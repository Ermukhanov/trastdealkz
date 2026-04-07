import { createFileRoute } from "@tanstack/react-router";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { LAMPORTS_PER_SOL, Connection, clusterApiUrl } from "@solana/web3.js";
import { Wallet, ArrowUpRight, ArrowDownLeft, Copy, Check } from "lucide-react";

export const Route = createFileRoute("/wallet")({
  component: WalletPage,
});

function WalletPage() {
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }
    const connection = new Connection(clusterApiUrl("devnet"));
    connection.getBalance(publicKey).then((bal) => {
      setBalance(bal / LAMPORTS_PER_SOL);
    }).catch(() => setBalance(null));
  }, [publicKey]);

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 6)}...${publicKey.toBase58().slice(-4)}`
    : "";

  return (
    <div className="min-h-screen bg-background pt-24 px-4 pb-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground animate-fade-in">Кошелёк</h1>
        <p className="mt-2 text-muted-foreground animate-fade-in">Управляйте вашим Solana кошельком</p>

        <div className="mt-8 space-y-6">
          {/* Connect button */}
          <div className="flex justify-center animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
            <WalletMultiButton className="!rounded-xl !bg-gradient-purple !px-8 !py-3 !text-sm !font-medium !text-primary-foreground !transition-all hover:!opacity-90" />
          </div>

          {connected && publicKey && (
            <>
              {/* Balance card */}
              <div className="glass-card rounded-2xl p-8 text-center animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Wallet className="h-6 w-6 text-brand-green" />
                  <span className="text-sm text-muted-foreground">Devnet</span>
                </div>
                <div className="text-4xl font-bold text-foreground">
                  {balance !== null ? `${balance.toFixed(4)} SOL` : "Загрузка..."}
                </div>
                <button
                  onClick={copyAddress}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? <Check className="h-4 w-4 text-brand-green" /> : <Copy className="h-4 w-4" />}
                  {shortAddress}
                </button>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
                <button className="glass-card rounded-2xl p-6 text-center transition-all hover:border-brand-green/30 hover:scale-105">
                  <ArrowUpRight className="mx-auto h-8 w-8 text-brand-green mb-2" />
                  <div className="font-medium text-foreground">Отправить</div>
                  <div className="text-xs text-muted-foreground">Перевод SOL</div>
                </button>
                <button className="glass-card rounded-2xl p-6 text-center transition-all hover:border-brand-purple/30 hover:scale-105">
                  <ArrowDownLeft className="mx-auto h-8 w-8 text-brand-purple mb-2" />
                  <div className="font-medium text-foreground">Получить</div>
                  <div className="text-xs text-muted-foreground">Ваш адрес</div>
                </button>
              </div>

              {/* Transactions placeholder */}
              <div className="glass-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: "400ms", animationFillMode: "both" }}>
                <h3 className="font-semibold text-foreground mb-4">Последние транзакции</h3>
                <p className="text-sm text-muted-foreground text-center py-4">Нет транзакций</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
