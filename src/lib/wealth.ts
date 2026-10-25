import type { Asset, AssetKind } from '@/types';

export const KINDS: Record<AssetKind, { label: string; emoji: string; liability: boolean; group: string }> = {
  bank: { label: 'Bank account', emoji: '🏦', liability: false, group: 'Cash & bank' },
  cash: { label: 'Cash', emoji: '💵', liability: false, group: 'Cash & bank' },
  fd: { label: 'Fixed deposit', emoji: '🔒', liability: false, group: 'Cash & bank' },
  mutual_fund: { label: 'Mutual fund', emoji: '📈', liability: false, group: 'Investments' },
  stocks: { label: 'Stocks', emoji: '📊', liability: false, group: 'Investments' },
  epf_ppf: { label: 'EPF / PPF / NPS', emoji: '🏛️', liability: false, group: 'Retirement' },
  gold: { label: 'Gold', emoji: '🪙', liability: false, group: 'Other assets' },
  property: { label: 'Property', emoji: '🏠', liability: false, group: 'Other assets' },
  crypto: { label: 'Crypto', emoji: '🪙', liability: false, group: 'Investments' },
  other_asset: { label: 'Other asset', emoji: '✨', liability: false, group: 'Other assets' },
  home_loan: { label: 'Home loan', emoji: '🏡', liability: true, group: 'Loans' },
  car_loan: { label: 'Car loan', emoji: '🚗', liability: true, group: 'Loans' },
  personal_loan: { label: 'Personal loan', emoji: '🧾', liability: true, group: 'Loans' },
  education_loan: { label: 'Education loan', emoji: '🎓', liability: true, group: 'Loans' },
  credit_card: { label: 'Credit card dues', emoji: '💳', liability: true, group: 'Cards' },
  other_liability: { label: 'Other debt', emoji: '📉', liability: true, group: 'Loans' },
};

export function netWorth(assets: Asset[]) {
  let a = 0, l = 0;
  for (const x of assets) (KINDS[x.kind]?.liability ? (l += x.value) : (a += x.value));
  return { assets: a, liabilities: l, net: a - l };
}

/** Net worth at the end of each of the last `months` months, rebuilt from each account's history. */
export function netWorthHistory(assets: Asset[], months = 12, now = new Date()) {
  const out: { month: string; net: number }[] = [];
  for (let k = months - 1; k >= 0; k--) {
    const end = new Date(now.getFullYear(), now.getMonth() - k + 1, 0, 23, 59, 59);
    let net = 0, any = false;
    for (const a of assets) {
      const pts = [...a.history, { date: a.updatedAt, value: a.value }].filter(p => new Date(p.date) <= end).sort((x, y) => +new Date(x.date) - +new Date(y.date));
      if (!pts.length) continue;
      any = true;
      net += (KINDS[a.kind]?.liability ? -1 : 1) * pts[pts.length - 1].value;
    }
    out.push({ month: end.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }), net: any ? net : NaN });
  }
  return out.filter(p => !Number.isNaN(p.net));
}

export function withNewValue(a: Asset, value: number): Asset {
  const now = new Date().toISOString();
  // Keep one point per day so history stays small
  const history = [...a.history.filter(h => h.date.slice(0, 10) !== a.updatedAt.slice(0, 10)), { date: a.updatedAt, value: a.value }].slice(-120);
  return { ...a, value, updatedAt: now, history };
}
