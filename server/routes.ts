import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  loginSchema,
  verifyOtpSchema,
  updateProfileSchema,
  publishLocationSchema,
  sendRequestSchema,
  sendMessageSchema,
  rateUserSchema,
  reportUserSchema,
} from "@shared/schema";

function authMiddleware(req: Request, res: Response, next: Function) {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  (req as any).userId = userId;
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/send-otp", async (req: Request, res: Response) => {
    try {
      const { phone } = loginSchema.parse(req.body);
      const result = await storage.sendOtp(phone);
      res.json({ success: result.success, message: "OTP sent successfully", otp: result.otp });
    } catch (error) {
      res.status(400).json({ error: "Invalid phone number" });
    }
  });

  app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
    try {
      const { phone, otp } = verifyOtpSchema.parse(req.body);
      const user = await storage.verifyOtp(phone, otp);
      if (!user) {
        return res.status(401).json({ error: "Invalid or expired OTP" });
      }
      res.json({ user, isNewUser: !user.name });
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.get("/api/user/me", authMiddleware, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  });

  app.put("/api/user/profile", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const data = updateProfileSchema.parse(req.body);
      const user = await storage.updateUser(userId, data);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.get("/api/user/:id", authMiddleware, async (req: Request, res: Response) => {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  });

  app.post("/api/location/publish", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const data = publishLocationSchema.parse(req.body);
      const location = await storage.publishLocation(userId, data);
      res.json(location);
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.delete("/api/location", authMiddleware, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    await storage.deactivateLocation(userId);
    res.json({ success: true });
  });

  app.get("/api/location/me", authMiddleware, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const location = await storage.getUserLocation(userId);
    res.json(location || null);
  });

  app.get("/api/nearby", authMiddleware, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const latitude = parseFloat(req.query.latitude as string) || 12.9716;
    const longitude = parseFloat(req.query.longitude as string) || 77.5946;
    const radius = parseFloat(req.query.radius as string) || 5;
    const mode = req.query.mode as any;

    const nearbyUsers = await storage.getNearbyUsers(userId, latitude, longitude, radius, mode);
    res.json(nearbyUsers);
  });

  app.post("/api/exchange/request", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { toUserId, amount, mode } = sendRequestSchema.parse(req.body);
      const request = await storage.createExchangeRequest(userId, toUserId, amount, mode);
      await storage.getOrCreateChat(request.id, [userId, toUserId]);
      res.json(request);
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.get("/api/exchange/requests", authMiddleware, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const requests = await storage.getExchangeRequestsForUser(userId);
    res.json(requests);
  });

  app.put("/api/exchange/request/:id/status", authMiddleware, async (req: Request, res: Response) => {
    const { status } = req.body;
    const request = await storage.updateExchangeRequestStatus(req.params.id, status);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    res.json(request);
  });

  app.get("/api/chats", authMiddleware, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const chats = await storage.getChatsForUser(userId);
    
    const chatsWithDetails = await Promise.all(
      chats.map(async (chat) => {
        const otherUserId = chat.participants.find((p) => p !== userId);
        const otherUser = otherUserId ? await storage.getUser(otherUserId) : null;
        const request = await storage.getExchangeRequest(chat.exchangeRequestId);
        return { ...chat, otherUser, request };
      })
    );
    
    res.json(chatsWithDetails);
  });

  app.get("/api/chat/:exchangeRequestId/messages", authMiddleware, async (req: Request, res: Response) => {
    const messages = await storage.getMessages(req.params.exchangeRequestId);
    res.json(messages);
  });

  app.post("/api/chat/send", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { exchangeRequestId, content } = sendMessageSchema.parse(req.body);
      const message = await storage.sendMessage(exchangeRequestId, userId, content);
      res.json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.post("/api/rating", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { toUserId, exchangeRequestId, score, comment } = rateUserSchema.parse(req.body);
      const rating = await storage.rateUser(userId, toUserId, exchangeRequestId, score, comment);
      res.json(rating);
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.post("/api/report", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { toUserId, reason, description } = reportUserSchema.parse(req.body);
      const report = await storage.reportUser(userId, toUserId, reason, description);
      res.json(report);
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
