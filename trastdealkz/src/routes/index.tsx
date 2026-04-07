import { createFileRoute } from "@tanstack/react-router";
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
