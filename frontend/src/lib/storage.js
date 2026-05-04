// Centralised localStorage keys + small typed wrapper. Lets us swap to
// sessionStorage / cookies later without combing through every page.

const KEYS = {
  token: 'vortex.token',
  user:  'vortex.user',
};

const readJson = (key) => {
  try { return JSON.parse(localStorage.getItem(key)); }
  catch { return null; }
};

export const storage = {
  getToken: () => localStorage.getItem(KEYS.token),
  setToken: (token) => {
    if (token) localStorage.setItem(KEYS.token, token);
    else       localStorage.removeItem(KEYS.token);
  },
  getUser: () => readJson(KEYS.user),
  setUser: (user) => {
    if (user) localStorage.setItem(KEYS.user, JSON.stringify(user));
    else      localStorage.removeItem(KEYS.user);
  },
  clear: () => {
    localStorage.removeItem(KEYS.token);
    localStorage.removeItem(KEYS.user);
  },
};
