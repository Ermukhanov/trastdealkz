
-- Create dispute status enum
CREATE TYPE public.dispute_status AS ENUM ('pending', 'voting', 'resolved', 'cancelled');

-- Create vote choice enum  
CREATE TYPE public.vote_choice AS ENUM ('side_a', 'side_b', 'split');

-- Create risk level enum
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Disputes table
CREATE TABLE public.disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  initiator_id UUID NOT NULL,
  deposit_amount NUMERIC NOT NULL DEFAULT 0.01,
  status dispute_status NOT NULL DEFAULT 'pending',
  jury_count INTEGER NOT NULL DEFAULT 5,
  side_a_claim TEXT NOT NULL,
  side_b_claim TEXT,
  evidence_urls TEXT[],
  verdict TEXT,
  verdict_side vote_choice,
  verdict_percent INTEGER,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view disputes" ON public.disputes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create disputes" ON public.disputes FOR INSERT TO authenticated WITH CHECK (auth.uid() = initiator_id);
CREATE POLICY "Initiator can update own disputes" ON public.disputes FOR UPDATE TO authenticated USING (auth.uid() = initiator_id);

-- Jury votes table
CREATE TABLE public.jury_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  juror_id UUID NOT NULL,
  vote vote_choice NOT NULL,
  reasoning TEXT,
  is_majority BOOLEAN,
  reward_amount NUMERIC DEFAULT 0,
  penalty_amount NUMERIC DEFAULT 0,
  voted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(dispute_id, juror_id)
);

ALTER TABLE public.jury_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes" ON public.jury_votes FOR SELECT USING (true);
CREATE POLICY "Jurors can cast votes" ON public.jury_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = juror_id);

-- Risk assessments table
CREATE TABLE public.risk_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  affiliation_score INTEGER NOT NULL DEFAULT 0,
  price_anomaly_score INTEGER NOT NULL DEFAULT 0,
  contract_clarity_score INTEGER NOT NULL DEFAULT 0,
  overall_risk risk_level NOT NULL DEFAULT 'low',
  overall_score INTEGER NOT NULL DEFAULT 0,
  details JSONB DEFAULT '{}',
  ai_reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view risk assessments" ON public.risk_assessments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create assessments" ON public.risk_assessments FOR INSERT TO authenticated WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
