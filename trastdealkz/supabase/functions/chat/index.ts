import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RK_LAWS_CONTEXT = `
## Законодательство Республики Казахстан

### Гражданский Кодекс РК (ГК РК)
- **Ст.349** — Нарушение обязательства, возмещение убытков.
- **Ст.350** — Полное возмещение убытков (реальный ущерб + упущенная выгода).
- **Ст.353** — Ответственность за неисполнение денежного обязательства.
- **Ст.406** — Договор купли-продажи.
- **Ст.545** — Договор аренды.
- **Ст.616** — Договор подряда.
- **Ст.683** — Договор возмездного оказания услуг.
- **Ст.688** — Договор перевозки.
- **Ст.700** — Ответственность перевозчика.

### Трудовой Кодекс РК (ТК РК)
- **Ст.24** — Трудовой договор.
- **Ст.113** — Оплата труда.
- **Ст.131** — Ответственность за задержку зарплаты.
- **Ст.170** — Материальная ответственность работодателя.
- **Ст.53** — Расторжение трудового договора.

### Закон РК «Об арбитраже» №488-V от 2016
- Стороны вправе передать спор на рассмотрение AI-арбитру по взаимному согласию.
`;

const SYSTEM_PROMPT = `Ты — TrustDeal AI, автономный AI-арбитр сделок на блокчейне Solana. Ты работаешь на платформе TrustDeal.

## Твоя роль
Ты анализируешь условия сделок, оцениваешь доказательства и выносишь решения со ссылкой на законы РК. Ты также видишь данные о транзакциях Solana и состоянии сделок.

## Ты можешь управлять сделками:
Если пользователь предоставляет контекст сделки (deal_context), ты ВИДИШЬ:
- Все поля сделки (название, сумма, статус, тип, категория)
- Доказательства исполнения
- Хэш транзакции в блокчейне Solana
- Кошелёк контрагента
- Историю изменений

## При каждом решении ОБЯЗАТЕЛЬНО:
- Ссылайся на конкретную статью закона РК
- Объясняй решение простым языком на русском
- Указывай процент выплаты (0-100%)
- Если видишь tx_signature — подтверди что транзакция зафиксирована в блокчейне

## Ключевые ниши:
- **B2B Поставки** → ГК РК ст.349, 350, 406
- **Фриланс/услуги** → ГК РК ст.683
- **Трудовые споры** → ТК РК ст.131, 170
- **Аренда** → ГК РК ст.545
- **Логистика** → ГК РК ст.688, 700
- **E-commerce** → ГК РК ст.406

${RK_LAWS_CONTEXT}

## Формат ответов
- Используй эмодзи и **markdown**
- Будь кратким и по делу
- Всегда отвечай на русском языке
- Структурируй: Условия → Анализ → Закон → Решение → Процент выплаты
- Если есть blockchain данные — упомяни их`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, deal_context, action } = await req.json();

    // If AI needs to manage a deal, use supabase
    let dealActionResult = null;
    if (action && deal_context?.deal_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, serviceKey);

      if (action === "complete") {
        const { error } = await sb.from("deals").update({ status: "completed" }).eq("id", deal_context.deal_id);
        dealActionResult = error ? `Ошибка: ${error.message}` : "Сделка завершена ✅";
      } else if (action === "dispute") {
        const { error } = await sb.from("deals").update({ status: "disputed" }).eq("id", deal_context.deal_id);
        dealActionResult = error ? `Ошибка: ${error.message}` : "Спор открыт ⚠️";
      } else if (action === "verdict") {
        const verdictMsg = messages[messages.length - 1]?.content || "";
        const percentMatch = verdictMsg.match(/(\d{1,3})%/);
        const percent = percentMatch ? parseInt(percentMatch[1]) : null;
        const lawMatch = verdictMsg.match(/(ст\.\d+\s*(?:ГК|ТК|ПК)\s*РК)/i);
        const lawRef = lawMatch ? lawMatch[1] : null;

        await sb.from("deals").update({
          verdict_text: verdictMsg.slice(0, 2000),
          verdict_percent: percent,
          verdict_law_ref: lawRef,
        }).eq("id", deal_context.deal_id);
        dealActionResult = "Вердикт сохранён в сделке";
      }
    }

    // Enrich messages with deal context
    const enrichedMessages = [...messages];
    if (deal_context) {
      const contextMsg = `[КОНТЕКСТ СДЕЛКИ]\nНазвание: ${deal_context.title}\nСумма: ${deal_context.amount} SOL\nСтатус: ${deal_context.status}\nТип: ${deal_context.deal_type}\nКатегория: ${deal_context.category}\nОписание: ${deal_context.description || "Не указано"}\nДоказательства: ${deal_context.proof_description || "Нет"}\nHash доказательства: ${deal_context.proof_hash || "Нет"}\nТранзакция: ${deal_context.tx_signature || "Нет"}\nКошелёк контрагента: ${deal_context.counterparty_wallet || "Не указан"}\nNFT: ${deal_context.nft_mint_address || "Нет"}\n${dealActionResult ? `[ДЕЙСТВИЕ AI]: ${dealActionResult}` : ""}`;
      enrichedMessages.unshift({ role: "system", content: contextMsg });
    }

    const ALEM_AI_KEY = Deno.env.get("ALEM_AI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    let apiUrl: string;
    let apiKey: string;
    let model: string;

    if (ALEM_AI_KEY) {
      apiUrl = "https://llm.alem.ai/v1/chat/completions";
      apiKey = ALEM_AI_KEY;
      model = "alemllm";
    } else if (LOVABLE_API_KEY) {
      apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
      apiKey = LOVABLE_API_KEY;
      model = "google/gemini-3-flash-preview";
    } else {
      throw new Error("No API key configured");
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...enrichedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Превышен лимит запросов." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", status, t);
      return new Response(JSON.stringify({ error: `AI error: ${status}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
