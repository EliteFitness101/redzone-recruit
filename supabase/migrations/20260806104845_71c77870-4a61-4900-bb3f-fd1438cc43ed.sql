
-- ============ INTERVIEWS EXTENSION ============
ALTER TABLE public.interviews
  ADD COLUMN IF NOT EXISTS round integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Africa/Lagos',
  ADD COLUMN IF NOT EXISTS interview_type text NOT NULL DEFAULT 'virtual',
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 45,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'scheduled',
  ADD COLUMN IF NOT EXISTS scorecard jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS rescheduled_from uuid REFERENCES public.interviews(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.tg_interviews_validate()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.interview_type NOT IN ('virtual','physical','telephone') THEN
    RAISE EXCEPTION 'invalid interview_type %', NEW.interview_type;
  END IF;
  IF NEW.status NOT IN ('scheduled','completed','cancelled','no_show','rescheduled') THEN
    RAISE EXCEPTION 'invalid interview status %', NEW.status;
  END IF;
  IF NEW.round < 1 THEN RAISE EXCEPTION 'round must be >= 1'; END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS interviews_validate ON public.interviews;
CREATE TRIGGER interviews_validate BEFORE INSERT OR UPDATE ON public.interviews
FOR EACH ROW EXECUTE FUNCTION public.tg_interviews_validate();

CREATE OR REPLACE FUNCTION public.tg_interview_update_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.application_activity(application_id, event, actor, metadata)
    VALUES (NEW.application_id, 'interview_' || NEW.status, auth.uid(),
            jsonb_build_object('interview_id', NEW.id, 'round', NEW.round, 'from', OLD.status, 'to', NEW.status));
  END IF;
  IF NEW.scheduled_at IS DISTINCT FROM OLD.scheduled_at THEN
    INSERT INTO public.application_activity(application_id, event, actor, metadata)
    VALUES (NEW.application_id, 'interview_rescheduled', auth.uid(),
            jsonb_build_object('interview_id', NEW.id, 'from', OLD.scheduled_at, 'to', NEW.scheduled_at));
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS interviews_update_audit ON public.interviews;
CREATE TRIGGER interviews_update_audit AFTER UPDATE ON public.interviews
FOR EACH ROW EXECUTE FUNCTION public.tg_interview_update_audit();

-- ============ DOCUMENTS ============
CREATE TABLE IF NOT EXISTS public.application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  doc_type text NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  scan_status text NOT NULL DEFAULT 'not_scanned',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.application_documents TO authenticated;
GRANT ALL ON public.application_documents TO service_role;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "docs_select" ON public.application_documents;
CREATE POLICY "docs_select" ON public.application_documents FOR SELECT TO authenticated
USING (public.can_access_application(auth.uid(), application_id));
DROP POLICY IF EXISTS "docs_insert" ON public.application_documents;
CREATE POLICY "docs_insert" ON public.application_documents FOR INSERT TO authenticated
WITH CHECK (public.can_access_application(auth.uid(), application_id) AND uploaded_by = auth.uid());
DROP POLICY IF EXISTS "docs_update_staff" ON public.application_documents;
CREATE POLICY "docs_update_staff" ON public.application_documents FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.is_recruiter(auth.uid()))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_recruiter(auth.uid()));

DROP TRIGGER IF EXISTS application_documents_updated_at ON public.application_documents;
CREATE TRIGGER application_documents_updated_at BEFORE UPDATE ON public.application_documents
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.tg_document_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.application_activity(application_id, event, actor, notes, metadata)
    VALUES (NEW.application_id, 'document_uploaded', NEW.uploaded_by, NEW.file_name,
            jsonb_build_object('document_id', NEW.id, 'doc_type', NEW.doc_type, 'version', NEW.version));
    INSERT INTO public.notifications(audience, type, title, body, link, metadata)
    VALUES ('admin','document_uploaded','Document uploaded', NEW.doc_type || ' — ' || NEW.file_name,
            '/admin/applications?app=' || NEW.application_id,
            jsonb_build_object('application_id', NEW.application_id, 'document_id', NEW.id));
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.application_activity(application_id, event, actor, notes, metadata)
    VALUES (NEW.application_id, 'document_reviewed', auth.uid(), NEW.review_notes,
            jsonb_build_object('document_id', NEW.id, 'from', OLD.status, 'to', NEW.status));
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS documents_activity_ins ON public.application_documents;
CREATE TRIGGER documents_activity_ins AFTER INSERT ON public.application_documents
FOR EACH ROW EXECUTE FUNCTION public.tg_document_activity();
DROP TRIGGER IF EXISTS documents_activity_upd ON public.application_documents;
CREATE TRIGGER documents_activity_upd AFTER UPDATE ON public.application_documents
FOR EACH ROW EXECUTE FUNCTION public.tg_document_activity();

-- ============ AUDIT LOG (immutable) ============
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  previous_value jsonb,
  new_value jsonb,
  reason text,
  ip_address text,
  request_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_select_staff" ON public.audit_logs;
CREATE POLICY "audit_select_staff" ON public.audit_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.is_recruiter(auth.uid()));
DROP POLICY IF EXISTS "audit_insert_auth" ON public.audit_logs;
CREATE POLICY "audit_insert_auth" ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (actor = auth.uid());

CREATE OR REPLACE FUNCTION public.tg_audit_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'audit_logs are immutable'; END; $$;
DROP TRIGGER IF EXISTS audit_logs_immutable ON public.audit_logs;
CREATE TRIGGER audit_logs_immutable BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.tg_audit_immutable();

CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON public.audit_logs(entity_type, entity_id, created_at DESC);

