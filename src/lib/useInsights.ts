import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { buildInsights, healthScore, monthForecast, detectRecurring, balanceSeries } from '@/lib/insights';

/** Memoised view of everything the insights engine derives from the ledger. */
export function useInsights() {
  const { transactions, budgets, goals, friends, settings } = useApp();
  return useMemo(() => {
    const ledger = { transactions, budgets, goals, friends };
    return {
      insights: buildInsights(ledger),
      health: healthScore(ledger),
      forecast: monthForecast(transactions),
      recurring: detectRecurring(transactions),
      series: balanceSeries(transactions, 30),
    };
    // settings is a dependency because currency/privacy change the formatted copy
  }, [transactions, budgets, goals, friends, settings.currency, settings.privacyMode]);
}
