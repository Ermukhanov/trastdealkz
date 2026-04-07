// src/hooks/useSolana.ts
// Phantom wallet + Solana devnet integration для TrustDeal AI

import { useState, useCallback, useEffect } from "react";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
  TransactionInstruction,
} from "@solana/web3.js";
import { BN } from "bn.js";

// Solana devnet connection
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// Program ID (после деплоя заменить на реальный)
export const PROGRAM_ID = new PublicKey(
  "TrustDea1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx"
);

export interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>;
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
}

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

export interface DealOnChain {
  dealId: number;
  creator: string;
  counterparty: string;
  amountSOL: number;
  description: string;
  status: DealStatus;
  dealType: DealType;
  createdAt: Date;
  txSignature?: string;
  explorerUrl?: string;
  aiVerdictText?: string;
  aiLawReference?: string;
  nftMint?: string;
}

export enum DealStatus {
  Pending = 0,
  Active = 1,
  Disputed = 2,
  VerdictReady = 3,
  Completed = 4,
  Cancelled = 5,
}

export enum DealType {
  Freelance = 0,
  Supply = 1,
  Rental = 2,
  Labor = 3,
}

export const DEAL_TYPE_LABELS: Record<DealType, string> = {
  [DealType.Freelance]: "Фриланс",
  [DealType.Supply]: "Поставка",
  [DealType.Rental]: "Аренда",
  [DealType.Labor]: "Трудовой спор",
};

export const STATUS_LABELS: Record<DealStatus, string> = {
  [DealStatus.Pending]: "Ожидает депозита",
  [DealStatus.Active]: "Активна",
  [DealStatus.Disputed]: "Спор",
  [DealStatus.VerdictReady]: "Вердикт готов",
  [DealStatus.Completed]: "Завершена",
  [DealStatus.Cancelled]: "Отменена",
};

// Derive PDA addresses
export function getDealPDA(creator: PublicKey, dealId: number): [PublicKey, number] {
  const dealIdBytes = new BN(dealId).toArrayLike(Buffer, "le", 8);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("deal"), creator.toBuffer(), dealIdBytes],
    PROGRAM_ID
  );
}

export function getVaultPDA(dealPDA: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), dealPDA.toBuffer()],
    PROGRAM_ID
  );
}

export function getProfilePDA(user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), user.toBuffer()],
    PROGRAM_ID
  );
}

// Generate Solana Explorer URL
export function explorerUrl(signature: string, type: "tx" | "address" = "tx"): string {
  return `https://explorer.solana.com/${type}/${signature}?cluster=devnet`;
}

