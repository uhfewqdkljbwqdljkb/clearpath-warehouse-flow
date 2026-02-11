CREATE POLICY "Clients can view their own JARDE reports"
ON public.jarde_reports
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid())
  OR (
    company_id IS NULL
    AND get_user_company_id(auth.uid()) IS NOT NULL
  )
);