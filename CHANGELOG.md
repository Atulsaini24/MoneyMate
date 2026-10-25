# Changelog

## 3.0.0

### New
- **Ask MoneyMate** (`/ask`): AI chat over your own finances with three tools (overview, transaction search, breakdowns) executed in the browser. Shows each lookup live.
- **Wealth** (`/wealth`): assets and liabilities, net-worth history chart, allocation, stale-balance reminders, CAMS/KFintech CAS PDF import.
- **Tax planner** (`/tax`): old vs new regime (Budget 2025 slabs, 87A rebate with marginal relief, cess), HRA exemption, section caps, auto-detected deductible payments you can confirm or dismiss.
- **Groups** (`/groups`): shared expenses, balances, minimum-payment settle-up, shareable summary.
- **UPI settle-up** in IOUs and Groups: QR codes with amount, WhatsApp nudges, one-tap pay on phones.
- **Budget autopilot** and **copy last month’s budgets**; **month-end savings sweep** into goals.
- **Bill reminders** via web push and a daily Vercel cron.
- **PDF bank statements** in the import centre (password-protected supported); debit/credit inferred from the running balance.
- **Accent themes** and a reorganised sidebar (Money / Plan / People / Tools).
- **End-to-end encryption** (opt-in, AES-GCM with a PBKDF2-derived key) with an unlock screen.
- **Sentry** crash reporting (optional, amounts never sent).
- **Public demo build** (`npm run build:demo`).
- 25 new tests (95 total).

### Not included, on purpose
- **Account Aggregator** bank sync needs registration as a regulated Financial Information User and a provider contract (Setu, Finvu, OneMoney). It's a business step before it's a code step.
- **Hindi**: needs a reviewed translation of every string; a partial machine translation would read worse than English.

## 2.1.0

### New
- **Import centre** (`/import`): paste bank SMS or drop a statement CSV. Understands SBI, HDFC, ICICI, Axis, Kotak and UPI formats, including SBI's "debited by 250.00" with no currency. Skips OTPs, offers, reminders and collect requests; never mistakes the available balance for the amount; flags transactions you already have; lets you edit the description and category of each row before importing.
- **Monthly Wrapped**: an animated eight-slide story with tap/hold/arrow-key controls, a money personality, and a 1080×1350 share image (amounts hidden unless you choose to show them). Month-in-progress comparisons use the same days of last month.
- **Redesigned sign-in**: live product showcase with a 3D card stack that follows the cursor, rotating notifications, and an SMS that turns into a clean transaction. Adds password reset and friendly error messages.
- **Mobile speed dial**: the + button fans out to Expense, Income, Scan and Import.
- **Living interface**: drifting ambient light, film grain, a glow that follows the cursor across cards, blur-through page transitions, sliding navigation pills, confetti on real milestones (goal funded, import done, recap) and haptic taps on phones. All of it turns off with reduced motion.
- **Demo mode** (`npm run demo`) with six months of sample data and no sign-in.
- **Test suite**: 70 Vitest tests, run automatically by `npm run build`.

### Fixes
- The health card said "Weakest area" even at a perfect score.
- The parser treated "by NEFT" as the sender of a salary credit.

## 2.0.0

### Security (action required)
- **Removed the MongoDB connection string hardcoded in `vite.config.ts` and `api/_db.ts`.** It is still in git history: rotate the database password in MongoDB Atlas.
- `/api/sync` now verifies the Firebase ID token and ignores the `userId` query parameter. Previously anyone could read or overwrite any account by changing the URL.
- Removed `Access-Control-Allow-Origin: *` from the API.
- Added security headers (`nosniff`, `X-Frame-Options`, `Referrer-Policy`) in `vercel.json`.
- Removed claims the app couldn't back up ("End-to-End Encrypted", "256-Bit Vault").

### Bug fixes
- The "Verify MongoDB Atlas Connection" button overwrote the cloud ledger with empty data. Replaced with a safe "Sync now".
- Local data was stored under one shared key, so different accounts on the same device merged into each other. The cache is now per account.
- Items deleted on one device came back after syncing (the merge unioned local and cloud). The cloud copy is now authoritative.
- `npm run build` failed on a TypeScript error (`refreshCloudData` missing).
- The currency setting was ignored; every amount showed in rupees.
- "Add income" from Quick Actions opened the sheet in expense mode.
- "Others" couldn't be chosen as an expense category (only the first 8 were shown).
- Dates were saved as the previous day when adding entries before 5:30 am IST (UTC conversion).
- The transaction list staggered its animation by 20 ms per row, so long lists took seconds to appear.
- The balance sparkline was fabricated; it now plots the real last-30-day balance.
- Adding money past a goal's target was silently discarded; the toast now says so.
- The "Reduced motion" setting had no effect; it now drives all animations.
- The notification bell showed a permanent dot and did nothing.
- The scan receipt button only showed an explanation dialog.
- Toasts said "Payment & Ledger Verified" for every action, including saving settings.
- Category icons had no size or padding (the `category-icon` class didn't exist).

### New
- Financial Pulse card: health score with breakdown, safe-to-spend today, month forecast.
- Insights feed and a working notification centre.
- Automatic bill and subscription detection; Upcoming bills card and Subscriptions tab.
- AI receipt scanning (`/api/scan-receipt`).
- Auto-categorisation from your history and common merchants.
- Command palette and keyboard shortcuts.
- Privacy mode.
- Undo on delete.
- Spending calendar heatmap.
- CSV export, transactions grouped by day, "Show more" paging, search by amount.
- Installable PWA with home-screen shortcuts and offline shell.
- Sync status indicator (saving, saved, offline with automatic retry).

### Design
- All ~1,170 hardcoded colours replaced with theme tokens; the light theme now covers every screen and drops the `!important` overrides.
- Muted text contrast raised from 4.1:1 to 5.3:1.
- Visible keyboard focus, skip link, `prefers-reduced-motion` support, accessible switches, labelled icon buttons.
- Plain-language copy in place of jargon ("Capital outflows by classification" → "Spending by category").
- Phones show metrics in two columns so the key numbers fit on the first screen.

### Performance
- Main JavaScript bundle 2.25 MB → 140 KB entry (pages lazy-loaded, vendors split, all-icons import removed, unused Firestore dropped). Total JS about halved.
- Images 8.3 MB → 1.7 MB.
