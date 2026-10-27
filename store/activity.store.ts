import { create } from 'zustand';
import type { ActivityItem } from '@/types/activity';
import { activityService } from '@/services/activity.service';

interface ActivityState {
  activities: ActivityItem[];
  unreadCount: number;
  isLoading: boolean;
  fetchActivities: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markItemAsRead: (id: string) => Promise<void>;
  addRealtimeActivity: (activity: ActivityItem, unreadCount?: number) => void;
  setUnreadCount: (count: number) => void;
  reset: () => void;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  activities: [],
  unreadCount: 0,
  isLoading: false,

  fetchActivities: async () => {
    set({ isLoading: true });
    try {
      const { activities, unreadCount } = await activityService.getActivities();
      set({ activities, unreadCount, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  markAllAsRead: async () => {
    const prevActivities = get().activities;
    const hasUnread = prevActivities.some((a) => !a.isRead) || get().unreadCount > 0;
    if (!hasUnread) return;

    // Optimistically mark all read
    set({
      unreadCount: 0,
      activities: prevActivities.map((a) => ({ ...a, isRead: true })),
    });

    try {
      const res = await activityService.markAsRead();
      set({ unreadCount: res.unreadCount });
    } catch {
      // Revert if failed
    }
  },

  markItemAsRead: async (id: string) => {
    const prevActivities = get().activities;
    const item = prevActivities.find((a) => a.id === id);
    if (!item || item.isRead) return;

    set({
      unreadCount: Math.max(0, get().unreadCount - 1),
      activities: prevActivities.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
    });

    try {
      const res = await activityService.markAsRead([id]);
      set({ unreadCount: res.unreadCount });
    } catch {}
  },

  addRealtimeActivity: (activity: ActivityItem, unreadCount?: number) => {
    const current = get().activities;
    if (current.some((a) => a.id === activity.id)) return;

    set({
      activities: [activity, ...current],
      unreadCount:
        typeof unreadCount === 'number'
          ? unreadCount
          : get().unreadCount + (activity.isRead ? 0 : 1),
    });
  },

  setUnreadCount: (count: number) => set({ unreadCount: count }),

  reset: () => set({ activities: [], unreadCount: 0, isLoading: false }),
}));
