# MoneyMate visual starter assets

This pack contains crops from the generated MoneyMate asset-board reference. Use them as visual references or image placeholders while implementing the UI. These are raster JPG crops, not individually exported SVG icons or transparent logos; for production, recreate icons with Lucide/SVG and export individual illustrations as needed.

## Contents
- `01-brand-logo-and-app-icons.jpg` — brand/logo inspiration
- `02-dashboard-hero-landscape.jpg` — landscape hero art crop
- `03-landscape-variations.jpg` — landscape variation thumbnails
- `04-expense-category-icons.jpg` — category icon visual reference
- `05-savings-goal-thumbnails.jpg` — savings goal image reference
- `06-onboarding-illustrations.jpg` — onboarding art reference
- `07-empty-state-illustrations.jpg` — empty-state art reference
- `08-ui-components-and-chart-elements.jpg` — chart and UI style reference
- `09-backgrounds-and-svg-pattern-inspiration.jpg` — background/pattern reference
- `00-asset-board-reference.jpg` — full reference board

## Suggested implementation
1. Put these files in `public/assets/moneymate/`.
2. Use `02-dashboard-hero-landscape.jpg` as a temporary hero background with a dark gradient overlay.
3. Use `05-savings-goal-thumbnails.jpg` only as a temporary contact-sheet placeholder; crop/export each goal thumbnail individually for polished cards.
4. Build category icons with `lucide-react` rather than using the entire category contact sheet in the live UI.
5. Use CSS gradients for glass cards, borders, and glows; do not use screenshots of UI components as actual controls.

## Design tokens
- Background: `#031A14`
- Secondary background: `#06251C`
- Card surface: `#083126`
- Emerald: `#10B981`
- Mint: `#6EF7BC`
- Primary text: `#F4FFF9`
- Secondary text: `#A7C4B6`
