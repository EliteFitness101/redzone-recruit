-- Repair production drift for the recruitment automation idempotency ledger.
-- Additive and safe when the table already exists from the original migration.
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

ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.automation_runs FROM anon;
GRANT SELECT ON TABLE public.automation_runs TO authenticated;
GRANT ALL ON TABLE public.automation_runs TO service_role;

DROP POLICY IF EXISTS automation_select_staff ON public.automation_runs;
CREATE POLICY automation_select_staff
  ON public.automation_runs
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.is_recruiter(auth.uid())
  );
