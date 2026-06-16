import { MoodType } from '@/constants/moods';

export interface Moment {
  id: string;
  authorId: string;
  authorAlias: string;
  authorAvatarId: string;
  content: string;
  mood: MoodType;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface CreateMomentPayload {
  content: string;
  mood: MoodType;
}
