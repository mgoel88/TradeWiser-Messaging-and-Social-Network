import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { setupAuth } from "./auth";
import passport from "passport";
import { notifyNewListing, notifyOfferReceived, notifyTradeUpdate, setupWebsocketServer } from "./notifications";
import { getRecommendedConnections, getComplementaryBusinessConnections, getCommodityConnectionRecommendations } from "./recommendations";
import { WebSocketServer } from "ws";
import { 
  userLoginSchema,
  insertUserCircleSchema,
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create Server instance first
  const httpServer = createServer(app);
  
  // Set up authentication with PostgreSQL session store
  setupAuth(app);
  
  // Add a simple API status route to ensure API paths are working
  app.get("/api/status", (req, res) => {
    console.log("Status API called");
    res.json({ status: "ok", time: new Date().toISOString() });
  });
  
  // Debug route to check if API routes are correctly configured
  app.get("/api-test", (req, res) => {
    console.log("API Test route called");
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ status: "ok", message: "API routes are working" }));
  });

  // Error handling middleware for Zod validation errors
  const handleZodError = (err: unknown, res: Response) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  };

  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Not authenticated" });
  };

  // Authentication routes are handled in auth.ts, but let's also add some compatibility routes
  // for the existing frontend code that might be using /api/auth/* patterns
  app.post("/api/auth/register", (req, res, next) => {
    try {
      userLoginSchema.parse(req.body);
      // Add other validation if needed
      // Forward the request to the auth module
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ message: info?.message || "Authentication failed" });
        
        req.login(user, (err: any) => {
          if (err) return next(err);
          res.json({ user });
        });
      })(req, res, next);
    } catch (err) {
      return handleZodError(err, res);
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    try {
      userLoginSchema.parse(req.body);
      // Forward the request to the passport auth middleware
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ message: info?.message || "Authentication failed" });
        
        req.login(user, (err: any) => {
          if (err) return next(err);
          res.json({ user });
        });
      })(req, res, next);
    } catch (err) {
      return handleZodError(err, res);
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err: any) => {
      if (err) return res.status(500).json({ message: "Error during logout" });
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/session", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json({ user: req.user });
    }
    return res.status(401).json({ message: "Not authenticated" });
  });

  // Debug route to check current user - make sure to remove in production
  app.get("/api/current-user", (req, res) => {
    console.log("Current user:", req.user);
    console.log("Is authenticated:", req.isAuthenticated());
    return res.json({
      isAuthenticated: req.isAuthenticated(),
      user: req.user || null
    });
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.listUsers();
      return res.json({ users });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Set up WebSocket server for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  setupWebsocketServer(wss);
  
  return httpServer;
}