/** Crash reporting with Sentry, loaded only when VITE_SENTRY_DSN is set. */
export async function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn || !import.meta.env.PROD) return;
  const Sentry = await import('@sentry/react');
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    // Never send money amounts or descriptions: drop input and console breadcrumbs, strip data
    beforeBreadcrumb: b => (b.category === 'console' || b.category === 'ui.input' ? null : { ...b, data: undefined }),
  });
}
