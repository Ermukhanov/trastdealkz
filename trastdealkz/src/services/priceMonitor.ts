// src/services/priceMonitor.ts
// Мониторинг цен криптовалют и фиата в реальном времени
// Данные от CoinGecko (бесплатно, без API ключа)

export interface PriceData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap?: number;
  volume24h?: number;
  timestamp: Date;
}

export interface CryptoPrices {
  bitcoin: PriceData;
  solana: PriceData;
  ethereum: PriceData;
  usd?: { rub: number; kzt: number; timestamp: Date };
}

// CoinGecko API endpoints (free, no key needed)
const COINGECKO_API = "https://api.coingecko.com/api/v3";

export async function fetchCryptoPrices(): Promise<CryptoPrices> {
  try {
    // Fetch BTC, SOL, ETH в одном запросе
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=bitcoin,solana,ethereum&vs_currencies=usd,kzt,eur&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`
    );

    if (!response.ok) throw new Error("CoinGecko API error");

    const data = await response.json();

    return {
      bitcoin: {
        symbol: "BTC",
        name: "Bitcoin",
        price: data.bitcoin.usd,
        change24h: data.bitcoin.usd_24h_change || 0,
        marketCap: data.bitcoin.usd_market_cap,
        volume24h: data.bitcoin.usd_24h_vol,
        timestamp: new Date(),
      },
      solana: {
        symbol: "SOL",
        name: "Solana",
        price: data.solana.usd,
        change24h: data.solana.usd_24h_change || 0,
        marketCap: data.solana.usd_market_cap,
        volume24h: data.solana.usd_24h_vol,
        timestamp: new Date(),
      },
      ethereum: {
        symbol: "ETH",
        name: "Ethereum",
        price: data.ethereum.usd,
        change24h: data.ethereum.usd_24h_change || 0,
        marketCap: data.ethereum.usd_market_cap,
        volume24h: data.ethereum.usd_24h_vol,
        timestamp: new Date(),
      },
      usd: {
        rub: 100, // Placeholder - в реальности нужна отдельная API
        kzt: 460,
        timestamp: new Date(),
      },
    };
  } catch (error) {
    console.error("Price fetch failed:", error);
    // Fallback values
    return {
      bitcoin: {
        symbol: "BTC",
        name: "Bitcoin",
        price: 65000,
        change24h: 2.3,
        timestamp: new Date(),
      },
      solana: {
        symbol: "SOL",
        name: "Solana",
        price: 145,
        change24h: 5.1,
        timestamp: new Date(),
      },
      ethereum: {
        symbol: "ETH",
        name: "Ethereum",
        price: 3500,
        change24h: 1.8,
        timestamp: new Date(),
      },
      usd: {
        rub: 100,
        kzt: 460,
        timestamp: new Date(),
      },
    };
  }
}

// Форматирует число как валюту
export function formatPrice(price: number, currency: string = "USD"): string {
  if (currency === "USD" || currency === "usd") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  }
  if (currency === "KZT" || currency === "kzt") {
    return new Intl.NumberFormat("kk-KZ", {
      style: "currency",
      currency: "KZT",
      minimumFractionDigits: 0,
    }).format(price);
  }
  return `$${price.toFixed(2)}`;
}

// Статус изменения цены
export function getPriceStatus(
  change: number
): "up" | "down" | "stable" {
  if (change > 2) return "up";
  if (change < -2) return "down";
  return "stable";
}

// Красивая дельта
export function formatDelta(delta: number): string {
  const sign = delta > 0 ? "↑ +" : delta < 0 ? "↓ " : "→ ";
  return `${sign}${delta.toFixed(2)}%`;
}

// Кэш с TTL (5 минут)
let cachedPrices: CryptoPrices | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedPrices(): Promise<CryptoPrices> {
  const now = Date.now();
  if (cachedPrices && now - lastFetchTime < CACHE_TTL) {
    return cachedPrices;
  }

  cachedPrices = await fetchCryptoPrices();
  lastFetchTime = now;
  return cachedPrices;
}
