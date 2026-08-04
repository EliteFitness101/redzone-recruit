
-- ============ APPLICATIONS EXTENSIONS ============
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS program text,
  ADD COLUMN IF NOT EXISTS cohort text,
  ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS assigned_recruiter uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reference_number text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS campaign text,
  ADD COLUMN IF NOT EXISTS attribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];

CREATE UNIQUE INDEX IF NOT EXISTS applications_reference_number_key ON public.applications(reference_number);
CREATE INDEX IF NOT EXISTS applications_stage_idx ON public.applications(stage);
CREATE INDEX IF NOT EXISTS applications_recruiter_idx ON public.applications(assigned_recruiter);
CREATE INDEX IF NOT EXISTS applications_created_idx ON public.applications(created_at DESC);

CREATE OR REPLACE FUNCTION public.tg_application_reference()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.reference_number IS NULL THEN
    NEW.reference_number := 'MX-' || to_char(now(),'YYMM') || '-' ||
      upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  END IF;
  IF NEW.stage IS NULL THEN NEW.stage := 'new'; END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS applications_reference ON public.applications;
CREATE TRIGGER applications_reference BEFORE INSERT ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.tg_application_reference();

UPDATE public.applications
SET reference_number = 'MX-' || to_char(created_at,'YYMM') || '-' ||
  upper(substr(replace(gen_random_uuid()::text,'-',''),1,6))
WHERE reference_number IS NULL;

-- ============ RECRUITERS ============
CREATE TABLE IF NOT EXISTS public.recruiters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  title text NOT NULL DEFAULT 'Recruiter',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recruiters TO authenticated;
GRANT ALL ON public.recruiters TO service_role;
ALTER TABLE public.recruiters ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_recruiter(_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.recruiters WHERE user_id = _user AND active)
$$;

CREATE OR REPLACE FUNCTION public.can_access_application(_user uuid, _app uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user,'admin') OR EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = _app AND (a.user_id = _user OR (a.assigned_recruiter = _user AND public.is_recruiter(_user)))
  )
$$;

DROP POLICY IF EXISTS "recruiters read directory" ON public.recruiters;
CREATE POLICY "recruiters read directory" ON public.recruiters FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.is_recruiter(auth.uid()));
DROP POLICY IF EXISTS "admins manage recruiters" ON public.recruiters;
CREATE POLICY "admins manage recruiters" ON public.recruiters FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP TRIGGER IF EXISTS recruiters_updated_at ON public.recruiters;
CREATE TRIGGER recruiters_updated_at BEFORE UPDATE ON public.recruiters
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- applications: recruiter access
DROP POLICY IF EXISTS "recruiters read assigned applications" ON public.applications;
CREATE POLICY "recruiters read assigned applications" ON public.applications FOR SELECT TO authenticated
USING (public.is_recruiter(auth.uid()) AND assigned_recruiter = auth.uid());
DROP POLICY IF EXISTS "recruiters update assigned applications" ON public.applications;
CREATE POLICY "recruiters update assigned applications" ON public.applications FOR UPDATE TO authenticated
USING (public.is_recruiter(auth.uid()) AND assigned_recruiter = auth.uid())
WITH CHECK (public.is_recruiter(auth.uid()) AND assigned_recruiter = auth.uid());

-- ============ ACTIVITY ============
CREATE TABLE IF NOT EXISTS public.application_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  event text NOT NULL,
  actor uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS application_activity_app_idx ON public.application_activity(application_id, created_at DESC);
GRANT SELECT, INSERT ON public.application_activity TO authenticated;
GRANT INSERT ON public.application_activity TO anon;
GRANT ALL ON public.application_activity TO service_role;
ALTER TABLE public.application_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read activity for accessible applications" ON public.application_activity;
CREATE POLICY "read activity for accessible applications" ON public.application_activity FOR SELECT TO authenticated
USING (public.can_access_application(auth.uid(), application_id));
DROP POLICY IF EXISTS "staff insert activity" ON public.application_activity;
CREATE POLICY "staff insert activity" ON public.application_activity FOR INSERT TO authenticated
WITH CHECK (actor = auth.uid() AND public.can_access_application(auth.uid(), application_id));

