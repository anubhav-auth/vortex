import { useCallback, useEffect, useRef, useState } from 'react';

// Tiny data hook with stale-while-revalidate semantics.
//   - Pass a fetcher that returns a promise.
//   - Pass `deps` so refetches happen when inputs change.
//   - Returns { data, error, loading, refetch, mutate }.
//   - Refetches on window-focus by default; opt out with { refetchOnFocus: false }.
//   - Optional `pollMs` polls in the background (paused when the tab is
//     hidden so we don't burn requests while the user is elsewhere).

export const useApi = (fetcher, deps = [], { refetchOnFocus = true, pollMs } = {}) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Avoid stale-closure issues by keeping the latest fetcher in a ref.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async () => {
    setError(null);
    try {
      const next = await fetcherRef.current();
      setData(next);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLoading(true);
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!refetchOnFocus) return;
    const onFocus = () => { run(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refetchOnFocus, run]);

  useEffect(() => {
    if (!pollMs) return;
    const tick = () => {
      // Skip while the tab is hidden so we don't burn requests in the
      // background. Visibilitychange below catches the user's return.
      if (!document.hidden) run();
    };
    const id = setInterval(tick, pollMs);
    const onVis = () => { if (!document.hidden) run(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [pollMs, run]);

  return { data, error, loading, refetch: run, mutate: setData };
};
