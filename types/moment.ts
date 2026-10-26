import { MoodType } from '@/constants/moods';

export interface Comment {
  id: string;
  authorId?: string;
  author: string;
  username?: string;
  avatarId: string;
  text: string;
  parentId?: string | null;
  replyToUser?: {
    id?: string;
    username?: string;
    name?: string;
  } | null;
  likes: number;
  isLiked?: boolean;
  timestamp: string;
}

export interface Moment {
  id: string;
  author: {
    id?: string;
    name: string;
    handle: string;
    avatarId: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: Comment[];
  isLiked: boolean;
  isMine: boolean;
}

export interface CreateMomentPayload {
  content: string;
  mood?: MoodType;
}
