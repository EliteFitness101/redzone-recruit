-- 1. CERTIFICATES: remove blanket public read
DROP POLICY IF EXISTS "cert public verify" ON public.certificates;

CREATE POLICY "cert owner read" ON public.certificates
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.verify_certificate(_code text)
RETURNS TABLE (valid boolean, certificate_code text, recipient_name text, course_title text, issued_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_code text := upper(btrim(coalesce(_code,'')));
BEGIN
  IF v_code = '' OR length(v_code) < 6 OR length(v_code) > 64 OR v_code !~ '^[A-Z0-9-]+$' THEN
    RETURN;
  END IF;
  RETURN QUERY
  SELECT (c.revoked_at IS NULL), c.certificate_code, c.recipient_name, c.course_title, c.issued_at
  FROM public.certificates c
  WHERE c.certificate_code = v_code
  LIMIT 1;
END; $$;

REVOKE ALL ON FUNCTION public.verify_certificate(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated;

-- 2. APPLICATIONS: block recruiter self-assignment / ownership tampering
CREATE OR REPLACE FUNCTION public.tg_applications_guard_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  IF NEW.assigned_recruiter IS DISTINCT FROM OLD.assigned_recruiter THEN
    RAISE EXCEPTION 'only admins can assign recruiters';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'ownership cannot be changed';
  END IF;
  IF NEW.reference_number IS DISTINCT FROM OLD.reference_number THEN
    RAISE EXCEPTION 'reference number is immutable';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS applications_guard_update ON public.applications;
CREATE TRIGGER applications_guard_update
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.tg_applications_guard_update();

-- 3. ANONYMOUS APPLICATION HARDENING
CREATE OR REPLACE FUNCTION public.tg_applications_validate_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_recent int;
BEGIN
  IF auth.uid() IS NULL THEN
    -- public submissions may never set privileged fields
    NEW.user_id := NULL;
    NEW.assigned_recruiter := NULL;
    NEW.stage := 'new';
    NEW.status := 'pending';
    NEW.tags := '{}';
    NEW.notes := NULL;
  END IF;

  NEW.full_name := btrim(NEW.full_name);
  IF length(NEW.full_name) < 2 OR length(NEW.full_name) > 120 THEN
    RAISE EXCEPTION 'invalid name';
  END IF;
  IF NEW.age < 16 OR NEW.age > 70 THEN
    RAISE EXCEPTION 'invalid age';
  END IF;
  NEW.phone := btrim(NEW.phone);
  IF NEW.phone !~ '^[0-9+()\s-]{7,20}$' THEN
    RAISE EXCEPTION 'invalid phone';
  END IF;
  IF NEW.email IS NOT NULL THEN
    NEW.email := lower(btrim(NEW.email));
    IF NEW.email <> '' AND NEW.email !~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' THEN
      RAISE EXCEPTION 'invalid email';
    END IF;
  END IF;
  IF length(NEW.location) > 120 OR length(NEW.education) > 120
     OR length(coalesce(NEW.prior_experience,'')) > 2000
     OR length(coalesce(NEW.program,'')) > 120
     OR length(coalesce(NEW.cohort,'')) > 120
     OR length(coalesce(NEW.source,'')) > 120
     OR length(coalesce(NEW.campaign,'')) > 200 THEN
    RAISE EXCEPTION 'field too long';
  END IF;

  SELECT count(*) INTO v_recent FROM public.applications a
   WHERE a.created_at > now() - interval '5 minutes'
     AND (a.phone = NEW.phone OR (NEW.email IS NOT NULL AND NEW.email <> '' AND a.email = NEW.email));
  IF v_recent >= 2 THEN
    RAISE EXCEPTION 'duplicate submission detected, please try again later';
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS applications_validate_insert ON public.applications;
CREATE TRIGGER applications_validate_insert
  BEFORE INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.tg_applications_validate_insert();

DROP POLICY IF EXISTS "anon guest application" ON public.applications;
CREATE POLICY "anon guest application" ON public.applications
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL AND assigned_recruiter IS NULL);

-- 4. SECURITY DEFINER functions: remove anon/public execute where not needed
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_recruiter(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_access_application(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_course_access(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.issue_certificate(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.recruitment_stats() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.recruitment_ops_stats() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.resolve_referral(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_recruiter(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_application(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_course_access(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.issue_certificate(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recruitment_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.recruitment_ops_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_referral(text) TO anon, authenticated;