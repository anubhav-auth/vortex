import { useCallback, useEffect, useRef, useState } from 'react';

// Tiny data hook with stale-while-revalidate semantics.
//   - Pass a fetcher that returns a promise.
//   - Pass `deps` so refetches happen when inputs change.
//   - Returns { data, error, loading, refetch, mutate }.
//   - Refetches on window-focus by default; opt out with { refetchOnFocus: false }.

export const useApi = (fetcher, deps = [], { refetchOnFocus = true } = {}) => {
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

  return { data, error, loading, refetch: run, mutate: setData };
};
