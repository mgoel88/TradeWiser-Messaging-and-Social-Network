import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { 
  insertUserSchema, 
  userLoginSchema, 
  insertPostSchema, 
  insertConnectionSchema,
  insertKycRequestSchema,
  insertUserCircleSchema,
  insertUserCommoditySchema,
  kycRequestFormSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session storage
  const MemoryStoreSession = MemoryStore(session);
  app.use(
    session({
      cookie: { maxAge: 86400000 }, // 24 hours
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || "krishiconnect-secret",
    })
  );

  // Set up passport authentication
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }
        if (user.password !== password) {
          return done(null, false, { message: "Incorrect password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
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

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const newUser = await storage.createUser(userData);
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed after registration" });
        }
        return res.status(201).json({ user: newUser });
      });
    } catch (err) {
      return handleZodError(err, res);
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    try {
      userLoginSchema.parse(req.body);
      passport.authenticate("local", (err, user, info) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.status(401).json({ message: info.message });
        }
        req.login(user, (err) => {
          if (err) {
            return next(err);
          }
          return res.json({ user });
        });
      })(req, res, next);
    } catch (err) {
      return handleZodError(err, res);
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/session", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json({ user: req.user });
    }
    return res.status(401).json({ message: "Not authenticated" });
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user's circles
      const userCircles = await storage.listUserCircles(userId);
      const circleIds = userCircles.map(uc => uc.circleId);
      const circles = await Promise.all(circleIds.map(id => storage.getCircle(id)));
      
      // Get user's connections
      const connections = await storage.getUserConnections(userId);
      
      return res.json({ 
        user, 
        circles: circles.filter(Boolean),
        connectionsCount: connections.length
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if user is updating their own profile
      if ((req.user as any).id !== userId) {
        return res.status(403).json({ message: "Not authorized to update this user" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only update allowed fields (not password, not username, not email)
      const allowedFields = ["name", "phone", "bio", "avatar", "business"];
      const updates: Record<string, any> = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }
      
      const updatedUser = await storage.updateUser(userId, updates);
      return res.json({ user: updatedUser });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Circle routes
  app.get("/api/circles", async (req, res) => {
    try {
      const circles = await storage.listCircles();
      return res.json({ circles });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/circles/:id", async (req, res) => {
    try {
      const circleId = parseInt(req.params.id);
      if (isNaN(circleId)) {
        return res.status(400).json({ message: "Invalid circle ID" });
      }
      
      const circle = await storage.getCircle(circleId);
      if (!circle) {
        return res.status(404).json({ message: "Circle not found" });
      }
      
      // Get circle's commodities
      const circleCommodities = await storage.getCommoditiesByCircle(circleId);
      const commodityIds = circleCommodities.map(cc => cc.commodityId);
      const commodities = await Promise.all(commodityIds.map(id => storage.getCommodity(id)));
      
      // Get circle's assets
      const assets = await storage.getAssetsByCircle(circleId);
      
      // Get users in this circle
      const userCircles = await storage.getUsersByCircle(circleId);
      const userIds = userCircles.map(uc => uc.userId);
      const users = await Promise.all(userIds.map(id => storage.getUser(id)));
      
      return res.json({ 
        circle, 
        commodities: commodities.filter(Boolean).map((commodity, index) => ({
          ...commodity,
          weight: circleCommodities[index].weight,
          currentPrice: circleCommodities[index].currentPrice,
          priceChange: circleCommodities[index].priceChange
        })),
        assets,
        users: users.filter(Boolean).map((user, index) => ({
          id: user?.id,
          name: user?.name,
          userType: user?.userType,
          avatar: user?.avatar,
          kycVerified: user?.kycVerified,
          isNative: userCircles[index].isNative
        }))
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/circles/nearby", async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      const radius = parseFloat(req.query.radius as string) || 50;
      
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }
      
      const circles = await storage.getNearbyCircles(lat, lng, radius);
      return res.json({ circles });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/user-circles", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const data = insertUserCircleSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if user is already in this circle
      const userCircles = await storage.listUserCircles(userId);
      const isAlreadyMember = userCircles.some(uc => uc.circleId === data.circleId);
      if (isAlreadyMember) {
        return res.status(400).json({ message: "User is already a member of this circle" });
      }
      
      const userCircle = await storage.createUserCircle(data);
      return res.status(201).json({ userCircle });
    } catch (err) {
      return handleZodError(err, res);
    }
  });

  app.delete("/api/user-circles/:circleId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const circleId = parseInt(req.params.circleId);
      
      if (isNaN(circleId)) {
        return res.status(400).json({ message: "Invalid circle ID" });
      }
      
      // Check if user is a member of this circle
      const userCircles = await storage.listUserCircles(userId);
      const userCircle = userCircles.find(uc => uc.circleId === circleId);
      if (!userCircle) {
        return res.status(404).json({ message: "User is not a member of this circle" });
      }
      
      // Cannot leave native circle
      if (userCircle.isNative) {
        return res.status(400).json({ message: "Cannot leave native circle" });
      }
      
      const success = await storage.deleteUserCircle(userId, circleId);
      if (!success) {
        return res.status(500).json({ message: "Failed to leave circle" });
      }
      
      return res.json({ message: "Successfully left circle" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Commodity routes
  app.get("/api/commodities", async (req, res) => {
    try {
      const commodities = await storage.listCommodities();
      return res.json({ commodities });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/commodities/trending", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const trendingCircleCommodities = await storage.getTrendingCommodities(limit);
      
      // Get full commodity details
      const commodityDetails = await Promise.all(
        trendingCircleCommodities.map(async (cc) => {
          const commodity = await storage.getCommodity(cc.commodityId);
          const circle = await storage.getCircle(cc.circleId);
          return {
            ...cc,
            commodity,
            circleName: circle?.name
          };
        })
      );
      
      return res.json({ trendingCommodities: commodityDetails });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/commodities/:id", async (req, res) => {
    try {
      const commodityId = parseInt(req.params.id);
      if (isNaN(commodityId)) {
        return res.status(400).json({ message: "Invalid commodity ID" });
      }
      
      const commodity = await storage.getCommodity(commodityId);
      if (!commodity) {
        return res.status(404).json({ message: "Commodity not found" });
      }
      
      // Get circles that have this commodity
      const circleCommodities = await storage.getCirclesByCommodity(commodityId);
      const circleIds = circleCommodities.map(cc => cc.circleId);
      const circles = await Promise.all(circleIds.map(id => storage.getCircle(id)));
      
      return res.json({ 
        commodity, 
        circles: circles.filter(Boolean).map((circle, index) => ({
          ...circle,
          weight: circleCommodities[index].weight,
          currentPrice: circleCommodities[index].currentPrice,
          priceChange: circleCommodities[index].priceChange
        }))
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/user-commodities", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const data = insertUserCommoditySchema.parse({
        ...req.body,
        userId
      });
      
      // Check if user already follows this commodity
      const userCommodities = await storage.listUserCommodities(userId);
      const isAlreadyFollowing = userCommodities.some(uc => uc.commodityId === data.commodityId);
      if (isAlreadyFollowing) {
        return res.status(400).json({ message: "User already follows this commodity" });
      }
      
      const userCommodity = await storage.createUserCommodity(data);
      return res.status(201).json({ userCommodity });
    } catch (err) {
      return handleZodError(err, res);
    }
  });

  app.delete("/api/user-commodities/:commodityId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const commodityId = parseInt(req.params.commodityId);
      
      if (isNaN(commodityId)) {
        return res.status(400).json({ message: "Invalid commodity ID" });
      }
      
      const success = await storage.deleteUserCommodity(userId, commodityId);
      if (!success) {
        return res.status(404).json({ message: "User does not follow this commodity" });
      }
      
      return res.json({ message: "Successfully unfollowed commodity" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Post routes
  app.get("/api/posts", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const posts = await storage.listPosts(limit, offset);
      
      // Enrich post data with user, circle, and commodity info
      const enrichedPosts = await Promise.all(
        posts.map(async (post) => {
          const user = await storage.getUser(post.userId);
          let circle = undefined;
          let commodity = undefined;
          
          if (post.circleId) {
            circle = await storage.getCircle(post.circleId);
          }
          
          if (post.commodityId) {
            commodity = await storage.getCommodity(post.commodityId);
          }
          
          return {
            ...post,
            user: user ? {
              id: user.id,
              name: user.name,
              username: user.username,
              avatar: user.avatar,
              userType: user.userType,
              kycVerified: user.kycVerified
            } : undefined,
            circle: circle ? {
              id: circle.id,
              name: circle.name
            } : undefined,
            commodity: commodity ? {
              id: commodity.id,
              name: commodity.name,
              icon: commodity.icon
            } : undefined
          };
        })
      );
      
      return res.json({ posts: enrichedPosts });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/posts/circle/:circleId", async (req, res) => {
    try {
      const circleId = parseInt(req.params.circleId);
      if (isNaN(circleId)) {
        return res.status(400).json({ message: "Invalid circle ID" });
      }
      
      const posts = await storage.getCirclePosts(circleId);
      
      // Enrich post data
      const enrichedPosts = await Promise.all(
        posts.map(async (post) => {
          const user = await storage.getUser(post.userId);
          let commodity = undefined;
          
          if (post.commodityId) {
            commodity = await storage.getCommodity(post.commodityId);
          }
          
          return {
            ...post,
            user: user ? {
              id: user.id,
              name: user.name,
              username: user.username,
              avatar: user.avatar,
              userType: user.userType,
              kycVerified: user.kycVerified
            } : undefined,
            commodity: commodity ? {
              id: commodity.id,
              name: commodity.name,
              icon: commodity.icon
            } : undefined
          };
        })
      );
      
      return res.json({ posts: enrichedPosts });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/posts", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const postData = insertPostSchema.parse({
        ...req.body,
        userId
      });
      
      const post = await storage.createPost(postData);
      
      // Return the created post with user info
      const user = await storage.getUser(userId);
      const enrichedPost = {
        ...post,
        user: {
          id: user?.id,
          name: user?.name,
          username: user?.username,
          avatar: user?.avatar,
          userType: user?.userType,
          kycVerified: user?.kycVerified
        }
      };
      
      return res.status(201).json({ post: enrichedPost });
    } catch (err) {
      return handleZodError(err, res);
    }
  });

  // Connection routes
  app.get("/api/connections", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const connections = await storage.getUserConnections(userId);
      
      // Get user details for each connection
      const enrichedConnections = await Promise.all(
        connections.map(async (connection) => {
          const otherUserId = connection.requesterId === userId ? connection.receiverId : connection.requesterId;
          const otherUser = await storage.getUser(otherUserId);
          
          return {
            ...connection,
            user: otherUser ? {
              id: otherUser.id,
              name: otherUser.name,
              username: otherUser.username,
              avatar: otherUser.avatar,
              userType: otherUser.userType,
              kycVerified: otherUser.kycVerified
            } : undefined
          };
        })
      );
      
      return res.json({ connections: enrichedConnections });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/connections/pending", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const pendingConnections = await storage.getPendingConnections(userId);
      
      // Get user details for each pending connection
      const enrichedConnections = await Promise.all(
        pendingConnections.map(async (connection) => {
          const requester = await storage.getUser(connection.requesterId);
          
          return {
            ...connection,
            user: requester ? {
              id: requester.id,
              name: requester.name,
              username: requester.username,
              avatar: requester.avatar,
              userType: requester.userType,
              kycVerified: requester.kycVerified
            } : undefined
          };
        })
      );
      
      return res.json({ pendingConnections: enrichedConnections });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/connections", isAuthenticated, async (req, res) => {
    try {
      const requesterId = (req.user as any).id;
      const data = insertConnectionSchema.parse({
        ...req.body,
        requesterId,
        status: "pending"
      });
      
      // Check if connection already exists
      const existingConnection = await storage.getConnectionStatus(requesterId, data.receiverId);
      if (existingConnection) {
        return res.status(400).json({ message: "Connection already exists", status: existingConnection.status });
      }
      
      // Check if receiver exists
      const receiver = await storage.getUser(data.receiverId);
      if (!receiver) {
        return res.status(404).json({ message: "Receiver not found" });
      }
      
      const connection = await storage.createConnection(data);
      return res.status(201).json({ connection });
    } catch (err) {
      return handleZodError(err, res);
    }
  });

  app.patch("/api/connections/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const connectionId = parseInt(req.params.id);
      
      if (isNaN(connectionId)) {
        return res.status(400).json({ message: "Invalid connection ID" });
      }
      
      const connection = await storage.getConnection(connectionId);
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      // Only the receiver can accept/reject the connection
      if (connection.receiverId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this connection" });
      }
      
      // Validate status
      const status = req.body.status;
      if (status !== "accepted" && status !== "rejected") {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedConnection = await storage.updateConnectionStatus(connectionId, status);
      return res.json({ connection: updatedConnection });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // KYC routes
  app.post("/api/kyc-requests", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Check if user already has a KYC request
      const existingRequest = await storage.getKycRequestByUser(userId);
      if (existingRequest) {
        return res.status(400).json({ 
          message: "KYC request already exists", 
          status: existingRequest.status 
        });
      }
      
      const data = kycRequestFormSchema.omit({ idNumberConfirm: true }).parse({
        ...req.body,
        userId
      });
      
      const kycRequest = await storage.createKycRequest(data);
      return res.status(201).json({ kycRequest });
    } catch (err) {
      return handleZodError(err, res);
    }
  });

  app.get("/api/kyc-requests/user", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const kycRequest = await storage.getKycRequestByUser(userId);
      
      if (!kycRequest) {
        return res.status(404).json({ message: "No KYC request found" });
      }
      
      return res.json({ kycRequest });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Assets routes (Warehouses, Processing plants, etc.)
  app.get("/api/assets", async (req, res) => {
    try {
      const assets = await storage.listAssets();
      return res.json({ assets });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/assets/circle/:circleId", async (req, res) => {
    try {
      const circleId = parseInt(req.params.circleId);
      if (isNaN(circleId)) {
        return res.status(400).json({ message: "Invalid circle ID" });
      }
      
      const assets = await storage.getAssetsByCircle(circleId);
      return res.json({ assets });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/assets/user", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const assets = await storage.getAssetsByOwner(userId);
      return res.json({ assets });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
