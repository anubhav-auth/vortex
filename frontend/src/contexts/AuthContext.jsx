import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { storage } from '../lib/storage.js';
import { api } from '../lib/api.js';
import { disconnectSocket } from '../lib/socket.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => storage.getUser());
  const [bootChecked, setBootChecked] = useState(false);

  // On first mount, if we have a stored token, refresh /me to detect
  // server-side revocation since last visit (token still valid but admin
  // revoked the account, etc.).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!storage.getToken()) { setBootChecked(true); return; }
      try {
        const { user: fresh } = await api.get('/api/auth/me');
        if (!cancelled) {
          storage.setUser(fresh);
          setUser(fresh);
        }
      } catch {
        // 401 already cleared storage via api.js; nothing to do.
      } finally {
        if (!cancelled) setBootChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Listen for the api.js global "token expired" event so any 401 boots
  // the user, even from a background fetch.
  useEffect(() => {
    const onExpired = () => { setUser(null); disconnectSocket(); };
    window.addEventListener('vortex:auth:expired', onExpired);
    return () => window.removeEventListener('vortex:auth:expired', onExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: u } = await api.post('/api/auth/login', { email, password });
    storage.setToken(token);
    storage.setUser(u);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    storage.clear();
    disconnectSocket();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, bootChecked, isAuth: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
};