-- mirror application changes into audit_logs
CREATE OR REPLACE FUNCTION public.tg_application_audit_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.stage IS DISTINCT FROM OLD.stage THEN
    INSERT INTO public.audit_logs(actor, action, entity_type, entity_id, previous_value, new_value)
    VALUES (auth.uid(),'stage_change','application',NEW.id,
            jsonb_build_object('stage', OLD.stage), jsonb_build_object('stage', NEW.stage));
  END IF;
  IF NEW.assigned_recruiter IS DISTINCT FROM OLD.assigned_recruiter THEN
    INSERT INTO public.audit_logs(actor, action, entity_type, entity_id, previous_value, new_value)
    VALUES (auth.uid(),'recruiter_assignment','application',NEW.id,
            jsonb_build_object('assigned_recruiter', OLD.assigned_recruiter),
            jsonb_build_object('assigned_recruiter', NEW.assigned_recruiter));
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.audit_logs(actor, action, entity_type, entity_id, previous_value, new_value)
    VALUES (auth.uid(),'status_change','application',NEW.id,
            jsonb_build_object('status', OLD.status), jsonb_build_object('status', NEW.status));
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS applications_audit_log ON public.applications;
CREATE TRIGGER applications_audit_log AFTER UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.tg_application_audit_log();

-- ============ RECRUITER TASKS ============
CREATE TABLE IF NOT EXISTS public.recruiter_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  details text,
  due_at timestamptz,
  completed_at timestamptz,
  priority text NOT NULL DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recruiter_tasks TO authenticated;
GRANT ALL ON public.recruiter_tasks TO service_role;
ALTER TABLE public.recruiter_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks_staff_all" ON public.recruiter_tasks;
CREATE POLICY "tasks_staff_all" ON public.recruiter_tasks FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.is_recruiter(auth.uid()))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_recruiter(auth.uid()));
DROP TRIGGER IF EXISTS recruiter_tasks_updated_at ON public.recruiter_tasks;
CREATE TRIGGER recruiter_tasks_updated_at BEFORE UPDATE ON public.recruiter_tasks
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ AUTOMATION RUNS ============
CREATE TABLE IF NOT EXISTS public.automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  workflow text NOT NULL,
  channel text NOT NULL DEFAULT 'internal',
  idempotency_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.automation_runs TO authenticated;
GRANT ALL ON public.automation_runs TO service_role;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "automation_select_staff" ON public.automation_runs;
CREATE POLICY "automation_select_staff" ON public.automation_runs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.is_recruiter(auth.uid()));
DROP TRIGGER IF EXISTS automation_runs_updated_at ON public.automation_runs;
CREATE TRIGGER automation_runs_updated_at BEFORE UPDATE ON public.automation_runs
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ EXTENDED STATS ============
CREATE OR REPLACE FUNCTION public.recruitment_ops_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.is_recruiter(auth.uid())) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  SELECT jsonb_build_object(
    'interviews_total', (SELECT count(*) FROM public.interviews),
    'interviews_by_status', (SELECT COALESCE(jsonb_object_agg(status,c),'{}'::jsonb)
       FROM (SELECT status, count(*) c FROM public.interviews GROUP BY status) s),
    'interview_pass_rate', (
       SELECT CASE WHEN count(*) FILTER (WHERE status='completed') = 0 THEN 0
         ELSE round(100.0 * count(*) FILTER (WHERE status='completed' AND COALESCE(score,0) >= 60)
              / count(*) FILTER (WHERE status='completed'), 1) END
       FROM public.interviews),
    'avg_time_to_offer_days', (
       SELECT COALESCE(round(avg(extract(epoch from (a.updated_at - a.created_at))/86400)::numeric,1),0)
       FROM public.applications a WHERE a.stage IN ('accepted','enrolled','certified','deployed')),
    'avg_hiring_days', (
       SELECT COALESCE(round(avg(extract(epoch from (a.updated_at - a.created_at))/86400)::numeric,1),0)
       FROM public.applications a WHERE a.stage IN ('enrolled','certified','deployed')),
    'automation_by_status', (SELECT COALESCE(jsonb_object_agg(status,c),'{}'::jsonb)
       FROM (SELECT status, count(*) c FROM public.automation_runs GROUP BY status) s),
    'automation_failures', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
         'workflow', workflow, 'error', last_error, 'attempts', attempts, 'at', updated_at)
         ORDER BY updated_at DESC),'[]'::jsonb)
       FROM (SELECT * FROM public.automation_runs WHERE status='failed' ORDER BY updated_at DESC LIMIT 20) f),
    'documents_by_status', (SELECT COALESCE(jsonb_object_agg(status,c),'{}'::jsonb)
       FROM (SELECT status, count(*) c FROM public.application_documents GROUP BY status) s),
    'recruiter_productivity', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
         'recruiter', r.display_name,
         'assigned', (SELECT count(*) FROM public.applications a WHERE a.assigned_recruiter = r.user_id),
         'advanced', (SELECT count(*) FROM public.applications a WHERE a.assigned_recruiter = r.user_id
                       AND a.stage IN ('accepted','enrolled','certified','deployed')),
         'actions', (SELECT count(*) FROM public.audit_logs al WHERE al.actor = r.user_id)
       )),'[]'::jsonb) FROM public.recruiters r WHERE r.active),
    'tasks_open', (SELECT count(*) FROM public.recruiter_tasks WHERE completed_at IS NULL),
    'tasks_overdue', (SELECT count(*) FROM public.recruiter_tasks WHERE completed_at IS NULL AND due_at < now())
  ) INTO result;
  RETURN result;
END; $$;