-- audit trigger for stage/status changes
CREATE OR REPLACE FUNCTION public.tg_application_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.application_activity(application_id, event, actor, notes, metadata)
    VALUES (NEW.id, 'application_submitted', NEW.user_id, NULL,
            jsonb_build_object('reference', NEW.reference_number, 'stage', NEW.stage));
    RETURN NEW;
  END IF;
  IF NEW.stage IS DISTINCT FROM OLD.stage THEN
    INSERT INTO public.application_activity(application_id, event, actor, metadata)
    VALUES (NEW.id, 'stage_changed', auth.uid(),
            jsonb_build_object('from', OLD.stage, 'to', NEW.stage));
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.application_activity(application_id, event, actor, metadata)
    VALUES (NEW.id, 'status_changed', auth.uid(),
            jsonb_build_object('from', OLD.status, 'to', NEW.status));
  END IF;
  IF NEW.assigned_recruiter IS DISTINCT FROM OLD.assigned_recruiter THEN
    INSERT INTO public.application_activity(application_id, event, actor, metadata)
    VALUES (NEW.id, 'recruiter_assigned', auth.uid(),
            jsonb_build_object('from', OLD.assigned_recruiter, 'to', NEW.assigned_recruiter));
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS applications_audit_ins ON public.applications;
CREATE TRIGGER applications_audit_ins AFTER INSERT ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.tg_application_audit();
DROP TRIGGER IF EXISTS applications_audit_upd ON public.applications;
CREATE TRIGGER applications_audit_upd AFTER UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.tg_application_audit();

-- ============ INTERVIEWS ============
CREATE TABLE IF NOT EXISTS public.interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  interviewer uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  meeting_link text,
  outcome text NOT NULL DEFAULT 'scheduled',
  score integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS interviews_app_idx ON public.interviews(application_id, scheduled_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interviews TO authenticated;
GRANT ALL ON public.interviews TO service_role;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read interviews for accessible applications" ON public.interviews;
CREATE POLICY "read interviews for accessible applications" ON public.interviews FOR SELECT TO authenticated
USING (public.can_access_application(auth.uid(), application_id));
DROP POLICY IF EXISTS "staff manage interviews" ON public.interviews;
CREATE POLICY "staff manage interviews" ON public.interviews FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR (public.is_recruiter(auth.uid()) AND public.can_access_application(auth.uid(), application_id)))
WITH CHECK (public.has_role(auth.uid(),'admin') OR (public.is_recruiter(auth.uid()) AND public.can_access_application(auth.uid(), application_id)));

