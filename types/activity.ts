export type ActivityType =
  | 'like_moment'
  | 'comment_moment'
  | 'reply_comment'
  | 'like_comment'
  | 'mention';

export interface ActivityActor {
  id: string;
  alias: string;
  username: string;
  avatarId: string;
}

export interface ActivityItem {
  id: string;
  recipientId: string;
  type: ActivityType;
  momentId: string;
  commentId?: string | null;
  snippet: string;
  isRead: boolean;
  createdAt: string;
  actor: ActivityActor;
}

export interface ActivityResponse {
  success: boolean;
  data: ActivityItem[];
  unreadCount: number;
}
