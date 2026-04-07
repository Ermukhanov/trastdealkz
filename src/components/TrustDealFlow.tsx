// src/components/TrustDealFlow.tsx
// Полный флоу: Wallet → Create Deal → Escrow → Dispute → AI Verdict → NFT Cert

import { useState, useCallback } from "react";
import { ExternalLink, ChainIcon, Zap, Lock, CheckCircle } from "lucide-react";
import {
  useSolana,
  DealType,
  DEAL_TYPE_LABELS,
  STATUS_LABELS,
  DealStatus,
  explorerUrl,
} from "../hooks/useSolana";
import { runAiArbitration, AiVerdict } from "../services/aiArbitration";
import {
  mintDealNftCertificate,
  getDealCertificateSvg,
  NftCertificateMetadata,
} from "../services/nftCertificate";
import PriceMonitor from "./PriceMonitor";

type FlowStep = "wallet" | "create" | "escrow" | "active" | "dispute" | "verdict" | "nft";

interface DealState {
  dealId: number;
  amountSOL: number;
  description: string;
  counterparty: string;
  dealType: DealType;
  status: DealStatus;
  createTx?: string;
  disputeTx?: string;
  verdictTx?: string;
  nftTx?: string;
  nftMint?: string;
  nftSvg?: string;
  aiVerdict?: AiVerdict;
  evidenceHash?: string;
  aiVerdictHash?: string;
}

const STEP_ORDER: FlowStep[] = [
  "wallet",
  "create",
  "active",
  "dispute",
  "verdict",
  "nft",
];

const STEP_LABELS: Record<FlowStep, string> = {
  wallet: "Кошелёк",
  create: "Создать сделку",
  escrow: "Депозит",
  active: "Активна",
  dispute: "Спор",
  verdict: "AI Вердикт",
  nft: "NFT Сертификат",
};

