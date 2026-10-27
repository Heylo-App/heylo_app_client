import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { ActivityItem } from '@/types/activity';

export const activityService = {
  async getActivities(): Promise<{ activities: ActivityItem[]; unreadCount: number }> {
    try {
      const { data } = await apiClient.get(endpoints.activity.list);
      return {
        activities: data.data || [],
        unreadCount: typeof data.unreadCount === 'number' ? data.unreadCount : 0,
      };
    } catch (error) {
      console.error('[activityService] getActivities error:', error);
      return { activities: [], unreadCount: 0 };
    }
  },

  async markAsRead(activityIds?: string[]): Promise<{ unreadCount: number }> {
    try {
      const { data } = await apiClient.post(endpoints.activity.markRead, { activityIds });
      return {
        unreadCount: typeof data.unreadCount === 'number' ? data.unreadCount : 0,
      };
    } catch (error) {
      console.error('[activityService] markAsRead error:', error);
      return { unreadCount: 0 };
    }
  },

  async getUnreadCount(): Promise<number> {
    try {
      const { data } = await apiClient.get(endpoints.activity.unreadCount);
      return typeof data.count === 'number' ? data.count : 0;
    } catch (error) {
      console.error('[activityService] getUnreadCount error:', error);
      return 0;
    }
  },
};
