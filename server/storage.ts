import { randomUUID } from "crypto";
import type {
  User,
  UserLocation,
  ExchangeRequest,
  ChatMessage,
  Chat,
  Rating,
  Report,
  NearbyUser,
  ExchangeMode,
} from "@shared/schema";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface IStorage {
  sendOtp(phone: string): Promise<{ success: boolean; otp: string }>;
  verifyOtp(phone: string, otp: string): Promise<User | null>;
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  publishLocation(userId: string, location: Omit<UserLocation, "userId" | "createdAt" | "expiresAt" | "isActive">): Promise<UserLocation>;
  getUserLocation(userId: string): Promise<UserLocation | undefined>;
  deactivateLocation(userId: string): Promise<void>;
  getNearbyUsers(userId: string, latitude: number, longitude: number, radius: number, mode?: ExchangeMode): Promise<NearbyUser[]>;

  createExchangeRequest(fromUserId: string, toUserId: string, amount: number, mode: ExchangeMode): Promise<ExchangeRequest>;
  getExchangeRequest(id: string): Promise<ExchangeRequest | undefined>;
  getExchangeRequestsForUser(userId: string): Promise<ExchangeRequest[]>;
  updateExchangeRequestStatus(id: string, status: ExchangeRequest["status"]): Promise<ExchangeRequest | undefined>;

  getOrCreateChat(exchangeRequestId: string, participants: string[]): Promise<Chat>;
  getChatsForUser(userId: string): Promise<Chat[]>;
  sendMessage(exchangeRequestId: string, senderId: string, content: string): Promise<ChatMessage>;
  getMessages(exchangeRequestId: string): Promise<ChatMessage[]>;

  rateUser(fromUserId: string, toUserId: string, exchangeRequestId: string, score: number, comment?: string): Promise<Rating>;
  reportUser(fromUserId: string, toUserId: string, reason: string, description?: string): Promise<Report>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private otps: Map<string, { otp: string; expiresAt: Date }>;
  private locations: Map<string, UserLocation>;
  private exchangeRequests: Map<string, ExchangeRequest>;
  private chats: Map<string, Chat>;
  private messages: Map<string, ChatMessage[]>;
  private ratings: Map<string, Rating>;
  private reports: Map<string, Report>;

  constructor() {
    this.users = new Map();
    this.otps = new Map();
    this.locations = new Map();
    this.exchangeRequests = new Map();
    this.chats = new Map();
    this.messages = new Map();
    this.ratings = new Map();
    this.reports = new Map();
    this.seedDemoData();
  }

  private seedDemoData() {
    const demoUsers: User[] = [
      { id: "demo1", phone: "+919876543210", name: "Rahul Sharma", rating: 4.8, completedExchanges: 23, createdAt: new Date().toISOString(), isOnline: true },
      { id: "demo2", phone: "+919876543211", name: "Priya Patel", rating: 4.9, completedExchanges: 45, createdAt: new Date().toISOString(), isOnline: true },
      { id: "demo3", phone: "+919876543212", name: "Amit Kumar", rating: 4.5, completedExchanges: 12, createdAt: new Date().toISOString(), isOnline: false },
      { id: "demo4", phone: "+919876543213", name: "Sneha Reddy", rating: 4.7, completedExchanges: 34, createdAt: new Date().toISOString(), isOnline: true },
      { id: "demo5", phone: "+919876543214", name: "Vikram Singh", rating: 4.6, completedExchanges: 18, createdAt: new Date().toISOString(), isOnline: true },
      { id: "demo6", phone: "+919876543215", name: "Ananya Gupta", rating: 4.4, completedExchanges: 8, createdAt: new Date().toISOString(), isOnline: false },
      { id: "demo7", phone: "+919876543216", name: "Karthik Nair", rating: 4.9, completedExchanges: 56, createdAt: new Date().toISOString(), isOnline: true },
      { id: "demo8", phone: "+919876543217", name: "Deepa Iyer", rating: 4.3, completedExchanges: 5, createdAt: new Date().toISOString(), isOnline: true },
      { id: "demo9", phone: "+919876543218", name: "Rajesh Menon", rating: 4.8, completedExchanges: 29, createdAt: new Date().toISOString(), isOnline: false },
      { id: "demo10", phone: "+919876543219", name: "Meera Joshi", rating: 4.7, completedExchanges: 15, createdAt: new Date().toISOString(), isOnline: true },
    ];

    demoUsers.forEach((user) => this.users.set(user.id, user));

    const baseLat = 12.9716;
    const baseLng = 77.5946;
    const demoLocations: UserLocation[] = [
      { userId: "demo1", latitude: baseLat + 0.008, longitude: baseLng + 0.005, mode: "NEED_CASH", amount: 2000, conditions: "UPI only, quick exchange", radius: 5, isActive: true, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString() },
      { userId: "demo2", latitude: baseLat - 0.003, longitude: baseLng + 0.012, mode: "HAVE_CASH", amount: 5000, conditions: "Meet at coffee shop", radius: 3, isActive: true, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString() },
      { userId: "demo4", latitude: baseLat + 0.015, longitude: baseLng - 0.008, mode: "NEED_CASH", amount: 1500, radius: 5, isActive: true, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString() },
      { userId: "demo5", latitude: baseLat - 0.010, longitude: baseLng - 0.015, mode: "HAVE_CASH", amount: 3000, conditions: "Available until 6 PM", radius: 4, isActive: true, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString() },
      { userId: "demo7", latitude: baseLat + 0.020, longitude: baseLng + 0.018, mode: "HAVE_CASH", amount: 10000, conditions: "Large amount, verified users only", radius: 2, isActive: true, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString() },
      { userId: "demo8", latitude: baseLat - 0.018, longitude: baseLng + 0.008, mode: "NEED_CASH", amount: 500, radius: 5, isActive: true, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString() },
      { userId: "demo10", latitude: baseLat + 0.005, longitude: baseLng - 0.020, mode: "HAVE_CASH", amount: 2500, conditions: "Phone pay preferred", radius: 3, isActive: true, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString() },
    ];

    demoLocations.forEach((loc) => this.locations.set(loc.userId, loc));
  }

  async sendOtp(phone: string): Promise<{ success: boolean; otp: string }> {
    const otp = generateOtp();
    this.otps.set(phone, { otp, expiresAt: new Date(Date.now() + 300000) });
    console.log(`[MOCK OTP] Phone: ${phone}, OTP: ${otp}`);
    return { success: true, otp };
  }

  async verifyOtp(phone: string, otp: string): Promise<User | null> {
    const stored = this.otps.get(phone);
    if (!stored || stored.otp !== otp || new Date() > stored.expiresAt) {
      return null;
    }
    this.otps.delete(phone);

    let user = await this.getUserByPhone(phone);
    if (!user) {
      user = {
        id: randomUUID(),
        phone,
        name: "",
        rating: 5.0,
        completedExchanges: 0,
        createdAt: new Date().toISOString(),
        isOnline: true,
      };
      this.users.set(user.id, user);
    }
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.phone === phone);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  async publishLocation(userId: string, location: Omit<UserLocation, "userId" | "createdAt" | "expiresAt" | "isActive">): Promise<UserLocation> {
    const userLocation: UserLocation = {
      ...location,
      userId,
      isActive: true,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };
    this.locations.set(userId, userLocation);
    return userLocation;
  }

  async getUserLocation(userId: string): Promise<UserLocation | undefined> {
    return this.locations.get(userId);
  }

  async deactivateLocation(userId: string): Promise<void> {
    const location = this.locations.get(userId);
    if (location) {
      location.isActive = false;
      this.locations.set(userId, location);
    }
  }

  async getNearbyUsers(userId: string, latitude: number, longitude: number, radius: number, mode?: ExchangeMode): Promise<NearbyUser[]> {
    const nearbyUsers: NearbyUser[] = [];

    for (const [locUserId, location] of this.locations) {
      if (locUserId === userId || !location.isActive) continue;
      if (mode && location.mode === mode) continue;

      const distance = haversineDistance(latitude, longitude, location.latitude, location.longitude);
      if (distance <= radius) {
        const user = await this.getUser(locUserId);
        if (user) {
          nearbyUsers.push({
            ...user,
            location,
            distance: Math.round(distance * 10) / 10,
          });
        }
      }
    }

    return nearbyUsers.sort((a, b) => a.distance - b.distance);
  }

  async createExchangeRequest(fromUserId: string, toUserId: string, amount: number, mode: ExchangeMode): Promise<ExchangeRequest> {
    const request: ExchangeRequest = {
      id: randomUUID(),
      fromUserId,
      toUserId,
      amount,
      mode,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.exchangeRequests.set(request.id, request);
    return request;
  }

  async getExchangeRequest(id: string): Promise<ExchangeRequest | undefined> {
    return this.exchangeRequests.get(id);
  }

  async getExchangeRequestsForUser(userId: string): Promise<ExchangeRequest[]> {
    return Array.from(this.exchangeRequests.values()).filter(
      (r) => r.fromUserId === userId || r.toUserId === userId
    );
  }

  async updateExchangeRequestStatus(id: string, status: ExchangeRequest["status"]): Promise<ExchangeRequest | undefined> {
    const request = this.exchangeRequests.get(id);
    if (!request) return undefined;
    request.status = status;
    request.updatedAt = new Date().toISOString();
    this.exchangeRequests.set(id, request);
    return request;
  }

  async getOrCreateChat(exchangeRequestId: string, participants: string[]): Promise<Chat> {
    let chat = Array.from(this.chats.values()).find((c) => c.exchangeRequestId === exchangeRequestId);
    if (!chat) {
      chat = {
        id: randomUUID(),
        exchangeRequestId,
        participants,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.chats.set(chat.id, chat);
      this.messages.set(exchangeRequestId, []);
    }
    return chat;
  }

  async getChatsForUser(userId: string): Promise<Chat[]> {
    return Array.from(this.chats.values()).filter((c) => c.participants.includes(userId));
  }

  async sendMessage(exchangeRequestId: string, senderId: string, content: string): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: randomUUID(),
      exchangeRequestId,
      senderId,
      content,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    const msgs = this.messages.get(exchangeRequestId) || [];
    msgs.push(message);
    this.messages.set(exchangeRequestId, msgs);

    const chat = Array.from(this.chats.values()).find((c) => c.exchangeRequestId === exchangeRequestId);
    if (chat) {
      chat.lastMessage = message;
      chat.updatedAt = new Date().toISOString();
      this.chats.set(chat.id, chat);
    }

    return message;
  }

  async getMessages(exchangeRequestId: string): Promise<ChatMessage[]> {
    return this.messages.get(exchangeRequestId) || [];
  }

  async rateUser(fromUserId: string, toUserId: string, exchangeRequestId: string, score: number, comment?: string): Promise<Rating> {
    const rating: Rating = {
      id: randomUUID(),
      fromUserId,
      toUserId,
      exchangeRequestId,
      score,
      comment,
      createdAt: new Date().toISOString(),
    };
    this.ratings.set(rating.id, rating);

    const user = await this.getUser(toUserId);
    if (user) {
      const allRatings = Array.from(this.ratings.values()).filter((r) => r.toUserId === toUserId);
      const avgRating = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;
      user.rating = Math.round(avgRating * 10) / 10;
      this.users.set(toUserId, user);
    }

    return rating;
  }

  async reportUser(fromUserId: string, toUserId: string, reason: string, description?: string): Promise<Report> {
    const report: Report = {
      id: randomUUID(),
      fromUserId,
      toUserId,
      reason,
      description,
      createdAt: new Date().toISOString(),
      status: "pending",
    };
    this.reports.set(report.id, report);
    return report;
  }
}

export const storage = new MemStorage();
