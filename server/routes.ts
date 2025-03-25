import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { notifyNewListing, notifyOfferReceived, notifyTradeUpdate } from "./notifications";
import { 
  insertUserSchema, 
  userLoginSchema, 
  insertPostSchema, 
  insertConnectionSchema,
  insertKycRequestSchema,
  insertUserCircleSchema,
  insertUserCommoditySchema,
  kycRequestFormSchema,
  insertListingSchema, 
  insertOfferSchema, 
  insertTradeSchema,
  listingFormSchema,
  offerFormSchema
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
      
      // Process document metadata
      const { documents, idNumberConfirm, ...requestData } = req.body;
      
      // Convert document metadata to string for storage
      // In a production environment, you would process actual file uploads here
      const processedData = {
        ...requestData,
        userId,
        documents: documents ? JSON.stringify(documents) : undefined
      };
      
      const data = kycRequestFormSchema.omit({ idNumberConfirm: true }).parse(processedData);
      
      const kycRequest = await storage.createKycRequest(data);
      
      console.log(`KYC request submitted with ${documents?.length || 0} document(s) for user ${userId}`);
      
      return res.status(201).json({ 
        kycRequest,
        message: "KYC request submitted successfully" 
      });
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
      
      // Parse document metadata if present
      if (kycRequest.documents && Array.isArray(kycRequest.documents)) {
        try {
          // In case the first element is already a JSON string (stored as stringified JSON)
          if (typeof kycRequest.documents[0] === 'string' && kycRequest.documents[0].startsWith('{')) {
            kycRequest.documents = kycRequest.documents.map(doc => 
              typeof doc === 'string' ? JSON.parse(doc) : doc
            );
          }
        } catch (parseErr) {
          console.log('Document parsing error:', parseErr);
          // If parsing fails, just return the documents as is
        }
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

  // Market News (Reuters/MoneyControl-like) endpoints
  app.get("/api/market-news", async (req, res) => {
    try {
      // In a real implementation, this would fetch from news APIs or databases
      // For now, providing sample data for demonstration
      const news = [
        {
          id: 1,
          headline: "Wheat prices surge amidst rainfall shortage in Northern India",
          summary: "Wheat futures saw a sharp increase as rainfall deficit in Punjab and Haryana raised concerns over yield. Analysts expect continued upward pressure on prices.",
          content: "Wheat futures on the National Commodity Exchange surged 3.5% today, reaching ₹2,350 per quintal as rainfall deficits in key wheat-growing regions of Punjab and Haryana raised concerns over potential yield impacts for the upcoming rabi season.\n\nThe Indian Meteorological Department reported that the rainfall in October has been 35% below normal in these regions, potentially affecting the sowing operations for the winter crop. Commodity analysts from AgriWatch noted that if the dry conditions persist, we could see wheat prices climbing further in the coming weeks.\n\n\"Farmers are delaying sowing operations in anticipation of rainfall, which could compress the growing season and impact final yields,\" said Dr. Rajiv Sharma, agricultural economist at the Indian Agricultural Research Institute.",
          source: "Reuters",
          sourceUrl: "https://reuters.com/agriculture/wheat-prices-surge",
          category: "grain",
          region: "Punjab",
          publishedAt: "2025-03-22T09:30:00Z",
          imageUrl: "https://images.unsplash.com/photo-1574323347407-f5e1c5a9ec68",
          tags: ["wheat", "rabi", "drought", "price rise"]
        },
        {
          id: 2,
          headline: "Government increases MSP for pulses to boost production",
          summary: "Cabinet approves ₹500/quintal increase in Minimum Support Price for pulses to encourage farmers to grow more pulses amidst rising imports.",
          content: "The Union Cabinet today approved an increase in the Minimum Support Price (MSP) for pulses by ₹500 per quintal for the 2025-26 crop year. The move aims to incentivize farmers to increase the area under pulse cultivation and reduce India's dependence on imports.\n\nThe MSP for moong has been set at ₹8,558 per quintal, while that for urad and tur has been increased to ₹7,800 and ₹7,600 per quintal respectively. This represents an average increase of 7.8% over the previous year's MSP.\n\n\"This decision will help increase domestic production of pulses and eventually reduce our import dependency,\" said the Agriculture Minister in a press statement. India currently imports about 15-20% of its pulse requirements, with significant volumes coming from Canada, Myanmar, and Australia.",
          source: "MoneyControl",
          sourceUrl: "https://moneycontrol.com/news/business/economy/government-increases-msp-for-pulses",
          category: "pulse",
          region: "Maharashtra",
          publishedAt: "2025-03-21T14:15:00Z",
          imageUrl: "https://images.unsplash.com/photo-1515543904419-b8c3f5bede14",
          tags: ["pulses", "MSP", "government policy", "agriculture"]
        },
        {
          id: 3,
          headline: "Soybean processors facing margin pressure despite rising global demand",
          summary: "Indian soybean processing industry struggles with capacity utilization as domestic prices remain elevated compared to international markets.",
          content: "India's soybean processing industry is facing significant margin pressure despite rising global demand for soybean meal, primarily due to high domestic prices of the oilseed. Industry data shows that capacity utilization at processing units has dropped to 55% from 70% last year.\n\n\"The price differential between Indian and international soybean has made our meal exports uncompetitive,\" said Rajesh Agrawal, Chairman of the Soybean Processors Association of India (SOPA). Domestic soybean prices are currently trading at ₹4,120 per quintal, approximately 15% higher than international prices when adjusted for import duties and logistics costs.\n\nThe situation has been exacerbated by increased soybean production in Brazil and Argentina, which has kept global prices under pressure. However, Indian prices have remained firm due to lower domestic production following erratic monsoon rainfall in major growing regions of Madhya Pradesh and Maharashtra.",
          source: "Financial Express",
          sourceUrl: "https://financialexpress.com/market/commodities/soybean-processors-margin-pressure",
          category: "oilseed",
          region: "Madhya Pradesh",
          publishedAt: "2025-03-20T16:45:00Z",
          imageUrl: "https://images.unsplash.com/photo-1563431453052-32cea445d3b4",
          tags: ["soybean", "processing", "exports", "price"]
        },
        {
          id: 4,
          headline: "Chana futures drop 2% on increased imports",
          summary: "Chana futures on NCDEX fell as government allows pulse imports to control retail inflation.",
          content: "Chana (chickpea) futures on the National Commodity and Derivatives Exchange (NCDEX) fell by over 2% today following the government's decision to allow duty-free imports of up to 400,000 tonnes of the pulse to control retail inflation.\n\nThe most-active Chana April contract on NCDEX was trading at ₹5,780 per quintal, down ₹120 or 2.03% from the previous close. Trading volumes surged to 42,350 lots as market participants rushed to adjust their positions following the announcement.\n\n\"This move is likely to increase domestic availability and cool down retail prices which have risen by nearly 15% over the past three months,\" said commodity analyst Vipul Sharma. The government has been actively managing pulse imports to balance the interests of consumers facing food inflation and farmers who benefit from higher prices.",
          source: "Economic Times",
          sourceUrl: "https://economictimes.com/markets/commodities/chana-futures-drop",
          category: "pulse",
          region: "Rajasthan",
          publishedAt: "2025-03-19T11:30:00Z",
          imageUrl: "https://images.unsplash.com/photo-1611575619367-628c2e8f2e4a",
          tags: ["chana", "futures", "imports", "pulses"]
        },
        {
          id: 5,
          headline: "Record turmeric production expected in Telangana",
          summary: "Turmeric output in Telangana projected to reach 5-year high, prices expected to moderate in coming months.",
          content: "Telangana is set to witness record turmeric production this season, with output projected to reach a five-year high of approximately 195,000 tonnes, according to the state's agriculture department. Favorable weather conditions and increased area under cultivation are the primary drivers behind this bumper crop.\n\n\"We've seen nearly a 12% increase in area under turmeric cultivation this year, with farmers switching from cotton due to better price realization for turmeric in the previous season,\" explained K. Srinivas Rao, Director of the state's Agriculture Department.\n\nThe increased production is expected to moderate prices, which had risen to record highs of ₹17,500 per quintal earlier this year. Market analysts predict prices could settle around ₹12,000-13,000 per quintal once the new crop starts arriving in full swing by early April.",
          source: "Reuters",
          sourceUrl: "https://reuters.com/markets/commodities/record-turmeric-production-telangana",
          category: "spice",
          region: "Telangana",
          publishedAt: "2025-03-18T13:20:00Z",
          imageUrl: "https://images.unsplash.com/photo-1615485500704-8e990f9921ef",
          tags: ["turmeric", "spices", "production", "telangana"]
        }
      ];
      
      return res.json({ news });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Weather updates endpoint
  app.get("/api/weather", async (req, res) => {
    try {
      // This would typically connect to a weather API
      // Providing sample data for demonstration
      const weather = [
        {
          location: "Bikaner",
          state: "Rajasthan",
          temperature: 32,
          condition: "Clear",
          humidity: 45,
          windSpeed: 12,
          forecast: [
            { day: "Tomorrow", temperature: 33, condition: "Clear" },
            { day: "Day 2", temperature: 34, condition: "Clear" },
            { day: "Day 3", temperature: 33, condition: "Partly Cloudy" }
          ]
        },
        {
          location: "Indore",
          state: "Madhya Pradesh",
          temperature: 28,
          condition: "Partly Cloudy",
          humidity: 60,
          windSpeed: 8,
          forecast: [
            { day: "Tomorrow", temperature: 29, condition: "Partly Cloudy" },
            { day: "Day 2", temperature: 30, condition: "Clear" },
            { day: "Day 3", temperature: 29, condition: "Clear" }
          ]
        },
        {
          location: "Guntur",
          state: "Andhra Pradesh",
          temperature: 30,
          condition: "Rain",
          humidity: 75,
          windSpeed: 15,
          forecast: [
            { day: "Tomorrow", temperature: 29, condition: "Showers" },
            { day: "Day 2", temperature: 28, condition: "Showers" },
            { day: "Day 3", temperature: 30, condition: "Partly Cloudy" }
          ],
          alerts: ["Heavy rainfall expected in the next 48 hours"]
        }
      ];
      
      return res.json({ weather });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Market recommendations endpoint
  app.get("/api/recommendations", async (req, res) => {
    try {
      // In a real implementation, this would be generated based on algorithms and data analysis
      // Providing sample data for demonstration
      const recommendations = [
        {
          id: 1,
          commodity: "Wheat",
          type: "buy",
          description: "Buy opportunity based on expected yield reduction due to rainfall shortage",
          currentPrice: 2350,
          targetPrice: 2600,
          stopLoss: 2250,
          timestamp: "2025-03-22T10:00:00Z",
          region: "Punjab",
          confidence: "high",
          rationale: "Weather patterns and reduced sowing area indicate potential supply constraints"
        },
        {
          id: 2,
          commodity: "Soybean",
          type: "sell",
          description: "Consider selling soybean with international prices trending lower",
          currentPrice: 4120,
          targetPrice: 3900,
          stopLoss: 4200,
          timestamp: "2025-03-21T15:30:00Z",
          region: "Madhya Pradesh",
          confidence: "medium",
          rationale: "Increased global production and lower export competitiveness"
        },
        {
          id: 3,
          commodity: "Chana",
          type: "hold",
          description: "Hold positions as market adjusts to new import policy",
          currentPrice: 5780,
          targetPrice: 5700,
          stopLoss: null,
          timestamp: "2025-03-20T09:15:00Z",
          region: "Rajasthan",
          confidence: "medium",
          rationale: "Initial price reaction to import news may be overdone"
        },
        {
          id: 4,
          commodity: "Turmeric",
          type: "alert",
          description: "Prepare for potential selling opportunity as new crop arrives",
          currentPrice: 15200,
          targetPrice: 12800,
          stopLoss: null,
          timestamp: "2025-03-19T11:45:00Z",
          region: "Telangana",
          confidence: "high",
          rationale: "Record production expected to pressure prices in coming weeks"
        },
        {
          id: 5,
          commodity: "Mustard Seed",
          type: "buy",
          description: "Accumulate on dips with positive long-term outlook",
          currentPrice: 6340,
          targetPrice: 6800,
          stopLoss: 6100,
          timestamp: "2025-03-18T14:30:00Z",
          region: "Haryana",
          confidence: "medium",
          rationale: "Growing demand for mustard oil and expected export opportunities"
        }
      ];
      
      return res.json({ recommendations });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Market analysis endpoint
  app.get("/api/market-analysis", async (req, res) => {
    try {
      // This would normally involve complex data processing and analysis
      // Providing sample data for demonstration
      const analysis = {
        daily: [
          { commodity: "Wheat", price: 2350, change: 2.4, volume: 1250, sentiment: 70 },
          { commodity: "Soybean", price: 4120, change: -1.8, volume: 980, sentiment: 40 },
          { commodity: "Chana", price: 5780, change: 0.5, volume: 750, sentiment: 55 },
          { commodity: "Turmeric", price: 15200, change: -3.2, volume: 320, sentiment: 30 },
          { commodity: "Mustard Seed", price: 6340, change: 1.2, volume: 540, sentiment: 65 }
        ],
        weekly: {
          summary: "Grain prices trending higher, oilseeds mixed, pulses steady",
          topPerformers: ["Wheat", "Barley", "Mustard Seed"],
          worstPerformers: ["Turmeric", "Soybean", "Cumin"]
        },
        monthly: {
          summary: "Agricultural commodities showing seasonal patterns with rabi harvest approaching",
          outlook: "Moderate price pressure expected as new harvests reach markets, but lower-than-expected yields may provide support",
          keyFactors: ["Rainfall deficit in northern states", "Export policy changes", "MSP announcements"]
        }
      };
      
      return res.json({ analysis });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Marketplace Listing routes
  app.get("/api/listings", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string);
      const offset = parseInt(req.query.offset as string);
      
      const listings = await storage.listListings(
        isNaN(limit) ? undefined : limit,
        isNaN(offset) ? undefined : offset
      );
      
      // Enrich listing data with commodity, circle, and user info
      const enrichedListings = await Promise.all(
        listings.map(async (listing) => {
          const commodity = await storage.getCommodity(listing.commodityId);
          const circle = await storage.getCircle(listing.circleId);
          const user = await storage.getUser(listing.userId);
          
          return {
            ...listing,
            commodity: commodity ? {
              id: commodity.id,
              name: commodity.name,
              icon: commodity.icon,
              category: commodity.category
            } : null,
            circle: circle ? {
              id: circle.id,
              name: circle.name,
              state: circle.state,
              district: circle.district
            } : null,
            user: user ? {
              id: user.id,
              name: user.name,
              avatar: user.avatar,
              kycVerified: user.kycVerified,
              userType: user.userType
            } : null
          };
        })
      );
      
      return res.json({ listings: enrichedListings });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/listings/active", async (req, res) => {
    try {
      const listingType = req.query.type as string || undefined;
      const listings = await storage.getActiveListings(listingType);
      
      // Enrich listing data with commodity, circle, and user info
      const enrichedListings = await Promise.all(
        listings.map(async (listing) => {
          const commodity = await storage.getCommodity(listing.commodityId);
          const circle = await storage.getCircle(listing.circleId);
          const user = await storage.getUser(listing.userId);
          
          return {
            ...listing,
            commodity: commodity ? {
              id: commodity.id,
              name: commodity.name,
              icon: commodity.icon,
              category: commodity.category
            } : null,
            circle: circle ? {
              id: circle.id,
              name: circle.name,
              state: circle.state,
              district: circle.district
            } : null,
            user: user ? {
              id: user.id,
              name: user.name,
              avatar: user.avatar,
              kycVerified: user.kycVerified,
              userType: user.userType
            } : null
          };
        })
      );
      
      return res.json({ listings: enrichedListings });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/listings/search", async (req, res) => {
    try {
      const commodityId = parseInt(req.query.commodityId as string);
      const circleId = parseInt(req.query.circleId as string);
      const minPrice = parseFloat(req.query.minPrice as string);
      const maxPrice = parseFloat(req.query.maxPrice as string);
      const listingType = req.query.type as string;
      const quality = req.query.quality as string;
      
      const searchParams: any = {};
      
      if (!isNaN(commodityId)) searchParams.commodityId = commodityId;
      if (!isNaN(circleId)) searchParams.circleId = circleId;
      if (!isNaN(minPrice)) searchParams.minPrice = minPrice;
      if (!isNaN(maxPrice)) searchParams.maxPrice = maxPrice;
      if (listingType) searchParams.listingType = listingType;
      if (quality) searchParams.quality = quality;
      
      const listings = await storage.searchListings(searchParams);
      
      // Enrich listing data with commodity, circle, and user info
      const enrichedListings = await Promise.all(
        listings.map(async (listing) => {
          const commodity = await storage.getCommodity(listing.commodityId);
          const circle = await storage.getCircle(listing.circleId);
          const user = await storage.getUser(listing.userId);
          
          return {
            ...listing,
            commodity: commodity ? {
              id: commodity.id,
              name: commodity.name,
              icon: commodity.icon,
              category: commodity.category
            } : null,
            circle: circle ? {
              id: circle.id,
              name: circle.name,
              state: circle.state,
              district: circle.district
            } : null,
            user: user ? {
              id: user.id,
              name: user.name,
              avatar: user.avatar,
              kycVerified: user.kycVerified,
              userType: user.userType
            } : null
          };
        })
      );
      
      return res.json({ listings: enrichedListings });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/listings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid listing ID" });
      }
      
      const listing = await storage.getListing(id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      // Get commodity, circle, and user details
      const commodity = await storage.getCommodity(listing.commodityId);
      const circle = await storage.getCircle(listing.circleId);
      const user = await storage.getUser(listing.userId);
      
      // Get offers for this listing
      const offers = await storage.getOffersByListing(id);
      
      return res.json({
        listing,
        commodity: commodity ? {
          id: commodity.id,
          name: commodity.name,
          icon: commodity.icon,
          category: commodity.category
        } : null,
        circle: circle ? {
          id: circle.id,
          name: circle.name,
          state: circle.state,
          district: circle.district
        } : null,
        user: user ? {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          kycVerified: user.kycVerified,
          userType: user.userType
        } : null,
        offers: offers.length
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/listings", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const data = listingFormSchema.parse({
        ...req.body,
        userId,
        status: 'active' // Default status for new listings
      });
      
      const newListing = await storage.createListing(data);
      
      // Send real-time notification about new listing
      notifyNewListing(newListing);
      
      return res.status(201).json({ listing: newListing });
    } catch (err) {
      return handleZodError(err, res);
    }
  });
  
  app.patch("/api/listings/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const listingId = parseInt(req.params.id);
      
      if (isNaN(listingId)) {
        return res.status(400).json({ message: "Invalid listing ID" });
      }
      
      const listing = await storage.getListing(listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      // Check if user owns this listing
      if (listing.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this listing" });
      }
      
      // Only update allowed fields
      const allowedFields = [
        "pricePerUnit", 
        "quantity", 
        "minQuantity", 
        "quality", 
        "availableFrom", 
        "availableTo", 
        "description",
        "status"
      ];
      
      const updates: Record<string, any> = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }
      
      const updatedListing = await storage.updateListing(listingId, updates);
      return res.json({ listing: updatedListing });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/listings/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const listingId = parseInt(req.params.id);
      
      if (isNaN(listingId)) {
        return res.status(400).json({ message: "Invalid listing ID" });
      }
      
      const listing = await storage.getListing(listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      // Check if user owns this listing
      if (listing.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this listing" });
      }
      
      const success = await storage.deleteListing(listingId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete listing" });
      }
      
      return res.json({ message: "Listing deleted successfully" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Marketplace Offer routes
  app.get("/api/offers", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const offers = await storage.getUserOffers(userId);
      
      // Enrich offer data
      const enrichedOffers = await Promise.all(
        offers.map(async (offer) => {
          const listing = await storage.getListing(offer.listingId);
          const buyer = await storage.getUser(offer.buyerId);
          
          let commodity = null;
          let circle = null;
          let seller = null;
          
          if (listing) {
            commodity = await storage.getCommodity(listing.commodityId);
            circle = await storage.getCircle(listing.circleId);
            seller = await storage.getUser(listing.userId);
          }
          
          return {
            ...offer,
            listing,
            buyer,
            commodity: commodity ? {
              id: commodity.id,
              name: commodity.name,
              icon: commodity.icon
            } : null,
            circle: circle ? {
              id: circle.id,
              name: circle.name
            } : null,
            seller
          };
        })
      );
      
      return res.json({ offers: enrichedOffers });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/offers/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const offerId = parseInt(req.params.id);
      
      if (isNaN(offerId)) {
        return res.status(400).json({ message: "Invalid offer ID" });
      }
      
      const offer = await storage.getOffer(offerId);
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      
      // Get the listing for this offer
      const listing = await storage.getListing(offer.listingId);
      
      // Check if user is involved in this offer (either as buyer or seller)
      if (offer.buyerId !== userId && (!listing || listing.userId !== userId)) {
        return res.status(403).json({ message: "Not authorized to view this offer" });
      }
      
      // Get additional details
      const buyer = await storage.getUser(offer.buyerId);
      
      let commodity = null;
      let circle = null;
      let seller = null;
      
      if (listing) {
        commodity = await storage.getCommodity(listing.commodityId);
        circle = await storage.getCircle(listing.circleId);
        seller = await storage.getUser(listing.userId);
      }
      
      return res.json({
        offer,
        listing,
        buyer,
        commodity: commodity ? {
          id: commodity.id,
          name: commodity.name,
          icon: commodity.icon
        } : null,
        circle: circle ? {
          id: circle.id,
          name: circle.name
        } : null,
        seller
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/offers", isAuthenticated, async (req, res) => {
    try {
      const buyerId = (req.user as any).id;
      const data = offerFormSchema.parse({
        ...req.body,
        buyerId,
        status: 'pending' // Default status for new offers
      });
      
      // Verify the listing exists and is active
      const listing = await storage.getListing(data.listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.status !== 'active') {
        return res.status(400).json({ message: "Listing is not active" });
      }
      
      // Buyers can't submit offers to their own listings
      if (listing.userId === buyerId) {
        return res.status(400).json({ message: "Cannot submit offer to your own listing" });
      }
      
      // Check if the quantity is valid
      if (data.quantity > listing.quantity) {
        return res.status(400).json({ message: "Offer quantity exceeds available quantity" });
      }
      
      if (listing.minQuantity && data.quantity < listing.minQuantity) {
        return res.status(400).json({ 
          message: `Minimum quantity required is ${listing.minQuantity}` 
        });
      }
      
      // Create the offer
      const newOffer = await storage.createOffer({
        ...data,
        totalAmount: data.quantity * (data.pricePerUnit || listing.pricePerUnit)
      });
      
      // Send real-time notification to seller about the new offer
      notifyOfferReceived(newOffer);
      
      return res.status(201).json({ offer: newOffer });
    } catch (err) {
      return handleZodError(err, res);
    }
  });
  
  app.patch("/api/offers/:id/status", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const offerId = parseInt(req.params.id);
      
      if (isNaN(offerId)) {
        return res.status(400).json({ message: "Invalid offer ID" });
      }
      
      const { status } = req.body;
      if (!status || !['accepted', 'rejected', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const offer = await storage.getOffer(offerId);
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      
      // Get the listing for this offer
      const listing = await storage.getListing(offer.listingId);
      if (!listing) {
        return res.status(404).json({ message: "Associated listing not found" });
      }
      
      // Check if user is allowed to update this offer's status
      if (status === 'cancelled') {
        // Only the buyer can cancel their offer
        if (offer.buyerId !== userId) {
          return res.status(403).json({ message: "Only the buyer can cancel this offer" });
        }
      } else { // 'accepted' or 'rejected'
        // Only the seller can accept or reject an offer
        if (listing.userId !== userId) {
          return res.status(403).json({ message: "Only the seller can accept or reject offers" });
        }
      }
      
      // Update the offer status
      const updatedOffer = await storage.updateOfferStatus(offerId, status);
      
      // If offer is accepted, create a trade
      if (status === 'accepted') {
        const trade = await storage.createTrade({
          offerId: offer.id,
          listingId: listing.id,
          sellerId: listing.userId,
          buyerId: offer.buyerId,
          quantity: offer.quantity,
          pricePerUnit: offer.pricePerUnit || listing.pricePerUnit,
          totalAmount: offer.totalAmount,
          status: 'pending',
          scheduledDate: new Date(),
          actualDate: null,
          paymentMethod: null,
          paymentStatus: 'pending',
          deliveryMethod: null,
          deliveryStatus: 'pending',
          buyerRating: null,
          buyerReview: null,
          sellerRating: null,
          sellerReview: null
        });
        
        // Send notification about the new trade
        notifyTradeUpdate(trade);
        
        return res.json({ offer: updatedOffer, trade });
      }
      
      return res.json({ offer: updatedOffer });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Trade routes
  app.get("/api/trades", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const role = req.query.role as string || undefined;
      
      const trades = await storage.getUserTrades(userId, role);
      
      // Enrich trade data
      const enrichedTrades = await Promise.all(
        trades.map(async (trade) => {
          const listing = await storage.getListing(trade.listingId);
          const offer = await storage.getOffer(trade.offerId);
          const buyer = await storage.getUser(trade.buyerId);
          const seller = await storage.getUser(trade.sellerId);
          
          let commodity = null;
          let circle = null;
          
          if (listing) {
            commodity = await storage.getCommodity(listing.commodityId);
            circle = await storage.getCircle(listing.circleId);
          }
          
          return {
            ...trade,
            listing,
            offer,
            buyer: buyer ? {
              id: buyer.id,
              name: buyer.name,
              avatar: buyer.avatar,
              kycVerified: buyer.kycVerified
            } : null,
            seller: seller ? {
              id: seller.id,
              name: seller.name,
              avatar: seller.avatar,
              kycVerified: seller.kycVerified
            } : null,
            commodity: commodity ? {
              id: commodity.id,
              name: commodity.name,
              icon: commodity.icon
            } : null,
            circle: circle ? {
              id: circle.id,
              name: circle.name
            } : null
          };
        })
      );
      
      return res.json({ trades: enrichedTrades });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/trades/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const tradeId = parseInt(req.params.id);
      
      if (isNaN(tradeId)) {
        return res.status(400).json({ message: "Invalid trade ID" });
      }
      
      const trade = await storage.getTrade(tradeId);
      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      // Check if user is involved in this trade
      if (trade.buyerId !== userId && trade.sellerId !== userId) {
        return res.status(403).json({ message: "Not authorized to view this trade" });
      }
      
      // Get additional details
      const listing = await storage.getListing(trade.listingId);
      const offer = await storage.getOffer(trade.offerId);
      const buyer = await storage.getUser(trade.buyerId);
      const seller = await storage.getUser(trade.sellerId);
      
      let commodity = null;
      let circle = null;
      
      if (listing) {
        commodity = await storage.getCommodity(listing.commodityId);
        circle = await storage.getCircle(listing.circleId);
      }
      
      return res.json({
        trade,
        listing,
        offer,
        buyer: buyer ? {
          id: buyer.id,
          name: buyer.name,
          avatar: buyer.avatar,
          kycVerified: buyer.kycVerified
        } : null,
        seller: seller ? {
          id: seller.id,
          name: seller.name,
          avatar: seller.avatar,
          kycVerified: seller.kycVerified
        } : null,
        commodity: commodity ? {
          id: commodity.id,
          name: commodity.name,
          icon: commodity.icon
        } : null,
        circle: circle ? {
          id: circle.id,
          name: circle.name
        } : null
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/trades/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const tradeId = parseInt(req.params.id);
      
      if (isNaN(tradeId)) {
        return res.status(400).json({ message: "Invalid trade ID" });
      }
      
      const trade = await storage.getTrade(tradeId);
      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      // Check if user is involved in this trade
      if (trade.buyerId !== userId && trade.sellerId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this trade" });
      }
      
      // Only allow updating certain fields based on user role
      const updates: Record<string, any> = {};
      
      if (trade.buyerId === userId) {
        // Fields the buyer can update
        const buyerFields = [
          "paymentMethod", 
          "scheduledDate"
        ];
        
        for (const field of buyerFields) {
          if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
          }
        }
      }
      
      if (trade.sellerId === userId) {
        // Fields the seller can update
        const sellerFields = [
          "deliveryMethod", 
          "scheduledDate"
        ];
        
        for (const field of sellerFields) {
          if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
          }
        }
      }
      
      // Both buyer and seller can update these fields
      if (req.body.status !== undefined && ["completed", "cancelled"].includes(req.body.status)) {
        updates.status = req.body.status;
        
        // If trade is completed, update the listing status
        if (req.body.status === "completed") {
          const listing = await storage.getListing(trade.listingId);
          
          if (listing) {
            // Check if the entire quantity has been fulfilled
            if (trade.quantity >= listing.quantity) {
              await storage.updateListingStatus(listing.id, "completed");
            } else {
              // Update remaining quantity
              await storage.updateListing(listing.id, {
                quantity: listing.quantity - trade.quantity
              });
            }
          }
        }
      }
      
      const updatedTrade = await storage.updateTrade(tradeId, updates);
      
      // Send real-time notification about trade update
      notifyTradeUpdate(updatedTrade);
      
      return res.json({ trade: updatedTrade });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/trades/:id/rating", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const tradeId = parseInt(req.params.id);
      
      if (isNaN(tradeId)) {
        return res.status(400).json({ message: "Invalid trade ID" });
      }
      
      const { rating, review } = req.body;
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
      }
      
      const trade = await storage.getTrade(tradeId);
      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      // Check if user is involved in this trade
      let role: string;
      if (trade.buyerId === userId) {
        role = 'buyer';
      } else if (trade.sellerId === userId) {
        role = 'seller';
      } else {
        return res.status(403).json({ message: "Not authorized to rate this trade" });
      }
      
      // Check if trade is completed
      if (trade.status !== 'completed') {
        return res.status(400).json({ message: "Can only rate completed trades" });
      }
      
      // Check if user has already rated
      if ((role === 'buyer' && trade.buyerRating) || (role === 'seller' && trade.sellerRating)) {
        return res.status(400).json({ message: "You have already rated this trade" });
      }
      
      const updatedTrade = await storage.updateTradeRating(tradeId, rating, review || '', role);
      return res.json({ trade: updatedTrade });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
