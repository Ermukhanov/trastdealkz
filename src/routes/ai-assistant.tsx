import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";

export const Route = createFileRoute("/ai-assistant")({
  component: AIAssistantPage,
});

type Message = { role: "user" | "assistant"; content: string };

function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Привет! Я TrustDeal AI ассистент. Я могу помочь вам с созданием сделок, анализом рисков и разрешением споров. Чем могу помочь?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    // Simple AI responses based on keywords
    const lowerInput = userMsg.content.toLowerCase();
    let response = "";

    if (lowerInput.includes("сделк") || lowerInput.includes("deal")) {
      response = "Для создания сделки вам нужно:\n\n1. **Определить условия** — опишите суть сделки\n2. **Указать сумму** — в SOL\n3. **Добавить участника** — по адресу кошелька\n4. **Подтвердить** — средства будут отправлены в эскроу\n\nAI автоматически проанализирует сделку и присвоит TrustScore. Хотите создать сделку прямо сейчас?";
    } else if (lowerInput.includes("эскроу") || lowerInput.includes("escrow")) {
      response = "**Эскроу на Solana** работает через смарт-контракты:\n\n- 💰 Средства блокируются до выполнения условий\n- 🤖 AI мониторит прогресс сделки\n- ✅ Автоматическое освобождение при завершении\n- 🛡️ Защита от мошенничества\n\nСреднее время транзакции: **< 1 секунда**";
    } else if (lowerInput.includes("nft") || lowerInput.includes("сертификат")) {
      response = "**NFT Сертификаты** — это неизменяемое доказательство сделки:\n\n- 📜 Содержит все детали сделки\n- ✍️ Подписан TrustDeal AI\n- 🔗 Хранится на блокчейне Solana\n- 🔍 Верифицируем любым участником\n\nКаждый NFT уникален и может служить юридическим доказательством.";
    } else if (lowerInput.includes("привет") || lowerInput.includes("hello") || lowerInput.includes("hi")) {
      response = "Привет! 👋 Я ваш AI ассистент для TrustDeal. Могу помочь с:\n\n- 📝 Создание и управление сделками\n- 💼 Анализ рисков и TrustScore\n- ⚖️ Арбитраж и разрешение споров\n- 📊 Статистика и аналитика\n\nЧто вас интересует?";
    } else {
      response = `Спасибо за ваш вопрос! На основе анализа:\n\n**TrustDeal AI рекомендует:**\n\n- Используйте эскроу для защиты средств\n- Проверяйте TrustScore участников\n- Все сделки верифицируются AI автоматически\n\nМогу подробнее рассказать о любой функции платформы. Что именно вас интересует?`;
    }

    // Simulate typing delay
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));
    setMessages([...allMessages, { role: "assistant", content: response }]);
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pt-16">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                msg.role === "assistant" ? "bg-gradient-purple" : "bg-secondary"
              }`}>
                {msg.role === "assistant" ? <Bot className="h-4 w-4 text-primary-foreground" /> : <User className="h-4 w-4 text-foreground" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "assistant"
                  ? "glass-card text-foreground"
                  : "bg-gradient-purple text-primary-foreground"
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-purple">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="glass-card rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-border/50 bg-background/80 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Задайте вопрос AI ассистенту..."
            className="flex-1 rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-brand-purple"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="flex items-center gap-2 rounded-xl bg-gradient-purple px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
