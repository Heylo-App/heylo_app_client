export interface VoiceRoom {
  id: string;
  title: string;
  topic: string;
  mood: string;
  hostAlias: string;
  participantCount: number;
  maxParticipants: number;
  status: string;
  isLive: boolean;
  participants: any[];
}
