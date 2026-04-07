import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
  clusterApiUrl,
} from "@solana/web3.js";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

export const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

/** Transfer SOL from connected wallet to recipient, with optional memo */
export async function createTransferTx({
  from,
  to,
  amountSOL,
  memo,
}: {
  from: PublicKey;
  to: PublicKey;
  amountSOL: number;
  memo?: string;
}): Promise<Transaction> {
  const tx = new Transaction();
  tx.add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports: Math.round(amountSOL * LAMPORTS_PER_SOL),
    })
  );
  if (memo) {
    tx.add(
      new TransactionInstruction({
        keys: [{ pubkey: from, isSigner: true, isWritable: false }],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(memo, "utf-8"),
      })
    );
  }
  tx.feePayer = from;
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  return tx;
}

/** Create a memo-only transaction (record deal hash on-chain) */
export async function createMemoTx({
  signer,
  memo,
}: {
  signer: PublicKey;
  memo: string;
}): Promise<Transaction> {
  const tx = new Transaction();
  tx.add(
    new TransactionInstruction({
      keys: [{ pubkey: signer, isSigner: true, isWritable: false }],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memo, "utf-8"),
    })
  );
  tx.feePayer = signer;
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  return tx;
}

/** Verify a transaction exists and is confirmed */
export async function verifyTransaction(signature: string): Promise<{
  confirmed: boolean;
  slot?: number;
  blockTime?: number | null;
}> {
  try {
    const tx = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    if (!tx) return { confirmed: false };
    return {
      confirmed: true,
      slot: tx.slot,
      blockTime: tx.blockTime,
    };
  } catch {
    return { confirmed: false };
  }
}

/** Get SOL balance */
export async function getBalance(publicKey: PublicKey): Promise<number> {
  const bal = await connection.getBalance(publicKey);
  return bal / LAMPORTS_PER_SOL;
}

/** Get recent transactions for a wallet */
export async function getRecentTransactions(publicKey: PublicKey, limit = 10) {
  const sigs = await connection.getSignaturesForAddress(publicKey, { limit });
  return sigs.map((s) => ({
    signature: s.signature,
    slot: s.slot,
    blockTime: s.blockTime,
    err: s.err,
    memo: s.memo,
  }));
}

/** Generate escrow memo for on-chain recording */
export function buildDealMemo(dealId: string, action: string, extra?: string): string {
  const parts = [`TD:${action}`, `deal:${dealId.slice(0, 8)}`];
  if (extra) parts.push(extra);
  return parts.join("|");
}
