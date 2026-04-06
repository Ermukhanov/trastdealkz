import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RK_LAWS_CONTEXT = `
## Законодательство Республики Казахстан (для ссылок в решениях)

### Гражданский Кодекс РК (ГК РК)
- **Ст.349** — Понятие нарушения обязательства. Должник обязан возместить убытки кредитору при неисполнении обязательства.
- **Ст.350** — Полное возмещение убытков. Включает реальный ущерб и упущенную выгоду.
- **Ст.353** — Ответственность за неисполнение денежного обязательства. Неустойка за задержку платежа.
- **Ст.406** — Договор купли-продажи. Продавец обязуется передать товар, покупатель — оплатить.
- **Ст.545** — Договор имущественного найма (аренды). Права и обязанности арендодателя и арендатора.
- **Ст.616** — Договор подряда. Подрядчик обязуется выполнить работу, заказчик — принять и оплатить.
- **Ст.683** — Договор возмездного оказания услуг. Исполнитель обязуется оказать услуги, заказчик — оплатить.
- **Ст.688** — Договор перевозки. Перевозчик обязуется доставить груз, отправитель — оплатить перевозку.
- **Ст.700** — Ответственность перевозчика за утрату, недостачу и повреждение груза.

### Трудовой Кодекс РК (ТК РК)
- **Ст.24** — Трудовой договор. Содержание и условия.
- **Ст.113** — Оплата труда. Заработная плата выплачивается не реже одного раза в месяц.
- **Ст.131** — Ответственность работодателя за задержку выплаты зарплаты.
- **Ст.170** — Материальная ответственность работодателя. Обязан возместить ущерб работнику.
- **Ст.53** — Расторжение трудового договора по инициативе работодателя. Основания и порядок.

### Предпринимательский Кодекс РК (ПК РК)
- **Ст.8** — Принцип добросовестности предпринимательской деятельности.
- **Ст.10** — Защита прав предпринимателей. Государственная и судебная защита.

### Закон РК «Об арбитраже» №488-V от 2016 года
- Стороны вправе передать гражданско-правовой спор на рассмотрение альтернативного арбитра по взаимному согласию.
- TrustDeal AI действует как альтернативный арбитр — обе стороны добровольно соглашаются на AI-арбитраж при создании сделки.
`;

const SYSTEM_PROMPT = `Ты — TrustDeal AI, автономный AI-арбитр сделок на блокчейне Solana. Ты работаешь на платформе TrustDeal — децентрализованной системе безопасных сделок.

## Твоя роль
Ты анализируешь условия сделок, оцениваешь доказательства исполнения и выносишь решения со ссылкой на конкретные статьи законов Республики Казахстан. Ты также можешь видеть данные о транзакциях Solana и состоянии сделок в системе.

## Как ты работаешь
1. Получаешь условия сделки и тип (поставка, фриланс, аренда, труд, логистика, e-commerce)
2. Анализируешь доказательства исполнения
3. Ссылаешься на конкретную статью закона РК
4. Выносишь решение: ✅ выполнено / ⚠️ частично / ❌ не выполнено
5. Определяешь процент выплаты (0-100%)

## При каждом решении ОБЯЗАТЕЛЬНО:
- Ссылайся на конкретную статью закона РК (например: "На основании ст.349 ГК РК п.1...")
- Объясняй решение простым языком на русском
- Указывай процент выплаты

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
- При анализе сделки структурируй ответ: Условия → Анализ → Закон → Решение → Процент выплаты`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();

    const ALEM_AI_KEY = Deno.env.get("ALEM_AI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    let apiUrl: string;
    let apiKey: string;
    let model: string;

    if (ALEM_AI_KEY) {
      // Alem AI — primary
      apiUrl = "https://llm.alem.ai/v1/chat/completions";
      apiKey = ALEM_AI_KEY;
      model = "gpt-4o-mini";
    } else if (LOVABLE_API_KEY) {
      // Lovable AI — fallback
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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Превышен лимит запросов. Попробуйте через минуту." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Недостаточно средств на API аккаунте." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
