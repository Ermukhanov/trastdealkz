
-- Add new columns to deals
ALTER TABLE public.deals 
  ADD COLUMN category TEXT DEFAULT 'freelance',
  ADD COLUMN proof_hash TEXT,
  ADD COLUMN proof_description TEXT,
  ADD COLUMN verdict_text TEXT,
  ADD COLUMN verdict_law_ref TEXT,
  ADD COLUMN verdict_percent INTEGER,
  ADD COLUMN nft_mint_address TEXT,
  ADD COLUMN tx_signature TEXT;

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = reviewer_id);

CREATE INDEX idx_reviews_reviewee ON public.reviews(reviewee_id);
CREATE INDEX idx_reviews_deal ON public.reviews(deal_id);
CREATE INDEX idx_deals_user ON public.deals(user_id);