// Main hook
export function useSolana() {
  const [wallet, setWallet] = useState<PhantomProvider | null>(null);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHistory, setTxHistory] = useState<string[]>([]);

  // Detect Phantom
  useEffect(() => {
    if (typeof window !== "undefined" && window.solana?.isConnected) {
      setWallet(window.solana);
      setPublicKey(window.solana.publicKey);
      if (window.solana.publicKey) {
        fetchBalance(window.solana.publicKey);
      }
    }
  }, []);

  const fetchBalance = useCallback(async (pk: PublicKey) => {
    try {
      const bal = await connection.getBalance(pk);
      setBalance(bal / LAMPORTS_PER_SOL);
    } catch (e) {
      console.error("Balance fetch failed:", e);
    }
  }, []);

  // Connect Phantom
  const connectWallet = useCallback(async () => {
    try {
      setError(null);
      if (typeof window === "undefined" || !window.solana) {
        setError("Phantom кошелёк не найден. Установите phantom.app");
        return null;
      }
      const resp = await window.solana.connect();
      setWallet(window.solana);
      setPublicKey(resp.publicKey);
      await fetchBalance(resp.publicKey);
      return resp.publicKey;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка подключения";
      setError(msg);
      return null;
    }
  }, [fetchBalance]);

  // Airdrop devnet SOL for testing
  const airdrop = useCallback(async (pk: PublicKey) => {
    try {
      setLoading(true);
      const sig = await connection.requestAirdrop(pk, 2 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, "confirmed");
      await fetchBalance(pk);
      return sig;
    } catch (e) {
      setError("Airdrop не удался — попробуйте на faucet.solana.com");
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchBalance]);

  // Create deal transaction
  const createDeal = useCallback(
    async (params: {
      dealId: number;
      amountSOL: number;
      description: string;
      counterpartyAddress: string;
      dealType: DealType;
      timeoutHours: number;
    }) => {
      if (!publicKey || !wallet) throw new Error("Кошелёк не подключён");
      setLoading(true);
      setError(null);

      try {
        const counterparty = new PublicKey(params.counterpartyAddress);
        const amountLamports = Math.floor(params.amountSOL * LAMPORTS_PER_SOL);

        const [dealPDA] = getDealPDA(publicKey, params.dealId);
        const [vaultPDA] = getVaultPDA(dealPDA);

        const tx = new Transaction();
        
        // Transfer SOL to escrow vault (PDA)
        tx.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: vaultPDA,
            lamports: amountLamports,
          })
        );

        // Memo instruction — записать метаданные сделки on-chain
        const memoData = JSON.stringify({
          app: "TrustDeal",
          dealId: params.dealId,
          type: DEAL_TYPE_LABELS[params.dealType],
          desc: params.description.slice(0, 50),
          counterparty: params.counterpartyAddress.slice(0, 8) + "...",
        });

        tx.add(
          new TransactionInstruction({
            keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
            programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
            data: Buffer.from(memoData, "utf8"),
          })
        );

        tx.feePayer = publicKey;
        tx.recentBlockhash = (
          await connection.getLatestBlockhash("confirmed")
        ).blockhash;

        const signed = await wallet.signTransaction(tx);
        const sig = await connection.sendRawTransaction(signed.serialize(), {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        });

        await connection.confirmTransaction(sig, "confirmed");

        setTxHistory((prev) => [sig, ...prev]);
        await fetchBalance(publicKey);

        return {
          signature: sig,
          explorerUrl: explorerUrl(sig),
          dealPDA: dealPDA.toString(),
          vaultPDA: vaultPDA.toString(),
        };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Транзакция не удалась";
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [publicKey, wallet, fetchBalance]
  );

  // Open dispute
  const openDispute = useCallback(
    async (dealId: number, evidenceText: string) => {
      if (!publicKey || !wallet) throw new Error("Кошелёк не подключён");
      setLoading(true);

      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(evidenceText);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashHex = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        const tx = new Transaction();
        const memoData = JSON.stringify({
          app: "TrustDeal",
          action: "OPEN_DISPUTE",
          dealId,
          evidenceHash: hashHex.slice(0, 16) + "...",
          timestamp: Date.now(),
        });

        tx.add(
          new TransactionInstruction({
            keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
            programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
            data: Buffer.from(memoData, "utf8"),
          })
        );

        tx.feePayer = publicKey;
        tx.recentBlockhash = (
          await connection.getLatestBlockhash("confirmed")
        ).blockhash;

        const signed = await wallet.signTransaction(tx);
        const sig = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(sig, "confirmed");

        setTxHistory((prev) => [sig, ...prev]);
        return { signature: sig, explorerUrl: explorerUrl(sig), evidenceHash: hashHex };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Ошибка открытия спора";
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [publicKey, wallet]
  );

  // Record AI verdict on-chain
  const recordAiVerdict = useCallback(
    async (dealId: number, verdict: string, lawReference: string, decision: "release" | "refund" | "split") => {
      if (!publicKey || !wallet) throw new Error("Кошелёк не подключён");
      setLoading(true);

      try {
        const encoder = new TextEncoder();
        const verdictHash = await crypto.subtle.digest("SHA-256", encoder.encode(verdict));
        const hashHex = Array.from(new Uint8Array(verdictHash))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        const tx = new Transaction();
        const memoData = JSON.stringify({
          app: "TrustDeal",
          action: "AI_VERDICT",
          dealId,
          decision,
          lawRef: lawReference,
          verdictHash: hashHex.slice(0, 16),
          autonomousExecution: true,
          timestamp: Date.now(),
        });

        tx.add(
          new TransactionInstruction({
            keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
            programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
            data: Buffer.from(memoData, "utf8"),
          })
        );

        tx.feePayer = publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;

        const signed = await wallet.signTransaction(tx);
        const sig = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(sig, "confirmed");

        setTxHistory((prev) => [sig, ...prev]);
        return { signature: sig, explorerUrl: explorerUrl(sig), verdictHash: hashHex };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Ошибка записи вердикта";
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [publicKey, wallet]
  );

  return {
    wallet,
    publicKey,
    balance,
    loading,
    error,
    txHistory,
    connection,
    connectWallet,
    airdrop,
    createDeal,
    openDispute,
    recordAiVerdict,
    fetchBalance,
  };
}
