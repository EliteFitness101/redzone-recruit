
REVOKE EXECUTE ON FUNCTION public.is_recruiter(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_access_application(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recruitment_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.tg_application_reference() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_application_audit() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_application_notify() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_interview_notify() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_stage_notify() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recruitment_stats() TO authenticated;
