
DROP POLICY IF EXISTS "applicant_docs_owner_read" ON storage.objects;
CREATE POLICY "applicant_docs_owner_read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'applicant-documents' AND (
  (storage.foldername(name))[1] = auth.uid()::text
  OR public.has_role(auth.uid(),'admin') OR public.is_recruiter(auth.uid())
));

DROP POLICY IF EXISTS "applicant_docs_owner_write" ON storage.objects;
CREATE POLICY "applicant_docs_owner_write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'applicant-documents' AND (
  (storage.foldername(name))[1] = auth.uid()::text
  OR public.has_role(auth.uid(),'admin') OR public.is_recruiter(auth.uid())
));

DROP POLICY IF EXISTS "applicant_docs_staff_update" ON storage.objects;
CREATE POLICY "applicant_docs_staff_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'applicant-documents' AND (public.has_role(auth.uid(),'admin') OR public.is_recruiter(auth.uid())));

DROP POLICY IF EXISTS "applicant_docs_staff_delete" ON storage.objects;
CREATE POLICY "applicant_docs_staff_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'applicant-documents' AND public.has_role(auth.uid(),'admin'));

REVOKE EXECUTE ON FUNCTION public.recruitment_ops_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.recruitment_stats() FROM anon;
