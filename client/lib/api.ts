import { getApiUrl } from "./query-client";
import type {
  User,
  NearbyUser,
  UserLocation,
  ExchangeRequest,
  Chat,
  ChatMessage,
  ExchangeMode,
} from "@shared/schema";

async function apiCall<T>(
  method: string,
  path: string,
  userId?: string,
  body?: any
): Promise<T> {
  const baseUrl = getApiUrl();
  const url = new URL(path, baseUrl);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (userId) {
    headers["x-user-id"] = userId;
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

export async function sendOtp(phone: string): Promise<{ success: boolean; otp: string; message: string }> {
  return apiCall("POST", "/api/auth/send-otp", undefined, { phone });
}

export async function verifyOtp(phone: string, otp: string): Promise<{ user: User; isNewUser: boolean }> {
  return apiCall("POST", "/api/auth/verify-otp", undefined, { phone, otp });
}

export async function updateProfile(userId: string, data: { name: string; avatar?: string }): Promise<User> {
  return apiCall("PUT", "/api/user/profile", userId, data);
}

export async function getMe(userId: string): Promise<User> {
  return apiCall("GET", "/api/user/me", userId);
}

export async function getUser(userId: string, targetUserId: string): Promise<User> {
  return apiCall("GET", `/api/user/${targetUserId}`, userId);
}

export async function publishLocation(
  userId: string,
  data: {
    latitude: number;
    longitude: number;
    mode: ExchangeMode;
    amount: number;
    conditions?: string;
    radius: number;
  }
): Promise<UserLocation> {
  return apiCall("POST", "/api/location/publish", userId, data);
}

export async function getMyLocation(userId: string): Promise<UserLocation | null> {
  return apiCall("GET", "/api/location/me", userId);
}

export async function deactivateLocation(userId: string): Promise<void> {
  return apiCall("DELETE", "/api/location", userId);
}

export async function getNearbyUsers(
  userId: string,
  latitude: number,
  longitude: number,
  radius: number,
  mode?: ExchangeMode
): Promise<NearbyUser[]> {
  let path = `/api/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;
  if (mode) {
    path += `&mode=${mode}`;
  }
  return apiCall("GET", path, userId);
}

export async function createExchangeRequest(
  userId: string,
  data: { toUserId: string; amount: number; mode: ExchangeMode }
): Promise<ExchangeRequest> {
  return apiCall("POST", "/api/exchange/request", userId, data);
}

export async function getExchangeRequests(userId: string): Promise<ExchangeRequest[]> {
  return apiCall("GET", "/api/exchange/requests", userId);
}

export async function updateExchangeStatus(
  userId: string,
  requestId: string,
  status: ExchangeRequest["status"]
): Promise<ExchangeRequest> {
  return apiCall("PUT", `/api/exchange/request/${requestId}/status`, userId, { status });
}

export async function getChats(userId: string): Promise<(Chat & { otherUser: User; request: ExchangeRequest })[]> {
  return apiCall("GET", "/api/chats", userId);
}

export async function getMessages(userId: string, exchangeRequestId: string): Promise<ChatMessage[]> {
  return apiCall("GET", `/api/chat/${exchangeRequestId}/messages`, userId);
}

export async function sendMessage(
  userId: string,
  exchangeRequestId: string,
  content: string
): Promise<ChatMessage> {
  return apiCall("POST", "/api/chat/send", userId, { exchangeRequestId, content });
}

export async function rateUser(
  userId: string,
  data: { toUserId: string; exchangeRequestId: string; score: number; comment?: string }
): Promise<void> {
  return apiCall("POST", "/api/rating", userId, data);
}

export async function reportUser(
  userId: string,
  data: { toUserId: string; reason: string; description?: string }
): Promise<void> {
  return apiCall("POST", "/api/report", userId, data);
}
