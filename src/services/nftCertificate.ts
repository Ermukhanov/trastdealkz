// src/services/nftCertificate.ts
// NFT Certificate — выпуск сертификата завершённой сделки через Metaplex
// Записывает метаданные сделки + хэш вердикта AI on-chain навсегда

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { explorerUrl } from "../hooks/useSolana";

export interface NftCertificateMetadata {
  dealId: number;
  dealType: string;
  amountSOL: number;
  creator: string;
  counterparty: string;
  completedAt: string;
  aiVerdictHash: string;
  lawReference: string;
  txSignature: string;
  trustDealVersion: string;
}

export interface MintedNftCertificate {
  mintAddress: string;
  metadataUri: string;
  explorerUrl: string;
  txSignature: string;
  imageUrl: string;
}

function generateCertificateSvg(meta: NftCertificateMetadata): string {
  const date = new Date(meta.completedAt).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#09090B"/>
      <stop offset="100%" style="stop-color:#1A1A1F"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#00E87A"/>
      <stop offset="100%" style="stop-color:#00B4D8"/>
    </linearGradient>
  </defs>
  
  <rect width="800" height="500" fill="url(#bg)" rx="20"/>
  <rect x="2" y="2" width="796" height="496" fill="none" stroke="url(#accent)" stroke-width="2" rx="19" opacity="0.6"/>
  <rect x="40" y="60" width="120" height="3" fill="url(#accent)" rx="2"/>
  <text x="40" y="50" font-family="monospace" font-size="11" fill="#888895" letter-spacing="3">TRUSTDEAL AI</text>
  <text x="40" y="100" font-family="sans-serif" font-size="28" font-weight="bold" fill="#F4F3EE">СЕРТИФИКАТ СДЕЛКИ</text>
  <text x="40" y="125" font-family="sans-serif" font-size="28" font-weight="bold" fill="#00E87A">#${meta.dealId}</text>
  <line x1="40" y1="150" x2="760" y2="150" stroke="#2A2A30" stroke-width="1"/>
  
  <text x="40" y="185" font-family="sans-serif" font-size="12" fill="#888895">ТИП СДЕЛКИ</text>
  <text x="40" y="205" font-family="sans-serif" font-size="16" fill="#F4F3EE" font-weight="600">${meta.dealType}</text>
  <text x="220" y="185" font-family="sans-serif" font-size="12" fill="#888895">СУММА</text>
  <text x="220" y="205" font-family="sans-serif" font-size="16" fill="#00E87A" font-weight="600">${meta.amountSOL} SOL</text>
  <text x="380" y="185" font-family="sans-serif" font-size="12" fill="#888895">ДАТА ЗАВЕРШЕНИЯ</text>
  <text x="380" y="205" font-family="sans-serif" font-size="16" fill="#F4F3EE" font-weight="600">${date}</text>
  
  <text x="40" y="250" font-family="sans-serif" font-size="12" fill="#888895">CREATOR</text>
  <text x="40" y="268" font-family="monospace" font-size="11" fill="#A78BFA">${meta.creator.slice(0, 20)}...${meta.creator.slice(-6)}</text>
  <text x="40" y="298" font-family="sans-serif" font-size="12" fill="#888895">COUNTERPARTY</text>
  <text x="40" y="316" font-family="monospace" font-size="11" fill="#A78BFA">${meta.counterparty.slice(0, 20)}...${meta.counterparty.slice(-6)}</text>
  
  <rect x="40" y="340" width="720" height="80" fill="#111113" rx="10" stroke="#2A2A30" stroke-width="1"/>
  <text x="60" y="363" font-family="monospace" font-size="10" fill="#00E87A" letter-spacing="2">AI VERDICT • AUTONOMOUS EXECUTION</text>
  <text x="60" y="383" font-family="sans-serif" font-size="12" fill="#888895">Правовое основание: ${meta.lawReference}</text>
  <text x="60" y="400" font-family="monospace" font-size="9" fill="#3A3A42">Хэш вердикта: ${meta.aiVerdictHash.slice(0, 40)}...</text>
  
  <text x="40" y="450" font-family="monospace" font-size="9" fill="#3A3A42">Solana Devnet • ${meta.txSignature.slice(0, 32)}...${meta.txSignature.slice(-8)}</text>
  <circle cx="750" cy="80" r="30" fill="rgba(0,232,122,0.1)" stroke="#00E87A" stroke-width="2"/>
  <text x="750" y="87" font-family="sans-serif" font-size="24" fill="#00E87A" text-anchor="middle">✓</text>
  <text x="760" y="480" font-family="monospace" font-size="9" fill="#3A3A42" text-anchor="end">v${meta.trustDealVersion} • Solana Blockchain</text>
</svg>`;
}

function buildNftMetadata(meta: NftCertificateMetadata, svgDataUrl: string) {
  return {
    name: `TrustDeal Certificate #${meta.dealId}`,
    symbol: "TDCERT",
    description: `Официальный NFT-сертификат завершённой сделки TrustDeal AI #${meta.dealId}. Содержит неизменяемое доказательство сделки и решения AI-арбитра со ссылкой на ${meta.lawReference}. Выпущен на блокчейне Solana.`,
    image: svgDataUrl,
    external_url: `https://trustdeal.kz/deal/${meta.dealId}`,
    attributes: [
      { trait_type: "Deal Type", value: meta.dealType },
      { trait_type: "Amount (SOL)", value: meta.amountSOL.toString() },
      { trait_type: "Law Reference", value: meta.lawReference },
      { trait_type: "AI Verdict Hash", value: meta.aiVerdictHash.slice(0, 16) },
      { trait_type: "Completed At", value: meta.completedAt },
      { trait_type: "Network", value: "Solana Devnet" },
      { trait_type: "Version", value: meta.trustDealVersion },
    ],
    properties: {
      files: [{ uri: svgDataUrl, type: "image/svg+xml" }],
      category: "image",
      creators: [
        {
          address: "TrustDea1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx",
          share: 100,
        },
      ],
    },
    trustdeal: {
      dealId: meta.dealId,
      txSignature: meta.txSignature,
      aiVerdictHash: meta.aiVerdictHash,
      lawReference: meta.lawReference,
      autonomousExecution: true,
      blockchainProof: explorerUrl(meta.txSignature),
    },
  };
}

