import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { env } from '@/config/env';
import type { PaginatedResponse } from '@/types/api';
import type { CreateMomentPayload, Moment } from '@/types/moment';

import { delay, mockMoments } from './mock/data';

const PAGE_SIZE = 10;

export const momentsService = {
  async getFeed(page = 1): Promise<PaginatedResponse<Moment>> {
    if (env.useMockApi || env.isDev) {
      const start = (page - 1) * PAGE_SIZE;
      const slice = mockMoments.slice(start, start + PAGE_SIZE);
      return delay({
        data: slice,
        page,
        pageSize: PAGE_SIZE,
        total: mockMoments.length,
        hasMore: start + PAGE_SIZE < mockMoments.length,
      });
    }
    const { data } = await apiClient.get(endpoints.moments.list, {
      params: { page, pageSize: PAGE_SIZE },
    });
    return data;
  },

  async createMoment(payload: CreateMomentPayload): Promise<Moment> {
    if (env.useMockApi || env.isDev) {
      const moment: Moment = {
        id: `moment-${Date.now()}`,
        authorId: 'user-me',
        authorAlias: 'HeyloTraveler',
        authorAvatarId: 'avatar-1',
        content: payload.content,
        mood: payload.mood,
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
        createdAt: new Date().toISOString(),
      };
      mockMoments.unshift(moment);
      return delay(moment);
    }
    const { data } = await apiClient.post(endpoints.moments.create, payload);
    return data;
  },

  async toggleLike(id: string, isLiked: boolean): Promise<Moment> {
    if (env.useMockApi || env.isDev) {
      const moment = mockMoments.find((m) => m.id === id);
      if (moment) {
        moment.isLiked = !isLiked;
        moment.likesCount += moment.isLiked ? 1 : -1;
      }
      return delay(moment!);
    }
    const { data } = await apiClient.post(endpoints.moments.like(id));
    return data;
  },
};
