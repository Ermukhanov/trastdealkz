import { ArrowRight, Zap, Shield, Bot, FileCheck, Globe } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";

export default function HeroSection() {
  const { t, i18n } = useTranslation();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const languages = [
    { code: "en", label: "English 🇬🇧" },
    { code: "ru", label: "Русский 🇷🇺" },
    { code: "kk", label: "Қазақша 🇰🇿" },
  ];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setShowLangMenu(false);
  };

  return (
    <section className="relative min-h-screen overflow-hidden pt-16 bg-gradient-hero">
      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-50">
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-2 rounded-lg border border-brand-green/40 bg-brand-green/10 px-4 py-2 text-sm font-medium text-brand-green hover:bg-brand-green/20 transition-all backdrop-blur-sm"
          >
            <Globe className="h-4 w-4" />
            {i18n.language.toUpperCase()}
          </button>
          
          {showLangMenu && (
            <div className="absolute top-full right-0 mt-2 rounded-lg border border-brand-green/40 bg-slate-950/95 shadow-xl backdrop-blur-sm z-50">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`block w-full px-4 py-2 text-left text-sm font-medium transition-all ${
                    i18n.language === lang.code
                      ? "bg-brand-green/20 text-brand-green"
                      : "text-muted-foreground hover:text-brand-green hover:bg-brand-green/10"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Animated grid */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: "linear-gradient(oklch(0.65 0.28 290 / 30%) 1px, transparent 1px), linear-gradient(90deg, oklch(0.65 0.28 290 / 30%) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-purple/10 blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-brand-green/10 blur-[100px] animate-pulse-glow" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-center px-4 pt-32 pb-20">
        <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-brand-green/30 bg-brand-green/10 px-4 py-2 animate-fade-in backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-brand-green animate-pulse" />
          <span className="text-sm font-medium text-brand-green">{t("hero.badge")}</span>
        </div>

        <h1 className="max-w-4xl text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl animate-fade-in" style={{ animationDelay: "150ms", animationFillMode: "both" }}>
          {t("hero.title.part1")}{" "}
          <span className="text-gradient-purple">{t("hero.title.highlight")}</span>
          {" "}{t("hero.title.part2")}
        </h1>

        <p className="mt-6 max-w-xl text-lg text-muted-foreground animate-fade-in leading-relaxed" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
          {t("hero.description")}
        </p>

        <div className="mt-10 flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: "450ms", animationFillMode: "both" }}>
          <Link
            to="/create-deal"
            className="flex items-center gap-2 rounded-xl bg-gradient-purple px-8 py-4 text-base font-semibold text-primary-foreground transition-all hover:opacity-90 hover:scale-105 glow-purple"
          >
            {t("hero.cta_create")} <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            to="/wallet"
            className="flex items-center gap-2 rounded-xl border border-brand-green/40 bg-brand-green/10 px-8 py-4 text-base font-semibold text-brand-green transition-all hover:bg-brand-green/20 hover:scale-105 backdrop-blur-sm"
          >
            <Zap className="h-5 w-5" />
            {t("hero.cta_wallet")}
          </Link>
        </div>

        {/* Feature pills */}
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3 animate-fade-in" style={{ animationDelay: "600ms", animationFillMode: "both" }}>
          {[
            { icon: Shield, labelKey: "hero.feature1_label", descKey: "hero.feature1_desc", color: "text-brand-green" },
            { icon: Bot, labelKey: "hero.feature2_label", descKey: "hero.feature2_desc", color: "text-brand-purple" },
            { icon: FileCheck, labelKey: "hero.feature3_label", descKey: "hero.feature3_desc", color: "text-brand-green" },
          ].map((item) => (
            <div key={item.labelKey} className="glass-card rounded-2xl p-5 flex items-center gap-4 hover:scale-[1.02] transition-transform">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <div>
                <div className="font-semibold text-foreground text-sm">{t(item.labelKey)}</div>
                <div className="text-xs text-muted-foreground">{t(item.descKey)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