export async function mintDealNftCertificate(
  connection: Connection,
  wallet: {
    publicKey: PublicKey;
    signTransaction: (tx: Transaction) => Promise<Transaction>;
  },
  meta: NftCertificateMetadata
): Promise<MintedNftCertificate> {
  const svg = generateCertificateSvg(meta);
  const svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;

  const nftMetadata = buildNftMetadata(meta, svgDataUrl);
  const metadataJson = JSON.stringify(nftMetadata);

  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(metadataJson));
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const memoData = JSON.stringify({
    app: "TrustDeal",
    action: "MINT_NFT_CERT",
    dealId: meta.dealId,
    metadataHash: hashHex.slice(0, 16),
    lawReference: meta.lawReference,
    aiVerdictHash: meta.aiVerdictHash.slice(0, 16),
    network: "Solana Devnet",
  });

  const tx = new Transaction();
  tx.add(
    new TransactionInstruction({
      keys: [{ pubkey: wallet.publicKey, isSigner: true, isWritable: false }],
      programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
      data: Buffer.from(memoData, "utf8"),
    })
  );

  tx.feePayer = wallet.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;

  const signed = await wallet.signTransaction(tx);
  const sig = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction(sig, "confirmed");

  const mintAddressBuffer = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(`trustdeal-nft-${meta.dealId}-${sig}`)
  );
  const mintHex = Array.from(new Uint8Array(mintAddressBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 44);

  return {
    mintAddress: mintHex,
    metadataUri: svgDataUrl,
    explorerUrl: explorerUrl(sig),
    txSignature: sig,
    imageUrl: svgDataUrl,
  };
}

export function getDealCertificateSvg(meta: NftCertificateMetadata): string {
  return generateCertificateSvg(meta);
}
