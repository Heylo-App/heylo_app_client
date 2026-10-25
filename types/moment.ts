import { MoodType } from '@/constants/moods';

export interface Comment {
  id: string;
  authorId?: string;
  author: string;
  avatarId: string;
  text: string;
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
