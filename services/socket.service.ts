import { io, Socket } from 'socket.io-client';

import { env } from '@/config/env';

export interface ConnectRequestPayload {
  id: string;
  senderId: string;
  alias: string;
  username: string;
  avatarId: string;
  moodId: string;
  vibe?: string;
  expiresAt: string | Date;
}

type SocketEvents = {
  'chat:message': (payload: unknown) => void;
  'chat:typing': (payload: { conversationId: string; isTyping: boolean }) => void;
  receive_group_message: (payload: any) => void;
  active_users_updated: () => void;
  receive_connect_request: (payload: ConnectRequestPayload) => void;
  connect_request_sent: (payload: {
    requestId: string;
    receiverId: string;
    expiresAt: string | Date;
  }) => void;
  connect_request_accepted: (payload: {
    chatId: string;
    requestId?: string;
    senderId?: string;
    receiverId?: string;
  }) => void;
  connect_request_cancelled: (payload: { requestId?: string; reason?: string }) => void;
  connect_request_error: (payload: { requestId?: string; message: string }) => void;
  find_match_result: (payload: { sentCount: number }) => void;
  receive_chat_message: (payload: any) => void;
  peer_left_chat: (payload: { chatId: string; message: string }) => void;
  chat_closed: (payload: { chatId: string; closedBy?: string; message: string }) => void;
  'moment:created': (payload: any) => void;
  'moment:updated': (payload: { id: string; likes: number; comments: any[] }) => void;
};

class SocketService {
  private socket: Socket | null = null;
  private currentUserId: string | null = null;
  private currentToken: string | null = null;
  private listeners = new Map<string, Set<Function>>();
  private joinedGroupRooms = new Set<string>();
  private joinedChatRooms = new Set<string>();

  connect(token?: string, userId?: string) {
    if (!env.socketUrl) return;

    if (token) this.currentToken = token;
    if (userId) this.currentUserId = userId;

    // If already connected, ensure user is registered
    if (this.socket?.connected) {
      if (this.currentUserId) {
        this.registerUser(this.currentUserId);
      }
      this.bindSocketListeners();
      return;
    }

    // If there's an existing connecting/reconnecting socket, just update handlers
    if (this.socket) {
      this.bindSocketListeners();
      return;
    }

    this.socket = io(env.socketUrl, {
      auth: { token: this.currentToken || undefined },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
      if (this.currentUserId) {
        this.registerUser(this.currentUserId);
      }
      this.rejoinRooms();
      this.bindSocketListeners();
    });

    this.socket.on('reconnect', () => {
      console.log('[Socket] Reconnected:', this.socket?.id);
      if (this.currentUserId) {
        this.registerUser(this.currentUserId);
      }
      this.rejoinRooms();
      this.bindSocketListeners();
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    this.bindSocketListeners();
  }

  setUserId(userId: string) {
    this.currentUserId = userId;
    if (this.socket?.connected) {
      this.registerUser(userId);
    }
  }

  private bindSocketListeners() {
    if (!this.socket) return;
    this.listeners.forEach((handlers, event) => {
      this.socket?.off(event);
      this.socket?.on(event, (...args: any[]) => {
        handlers.forEach((handler) => {
          try {
            handler(...args);
          } catch (e) {
            console.error(`Error in socket listener for ${event}:`, e);
          }
        });
      });
    });
  }

  private rejoinRooms() {
    this.joinedGroupRooms.forEach((groupId) => {
      this.socket?.emit('join_group_room', groupId);
    });
    this.joinedChatRooms.forEach((chatId) => {
      this.socket?.emit('join_chat_room', chatId);
    });
  }

  onConnect(callback: () => void) {
    if (!this.socket) return;
    if (this.socket.connected) {
      callback();
    } else {
      this.socket.on('connect', callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.joinedGroupRooms.clear();
    this.joinedChatRooms.clear();
  }

  on<K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as Function);
    this.bindSocketListeners();
  }

  off<K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(handler as Function);
      if (set.size === 0) {
        this.listeners.delete(event);
        this.socket?.off(event);
      }
    }
  }

  emit(event: string, payload?: unknown) {
    if (!this.socket) {
      // Auto-connect if socket instance hasn't been created yet
      this.connect();
    }
    this.socket?.emit(event, payload);
  }

  // ── Group Chat ──────────────────────────────────────────────────

  joinGroupRoom(groupId: string) {
    this.joinedGroupRooms.add(groupId);
    this.emit('join_group_room', groupId);
  }

