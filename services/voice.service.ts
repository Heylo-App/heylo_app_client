import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { env } from '@/config/env';
import type { VoiceRoom } from '@/types/voice';

import { delay, mockVoiceRooms } from './mock/data';

export const voiceService = {
  async getRooms(): Promise<VoiceRoom[]> {
    if (env.useMockApi || env.isDev) {
      return delay(mockVoiceRooms);
    }
    const { data } = await apiClient.get(endpoints.voice.rooms);
    return data;
  },

  async joinRoom(roomId: string): Promise<{ token: string; room: VoiceRoom }> {
    if (env.useMockApi || env.isDev) {
      const room = mockVoiceRooms.find((r) => r.id === roomId)!;
      return delay({
        token: 'mock-voice-token',
        room: { ...room, participantCount: room.participantCount + 1 },
      });
    }
    const { data } = await apiClient.post(endpoints.voice.join(roomId));
    return data;
  },

  async getRtcToken(roomId: string): Promise<string> {
    if (env.useMockApi || env.isDev) {
      return delay('mock-rtc-token');
    }
    const { data } = await apiClient.get(endpoints.voice.token(roomId));
    return data.token;
  },
};
