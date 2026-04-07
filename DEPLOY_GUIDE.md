# 🚀 ПОЛНАЯ ИНСТРУКЦИЯ ПО ЗАПУСКУ И DEPLOY

> **Время:** 30-40 минут до работающего блокчейна  
> **Результат:** Солана + фронтенд + AI-арб всё вместе

---

## ✋ ТРЕБОВАНИЯ ПЕРЕД НАЧАЛОМ

```
✅ Node.js 18+ (проверить: node --version)
✅ npm или bun (здесь bun)
✅ Rust 1.70+ (проверить: rustc --version)
✅ Anchor CLI 0.30.1
✅ Solana CLI 1.18.26
✅ Phantom браузер расширение (установить)
```

---

## 📋 ШАГ 0: ПРОВЕРКА ОКРУЖЕНИЯ

```powershell
# Windows PowerShell (Admin)

# Проверить Node.js
node --version
# Должно быть: v18.x или v20.x

# Проверить npm/bun
bun --version

# Проверить Rust
rustc --version
cargo --version

# Проверить Anchor
anchor --version
# Должно быть: anchor 0.30.1

# Проверить Solana CLI
solana --version
# Должно быть: 1.18.26
```

Если чего-то не хватает:

```powershell
# Установить Rust (если нет)
Invoke-WebRequest https://win.rustup.rs -OutFile rustup-init.exe
.\rustup-init.exe -y

# Установить Solana CLI
Invoke-WebRequest https://release.solana.com/v1.18.26/solana-install-init-x86_64-pc-windows-gnu.exe -OutFile solana-installer.exe
.\solana-installer.exe

# Установить Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install 0.30.1
avm use 0.30.1
```

---

## 🎯 ШАГ 1: СКОМПИЛИРОВАТЬ SMART CONTRACT

```powershell
cd c:\Users\Acer Nitro\trastdealkz

# Сборка контракта (20-30 минут в первый раз)
anchor build

# Если все ОК, увидишь:
# Compiling trustdeal v0.1.0
# Finished release [optimized] target(s) in XXXs
```

**Что произошло:**
- Создался `target/debug/trustdeal.so` (скомпилированный контракт)
- Создался `target/idl/trustdeal.json` (interface для фронтенда)

---

## 🔑 ШАГ 2: ИНИЦИАЛИЗИРОВАТЬ SOLANA WALLET

```powershell
# Настроить devnet
solana config set --url https://api.devnet.solana.com

# Создать/проверить wallet
solana-keygen new --outfile ~/.config/solana/id.json -f

# Получить devnet SOL (ВАЖНО - нужно минимум 2 SOL для deploy)
solana airdrop 5 $(solana-keygen pubkey ~/.config/solana/id.json) --commitment confirmed
# Повторить если недостаточно

# Проверить баланс
solana balance $(solana-keygen pubkey ~/.config/solana/id.json)
# Должно быть: 5 SOL или больше
```

**Что произошло:**
- Wallet создан и подключен к devnet
- 5 SOL deposited for deploy costs

---

## 🔗 ШАГ 3: РАЗВЕРНУТЬ КОНТРАКТ НА DEVNET

```powershell
cd c:\Users\Acer Nitro\trastdealkz

# Deploy контракта
anchor deploy --provider.cluster devnet

# Ждать... (2-5 минут)
# Увидишь в консоли:
# Deploy successful. Signature: 
# Program Id: TrustDea1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**СКОПИРОВАТЬ Program ID из output!** Будет выглядеть как:
```
Program Id: 11111111222222223333333344444444555555556666
```

---

## 📝 ШАГ 4: ОБНОВИТЬ PROGRAM ID В 3 МЕСТАХ

### Место 1: `src/hooks/useSolana.ts`
```typescript
// Найти строку:
export const PROGRAM_ID = new PublicKey(
  "TrustDea1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx"
);

// Заменить на новый ID:
export const PROGRAM_ID = new PublicKey(
  "11111111222222223333333344444444555555556666"  // ТВОЙ ID
);
```

### Место 2: `programs/trustdeal/src/lib.rs`
```rust
// Найти строку:
declare_id!("TrustDea1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx");

