import { create } from 'zustand';

import type { AnonymousProfile } from '@/types/auth';
import { persistentStorage } from '@/utils/storage';
import { StorageKeys } from '@/constants/storage';

interface AuthState {
  user: AnonymousProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;
  setUser: (user: AnonymousProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setOnboarded: (value: boolean) => void;
  hydrate: () => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isOnboarded: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: Boolean(user),
      isOnboarded: user?.isOnboarded ?? false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setOnboarded: async (value) => {
    await persistentStorage.setBoolean(StorageKeys.onboardingComplete, value);
    set({ isOnboarded: value });
  },

  hydrate: async () => {
    // Demo mode: no backend, just clear the loading state
    set({ isLoading: false });
  },

  reset: () =>
    set({
      user: null,
      isAuthenticated: false,
      isOnboarded: false,
      isLoading: false,
    }),
}));
