import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/useStore';

// In production, use empty string to connect to same origin
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');

// Generate or get session ID for anonymous users
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('chat_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('chat_session_id', sessionId);
  }
  return sessionId;
};

// Create socket instances
let customerSocket: Socket | null = null;
let adminSocket: Socket | null = null;

// Connect as customer (ChatBot widget) - never sends token to avoid admin detection
export const connectChatSocket = (): Socket => {
  if (customerSocket?.connected) {
    console.log('[Socket] Returning existing customer socket');
    return customerSocket;
  }

  const sessionId = getSessionId();
  console.log('[Socket] Connecting as customer, sessionId:', sessionId);

  customerSocket = io(`${SOCKET_URL}/chat`, {
    auth: {
      // Don't send token - always connect as customer even if logged in as admin
      sessionId,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  customerSocket.on('connect', () => {
    console.log('[Socket] Customer socket connected, id:', customerSocket?.id);
  });

  customerSocket.on('disconnect', (reason) => {
    console.log('[Socket] Customer socket disconnected:', reason);
  });

  customerSocket.on('connect_error', (error) => {
    console.error('[Socket] Customer socket connection error:', error);
  });

  return customerSocket;
};

// Connect as admin (Admin chat page) - sends token for admin authentication
export const connectAdminSocket = (): Socket => {
  if (adminSocket?.connected) {
    console.log('[Socket] Returning existing admin socket');
    return adminSocket;
  }

  const token = useAuthStore.getState().token;
  const sessionId = getSessionId();
  console.log('[Socket] Connecting as admin, token:', !!token, 'sessionId:', sessionId);

  adminSocket = io(`${SOCKET_URL}/chat`, {
    auth: {
      token,
      sessionId,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  adminSocket.on('connect', () => {
    console.log('[Socket] Admin socket connected, id:', adminSocket?.id);
  });

  adminSocket.on('disconnect', (reason) => {
    console.log('[Socket] Admin socket disconnected:', reason);
  });

  adminSocket.on('connect_error', (error) => {
    console.error('[Socket] Admin socket connection error:', error);
  });

  return adminSocket;
};

export const disconnectChatSocket = (): void => {
  if (customerSocket) {
    customerSocket.disconnect();
    customerSocket = null;
  }
};

export const disconnectAdminSocket = (): void => {
  if (adminSocket) {
    adminSocket.disconnect();
    adminSocket = null;
  }
};

// Reset chat session (call on logout)
export const resetChatSession = (): void => {
  // Disconnect both sockets
  disconnectChatSocket();
  disconnectAdminSocket();
  // Clear session ID from localStorage
  localStorage.removeItem('chat_session_id');
  console.log('[Socket] Chat session reset');
};

export const getChatSocket = (): Socket | null => {
  return customerSocket;
};

export const getAdminSocket = (): Socket | null => {
  return adminSocket;
};

export { getSessionId };
