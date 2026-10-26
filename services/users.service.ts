import { apiClient } from '../api/client';
import { endpoints } from '../api/endpoints';
import { MoodType } from '../constants/moods';

export interface ActiveUser {
  _id: string;
  userId: {
    _id: string;
    alias: string;
    username: string;
    avatarId: string;
  };
  moodId: MoodType;
  vibe: string;
  createdAt: string;
}

export interface MyActiveStatus {
  isActive: boolean;
  moodId?: MoodType;
  vibe?: string;
}

export interface GetActiveUsersResult {
  users: ActiveUser[];
  myStatus?: MyActiveStatus;
}

export interface UserProfile {
  id: string;
  username: string;
  alias: string;
  avatarId: string;
  mood: MoodType;
  needs: string[];
  language?: string;
  age?: string;
  reputation: number;
  createdAt: string;
  isActive: boolean;
  activeVibe?: string | null;
  activeMoodId?: MoodType | null;
  existingChatId?: string | null;
}

export const usersService = {
  async getActiveUsers(): Promise<GetActiveUsersResult> {
    const { data } = await apiClient.get(endpoints.users.active);
    return {
      users: Array.isArray(data.data) ? data.data : [],
      myStatus: data.myStatus || { isActive: false },
    };
  },
  async toggleActive(payload: {
    moodId?: string | null;
    vibe?: string;
    isActive: boolean;
  }): Promise<any> {
    const { data } = await apiClient.post(endpoints.users.toggleActive, payload);
    return data;
  },
  async searchUsers(query: string, limit: number = 8): Promise<any[]> {
    const { data } = await apiClient.get(endpoints.users.search, { params: { q: query, limit } });
    return data.data;
  },
  async getUserByUsername(username: string): Promise<UserProfile> {
    const { data } = await apiClient.get(endpoints.users.byUsername(username));
    return data.data;
  },
  async getUserProfile(id: string): Promise<UserProfile> {
    const { data } = await apiClient.get(endpoints.users.profile(id));
    return data.data;
  },
};
