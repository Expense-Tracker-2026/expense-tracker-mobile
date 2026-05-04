import { useState, useEffect } from 'react';

// Module-level cache shared across all hook instances
const rateCache = new Map<string, { rates: Record<string, number>; ts: number }>();
const TTL = 60 * 60_000; // 1 hour

export function useExchangeRate(base: string | null) {
  const [rates, setRates] = useState<Record<string, number> | null>(() => {
    if (!base) return null;
    const c = rateCache.get(base);
    return c && Date.now() - c.ts < TTL ? c.rates : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!base) { setRates(null); return; }

    const cached = rateCache.get(base);
    if (cached && Date.now() - cached.ts < TTL) {
      setRates(cached.rates);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`https://open.er-api.com/v6/latest/${base}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.error) throw new Error(data.error);
        rateCache.set(base, { rates: data.rates, ts: Date.now() });
        setRates(data.rates);
      })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [base]);

  return { rates, loading, error };
}