// Заменить на:
declare_id!("11111111222222223333333344444444555555556666");  // ТВОЙ ID
```

### Место 3: `Anchor.toml`
```toml
# Найти:
[programs.devnet]
trustdeal = "TrustDea1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx"

# Заменить на:
[programs.devnet]
trustdeal = "11111111222222223333333344444444555555556666"  # ТВОЙ ID
```

**Проверка:**
```powershell
# Убедиться что всё обновлено:
grep -r "TrustDea1" src\
# Если ничего не найдется - хорошо!
```

---

## 🌐 ШАГ 5: УСТАНОВИТЬ ЗАВИСИМОСТИ ФРОНТЕНДА

```powershell
cd c:\Users\Acer Nitro\trastdealkz

# Установить npm зависимости
bun install

# или если bun не работает:
npm install

# Учебные пакеты:
# - @solana/web3.js (подключение к Solana)
# - @solana/wallet-adapter-react (Phantom интеграция)
# - anchor-lang (типы для контракта)
```

---

## 🎮 ШАГ 6: ЗАПУСТИТЬ DEV SERVER

```powershell
cd c:\Users\Acer Nitro\trastdealkz

# Запустить Vite dev server
bun run dev

# или:
npm run dev

# Увидишь:
#   vite v5.0.0 dev server running at:
#   http://localhost:5173/
#   Local: http://localhost:5173/
```

**Открыть в браузере:** http://localhost:5173/ 🎉

---

## 💰 ШАГ 7: ПОДКЛЮЧИТЬ PHANTOM И ПОЛУЧИТЬ DEVNET SOL

1. **Установить Phantom** (если ещё нет)
   - Chrome: https://phantom.app/
   - Firefox: https://phantom.app/
   - Кликнуть "Install"

2. **Создать/импортировать кошелёк**
   - Create new или Import seed phrase
   - Установить пароль
   - **ВАЖНО:** Переключить на **Devnet** (нижний левый угол → "Devnet")

3. **Получить 2 SOL в Phantom:**
   - В приложении TrustDeal кликнуть "🔗 Подключить Phantom"
   - Авторизовать подключение
   - Кликнуть "Запросить 2 SOL"
   - (или скопировать адрес и профинансировать через https://faucet-solana.web.app/)

4. **Проверить баланс:**
   - В Phantom должно появиться 2 SOL (devnet)
   - Может быть задержка 30 сек

---

## 🔄 ШАГ 8: ЗАПУСТИТЬ ПОЛНЫЙ ТЕСТ-ФЛОУС

### На фронтенде (http://localhost:5173/)

**Шаг 1: Подключение кошелька**
```
Кликнуть: "🔗 Подключить Phantom"
✅ Должна появиться кнопка "Создать deal"
✅ Баланс должен показать 2 SOL
```

**Шаг 2: Создание deal**
```
Заполнить форму:
- Описание: "Test freelance agreement"
- SOL: 0.1
- Контрагент: (скопировать адрес из Phantom или ввести другой)
- Тип: "Фриланс"
- Таймаут: 72 часа

Кликнуть: "🚀 Создать deal"
✅ TX должна отправиться (видно в консоли)
✅ Появится TX signature в статусе
✅ Уведомление: "✅ Сделка #xxxxx создана!"
```

**Шаг 3: Проверить на Solana Explorer**
```
TX signature появил в статусе
Кликнуть ссылку → откроется:
https://explorer.solana.com/tx/[SIGNATURE]?cluster=devnet

Должно показать:
✅ Status: Success
✅ Fee: 5000 lamports (~$0.0000015)
✅ Confirmed: Yes
```

**Шаг 4: Открыть спор**
```
На странице должна быть кнопка "Открыть спор"
Заполнить: "Contractor didn't deliver"
Кликнуть: "Открыть спор"
✅ Вторая TX отправится
✅ Статус: "⚠️ Спор открыт"
```

**Шаг 5: Запустить AI**
```
Кликнуть: "🤖 AI анализирует"
⏳ Ждать 5-10 сек (вызов Gemini API)
✅ Должен появиться вердикт JSON:
{
  "decision": "split",
  "lawReference": "ГК РК ст. 349",
  "reasoning": "...",
  "autonomousExecution": true
}
```

**Шаг 6: Выпустить NFT**
```
Кликнуть: "🎨 Выпустить NFT"
⏳ Ждать (генерируется SVG, хэшируется, отправляется Memo)
✅ Должен появиться SVG-сертификат
✅ NFT mint address покажется
✅ TX для NFT запишется on-chain
```

**Шаг 7: Проверить все TX в Explorer**
```
Удалены должны быть 3 TX:
1. create_deal
2. open_dispute
3. mint_nft_certificate

