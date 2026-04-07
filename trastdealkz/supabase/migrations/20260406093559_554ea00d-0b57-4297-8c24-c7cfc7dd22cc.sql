
-- Allow anyone (including anonymous) to view any deal by ID for sharing
CREATE POLICY "Anyone can view deals by id"
ON public.deals
FOR SELECT
TO anon, authenticated
USING (true);

-- Drop the old restrictive select policy
DROP POLICY IF EXISTS "Users can view their own deals" ON public.deals;
