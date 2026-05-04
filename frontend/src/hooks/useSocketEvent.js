import { useEffect } from 'react';
import { getSocket } from '../lib/socket.js';

// Subscribe to a socket event for the lifetime of the component.
// Listener identity is recreated whenever `deps` change.

export const useSocketEvent = (event, listener, deps = []) => {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on(event, listener);
    return () => socket.off(event, listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
