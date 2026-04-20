import type { Timestamp } from "firebase/firestore";

export type FeedbackTag =
  | "clear"
  | "interesting"
  | "confusing"
  | "needs_detail";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: Timestamp;
}

export interface Draft {
  id: string;
  authorId: string;
  title: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  feedbackCount: number;
  viewCount: number;
}

export interface Invite {
  id: string;
  draftId: string;
  creatorId: string;
  maxUses: number;
  usedCount: number;
  expiresAt: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
}

export interface Feedback {
  id: string;
  draftId: string;
  inviteId: string;
  reviewerId: string;
  nickname: string;
  tags: FeedbackTag[];
  comment: string;
  createdAt: Timestamp;
}
