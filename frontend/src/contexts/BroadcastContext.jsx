import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';
import { getSocket } from '../lib/socket.js';
import { api } from '../lib/api.js';

// Subscribes to broadcast:new and surfaces:
//   - a real-time toast for each incoming broadcast
//   - the latest N broadcasts for components that want a feed
//
// Mounted at app root so toasts fire even on pages that don't read
// the context themselves.

const BroadcastContext = createContext(null);

export const BroadcastProvider = ({ children }) => {
  const { isAuth } = useAuth();
  const toast = useToast();
  const [latest, setLatest] = useState([]);
  const seen = useRef(new Set());

  // Initial backfill once authenticated.
  useEffect(() => {
    if (!isAuth) { setLatest([]); seen.current.clear(); return; }
    let cancelled = false;
    (async () => {
      try {
        const { broadcasts } = await api.get('/api/broadcast', { query: { limit: 25 } });
        if (cancelled) return;
        for (const b of broadcasts) seen.current.add(b.id);
        setLatest(broadcasts);
      } catch { /* gracefully degraded */ }
    })();
    return () => { cancelled = true; };
  }, [isAuth]);

  // Live socket subscription.
  useEffect(() => {
    if (!isAuth) return;
    const socket = getSocket();
    if (!socket) return;

    const onBroadcast = ({ broadcast }) => {
      if (!broadcast || seen.current.has(broadcast.id)) return;
      seen.current.add(broadcast.id);
      setLatest((prev) => [broadcast, ...prev].slice(0, 25));
      toast.info(broadcast.message, { title: 'Broadcast', ttl: 8000 });
    };

    socket.on('broadcast:new', onBroadcast);
    return () => socket.off('broadcast:new', onBroadcast);
  }, [isAuth, toast]);

  return (
    <BroadcastContext.Provider value={{ latest }}>
      {children}
    </BroadcastContext.Provider>
  );
};

export const useBroadcasts = () => {
  const ctx = useContext(BroadcastContext);
  if (!ctx) throw new Error('useBroadcasts outside BroadcastProvider');
  return ctx;
};
