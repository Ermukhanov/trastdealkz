# TrustDeal AI

> Next-Gen AI Deal Platform на блокчейне Solana

## О продукте

**TrustDeal AI** — платформа для создания безопасных сделок с использованием искусственного интеллекта и блокчейна Solana.

### Ключевые возможности

- 🤖 **AI Ассистент** — интеллектуальный помощник для анализа сделок, оценки рисков и разрешения споров
- 🔒 **Эскроу на Solana** — безопасное хранение средств через смарт-контракты
- 📜 **NFT Сертификаты** — неизменяемые доказательства завершённых сделок
- ⚡ **TrustScore** — AI-система оценки надёжности участников
- ⚖️ **AI Арбитраж** — автоматическое разрешение споров

## Технологический стек

- **Frontend**: React 19, TanStack Start, TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Lovable Cloud (Supabase)
- **AI**: Lovable AI Gateway (Google Gemini)
- **Blockchain**: Solana
- **Build**: Vite 7

## Запуск проекта

### Требования

- Node.js >= 18
- npm или bun

### Установка

```bash
# Клонируйте репозиторий
git clone <repo-url>
cd trustdeal-ai

# Установите зависимости
npm install

# Запустите dev-сервер
npm run dev
```

### Переменные окружения

Проект использует Lovable Cloud, переменные окружения настраиваются автоматически:

- `VITE_SUPABASE_URL` — URL Supabase проекта
- `VITE_SUPABASE_PUBLISHABLE_KEY` — публичный ключ Supabase
- `LOVABLE_API_KEY` — ключ для Lovable AI Gateway (серверный)

## Структура проекта

```
src/
├── components/          # UI компоненты
│   ├── ui/             # shadcn/ui компоненты
│   ├── Navbar.tsx      # Навигация
│   ├── HeroSection.tsx # Главный экран
│   └── ...
├── routes/             # Страницы (file-based routing)
│   ├── index.tsx       # Главная
│   ├── deals.tsx       # Список сделок
│   ├── create-deal.tsx # Создание сделки
│   ├── ai-assistant.tsx# AI чат
│   ├── dashboard.tsx   # Дашборд
│   ├── profile.tsx     # Профиль
│   └── wallet.tsx      # Кошелёк
├── integrations/       # Supabase клиент и типы
├── lib/                # Утилиты
└── styles.css          # Глобальные стили
supabase/
└── functions/
    └── chat/           # Edge function для AI чата
```

## База данных

### Таблица `deals`

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Уникальный идентификатор |
| user_id | UUID | Владелец сделки |
| title | TEXT | Название |
| description | TEXT | Описание |
| amount | DECIMAL | Сумма в SOL |
| counterparty_wallet | TEXT | Кошелёк контрагента |
| status | ENUM | pending, active, completed, disputed, cancelled |
| deal_type | ENUM | escrow, direct, nft |

RLS: каждый пользователь видит только свои сделки.

## Лицензия

MIT
