# Changelog

## 4.2.0

### Payment confirmation
- **Full-screen "done" moment** after saving a payment, like a UPI app: green grows out of the button you tapped, a white coin flips in and its tick draws, rings ripple out and sparks burst. The amount rolls in, and a receipt card shows who was paid (with their logo), when, and a reference number. It has Share and Done buttons and closes itself after about 5 seconds unless you touch the screen.
- Also plays for money added to a goal (with confetti when the goal is fully funded) and for IOU payments.
- **Sounds**: a two-note bell chime for payments and a coin "ting" for goals, synthesised with the Web Audio API (no audio files, works offline). Phones also get a short vibration.
- Both can be turned off in Settings → Appearance; with the confirmation off, the old toast is shown instead.

### Real logos and photos
- **Merchant logos** for about 100 brands (Swiggy, Zomato, Uber, Netflix, Spotify, Airtel, Jio, IndiGo, HDFC, PhonePe, Paytm and more) in transactions, bills, subscriptions and search, from Simple Icons (CC0). Brands Simple Icons doesn't carry (Amazon, Flipkart, Ola, Blinkit, Zepto…) show a letter in their brand colour rather than an imitation logo. Unknown names keep the category icon.
- **Goal photos** from Unsplash, chosen by the goal's name ("Goa trip" gets a beach) or its icon. They shimmer while loading and fall back to a coloured cover if a photo can't load.

### Phones
- Floating glass bottom dock with a raised + button; its menu springs up out of the button instead of opening a sheet.
- Round, colourful quick actions on Home; goals as a swipeable photo carousel near the top.
- Add sheet: a big centred amount, the merchant's logo appears as you type, one-tap chips for your usual merchants, and payment methods as chips. The button shows the amount ("Save ₹1,299").
- The balance card tilts with the phone's gyroscope (iOS asks for permission on first tap).
- Pull down at the top of any page to sync, with a spinning gold coin.
- Pages slide in from the side their tab sits on.
- The top bar on Home shows "₹3,117 safe today" once you scroll past the card.
- Transactions filters scroll sideways so their labels are no longer cut off; the notification badge no longer covers the bell.
- Dates read "Today", "Yesterday" or "4 Nov" instead of "6 Nov 2026".

### Desktop
- A custom pointer: a dot with a trailing ring that wraps small buttons, swells over larger ones, says "Tap" over the 3D scenes and steps aside for text fields. Mouse only, and off with Reduce motion.

### Loading
- A 3D spinning-coin splash is part of index.html, so it shows the instant the page opens, before any JavaScript loads.
- Skeleton screens shaped like the page that's loading (Home, lists, cards with photos), with an accent-to-gold progress line.
- Fixed: the old shimmer used the CSS background shorthand, which erased its own base colour.

### Sign-in on phones
- The headline reveals word by word, the 3D banknote tilts with the phone, and a row of bank and UPI app logos shows whose SMS MoneyMate can read.

## 4.1.0

### 3D
- **Sign-in**: a real-time 3D banknote that ripples, with gold coins floating around it and leaning toward your cursor.
- **Home**: a 3D stack of gold coins with the ₹ embossed on top. Its height is your data: the share of this month's income that's still free (not spent, not set aside for bills). Coins drop in with a bounce, the stack follows the cursor, and tapping it makes the coins hop. Before any income is added, a single coin turns slowly.
- **Goals**: a coin stack showing how much of all your goals you've saved.
- Built with three.js and loaded only on pages that show it (about 137 KB gzipped).

### Motion
- The safe-to-spend figure rolls like an odometer; other figures count up.
- Page titles reveal word by word; sections, cards and transaction rows cascade in.
- Sliding highlights on the sidebar, bottom tab bar, tabs and switches; the theme icon spins when you switch.
- Cards tilt in 3D on desktop with a light that follows the cursor; clickable cards lift on hover; primary buttons have a shine sweep.
- A slow colour wash drifts behind the app, and the banknote line-work draws itself in.
- Success messages draw their tick; the category chart dims other slices when you point at one.
- Skeleton placeholders with a shimmer and a top progress bar replace the loading spinner.

### Performance and comfort
- The coin stack only renders while something moves, then sleeps. Constant motion is capped at 30fps, resolution is capped, and the 3D pauses when it's off-screen or the tab is hidden.
- On devices without a graphics chip, or if frames get slow, the 3D shows as a still picture.
- Cards hold still while the pointer is over a button, so nothing slides away as you click.
- The phone's "reduce motion" setting and Settings → Reduce motion turn all of this off.

