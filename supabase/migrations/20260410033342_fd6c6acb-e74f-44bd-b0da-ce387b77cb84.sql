
DROP POLICY "Authenticated users can create assessments" ON public.risk_assessments;
CREATE POLICY "Deal owners can create assessments" ON public.risk_assessments FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.deals WHERE deals.id = deal_id AND deals.user_id = auth.uid())
);
