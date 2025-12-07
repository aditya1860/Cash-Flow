import { z } from "zod";

export type ExchangeMode = "NEED_CASH" | "HAVE_CASH";

export interface User {
  id: string;
  phone: string;
  name: string;
  avatar?: string;
  rating: number;
  completedExchanges: number;
  createdAt: string;
  isOnline: boolean;
}

export interface UserLocation {
  userId: string;
  latitude: number;
  longitude: number;
  mode: ExchangeMode;
  amount: number;
  conditions?: string;
  radius: number;
  isActive: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface NearbyUser extends User {
  location: UserLocation;
  distance: number;
}

export interface ExchangeRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  mode: ExchangeMode;
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  exchangeRequestId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface Chat {
  id: string;
  exchangeRequestId: string;
  participants: string[];
  lastMessage?: ChatMessage;
  createdAt: string;
  updatedAt: string;
}

export interface Rating {
  id: string;
  fromUserId: string;
  toUserId: string;
  exchangeRequestId: string;
  score: number;
  comment?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  fromUserId: string;
  toUserId: string;
  reason: string;
  description?: string;
  createdAt: string;
  status: "pending" | "reviewed" | "resolved";
}

export const loginSchema = z.object({
  phone: z.string().min(10).max(15),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(6),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50),
  avatar: z.string().optional(),
});

export const publishLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  mode: z.enum(["NEED_CASH", "HAVE_CASH"]),
  amount: z.number().min(100).max(100000),
  conditions: z.string().max(200).optional(),
  radius: z.number().min(1).max(10),
});

export const sendRequestSchema = z.object({
  toUserId: z.string(),
  amount: z.number().min(100),
  mode: z.enum(["NEED_CASH", "HAVE_CASH"]),
});

export const sendMessageSchema = z.object({
  exchangeRequestId: z.string(),
  content: z.string().min(1).max(500),
});

export const rateUserSchema = z.object({
  toUserId: z.string(),
  exchangeRequestId: z.string(),
  score: z.number().min(1).max(5),
  comment: z.string().max(200).optional(),
});

export const reportUserSchema = z.object({
  toUserId: z.string(),
  reason: z.string().min(1),
  description: z.string().max(500).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type PublishLocationInput = z.infer<typeof publishLocationSchema>;
export type SendRequestInput = z.infer<typeof sendRequestSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type RateUserInput = z.infer<typeof rateUserSchema>;
export type ReportUserInput = z.infer<typeof reportUserSchema>;
