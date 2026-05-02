import { io } from 'socket.io-client';
import { storage } from './storage.js';

// Socket singleton. We connect lazily — only when AuthProvider has a token
// — and reuse the same socket across the app. On logout we disconnect and
// drop the reference so the next login forces a fresh handshake.

const BASE = import.meta.env.VITE_API_URL ?? window.location.origin;

let socket = null;

export const getSocket = () => {
  const token = storage.getToken();
  if (!token) return null;

  if (socket && socket.connected) return socket;
  if (socket) {
    // Token may have changed (re-login as another user) — rebuild auth.
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  socket = io(BASE, {
    auth: { token },
    autoConnect: true,
    transports: ['websocket', 'polling'],
  });
  return socket;
};

export const disconnectSocket = () => {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
};
