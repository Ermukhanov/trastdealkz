// src/components/PriceMonitor.tsx
// Красивый компонент мониторинга цен BTC / SOL / ETH
// Используется в Profile, Dashboard и везде

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, RotateCw } from "lucide-react";
import {
  getCachedPrices,
  getPriceStatus,
  formatDelta,
  formatPrice,
  type PriceData,
} from "../services/priceMonitor";

interface PriceMonitorProps {
  compact?: boolean; // Compact view или full
  showSolana?: boolean;
}

export default function PriceMonitor({
  compact = false,
  showSolana = true,
}: PriceMonitorProps) {
  const [prices, setPrices] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCachedPrices();
        setPrices(data);
        setLastUpdate(new Date());
      } catch (e) {
        console.error("Price load error:", e);
      } finally {
        setLoading(false);
      }
    };

    load();
    // Refresh every 5 minutes
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !prices)
    return (
      <div className="p-3 bg-[#09090B] border border-[#2A2A30] rounded-lg text-[#888895]">
        <RotateCw className="w-4 h-4 animate-spin inline" /> Загружаю цены...
      </div>
    );

  const renderPrice = (coin: PriceData) => {
    const status = getPriceStatus(coin.change24h);
    const statusColor =
      status === "up"
        ? "text-[#00E87A]"
        : status === "down"
          ? "text-[#FF6B6B]"
          : "text-[#888895]";
    const statusBg =
      status === "up"
        ? "bg-[#00E87A]/10"
        : status === "down"
          ? "bg-[#FF6B6B]/10"
          : "bg-[#2A2A30]";

    if (compact) {
      return (
        <div
          key={coin.symbol}
          className="text-xs flex justify-between items-center p-2 rounded border border-[#2A2A30] mn:flex-col gap-1"
        >
          <div className="font-mono">{coin.symbol}</div>
          <div className={`font-bold ${statusColor}`}>
            {formatPrice(coin.price, "USD")}
          </div>
          <span className={`text-[10px] px-1 rounded ${statusBg} ${statusColor}`}>
            {formatDelta(coin.change24h)}
          </span>
        </div>
      );
    }

    return (
      <div
        key={coin.symbol}
        className={`p-4 rounded-lg border ${statusBg} border-[#2A2A30] bg-[#111113]`}
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="font-bold text-[#F4F3EE] text-lg">{coin.name}</div>
            <div className="text-xs text-[#888895] font-mono">{coin.symbol}</div>
          </div>
          {status === "up" && (
            <TrendingUp className="w-5 h-5 text-[#00E87A]" />
          )}
          {status === "down" && (
            <TrendingDown className="w-5 h-5 text-[#FF6B6B]" />
          )}
        </div>

        <div className="flex justify-between items-end">
          <div>
            <div className={`text-2xl font-bold ${statusColor}`}>
              {formatPrice(coin.price, "USD")}
            </div>
            {coin.marketCap && (
              <div className="text-xs text-[#3A3A42] mt-1">
                MCap: ${(coin.marketCap / 1e9).toFixed(1)}B
              </div>
            )}
          </div>
          <div
            className={`text-lg font-bold px-3 py-1 rounded ${statusBg} ${statusColor}`}
          >
            {formatDelta(coin.change24h)}
          </div>
        </div>

        {coin.volume24h && (
          <div className="text-xs text-[#3A3A42] mt-2">
            Vol24h: ${(coin.volume24h / 1e6).toFixed(0)}M
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={compact ? "grid grid-cols-3 gap-2" : "space-y-3"}>
      {renderPrice(prices.bitcoin)}
      {showSolana && renderPrice(prices.solana)}
      {renderPrice(prices.ethereum)}

      {lastUpdate && (
        <div className="text-xs text-[#3A3A42] text-right px-2">
          Обновлено: {lastUpdate.toLocaleTimeString("ru-RU")}
        </div>
      )}

      {/* Disclaimer */}
      <button
        onClick={() => window.open("https://www.coingecko.com", "_blank")}
        className="text-xs text-[#A78BFA] hover:text-[#00E87A] transition mt-2"
      >
        📊 Данные от CoinGecko · LIVE
      </button>
    </div>
  );
}

// Compact inline версия для топ-панели
export function PriceTicker() {
  const [prices, setPrices] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const data = await getCachedPrices();
      setPrices(data);
    };
    load();
    const interval = setInterval(load, 60 * 1000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (!prices) return null;

  return (
    <div className="flex gap-3 text-xs font-mono bg-gradient-to-r from-[#09090B] to-[#111113] border-b border-[#2A2A30] px-4 py-2 overflow-x-auto">
      <div className="flex gap-2 items-center">
        <span className="text-[#00E87A]">●</span>
        <span className="text-[#888895]">BTC:</span>
        <span className="text-[#F4F3EE] font-bold">
          {formatPrice(prices.bitcoin.price, "USD")}
        </span>
        <span
          className={
            prices.bitcoin.change24h > 0 ? "text-[#00E87A]" : "text-[#FF6B6B]"
          }
        >
          {formatDelta(prices.bitcoin.change24h)}
        </span>
      </div>

      <div className="flex gap-2 items-center py-1 px-1 bg-[#1A1A1F] rounded border border-[#2A2A30]">
        <span className="text-[#888895]">SOL:</span>
        <span className="text-[#00E87A] font-bold">
          {prices.solana.price.toFixed(2)}
        </span>
        <span
          className={
            prices.solana.change24h > 0 ? "text-[#00E87A]" : "text-[#FF6B6B]"
          }
        >
          {formatDelta(prices.solana.change24h)}
        </span>
      </div>

      <div className="flex gap-2 items-center">
        <span className="text-[#888895]">ETH:</span>
        <span className="text-[#F4F3EE] font-bold">
          {formatPrice(prices.ethereum.price, "USD")}
        </span>
        <span
          className={
            prices.ethereum.change24h > 0 ? "text-[#00E87A]" : "text-[#FF6B6B]"
          }
        >
          {formatDelta(prices.ethereum.change24h)}
        </span>
      </div>
    </div>
  );
}
