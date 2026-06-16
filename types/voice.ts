import { MoodType } from '@/constants/moods';

export type VoiceRoomStatus = 'live' | 'scheduled' | 'ended';

export interface VoiceRoomParticipant {
  id: string;
  alias: string;
  avatarId: string;
  isSpeaking: boolean;
  isMuted: boolean;
}

export interface VoiceRoom {
  id: string;
  title: string;
  topic: string;
  mood: MoodType;
  hostAlias: string;
  participantCount: number;
  maxParticipants: number;
  status: VoiceRoomStatus;
  isLive: boolean;
  participants: VoiceRoomParticipant[];
}
