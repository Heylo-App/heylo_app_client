import { MOOD_TYPES } from '@/constants/moods';
import { NEED_TYPES } from '@/constants/needs';
import type { Conversation, ChatMessage } from '@/types/chat';
import type { Moment } from '@/types/moment';
import type { PublicUser } from '@/types/user';
import type { VoiceRoom } from '@/types/voice';
import type { AnonymousProfile } from '@/types/auth';

const aliases = ['LunaEcho', 'QuietRiver', 'SoftPixel', 'NightBloom', 'CalmOrbit', 'MistyWave'];
const avatars = ['avatar-1', 'avatar-2', 'avatar-3', 'avatar-4', 'avatar-5', 'avatar-6'];

function pick<T>(arr: readonly T[], index: number): T {
  return arr[index % arr.length] as T;
}

export const mockProfile: AnonymousProfile = {
  id: 'user-me',
  alias: 'HeyloTraveler',
  avatarId: 'avatar-1',
  mood: 'reflective',
  needs: ['listen', 'company'],
  language: 'English',
  age: '21',
  reputation: 82,
  createdAt: new Date().toISOString(),
  isOnboarded: true,
};

export const mockMoments: Moment[] = Array.from({ length: 20 }, (_, i) => ({
  id: `moment-${i}`,
  authorId: `user-${i}`,
  authorAlias: pick(aliases, i),
  authorAvatarId: pick(avatars, i),
  content:
    i % 2 === 0
      ? 'Sometimes you just need a quiet corner of the internet. Grateful this space exists.'
      : 'Checked in with myself today. Feeling lighter after sharing, even anonymously.',
  mood: pick(MOOD_TYPES, i),
  likesCount: Math.floor(Math.random() * 120) + 5,
  commentsCount: Math.floor(Math.random() * 30),
  isLiked: i % 5 === 0,
  createdAt: new Date(Date.now() - i * 3600000).toISOString(),
}));

export const mockSuggestedUsers: PublicUser[] = Array.from({ length: 12 }, (_, i) => ({
  id: `suggested-${i}`,
  alias: pick(aliases, i + 2),
  avatarId: pick(avatars, i),
  mood: pick(MOOD_TYPES, i),
  needs: [pick(NEED_TYPES, i), pick(NEED_TYPES, i + 1)],
  reputation: 60 + (i % 40),
  matchScore: 70 + (i % 30),
  isOnline: i % 3 !== 0,
}));

export const mockConversations: Conversation[] = Array.from({ length: 8 }, (_, i) => ({
  id: `chat-${i}`,
  participantId: `user-${i}`,
  participantAlias: pick(aliases, i),
  participantAvatarId: pick(avatars, i),
  lastMessage: 'Thanks for listening. That helped more than I expected.',
  lastMessageAt: new Date(Date.now() - i * 7200000).toISOString(),
  unreadCount: i % 3,
  isOnline: i % 2 === 0,
}));

export const mockMessages: Record<string, ChatMessage[]> = {
  'chat-0': [
    {
      id: 'm1',
      conversationId: 'chat-0',
      senderId: 'user-0',
      content: 'Hey — rough day. Mind if I vent a little?',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'read',
      isMine: false,
    },
    {
      id: 'm2',
      conversationId: 'chat-0',
      senderId: 'user-me',
      content: 'Of course. I’m here. Take your time.',
      createdAt: new Date(Date.now() - 3500000).toISOString(),
      status: 'read',
      isMine: true,
    },
    {
      id: 'm3',
      conversationId: 'chat-0',
      senderId: 'user-0',
      content: 'Thanks for listening. That helped more than I expected.',
      createdAt: new Date(Date.now() - 3400000).toISOString(),
      status: 'delivered',
      isMine: false,
    },
  ],
};

export const mockVoiceRooms: VoiceRoom[] = [
  {
    id: 'room-1',
    title: 'Late Night Feelings',
    topic: 'Open mic for whatever is on your mind',
    mood: 'lonely',
    hostAlias: 'NightBloom',
    participantCount: 12,
    maxParticipants: 25,
    status: 'live',
    isLive: true,
    participants: [],
  },
  {
    id: 'room-2',
    title: 'Anxiety Support Circle',
    topic: 'Grounding exercises and gentle conversation',
    mood: 'anxious',
    hostAlias: 'CalmOrbit',
    participantCount: 8,
    maxParticipants: 20,
    status: 'live',
    isLive: true,
    participants: [],
  },
  {
    id: 'room-3',
    title: 'Good News Only',
    topic: 'Share small wins and bright moments',
    mood: 'hopeful',
    hostAlias: 'SoftPixel',
    participantCount: 18,
    maxParticipants: 30,
    status: 'live',
    isLive: true,
    participants: [],
  },
];

export function delay<T>(data: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}
