# MoneyMate

A personal finance app that tells you what's safe to spend today. Track income and expenses, set budgets, save towards goals, keep tabs on IOUs, and scan receipts with AI.

Built with React 19, TypeScript, Vite, Tailwind CSS 4, Firebase Auth and MongoDB Atlas, deployed on Vercel.

## Features

- **Financial Pulse**: a 0–100 health score (savings rate, budget discipline, emergency cushion, debt load) and a daily safe-to-spend figure that accounts for bills still due this month.
- **Smart insights**: budget pace warnings with the date you'll cross the limit, category spikes against your 3-month average, overdue IOUs, and the monthly amount each goal needs.
- **Bill and subscription detection**: payments that repeat roughly monthly are found automatically, with reminders before they're due.
- **AI receipt scanning**: photograph a bill and the form fills itself in for you to check.
- **Auto-categorisation**: learns from your past entries, falling back to common Indian merchants.
- **Command palette** (`⌘K` / `Ctrl K`) and shortcuts: `N` expense, `I` income, `H` hide amounts, `/` search.
- **Privacy mode**, **undo delete**, **CSV export**, a **spending calendar**, light and dark themes.
- **Bank SMS & statement import**: paste SMS from SBI, HDFC, ICICI, Axis, Kotak and UPI apps, or drop a statement CSV. OTPs, offers and reminders are ignored, duplicates are caught, and everything is reviewed before importing.
- **Monthly Wrapped**: an eight-slide animated story of your month (top category, go-to merchant, no-spend days, your money personality) with a shareable image that hides amounts by default.
- **Ask MoneyMate**: chat with an AI that answers from your own data ("Can I afford a ₹40,000 phone?"). Claude requests tools and they run in your browser against your ledger, so every number is computed, and it works with encryption on.
- **Wealth**: track bank accounts, FDs, mutual funds, EPF/PPF, gold, property and loans. Net worth trend, allocation bar, stale-balance reminders, and one-click import of mutual funds from a CAMS/KFintech statement PDF.
- **Tax planner (India)**: old vs new regime from Budget 2025 slabs, deductions auto-detected from your payments (PPF, LIC, health insurance, NPS, rent), caps per section and what more you could save.
- **Groups**: split trips and flat bills, see balances, settle in the fewest payments.
- **UPI settle-up**: payment requests with a QR code (amount pre-filled), WhatsApp nudges, and "Open UPI app" to pay friends in one tap.
- **Budget autopilot & savings sweep**: suggested budgets from your last 3 months, copy last month's budgets, and an offer early each month to move last month's surplus into a goal.
- **Bill reminders**: push notifications the day before bills and IOUs are due.
- **Accent themes**: Gold, Emerald, Sapphire, Rose and Amethyst, each tuned for dark and light.
- **Optional end-to-end encryption**: your passphrase encrypts everything before upload; the server stores only ciphertext.
- **Installable PWA** with home-screen shortcuts and an offline app shell.
- Sync across devices; works signed-out with data kept on the device.

## Getting started

```bash
npm install
cp .env.example .env   # then fill it in, see below
npm run dev
```

`npm run dev` serves the `/api` routes too, using the same code Vercel runs in production.

### Demo mode

```bash
npm run demo
```

Opens the full app with six months of sample data and a signed-in demo user. No Firebase or database needed, so it's the quickest way to show the project to someone. Add `?loggedout` to the URL to see the sign-in page, or `?theme=light` for the light theme.

### Public demo site

```bash
npm run build:demo   # → dist-demo/
```

Deploy `dist-demo` as a second Vercel project (or any static host) to give people a one-click live demo with sample data. AI features need a real account, so they show a friendly message in the demo.

### Tests

```bash
npm test          # once
npm run test:watch
```

95 tests cover the insights engine, income-tax maths, group settlements, UPI links, budget autopilot, PDF statement and CAMS parsing, (forecast, health score, bill detection, alerts), the SMS and statement parsers, auto-categorisation and the monthly recap. `npm run build` runs them first, so a broken calculation can't be deployed.

## Environment variables

| Variable | Where it's used | Required |
| --- | --- | --- |
| `VITE_FIREBASE_*` | Browser (sign-in) | Yes |
| `MONGODB_URI` | Server only | Yes, for sync |
| `FIREBASE_PROJECT_ID` | Server only, verifies sign-in tokens | Yes, for sync |
| `ANTHROPIC_API_KEY` | Server only | Only for receipt scanning |
| `ANTHROPIC_MODEL` | Server only | No (receipts; defaults to `claude-haiku-5-5`) |
| `ANTHROPIC_CHAT_MODEL` | Server only | No (Ask MoneyMate; defaults to `claude-sonnet-5-5`) |
| `VITE_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Browser / server | Only for bill reminders (`npx web-push generate-vapid-keys`) |
| `CRON_SECRET` | Server only | Only for bill reminders (any long random string) |
| `VITE_SENTRY_DSN` | Browser | Only for crash reporting |

Only `VITE_`-prefixed variables reach the browser. Never prefix secrets with `VITE_`.

On Vercel, add the same variables under **Project → Settings → Environment Variables**.

## How it's organised

```
api/                 Vercel serverless functions
  _auth.ts           Verifies Firebase ID tokens (no service account needed)
  _ledger.ts         Read/write a user's ledger (shared with the dev server)
  _receipt.ts        Receipt → structured data via Claude vision
  sync.ts            GET/POST /api/sync
  ask.ts             POST /api/ask (AI relay with tool definitions)
  push-subscribe.ts  Save/remove push subscriptions
  cron/reminders.ts  Daily 09:00 IST bill reminders (Vercel cron)
  scan-receipt.ts    POST /api/scan-receipt
src/
  context/           AuthContext, AppContext (data + sync), UIContext (sheets, palette, shortcuts)
  lib/insights.ts    Pure functions behind every score, forecast and alert
  lib/importers/     Bank SMS and statement CSV parsers
  lib/recap.ts       Data for the monthly Wrapped story
  lib/fx.ts          Confetti, haptics and the card spotlight
  lib/askTools.ts    Tools Ask MoneyMate runs in the browser
  lib/tax.ts, groups.ts, wealth.ts, upi.ts, autopilot.ts, crypto.ts, push.ts
  __tests__/         Vitest suite
  lib/autoCategory.ts
  lib/api.ts         Authenticated fetch helpers
  components/        dashboard/, reports/, layout/, shared/, transactions/
  pages/             One file per route; all except the dashboard are lazy-loaded
public/              PWA manifest, service worker, icons, images
demo/                Demo mode (sample data + mock sign-in)
```

## Data and privacy

- Each request to `/api/sync` must carry the user's Firebase ID token. The server takes the user ID from the verified token, so nobody can read or write another account.
- The browser keeps a per-account cache in `localStorage` (`moneymate:v2:<uid>`) so the app opens instantly and works offline. The cloud copy is the source of truth whenever you're signed in.
- Receipt photos are sent to the server only for scanning and are not stored.
- Bank SMS, statement PDFs and CAS PDFs are parsed on your device.
- Ask MoneyMate sends your question and the tool results it needs to Claude via the server; nothing is stored.
- With end-to-end encryption on, the server keeps only ciphertext and no readable copy is cached on the device. Bill-reminder notifications don't work in this mode, because the server can't read your bills.