DROP TRIGGER IF EXISTS interviews_updated_at ON public.interviews;
CREATE TRIGGER interviews_updated_at BEFORE UPDATE ON public.interviews
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  audience text NOT NULL DEFAULT 'admin',
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_created_idx ON public.notifications(created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT INSERT ON public.notifications TO anon;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff read notifications" ON public.notifications;
CREATE POLICY "staff read notifications" ON public.notifications FOR SELECT TO authenticated
USING (recipient = auth.uid() OR (audience = 'admin' AND public.has_role(auth.uid(),'admin'))
       OR (audience = 'recruiters' AND public.is_recruiter(auth.uid())));
DROP POLICY IF EXISTS "staff update notifications" ON public.notifications;
CREATE POLICY "staff update notifications" ON public.notifications FOR UPDATE TO authenticated
USING (recipient = auth.uid() OR (audience = 'admin' AND public.has_role(auth.uid(),'admin'))
       OR (audience = 'recruiters' AND public.is_recruiter(auth.uid())))
WITH CHECK (true);
DROP POLICY IF EXISTS "admins insert notifications" ON public.notifications;
CREATE POLICY "admins insert notifications" ON public.notifications FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin'));

-- new application -> admin notification
CREATE OR REPLACE FUNCTION public.tg_application_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications(audience, type, title, body, link, metadata)
  VALUES ('admin','application_created','New application received',
          NEW.full_name || ' — ' || COALESCE(NEW.program,'Unassigned program') || ' (' || NEW.location || ')',
          '/admin/applications?ref=' || NEW.reference_number,
          jsonb_build_object('application_id', NEW.id, 'reference', NEW.reference_number));
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS applications_notify ON public.applications;
CREATE TRIGGER applications_notify AFTER INSERT ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.tg_application_notify();

-- interview scheduled -> notification
CREATE OR REPLACE FUNCTION public.tg_interview_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text;
BEGIN
  SELECT full_name INTO v_name FROM public.applications WHERE id = NEW.application_id;
  INSERT INTO public.notifications(audience, type, title, body, link, metadata)
  VALUES ('admin','interview_scheduled','Interview scheduled',
          COALESCE(v_name,'Applicant') || ' — ' || to_char(NEW.scheduled_at,'DD Mon YYYY HH24:MI'),
          '/admin/applications?app=' || NEW.application_id,
          jsonb_build_object('application_id', NEW.application_id, 'interview_id', NEW.id));
  INSERT INTO public.application_activity(application_id, event, actor, metadata)
  VALUES (NEW.application_id,'interview_scheduled', auth.uid(),
          jsonb_build_object('scheduled_at', NEW.scheduled_at, 'meeting_link', NEW.meeting_link));
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS interviews_notify ON public.interviews;
CREATE TRIGGER interviews_notify AFTER INSERT ON public.interviews
FOR EACH ROW EXECUTE FUNCTION public.tg_interview_notify();

-- stage milestone notifications
CREATE OR REPLACE FUNCTION public.tg_stage_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.stage IS DISTINCT FROM OLD.stage AND NEW.stage IN ('accepted','enrolled') THEN
    INSERT INTO public.notifications(audience, type, title, body, link, metadata)
    VALUES ('admin','applicant_' || NEW.stage,
            'Applicant ' || NEW.stage, NEW.full_name || ' is now ' || NEW.stage,
            '/admin/applications?app=' || NEW.id,
            jsonb_build_object('application_id', NEW.id));
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS applications_stage_notify ON public.applications;
CREATE TRIGGER applications_stage_notify AFTER UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.tg_stage_notify();

-- ============ DASHBOARD STATS ============
CREATE OR REPLACE FUNCTION public.recruitment_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.is_recruiter(auth.uid())) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM public.applications),
    'today', (SELECT count(*) FROM public.applications WHERE created_at >= date_trunc('day', now())),
    'week', (SELECT count(*) FROM public.applications WHERE created_at >= now() - interval '7 days'),
    'by_stage', (SELECT COALESCE(jsonb_object_agg(stage, c),'{}'::jsonb) FROM (SELECT stage, count(*) c FROM public.applications GROUP BY stage) s),
    'by_program', (SELECT COALESCE(jsonb_object_agg(COALESCE(program,'unspecified'), c),'{}'::jsonb) FROM (SELECT program, count(*) c FROM public.applications GROUP BY program) s),
    'by_cohort', (SELECT COALESCE(jsonb_object_agg(COALESCE(cohort,'unassigned'), c),'{}'::jsonb) FROM (SELECT cohort, count(*) c FROM public.applications GROUP BY cohort) s),
    'by_source', (SELECT COALESCE(jsonb_object_agg(COALESCE(source,'direct'), c),'{}'::jsonb) FROM (SELECT source, count(*) c FROM public.applications GROUP BY source) s),
    'by_campaign', (SELECT COALESCE(jsonb_object_agg(COALESCE(campaign,'none'), c),'{}'::jsonb) FROM (SELECT campaign, count(*) c FROM public.applications GROUP BY campaign) s),
    'by_recruiter', (SELECT COALESCE(jsonb_object_agg(COALESCE(assigned_recruiter::text,'unassigned'), c),'{}'::jsonb) FROM (SELECT assigned_recruiter, count(*) c FROM public.applications GROUP BY assigned_recruiter) s),
    'daily', (SELECT COALESCE(jsonb_agg(jsonb_build_object('date', d, 'count', c) ORDER BY d),'[]'::jsonb)
              FROM (SELECT date_trunc('day', created_at)::date d, count(*) c FROM public.applications
                    WHERE created_at >= now() - interval '30 days' GROUP BY 1) x),
    'stage_aging', (SELECT COALESCE(jsonb_object_agg(stage, avg_days),'{}'::jsonb)
              FROM (SELECT stage, round(avg(extract(epoch from (now()-updated_at))/86400)::numeric,1) avg_days
                    FROM public.applications GROUP BY stage) y)
  ) INTO result;
  RETURN result;
END; $$;
