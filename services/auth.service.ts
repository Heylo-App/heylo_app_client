import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { env } from '@/config/env';
import type { AnonymousProfile, AuthTokens, LoginPayload, OnboardingPayload, VerifyOtpPayload } from '@/types/auth';
import { secureStorage } from '@/utils/storage';

import { delay, mockProfile } from './mock/data';

export const authService = {
  async sendOtp(payload: LoginPayload): Promise<{ success: boolean }> {
    if (env.useMockApi || env.isDev) {
      return delay({ success: true });
    }
    const { data } = await apiClient.post(endpoints.auth.sendOtp, payload);
    return data;
  },

  async verifyOtp(payload: VerifyOtpPayload): Promise<AuthTokens & { user: AnonymousProfile }> {
    if (env.useMockApi || env.isDev) {
      const tokens: AuthTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: Date.now() + 3600000,
      };
      await secureStorage.setToken(tokens.accessToken);
      await secureStorage.setRefreshToken(tokens.refreshToken);
      return delay({ ...tokens, user: { ...mockProfile, isOnboarded: false } });
    }
    const { data } = await apiClient.post(endpoints.auth.verifyOtp, payload);
    await secureStorage.setToken(data.accessToken);
    await secureStorage.setRefreshToken(data.refreshToken);
    return data;
  },

  async getMe(): Promise<AnonymousProfile> {
    if (env.useMockApi || env.isDev) {
      return delay(mockProfile);
    }
    const { data } = await apiClient.get(endpoints.auth.me);
    return data;
  },

  async completeOnboarding(payload: OnboardingPayload): Promise<AnonymousProfile> {
    if (env.useMockApi || env.isDev) {
      return delay({
        ...mockProfile,
        ...payload,
        isOnboarded: true,
      });
    }
    const { data } = await apiClient.post(endpoints.onboarding, payload);
    return data;
  },

  async logout(): Promise<void> {
    if (!env.useMockApi && !env.isDev) {
      try {
        await apiClient.post(endpoints.auth.logout);
      } catch {
        // ignore logout errors
      }
    }
    await secureStorage.clearTokens();
  },
};
