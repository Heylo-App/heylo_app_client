import { io, Socket } from 'socket.io-client';

import { env } from '@/config/env';

type SocketEvents = {
  'chat:message': (payload: unknown) => void;
  'chat:typing': (payload: { conversationId: string; isTyping: boolean }) => void;
  'voice:participant_joined': (payload: unknown) => void;
  'voice:participant_left': (payload: unknown) => void;
  'voice:speaking': (payload: { userId: string; isSpeaking: boolean }) => void;
};

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (!env.socketUrl || this.socket?.connected) return;

    this.socket = io(env.socketUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  on<K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.socket?.on(event, handler as any);
  }

  off<K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.socket?.off(event, handler as any);
  }

  emit(event: string, payload?: unknown) {
    this.socket?.emit(event, payload);
  }

  joinRoom(roomId: string) {
    this.emit('voice:join', { roomId });
  }

  leaveRoom(roomId: string) {
    this.emit('voice:leave', { roomId });
  }

  sendMessage(conversationId: string, content: string) {
    this.emit('chat:send', { conversationId, content });
  }

  get isConnected() {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