export default function TrustDealFlow() {
  const {
    publicKey,
    balance,
    loading,
    error,
    txHistory,
    connection,
    wallet,
    connectWallet,
    airdrop,
    createDeal,
    openDispute,
    recordAiVerdict,
  } = useSolana();

  const [step, setStep] = useState<FlowStep>("wallet");
  const [deal, setDeal] = useState<DealState | null>(null);
  const [form, setForm] = useState({
    description: "",
    amountSOL: "0.1",
    counterparty: "",
    dealType: DealType.Freelance,
    timeoutHours: 72,
  });
  const [disputeText, setDisputeText] = useState("");
  const [counterpartyResponse, setCounterpartyResponse] = useState("");
  const [processing, setProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const log = (msg: string) => setStatusMsg(msg);

  // Step 1: Connect wallet
  const handleConnect = useCallback(async () => {
    const pk = await connectWallet();
    if (pk) setStep("create");
  }, [connectWallet]);

  // Airdrop devnet SOL
  const handleAirdrop = useCallback(async () => {
    if (!publicKey) return;
    log("Запрашиваю 2 SOL с devnet faucet...");
    await airdrop(publicKey);
    log("✅ 2 SOL получено на devnet!");
  }, [publicKey, airdrop]);

  // Step 2: Create deal
  const handleCreateDeal = useCallback(async () => {
    if (!form.description || !form.counterparty || !form.amountSOL) {
      log("❌ Заполни все поля");
      return;
    }
    setProcessing(true);
    const dealId = Math.floor(Math.random() * 999999) + 1;

    try {
      log("📝 Создаю сделку на Solana devnet...");
      const result = await createDeal({
        dealId,
        amountSOL: parseFloat(form.amountSOL),
        description: form.description,
        counterpartyAddress: form.counterparty,
        dealType: form.dealType,
        timeoutHours: form.timeoutHours,
      });

      setDeal({
        dealId,
        amountSOL: parseFloat(form.amountSOL),
        description: form.description,
        counterparty: form.counterparty,
        dealType: form.dealType,
        status: DealStatus.Active,
        createTx: result.signature,
      });

      log(`✅ Сделка #${dealId} создана! TX: ${result.signature.slice(0, 16)}...`);
      setStep("active");
    } catch (e) {
      log(`❌ Ошибка: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setProcessing(false);
    }
  }, [form, createDeal]);

  // Step 3: Open dispute
  const handleOpenDispute = useCallback(async () => {
    if (!deal || !disputeText) return;
    setProcessing(true);
    log("⚠️ Открываю спор на блокчейне...");

    try {
      const result = await openDispute(deal.dealId, disputeText);
      setDeal((prev) =>
        prev
          ? {
              ...prev,
              status: DealStatus.Disputed,
              disputeTx: result.signature,
              evidenceHash: result.evidenceHash,
            }
          : prev
      );
      log(`✅ Спор открыт! TX: ${result.signature.slice(0, 16)}...`);
      setStep("dispute");
    } catch (e) {
      log(`❌ ${e instanceof Error ? e.message : "error"}`);
    } finally {
      setProcessing(false);
    }
  }, [deal, disputeText, openDispute]);

  // Step 4: Run AI arbitration → record verdict on-chain
  const handleAiArbitration = useCallback(async () => {
    if (!deal) return;
    setProcessing(true);
    log("🤖 AI арбитр анализирует спор...");

    try {
      log("🧠 AI анализирует позиции сторон и законодательство РК...");
      const verdict = await runAiArbitration({
        dealId: deal.dealId,
        dealType: deal.dealType,
        description: deal.description,
        amountSOL: deal.amountSOL,
        creatorClaim: disputeText,
        counterpartyClaim: counterpartyResponse || "Контрагент не предоставил позицию.",
        evidence: deal.evidenceHash,
      });

      log(`⚖️ AI вынес решение: ${verdict.decision.toUpperCase()} (${verdict.lawReference})`);
      await new Promise((r) => setTimeout(r, 800));

      log("📝 Записываю вердикт AI на блокчейн Solana...");
      const verdictResult = await recordAiVerdict(
        deal.dealId,
        verdict.verdictSummary,
        verdict.lawReference,
        verdict.decision
      );

      setDeal((prev) =>
        prev
          ? {
              ...prev,
              status: DealStatus.VerdictReady,
              aiVerdict: verdict,
              verdictTx: verdictResult.signature,
              aiVerdictHash: verdictResult.verdictHash,
            }
          : prev
      );

      log(`✅ Вердикт записан on-chain! TX: ${verdictResult.signature.slice(0, 16)}...`);
      setStep("verdict");
    } catch (e) {
      log(`❌ ${e instanceof Error ? e.message : "error"}`);
    } finally {
      setProcessing(false);
    }
  }, [deal, disputeText, counterpartyResponse, recordAiVerdict]);

  // Step 5: Mint NFT certificate
  const handleMintNft = useCallback(async () => {
    if (!deal || !wallet || !publicKey || !deal.aiVerdict) return;
    setProcessing(true);
    log("🎨 Создаю NFT сертификат завершённой сделки...");

    try {
      const meta: NftCertificateMetadata = {
        dealId: deal.dealId,
        dealType: DEAL_TYPE_LABELS[deal.dealType],
        amountSOL: deal.amountSOL,
        creator: publicKey.toString(),
        counterparty: deal.counterparty,
        completedAt: new Date().toISOString(),
        aiVerdictHash: deal.aiVerdictHash || "0".repeat(64),
        lawReference: deal.aiVerdict.lawReference,
        txSignature: deal.verdictTx || deal.createTx || "",
        trustDealVersion: "1.0.0",
      };

      const nft = await mintDealNftCertificate(
        connection,
        { publicKey, signTransaction: wallet.signTransaction.bind(wallet) },
        meta
      );

      const svg = getDealCertificateSvg(meta);

      setDeal((prev) =>
        prev
          ? {
              ...prev,
              status: DealStatus.Completed,
              nftTx: nft.txSignature,
              nftMint: nft.mintAddress,
              nftSvg: svg,
            }
          : prev
      );

      log(`✅ NFT сертификат выпущен! TX: ${nft.txSignature.slice(0, 16)}...`);
      setStep("nft");
    } catch (e) {
      log(`❌ ${e instanceof Error ? e.message : "error"}`);
    } finally {
      setProcessing(false);
    }
  }, [deal, wallet, publicKey, connection]);

  const currentStepIndex = STEP_ORDER.indexOf(step);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F4F3EE] font-sans">
      {/* Header */}
      <nav className="px-6 py-4 border-b border-[#2A2A30] flex items-center justify-between sticky top-0 bg-[#09090B]/90 backdrop-blur-sm z-50">
        <div className="font-bold text-xl tracking-tight">
          Trust<span className="text-[#00E87A]">Deal</span> AI
        </div>
        {publicKey && (
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-[#888895]">
              {balance.toFixed(3)} SOL
            </span>
            <span className="text-xs font-mono bg-[#1A1A1F] border border-[#2A2A30] px-3 py-1 rounded-full">
              {publicKey.toString().slice(0, 6)}...{publicKey.toString().slice(-4)}
            </span>
          </div>
        )}
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {statusMsg && (
          <div className="mb-6 p-4 bg-[#111113] border border-[#2A2A30] rounded-xl font-mono text-sm text-[#00E87A]">
            {statusMsg}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-[#1A0A0A] border border-[#F87171]/40 rounded-xl font-mono text-sm text-[#F87171]">
            ❌ {error}
          </div>
        )}

       {/* Step: Wallet */}
        {step === "wallet" && (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold">🤝 Добро пожаловать</h1>
            <p className="text-lg text-[#888895]">AI-арбитраж коммерческих споров на Solana</p>
            
            <button
              onClick={handleConnect}
              disabled={loading}
              className="w-full py-4 bg-[#00E87A] text-black font-bold rounded-xl hover:bg-[#00E87A]/90 transition disabled:opacity-50 text-lg"
            >
              {loading ? "Подключаю..." : "🔗 Подключить Phantom Wallet"}
            </button>
          </div>
        )}

        {/* Step: Create Deal */}
        {step === "create" && (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold">📝 Создать сделку</h1>

            {balance < 0.1 && (
              <button
                onClick={handleAirdrop}
                className="w-full p-4 bg-[#1A1400] border border-[#FB923C]/40 text-[#FB923C] rounded-xl text-sm"
              >
                ⚠️ Нужен devnet SOL. Получить 2 SOL бесплатно →
              </button>
            )}

            <div className="space-y-4 p-6 bg-[#111113] border border-[#2A2A30] rounded-2xl">
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Описание сделки..."
                className="w-full p-3 bg-[#0D0D0F] border border-[#2A2A30] rounded-xl text-sm h-20 focus:outline-none focus:border-[#00E87A]/50"
              />
              
              <input
                type="number"
                step="0.01"
                value={form.amountSOL}
                onChange={(e) => setForm((f) => ({ ...f, amountSOL: e.target.value }))}
                placeholder="Сумма (SOL)"
                className="w-full p-3 bg-[#0D0D0F] border border-[#2A2A30] rounded-xl text-sm focus:outline-none focus:border-[#00E87A]/50"
              />

              <input
                value={form.counterparty}
                onChange={(e) => setForm((f) => ({ ...f, counterparty: e.target.value }))}
                placeholder="Адрес контрагента..."
                className="w-full p-3 bg-[#0D0D0F] border border-[#2A2A30] rounded-xl text-sm font-mono focus:outline-none focus:border-[#00E87A]/50"
              />

              <button
                onClick={handleCreateDeal}
                disabled={processing}
                className="w-full py-3 bg-[#00E87A] text-black font-bold rounded-xl hover:bg-[#00E87A]/90"
              >
                {processing ? "⏳..." : "🚀 Создать on-chain"}
              </button>
            </div>
          </div>
        )}

        {/* Step: Active Deal */}
        {step === "active" && deal && (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold">Сделка #{deal.dealId}</h1>
            <p className="text-[#888895]">{deal.amountSOL} SOL · {DEAL_TYPE_LABELS[deal.dealType]}</p>

            <div className="p-4 bg-[#111113] border border-[#2A2A30] rounded-xl">
              <textarea
                value={disputeText}
                onChange={(e) => setDisputeText(e.target.value)}
                placeholder="Есть проблема? Опиши ситуацию и доказательства..."
                className="w-full p-3 bg-[#0D0D0F] border border-[#2A2A30] rounded-xl text-sm h-20 focus:outline-none"
              />
              <button
                onClick={handleOpenDispute}
                disabled={processing || !disputeText}
                className="w-full mt-3 py-3 bg-[#FB923C] text-black font-bold rounded-xl"
              >
                {processing ? "⏳..." : "⚠️ Открыть спор"}
              </button>
            </div>
          </div>
        )}

        {/* Step: Dispute */}
        {step === "dispute" && deal && (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold">🤖 AI Арбитраж</h1>
            
            <div className="p-4 bg-[#111113] border border-[#2A2A30] rounded-xl">
              <textarea
                value={counterpartyResponse}
                onChange={(e) => setCounterpartyResponse(e.target.value)}
                placeholder="Позиция контрагента (опционально)..."
                className="w-full p-3 bg-[#0D0D0F] border border-[#2A2A30] rounded-xl text-sm h-20 focus:outline-none"
              />
              <button
                onClick={handleAiArbitration}
                disabled={processing}
                className="w-full mt-3 py-3 bg-[#A78BFA] text-black font-bold rounded-xl"
              >
                {processing ? "🤖 Анализирую..." : "🤖 Запустить AI → On-chain"}
              </button>
            </div>
          </div>
        )}

        {/* Step: Verdict */}
        {step === "verdict" && deal?.aiVerdict && (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold">⚖️ Решение AI</h1>

            <div className="p-6 bg-[#0D1A10] border border-[#00E87A]/40 rounded-2xl space-y-3">
              <div className="text-2xl font-bold text-[#00E87A]">
                {deal.aiVerdict.decision === "release" ? "✅ Средства контрагенту" : ""}
                {deal.aiVerdict.decision === "refund" ? "↩️ Возврат вам" : ""}
               {deal.aiVerdict.decision === "split" ? "⚖️ Разделить" : ""}
              </div>

              <div className="text-sm">
                <div className="text-[#888895]">Закон:</div>
                <div className="text-[#A78BFA] font-medium">{deal.aiVerdict.lawReference}</div>
              </div>

              <p className="text-sm text-[#F4F3EE]">{deal.aiVerdict.reasoning}</p>

              <button
                onClick={handleMintNft}
                disabled={processing}
                className="w-full mt-4 py-3 bg-[#00E87A] text-black font-bold rounded-xl"
              >
                {processing ? "⏳..." : "🎨 Выпустить NFT"}
              </button>
            </div>
          </div>
        )}

        {/* Step: NFT */}
        {step === "nft" && deal && (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold">🎉 Завершено!</h1>
            <p className="text-[#888895]">NFT сертификат выпущен on-chain</p>

            {deal.nftSvg && (
              <div
                className="rounded-2xl overflow-hidden border border-[#2A2A30]"
                dangerouslySetInnerHTML={{ __html: deal.nftSvg }}
              />
            )}

            <button
              onClick={() => {
                setStep("create");
                setDeal(null);
                setDisputeText("");
              }}
              className="w-full py-3 border border-[#2A2A30] text-[#888895] rounded-xl hover:text-[#F4F3EE]"
            >
              ← Новая сделка
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