  leaveGroupRoom(groupId: string) {
    this.joinedGroupRooms.delete(groupId);
    this.emit('leave_group_room', groupId);
  }

  sendGroupMessage(payload: {
    groupId: string;
    senderId: string;
    text: string;
    senderAlias: string;
    senderUsername: string;
    senderAvatarId: string;
  }) {
    this.emit('send_group_message', payload);
  }

  onReceiveGroupMessage(handler: (msg: any) => void) {
    this.on('receive_group_message', handler);
    return () => this.off('receive_group_message', handler);
  }

  sendMessage(conversationId: string, content: string) {
    this.emit('chat:send', { conversationId, content });
  }

  // ── Explore / Active Users ──────────────────────────────────────

  registerUser(userId: string) {
    this.currentUserId = userId;
    this.emit('register_user', userId);
  }

  toggleActive(userId: string, moodId: string, vibe: string, isActive: boolean) {
    this.emit('toggle_active', { userId, moodId, vibe, isActive });
  }

  onActiveUsersUpdated(handler: () => void) {
    this.on('active_users_updated', handler);
    return () => this.off('active_users_updated', handler);
  }

  sendConnectRequest(senderId: string, receiverId: string) {
    this.emit('send_connect_request', { senderId, receiverId });
  }

  cancelConnectRequest(requestId: string) {
    this.emit('cancel_connect_request', requestId);
  }

  onConnectRequestSent(
    handler: (payload: { requestId: string; receiverId: string; expiresAt: string | Date }) => void,
  ) {
    this.on('connect_request_sent', handler);
    return () => this.off('connect_request_sent', handler);
  }

  onReceiveConnectRequest(handler: (payload: ConnectRequestPayload) => void) {
    this.on('receive_connect_request', handler);
    return () => this.off('receive_connect_request', handler);
  }

  acceptConnectRequest(requestId: string) {
    this.emit('accept_connect_request', requestId);
  }

  declineConnectRequest(requestId: string) {
    this.emit('decline_connect_request', requestId);
  }

  onConnectRequestAccepted(
    handler: (payload: {
      chatId: string;
      requestId?: string;
      senderId?: string;
      receiverId?: string;
    }) => void,
  ) {
    this.on('connect_request_accepted', handler);
    return () => this.off('connect_request_accepted', handler);
  }

  onConnectRequestCancelled(handler: (payload: { requestId?: string; reason?: string }) => void) {
    this.on('connect_request_cancelled', handler);
    return () => this.off('connect_request_cancelled', handler);
  }

  onConnectRequestError(handler: (payload: { requestId?: string; message: string }) => void) {
    this.on('connect_request_error', handler);
    return () => this.off('connect_request_error', handler);
  }

  // ── Matching ────────────────────────────────────────────────────

  findMatch(senderId: string, moodId: string) {
    this.emit('find_match', { senderId, moodId });
  }

  onFindMatchResult(handler: (payload: { sentCount: number }) => void) {
    this.on('find_match_result', handler);
    return () => this.off('find_match_result', handler);
  }

  // ── 1-on-1 Chat ────────────────────────────────────────────────

  joinChatRoom(chatId: string) {
    this.joinedChatRooms.add(chatId);
    this.emit('join_chat_room', chatId);
  }

  joinRoom(roomId: string) {
    this.joinChatRoom(roomId);
  }

  leaveChatRoom(chatId: string) {
    this.joinedChatRooms.delete(chatId);
    this.emit('leave_chat_room', chatId);
  }

  closeChat(chatId: string, userId: string) {
    this.emit('close_chat', { chatId, userId });
  }

  onPeerLeftChat(handler: (payload: { chatId: string; message: string }) => void) {
    this.on('peer_left_chat', handler);
    return () => this.off('peer_left_chat', handler);
  }

  onChatClosed(handler: (payload: { chatId: string; closedBy?: string; message: string }) => void) {
    this.on('chat_closed', handler);
    return () => this.off('chat_closed', handler);
  }

  sendChatMessage(payload: {
    chatId: string;
    senderId: string;
    text: string;
    senderAlias?: string;
    senderAvatarId?: string;
  }) {
    this.emit('send_chat_message', payload);
  }

  onReceiveChatMessage(handler: (msg: any) => void) {
    this.on('receive_chat_message', handler);
    return () => this.off('receive_chat_message', handler);
  }

  get isConnected() {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
