import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import AIDecisionSection from "@/components/AIDecisionSection";
import TrustSection from "@/components/TrustSection";
import NFTSection from "@/components/NFTSection";
import FeaturesSection from "@/components/FeaturesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        navigate({ to: "/dashboard" });
      } else {
        setChecked(true);
      }
    });
  }, [navigate]);

  if (!checked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-purple border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <HeroSection />
      <AnimatedSection>
        <StatsSection />
      </AnimatedSection>
      <AnimatedSection delay={100}>
        <HowItWorksSection />
      </AnimatedSection>
      <AnimatedSection delay={100}>
        <AIDecisionSection />
      </AnimatedSection>
      <AnimatedSection delay={100}>
        <TrustSection />
      </AnimatedSection>
      <AnimatedSection delay={100}>
        <NFTSection />
      </AnimatedSection>
      <AnimatedSection delay={100}>
        <FeaturesSection />
      </AnimatedSection>
      <AnimatedSection delay={100}>
        <TestimonialsSection />
      </AnimatedSection>
      <AnimatedSection delay={100}>
        <CTASection />
      </AnimatedSection>
      <Footer />
    </>
  );
}
