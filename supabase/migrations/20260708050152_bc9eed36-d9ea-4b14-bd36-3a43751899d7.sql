
REVOKE EXECUTE ON FUNCTION public.resolve_referral(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_referral(text) TO service_role;
