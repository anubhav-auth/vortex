import { storage } from './storage.js';

// ─────────────────────────────────────────────────────────────────────────
// Single API client. Every page goes through this — no naked `fetch` calls.
//
// Responsibilities:
//   - inject Authorization: Bearer <token>
//   - parse JSON, surface backend's { error, code, details } on non-2xx
//   - swallow 401 by clearing local auth and dispatching an event the
//     AuthProvider listens for, so a stale token boots the user to /login
//   - normalise errors into ApiError so callers can `try { ... } catch (e)`
//     and rely on shape (message, code, status, details)
// ─────────────────────────────────────────────────────────────────────────

const BASE = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  constructor({ message, code, status, details }) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const buildUrl = (path, query) => {
  const qs = query
    ? '?' + new URLSearchParams(
        Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== ''),
      ).toString()
    : '';
  return `${BASE}${path}${qs}`;
};

const onUnauthorized = () => {
  storage.clear();
  window.dispatchEvent(new CustomEvent('vortex:auth:expired'));
};

const request = async (method, path, { body, query, headers, signal } = {}) => {
  const token = storage.getToken();
  const res = await fetch(buildUrl(path, query), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  // 204 No Content
  if (res.status === 204) return null;

  let payload = null;
  try { payload = await res.json(); }
  catch { /* empty body */ }

  if (!res.ok) {
    if (res.status === 401) onUnauthorized();
    throw new ApiError({
      message: payload?.error ?? `${method} ${path} failed (${res.status})`,
      code:    payload?.code  ?? 'HTTP_ERROR',
      status:  res.status,
      details: payload?.details,
    });
  }

  return payload;
};

export const api = {
  get:    (path, opts) => request('GET',    path, opts),
  post:   (path, body, opts) => request('POST',   path, { ...opts, body }),
  put:    (path, body, opts) => request('PUT',    path, { ...opts, body }),
  patch:  (path, body, opts) => request('PATCH',  path, { ...opts, body }),
  delete: (path, opts) => request('DELETE', path, opts),
};