## 4.0.0

A full redesign of the interface, plus a pass to remove anything fake and fix what was broken.

### Design
- **New look**, inspired by Indian banknotes: a cool paper background, deep ink text, a peacock accent, and one marigold "safe to spend today" panel with a guilloche engraving. Replaces the black-and-gold theme.
- **Light, dark and Auto themes**. Auto follows the device and updates live. The saved theme is applied before first paint, so there's no flash.
- **Bricolage Grotesque and Figtree**, bundled with the app instead of loaded from Google Fonts, so text renders the same offline. Tabular figures for every amount.
- **Accent colours** renamed and retuned for both themes: Peacock (default), Marigold, Leaf, Indigo, Rose and Plum.
- **Category colours** are now distinct hues, so charts and lists can be told apart at a glance.
- **Crisp icons instead of photos.** Goal pictures, empty-state images and onboarding images were 87 to 150px and looked blurry; goals now have an icon and a colour you choose. Goals made in v3 keep a matching icon.
- New app icon, favicon and PWA icons.

### Navigation and layout
- **Phones**: a bottom tab bar (Home, Activity, Add, Budgets, More). Add opens a sheet with Expense, Income, Transfer, Scan receipt, Say it and Import SMS. More lists every section and the theme switch. The seven-button top bar and hamburger drawer are gone.
- **Desktop**: grouped sidebar with your account and sync status at the bottom, and a slim top bar with search, scan, voice, hide amounts, theme, notifications and Add transaction.
- **One dialog component** for the whole app: a bottom sheet you can swipe down on phones, a centred panel on desktop. Closes with Escape, keeps keyboard focus inside, locks page scroll, makes the page behind it inert for screen readers, and returns focus afterwards.
- Every page uses the same container, header and spacing, and was checked for sideways scrolling at 320, 375 and 390px wide, with very long names and very large amounts.

### Screens
- **Home**: the safe-to-spend panel, a this-month summary with the health score and its breakdown, a "Get set up" checklist worked out from what you've actually done, recent activity you can tap to edit, bills, categories, budgets and goals. A brand-new account sees the checklist only, not a wall of empty panels.
- **Transactions**: type, category, month and sort filters, grouped by day with each day's net, tap a row to edit or delete (with undo), CSV export.
- **Budgets**: month arrows, an even-pace marker, a per-day allowance, and an edit sheet with delete.
- **Goals**: amount needed per month to hit a target date, withdraw as well as add money, quick amounts.
- **IOUs, Groups, Net worth, Tax planner, Import, Analytics, Ask and Settings** rebuilt on the new components. Analytics merges Trends into Overview and adds a "Biggest changes" list.
- **Settings** is one page in clear sections, with a Delete all records option and a confirmation before restoring a backup.
- **Voice entry** shows what it heard and waits for you to tap Save, instead of saving on a two-second countdown. You can type instead, or open the full form to edit first.

### Guest mode
- **Use without an account.** The sign-in screen has a "Use without an account" option, and when Firebase isn't configured the app goes straight to "Start using MoneyMate" instead of a sign-in form that can't work. Data stays in the browser; signing in later moves it to your account.
- Receipt scanning, Ask MoneyMate and bill reminders explain that they need an account, and say plainly when accounts aren't turned on for the installation.

### Removed (fake or misleading)
- Demo mode (`npm run demo`, `build:demo`) and its six months of invented transactions.
- The sign-in page's animated showcase with made-up figures.
- The "Try sample messages" button on Import.
- The voice assistant's randomly generated waveform and its spoken "authorized" confirmation.
- The full-screen "Payment successful" overlay shown when logging an expense.
- Settings copy claiming Firestore sync, "Zero server telemetry" and "100% client sovereign", and the "Monthly cycle anchor day" setting that did nothing.
- The decorative stock-photo banner and quote on Goals, and leftover Vite assets.

### Fixed
- Confirmation dialogs weren't portaled, so they could appear behind other dialogs or the phone navigation.
- Date pickers and dropdowns were forced into dark mode, which broke them in the light theme.
- Group expense delete buttons were invisible on touch screens; deleting a group had no confirmation.
- Savings goals on Home showed an empty header when you had none.
- Currency labels and chart axes were hard-coded to ₹ regardless of your currency.
- The health score showed a number before there was enough data to mean anything.
- Single-key shortcuts (N, I, H) fired while a dialog was open.
- Focusing a button changed its corner radius.
- Adding money to a goal past its target showed an unformatted number.

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
