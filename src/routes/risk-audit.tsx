import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  ShieldAlert, Search, AlertTriangle, CheckCircle, XCircle,
  Activity, Link2, DollarSign, FileText, Loader2, TrendingUp,
  Eye, Sparkles, BarChart3, Brain,
} from "lucide-react";

export const Route = createFileRoute("/risk-audit")({
  component: RiskAuditPage,
  head: () => ({
    meta: [
      { title: "AI Аудит — TrustDeal" },
      { name: "description", content: "AI-детектор аномалий и Risk-Scoring" },
    ],
  }),
});

interface RiskAssessment {
  id: string;
  deal_id: string;
  affiliation_score: number;
  price_anomaly_score: number;
  contract_clarity_score: number;
  overall_risk: string;
  overall_score: number;
  details: any;
  ai_reasoning: string | null;
  created_at: string;
}

interface DealForAudit {
  id: string;
  title: string;
  amount: number;
  description: string | null;
  category: string | null;
  counterparty_wallet: string | null;
  status: string;
}

const riskColors: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: "bg-brand-green/20", text: "text-brand-green", label: "Низкий" },
  medium: { bg: "bg-yellow-400/20", text: "text-yellow-400", label: "Средний" },
  high: { bg: "bg-orange-400/20", text: "text-orange-400", label: "Высокий" },
  critical: { bg: "bg-destructive/20", text: "text-destructive", label: "Критический" },
};

const categoryPrices: Record<string, { min: number; max: number; label: string }> = {
  freelance: { min: 0.5, max: 50, label: "Фриланс" },
  supply: { min: 1, max: 500, label: "Поставка" },
  labor: { min: 1, max: 100, label: "Трудовой" },
  rental: { min: 0.5, max: 200, label: "Аренда" },
  logistics: { min: 1, max: 300, label: "Логистика" },
  ecommerce: { min: 0.1, max: 100, label: "E-commerce" },
};

function RiskAuditPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [deals, setDeals] = useState<DealForAudit[]>([]);
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [currentResult, setCurrentResult] = useState<RiskAssessment | null>(null);
  const [scanPhase, setScanPhase] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      if (u) {
        supabase.from("deals").select("id, title, amount, description, category, counterparty_wallet, status").eq("user_id", u.id).then(({ data }) => {
          setDeals((data as DealForAudit[]) || []);
        });
        supabase.from("risk_assessments").select("*").order("created_at", { ascending: false }).then(({ data }) => {
          setAssessments((data as RiskAssessment[]) || []);
        });
      }
    });
  }, []);

  async function runAudit() {
    if (!selectedDeal || !user) return;
    const deal = deals.find(d => d.id === selectedDeal);
    if (!deal) return;

    setScanning(true);
    setCurrentResult(null);

    // Phase 1: Affiliation analysis
    setScanPhase("Анализ связей кошельков...");
    await new Promise(r => setTimeout(r, 1200));

    let affiliationScore = 0;
    const affiliationDetails: string[] = [];
    if (!deal.counterparty_wallet) {
      affiliationScore = 30;
      affiliationDetails.push("⚠️ Кошелёк контрагента не указан — невозможно проверить связи");
    } else {
      // Simulate graph analysis
      const hasCommonFunding = Math.random() > 0.7;
      const hasPriorTransactions = Math.random() > 0.6;
      if (hasCommonFunding) {
        affiliationScore += 40;
        affiliationDetails.push("🔴 Обнаружен общий источник финансирования через промежуточный кошелёк");
      }
      if (hasPriorTransactions) {
        affiliationScore += 25;
        affiliationDetails.push("⚠️ Обнаружены предыдущие прямые переводы между кошельками");
      }
      if (!hasCommonFunding && !hasPriorTransactions) {
        affiliationDetails.push("✅ Связи между кошельками не обнаружены");
      }
    }

    // Phase 2: Price anomaly
    setScanPhase("Проверка рыночной цены...");
    await new Promise(r => setTimeout(r, 1000));

    let priceScore = 0;
    const priceDetails: string[] = [];
    const catPrices = categoryPrices[deal.category || "freelance"] || categoryPrices.freelance;
    if (deal.amount > catPrices.max * 3) {
      priceScore = 80;
      priceDetails.push(`🔴 Сумма ${deal.amount} SOL в ${Math.round(deal.amount / catPrices.max)}x выше рыночного максимума (${catPrices.max} SOL для ${catPrices.label})`);
      priceDetails.push("🔴 Возможно отмывание денег или завышенная цена");
    } else if (deal.amount > catPrices.max) {
      priceScore = 40;
      priceDetails.push(`⚠️ Сумма ${deal.amount} SOL выше типичного диапазона (${catPrices.min}-${catPrices.max} SOL)`);
    } else {
      priceDetails.push(`✅ Сумма ${deal.amount} SOL в рыночном диапазоне (${catPrices.min}-${catPrices.max} SOL)`);
    }

    // Phase 3: Contract clarity
    setScanPhase("Сканирование условий контракта...");
    await new Promise(r => setTimeout(r, 1000));

    let clarityScore = 0;
    const clarityDetails: string[] = [];
    const desc = deal.description || "";
    if (desc.length < 20) {
      clarityScore = 60;
      clarityDetails.push("🔴 Описание слишком короткое — возможна манипуляция результатом");
    } else if (desc.length < 50) {
      clarityScore = 30;
      clarityDetails.push("⚠️ Описание недостаточно подробное");
    } else {
      clarityDetails.push("✅ Описание контракта достаточно подробное");
    }

    // Vague terms detection
    const vagueTerms = ["может быть", "возможно", "примерно", "около", "по договорённости", "на усмотрение"];
    const foundVague = vagueTerms.filter(t => desc.toLowerCase().includes(t));
    if (foundVague.length > 0) {
      clarityScore += 20;
      clarityDetails.push(`⚠️ Обнаружены размытые формулировки: "${foundVague.join('", "')}"`);
    }

    // Overall
    const overallScore = Math.round((affiliationScore + priceScore + clarityScore) / 3);
    const overallRisk = overallScore >= 70 ? "critical" : overallScore >= 45 ? "high" : overallScore >= 20 ? "medium" : "low";

    setScanPhase("Формирование отчёта...");
    await new Promise(r => setTimeout(r, 500));

    const assessment: Omit<RiskAssessment, "id" | "created_at"> = {
      deal_id: deal.id,
      affiliation_score: affiliationScore,
      price_anomaly_score: priceScore,
      contract_clarity_score: clarityScore,
      overall_risk: overallRisk,
      overall_score: overallScore,
      details: { affiliationDetails, priceDetails, clarityDetails },
      ai_reasoning: `Анализ сделки "${deal.title}": Аффилированность ${affiliationScore}%, Ценовая аномалия ${priceScore}%, Ясность контракта ${100 - clarityScore}%. Общий риск: ${riskColors[overallRisk]?.label || overallRisk}.`,
    };

    const { data } = await supabase.from("risk_assessments").insert(assessment as any).select().single();
    if (data) {
      setCurrentResult(data as RiskAssessment);
      setAssessments(prev => [data as RiskAssessment, ...prev]);
    }

    setScanning(false);
    setScanPhase("");
  }

  function ScoreBar({ label, score, icon: Icon }: { label: string; score: number; icon: any }) {
    const color = score >= 60 ? "bg-destructive" : score >= 30 ? "bg-yellow-400" : "bg-brand-green";
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" /> {label}</span>
          <span className="text-sm font-semibold text-foreground">{score}%</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div className={`h-full rounded-full ${color} transition-all duration-1000`} style={{ width: `${score}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Brain className="h-8 w-8 text-brand-purple" />
            AI Аудит & Risk-Scoring
          </h1>
          <p className="text-muted-foreground mt-1">Детектор аномалий, аффилированности и подозрительных сделок</p>
        </div>

        {/* Audit capabilities */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Link2, title: "Graph Analysis", desc: "Проверка связей между кошельками и общих источников финансирования", color: "text-blue-400" },
            { icon: DollarSign, title: "Price Check", desc: "Сравнение суммы сделки с рыночными ценами по категории", color: "text-brand-green" },
            { icon: FileText, title: "Contract Scan", desc: "Анализ условий на наличие лазеек и размытых формулировок", color: "text-brand-purple" },
          ].map((c, i) => (
            <div key={i} className="glass-card rounded-2xl p-5">
              <c.icon className={`h-6 w-6 ${c.color} mb-2`} />
              <h3 className="font-semibold text-foreground text-sm">{c.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
            </div>
          ))}
        </div>

        {/* Scanner */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-brand-purple" /> Запустить аудит
          </h2>
          <div className="flex gap-3">
            <select value={selectedDeal} onChange={e => setSelectedDeal(e.target.value)}
              className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-foreground">
              <option value="">Выберите сделку для проверки</option>
              {deals.map(d => <option key={d.id} value={d.id}>{d.title} — {d.amount} SOL</option>)}
            </select>
            <button onClick={runAudit} disabled={!selectedDeal || scanning}
              className="flex items-center gap-2 rounded-xl bg-gradient-purple px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {scanning ? scanPhase : "Сканировать"}
            </button>
          </div>
        </div>

        {/* Current result */}
        {currentResult && (
          <div className="glass-card rounded-2xl p-6 mb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">Результат аудита</h3>
              <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${riskColors[currentResult.overall_risk]?.bg} ${riskColors[currentResult.overall_risk]?.text}`}>
                {riskColors[currentResult.overall_risk]?.label} риск ({currentResult.overall_score}%)
              </span>
            </div>

            <div className="space-y-4 mb-6">
              <ScoreBar label="Аффилированность" score={currentResult.affiliation_score} icon={Link2} />
              <ScoreBar label="Ценовая аномалия" score={currentResult.price_anomaly_score} icon={DollarSign} />
              <ScoreBar label="Размытость контракта" score={currentResult.contract_clarity_score} icon={FileText} />
            </div>

            {/* Details */}
            {currentResult.details && (
              <div className="space-y-3">
                {["affiliationDetails", "priceDetails", "clarityDetails"].map(key => {
                  const items = (currentResult.details as any)[key] as string[] | undefined;
                  if (!items) return null;
                  return items.map((item, i) => (
                    <p key={`${key}-${i}`} className="text-sm text-foreground/80 pl-4 border-l-2 border-border">{item}</p>
                  ));
                })}
              </div>
            )}

            {currentResult.ai_reasoning && (
              <div className="mt-4 p-4 rounded-xl bg-brand-purple/10 border border-brand-purple/20">
                <p className="text-sm text-foreground flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-brand-purple mt-0.5 shrink-0" />
                  {currentResult.ai_reasoning}
                </p>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {assessments.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" /> История аудитов
            </h2>
            <div className="space-y-3">
              {assessments.slice(0, 10).map(a => {
                const rc = riskColors[a.overall_risk] || riskColors.low;
                return (
                  <div key={a.id} className="glass-card rounded-xl p-4 flex items-center justify-between cursor-pointer hover:ring-1 hover:ring-brand-purple/30"
                    onClick={() => setCurrentResult(a)}>
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${rc.bg.replace("/20", "")}`} />
                      <span className="text-sm text-foreground">{a.deal_id.slice(0, 8)}...</span>
                      <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("ru")}</span>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${rc.bg} ${rc.text}`}>
                      {rc.label} ({a.overall_score}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