Все видны в:
https://explorer.solana.com/?cluster=devnet
Поиск по "trustdeal"
```

---

## ✅ УСПЕХ! ЧТО ДАЛЬШЕ?

Если всё прошло успешно:

```powershell
# 1. Снять скрин/видео
# 2. Commit в git
git add -A
git commit -m "🎉 TrustDeal AI - Devnet deploy working end-to-end"
git push origin main

# 3. Подготовить демо-видео (5 минут)
# 4. Заполнить Colosseum форму
# 5. ЛУЧШЕ СПЕШИТЬ! Deadline 23:59 GMT+5 сегодня!
```

---

## 🐛 TROUBLESHOOTING

### Ошибка: "Phantom not detected"
```
✅ Решение: Установить https://phantom.app/, перезагрузить браузер
```

### Ошибка: "Insufficient SOL for transaction"
```
✅ Решение: Запросить ещё devnet SOL через faucet
solana airdrop 2 $(solana-keygen pubkey ~/.config/solana/id.json)
```

### Ошибка: "Program deploy failed"
```
✅ Решение: Проверить что контракт скомпилировался:
anchor build  # должна быть success

✅ Проверить wallet balance:
solana balance $(solana-keygen pubkey ~/.config/solana/id.json)
# нужно >3 SOL

✅ Если всё равно не работает, попробовать:
anchor deploy --provider.cluster devnet --skip-local-validation
```

### Ошибка: "Cannot read property 'key' of undefined"
```
✅ Решение: Program ID обновлен? Проверить в 3 местах!
grep -r "TrustDea1" .

✅ Если остались старые ID - заменить везде
```

### Ошибка: "AI не возвращает вердикт"
```
✅ Решение: Fallback будет 50/50 split (это OK для демо)
✅ Проверить что Supabase URL установлена (если требуется)
```

---

## 🎬 ФИНАЛЬНЫЙ ЧЕКЛИСТ

```
Техническая подготовка:
[ ] anchor build - успешно скомпилировалось
[ ] anchor deploy - контракт развернут, Program ID получен
[ ] 3 места обновлены - Program ID везде свежий
[ ] bun run dev - фронтенд запущен на localhost:5173
[ ] Phantom подключен - 2 SOL devnet получено
[ ] 1 полный флоу завершён - deal создан, спор открыт, vverdikt выпущен, NFT готов
[ ] Все TX видны в Explorer devnet

Подготовка к сабмиту:
[ ] Demo видео записано (5 минут)
[ ] GitHub репо чистый, готов к review
[ ] README понятен судьям
[ ] Blockchain validation doc подготовлена
[ ] Top10 analysis прочитана

Финальная проверка:
[ ] Форма Colosseum заполнена
[ ] Video link вставлен
[ ] GitHub link актуален
[ ] Submit button готов (но не жми пока!)
```

---

## 📦 РЕЗУЛЬТАТЫ ПОСЛЕ ЗАВЕРШЕНИЯ

```
$ bun run dev
Запущен dev server на http://localhost:5173/

$ Phantom подключен → 2 SOL видны

$ Создана сделка → TX в explorer
https://explorer.solana.com/tx/[sig]?cluster=devnet

$ Открыт спор → на блокчейне

$ AI вынес вердикт → записано on-chain с законом РК

$ NFT сертификат → на Solana с метаданными

✅ ГОТОВО! Блокчейн работает, AI управляет, всё на Devnet!
```

---

**Если что-то не работает:**
- Перезагрузить браузер (Ctrl+Shift+R)
- Обновить Terminal window
- Очистить bun cache: `bun cache rm --all`
- Пересобрать контракт: `anchor clean && anchor build`

**Успехов в хакатоне! 🎉**

Дата: 7 апреля 2026 г.  
Время запуска: 2 часа до Colosseum deadline  
