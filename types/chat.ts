export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  status: MessageStatus;
  isMine: boolean;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantAlias: string;
  participantAvatarId: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  isOnline: boolean;
}
