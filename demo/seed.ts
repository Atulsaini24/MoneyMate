// Seeds six months of realistic sample data for demo mode. Only loaded by demo.html.
const now = new Date();
let id = 0;
const tx = (monthsAgo: number, day: number, type: string, amount: number, description: string, category: string, paymentMethod = 'UPI') => {
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, day, 12);
  return { id: 't' + id++, type, amount, description, category, date: d.toISOString(), createdAt: d.toISOString(), paymentMethod };
};
const txs: any[] = [];
const today = now.getDate();
for (const m of [5, 4, 3, 2, 1, 0]) {
  const lim = m === 0 ? today : 28;
  txs.push(tx(m, 1, 'income', 85000, 'Salary — Infosys', 'Salary', 'Net Banking'));
  if (5 <= lim) txs.push(tx(m, 5, 'expense', 22000, 'Rent', 'Bills & Utilities', 'Net Banking'));
  if (12 <= lim) txs.push(tx(m, 12, 'expense', 649, 'Netflix', 'Entertainment', 'Credit Card'));
  if (8 <= lim) txs.push(tx(m, 8, 'expense', 1499, 'Cult.fit membership', 'Gym & Fitness', 'Credit Card'));
  if (m % 2 === 0 && 15 <= lim) txs.push(tx(m, 15, 'income', 18000, 'Freelance — logo project', 'Freelance', 'UPI'));
  for (let d = 2; d <= lim; d += 2) txs.push(tx(m, d, 'expense', m === 0 ? 420 + (d * 37) % 300 : 260 + (d * 53) % 200, ['Swiggy', 'Zomato', 'Blue Tokai coffee', 'Swiggy'][d % 4], 'Food & Dining'));
  for (let d = 3; d <= lim; d += 4) txs.push(tx(m, d, 'expense', 180 + (d * 29) % 250, ['Uber', 'Metro card recharge', 'Rapido'][d % 3], 'Transport'));
  if (m % 2 === 1 && 18 <= lim) txs.push(tx(m, 18, 'expense', 3200, 'Myntra', 'Shopping', 'Credit Card'));
}
txs.push(tx(0, Math.max(1, today - 3), 'expense', 6800, 'Nike running shoes', 'Shopping', 'Credit Card'));
// Tax-relevant payments, picked up by the Tax planner
txs.push(tx(4, 10, 'expense', 50000, 'PPF deposit', 'Others', 'Net Banking'));
txs.push(tx(3, 15, 'expense', 24000, 'LIC premium', 'Others', 'Net Banking'));
txs.push(tx(2, 20, 'expense', 18500, 'Star Health insurance renewal', 'Health', 'Credit Card'));
txs.push(tx(1, 7, 'expense', 25000, 'NPS contribution', 'Others', 'Net Banking'));
txs.sort((a, b) => +new Date(b.date) - +new Date(a.date));
const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
const iso = (dd: number) => new Date(now.getTime() + dd * 86400000).toISOString();
localStorage.setItem('moneymate:v2:demo-user', JSON.stringify({
  transactions: txs,
  budgets: [{ id: 'b1', category: 'Food & Dining', limit: 9000, month }, { id: 'b2', category: 'Shopping', limit: 9000, month }, { id: 'b3', category: 'Transport', limit: 3000, month }],
  goals: [
    { id: 'g1', name: 'Europe trip', targetAmount: 250000, savedAmount: 92000, targetDate: iso(240), category: 'long-term', image: '/assets/moneymate/goals/europe-trip.jpg', createdAt: iso(-90) },
    { id: 'g2', name: 'Emergency fund', targetAmount: 300000, savedAmount: 180000, category: 'long-term', image: '/assets/moneymate/goals/emergency-fund.jpg', createdAt: iso(-200) },
  ],
  assets: (() => {
    const hist = (base: number, growth: number) => Array.from({ length: 10 }, (_, k) => ({ date: new Date(now.getFullYear(), now.getMonth() - 10 + k, 15).toISOString(), value: Math.round(base * Math.pow(1 + growth, k)) }));
    const a = (id: string, name: string, kind: string, value: number, growth: number) => ({ id, name, kind, value, updatedAt: iso(-2), history: hist(value / Math.pow(1 + growth, 10), growth) });
    return [
      a('a1', 'HDFC savings', 'bank', 186000, 0.04), a('a2', 'SBI fixed deposit', 'fd', 200000, 0.006),
      a('a3', 'Parag Parikh Flexi Cap', 'mutual_fund', 342000, 0.025), a('a4', 'Axis Bluechip Fund', 'mutual_fund', 128000, 0.018),
      a('a5', 'Zerodha stocks', 'stocks', 96000, 0.02), a('a6', 'EPF', 'epf_ppf', 410000, 0.012), a('a7', 'PPF', 'epf_ppf', 165000, 0.01),
      a('a8', 'Sovereign gold bond', 'gold', 74000, 0.015), a('a9', 'Car loan', 'car_loan', 285000, -0.018), a('a10', 'HDFC credit card', 'credit_card', 23400, 0),
    ];
  })(),
  groups: [{
    id: 'grp1', name: 'Goa 2026', emoji: '🏖️', members: ['You', 'Rahul', 'Priya', 'Karan'], createdAt: iso(-20),
    upi: { Rahul: 'rahul.k@okaxis' },
    expenses: [
      { id: 'e1', description: 'Villa in Anjuna (3 nights)', amount: 24000, paidBy: 'You', splitAmong: ['You', 'Rahul', 'Priya', 'Karan'], date: iso(-18) },
      { id: 'e2', description: 'Dinner at Thalassa', amount: 6400, paidBy: 'Rahul', splitAmong: ['You', 'Rahul', 'Priya', 'Karan'], date: iso(-17) },
      { id: 'e3', description: 'Scooter rentals', amount: 2400, paidBy: 'Priya', splitAmong: ['You', 'Rahul', 'Priya', 'Karan'], date: iso(-17) },
      { id: 'e4', description: 'Cruise tickets', amount: 3600, paidBy: 'Karan', splitAmong: ['You', 'Priya', 'Karan'], date: iso(-16) },
    ],
  }, {
    id: 'grp2', name: 'Flat 4B', emoji: '🏠', members: ['You', 'Arjun'], createdAt: iso(-60),
    expenses: [{ id: 'f1', description: 'October electricity', amount: 3200, paidBy: 'Arjun', splitAmong: ['You', 'Arjun'], date: iso(-6) }],
  }],
  friends: [{ id: 'f1', name: 'Rahul', type: 'owed-to-me', amount: 3500, date: iso(-30), dueDate: iso(-9), status: 'outstanding', payments: [] }],
  settings: { upiId: 'atul.saini@okhdfcbank', accent: (new URLSearchParams(location.search).get('accent') || 'gold'), taxProfile: { grossSalary: 1800000, otherIncome: 40000, basic: 720000, hraReceived: 288000, metro: true, extra: { '80C': 64800 } }, name: 'Atul Saini', currency: 'INR', currencySymbol: '₹', dateFormat: 'DD/MM/YYYY', budgetStartDay: 1, theme: (new URLSearchParams(location.search).get('theme') || 'dark'), reducedMotion: false, notifications: true, privacyMode: false },
}));
