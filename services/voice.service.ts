import { delay, mockVoiceRooms } from './mock/data';
import type { VoiceRoom } from '@/types/voice';

export const voiceService = {
  async getRooms(): Promise<VoiceRoom[]> {
    return delay(mockVoiceRooms);
  },
  async joinRoom(roomId: string): Promise<{ success: boolean; roomId: string }> {
    return delay({ success: true, roomId });
  },
};
