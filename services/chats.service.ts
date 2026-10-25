import { apiClient } from '../api/client';
import { endpoints } from '../api/endpoints';

export interface ChatParticipant {
  _id: string;
  alias: string;
  username: string;
  avatarId: string;
}

export interface Chat {
  _id: string;
  participants: ChatParticipant[];
  lastMessageText?: string;
  lastMessageAt?: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  chatId: string;
  senderId: string | ChatParticipant;
  text: string;
  createdAt: string;
}

export const chatsService = {
  async getChats(): Promise<Chat[]> {
    const { data } = await apiClient.get(endpoints.chats.list);
    return data.data;
  },

  async getChat(chatId: string): Promise<Chat> {
    const { data } = await apiClient.get(endpoints.chats.detail(chatId));
    return data.data;
  },

  async getMessages(chatId: string): Promise<ChatMessage[]> {
    const { data } = await apiClient.get(endpoints.chats.messages(chatId));
    return data.data;
  },

  async createOrGetChat(recipientId: string): Promise<Chat> {
    const { data } = await apiClient.post(endpoints.chats.list, { recipientId });
    return data.data;
  },
};
