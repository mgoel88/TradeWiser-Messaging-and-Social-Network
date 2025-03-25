import {
  users, User, InsertUser,
  circles, Circle, InsertCircle,
  assets, Asset, InsertAsset, 
  commodities, Commodity, InsertCommodity,
  circleCommodities, CircleCommodity, InsertCircleCommodity,
  userCircles, UserCircle, InsertUserCircle,
  userCommodities, UserCommodity, InsertUserCommodity,
  connections, Connection, InsertConnection,
  posts, Post, InsertPost,
  kycRequests, KycRequest, InsertKycRequest
} from "@shared/schema";

import { db } from "./db";
import { eq, and, or, desc, sql } from "drizzle-orm";

// Storage interface for all data operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  listUsers(): Promise<User[]>;

  // Circle operations
  getCircle(id: number): Promise<Circle | undefined>;
  createCircle(circle: InsertCircle): Promise<Circle>;
  updateCircle(id: number, circle: Partial<Circle>): Promise<Circle | undefined>;
  listCircles(): Promise<Circle[]>;
  getCirclesByState(state: string): Promise<Circle[]>;
  getCirclesByDistrict(district: string): Promise<Circle[]>;
  getNearbyCircles(lat: number, lng: number, radiusKm: number): Promise<Circle[]>;

  // Asset operations
  getAsset(id: number): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: number, asset: Partial<Asset>): Promise<Asset | undefined>;
  listAssets(): Promise<Asset[]>;
  getAssetsByCircle(circleId: number): Promise<Asset[]>;
  getAssetsByOwner(ownerId: number): Promise<Asset[]>;

  // Commodity operations
  getCommodity(id: number): Promise<Commodity | undefined>;
  getCommodityByName(name: string): Promise<Commodity | undefined>;
  createCommodity(commodity: InsertCommodity): Promise<Commodity>;
  updateCommodity(id: number, commodity: Partial<Commodity>): Promise<Commodity | undefined>;
  listCommodities(): Promise<Commodity[]>;

  // Circle-Commodity operations
  getCircleCommodity(id: number): Promise<CircleCommodity | undefined>;
  getCircleCommodityByIds(circleId: number, commodityId: number): Promise<CircleCommodity | undefined>;
  createCircleCommodity(circleCommodity: InsertCircleCommodity): Promise<CircleCommodity>;
  updateCircleCommodity(id: number, circleCommodity: Partial<CircleCommodity>): Promise<CircleCommodity | undefined>;
  listCircleCommodities(): Promise<CircleCommodity[]>;
  getCommoditiesByCircle(circleId: number): Promise<CircleCommodity[]>;
  getCirclesByCommodity(commodityId: number): Promise<CircleCommodity[]>;
  getTrendingCommodities(limit: number): Promise<CircleCommodity[]>;

  // User-Circle operations
  getUserCircle(id: number): Promise<UserCircle | undefined>;
  createUserCircle(userCircle: InsertUserCircle): Promise<UserCircle>;
  deleteUserCircle(userId: number, circleId: number): Promise<boolean>;
  listUserCircles(userId: number): Promise<UserCircle[]>;
  getUsersByCircle(circleId: number): Promise<UserCircle[]>;

  // User-Commodity operations
  getUserCommodity(id: number): Promise<UserCommodity | undefined>;
  createUserCommodity(userCommodity: InsertUserCommodity): Promise<UserCommodity>;
  deleteUserCommodity(userId: number, commodityId: number): Promise<boolean>;
  listUserCommodities(userId: number): Promise<UserCommodity[]>;
  getUsersByCommodity(commodityId: number): Promise<UserCommodity[]>;

  // Connection operations
  getConnection(id: number): Promise<Connection | undefined>;
  createConnection(connection: InsertConnection): Promise<Connection>;
  updateConnectionStatus(id: number, status: string): Promise<Connection | undefined>;
  getUserConnections(userId: number): Promise<Connection[]>;
  getPendingConnections(userId: number): Promise<Connection[]>;
  getConnectionStatus(requesterId: number, receiverId: number): Promise<Connection | undefined>;

  // Post operations
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, post: Partial<Post>): Promise<Post | undefined>;
  deletePost(id: number): Promise<boolean>;
  listPosts(limit: number, offset: number): Promise<Post[]>;
  getUserPosts(userId: number): Promise<Post[]>;
  getCirclePosts(circleId: number): Promise<Post[]>;
  getCommodityPosts(commodityId: number): Promise<Post[]>;

  // KYC operations
  getKycRequest(id: number): Promise<KycRequest | undefined>;
  getKycRequestByUser(userId: number): Promise<KycRequest | undefined>;
  createKycRequest(kycRequest: InsertKycRequest): Promise<KycRequest>;
  updateKycRequestStatus(id: number, status: string): Promise<KycRequest | undefined>;
  listKycRequests(): Promise<KycRequest[]>;
  getPendingKycRequests(): Promise<KycRequest[]>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // No constructor needed for database-backed storage

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Circle operations
  async getCircle(id: number): Promise<Circle | undefined> {
    const [circle] = await db.select().from(circles).where(eq(circles.id, id));
    return circle || undefined;
  }

  async createCircle(circle: InsertCircle): Promise<Circle> {
    const [newCircle] = await db.insert(circles).values(circle).returning();
    return newCircle;
  }

  async updateCircle(id: number, circle: Partial<Circle>): Promise<Circle | undefined> {
    const [updatedCircle] = await db
      .update(circles)
      .set(circle)
      .where(eq(circles.id, id))
      .returning();
    return updatedCircle || undefined;
  }

  async listCircles(): Promise<Circle[]> {
    return await db.select().from(circles);
  }

  async getCirclesByState(state: string): Promise<Circle[]> {
    return await db.select().from(circles).where(eq(circles.state, state));
  }

  async getCirclesByDistrict(district: string): Promise<Circle[]> {
    return await db.select().from(circles).where(eq(circles.district, district));
  }

  async getNearbyCircles(lat: number, lng: number, radiusKm: number): Promise<Circle[]> {
    // This is a simplified approach - in production, would use PostGIS or similar
    // Get all circles and filter by approximate distance
    const allCircles = await db.select().from(circles);
    return allCircles.filter((circle) => {
      const distance = Math.sqrt(
        Math.pow(circle.latitude - lat, 2) + Math.pow(circle.longitude - lng, 2)
      ) * 111; // Rough conversion to km
      return distance <= radiusKm;
    });
  }

  // Asset operations
  async getAsset(id: number): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset || undefined;
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    const [newAsset] = await db.insert(assets).values(asset).returning();
    return newAsset;
  }

  async updateAsset(id: number, asset: Partial<Asset>): Promise<Asset | undefined> {
    const [updatedAsset] = await db
      .update(assets)
      .set(asset)
      .where(eq(assets.id, id))
      .returning();
    return updatedAsset || undefined;
  }

  async listAssets(): Promise<Asset[]> {
    return await db.select().from(assets);
  }

  async getAssetsByCircle(circleId: number): Promise<Asset[]> {
    return await db.select().from(assets).where(eq(assets.circleId, circleId));
  }

  async getAssetsByOwner(ownerId: number): Promise<Asset[]> {
    return await db.select().from(assets).where(eq(assets.ownerId, ownerId));
  }

  // Commodity operations
  async getCommodity(id: number): Promise<Commodity | undefined> {
    const [commodity] = await db.select().from(commodities).where(eq(commodities.id, id));
    return commodity || undefined;
  }

  async getCommodityByName(name: string): Promise<Commodity | undefined> {
    const [commodity] = await db.select().from(commodities).where(eq(commodities.name, name));
    return commodity || undefined;
  }

  async createCommodity(commodity: InsertCommodity): Promise<Commodity> {
    const [newCommodity] = await db.insert(commodities).values(commodity).returning();
    return newCommodity;
  }

  async updateCommodity(id: number, commodity: Partial<Commodity>): Promise<Commodity | undefined> {
    const [updatedCommodity] = await db
      .update(commodities)
      .set(commodity)
      .where(eq(commodities.id, id))
      .returning();
    return updatedCommodity || undefined;
  }

  async listCommodities(): Promise<Commodity[]> {
    return await db.select().from(commodities);
  }

  // Circle-Commodity operations
  async getCircleCommodity(id: number): Promise<CircleCommodity | undefined> {
    const [circleCommodity] = await db
      .select()
      .from(circleCommodities)
      .where(eq(circleCommodities.id, id));
    return circleCommodity || undefined;
  }

  async getCircleCommodityByIds(circleId: number, commodityId: number): Promise<CircleCommodity | undefined> {
    const [circleCommodity] = await db
      .select()
      .from(circleCommodities)
      .where(and(
        eq(circleCommodities.circleId, circleId),
        eq(circleCommodities.commodityId, commodityId)
      ));
    return circleCommodity || undefined;
  }

  async createCircleCommodity(circleCommodity: InsertCircleCommodity): Promise<CircleCommodity> {
    const [newCircleCommodity] = await db
      .insert(circleCommodities)
      .values(circleCommodity)
      .returning();
    return newCircleCommodity;
  }

  async updateCircleCommodity(id: number, circleCommodity: Partial<CircleCommodity>): Promise<CircleCommodity | undefined> {
    const [updatedCircleCommodity] = await db
      .update(circleCommodities)
      .set(circleCommodity)
      .where(eq(circleCommodities.id, id))
      .returning();
    return updatedCircleCommodity || undefined;
  }

  async listCircleCommodities(): Promise<CircleCommodity[]> {
    return await db.select().from(circleCommodities);
  }

  async getCommoditiesByCircle(circleId: number): Promise<CircleCommodity[]> {
    return await db
      .select()
      .from(circleCommodities)
      .where(eq(circleCommodities.circleId, circleId));
  }

  async getCirclesByCommodity(commodityId: number): Promise<CircleCommodity[]> {
    return await db
      .select()
      .from(circleCommodities)
      .where(eq(circleCommodities.commodityId, commodityId));
  }

  async getTrendingCommodities(limit: number): Promise<CircleCommodity[]> {
    return await db
      .select()
      .from(circleCommodities)
      .orderBy(desc(sql`ABS(${circleCommodities.priceChange})`))
      .limit(limit);
  }

  // User-Circle operations
  async getUserCircle(id: number): Promise<UserCircle | undefined> {
    const [userCircle] = await db
      .select()
      .from(userCircles)
      .where(eq(userCircles.id, id));
    return userCircle || undefined;
  }

  async createUserCircle(userCircle: InsertUserCircle): Promise<UserCircle> {
    const [newUserCircle] = await db
      .insert(userCircles)
      .values(userCircle)
      .returning();
    return newUserCircle;
  }

  async deleteUserCircle(userId: number, circleId: number): Promise<boolean> {
    const result = await db
      .delete(userCircles)
      .where(and(
        eq(userCircles.userId, userId),
        eq(userCircles.circleId, circleId)
      ));
    return !!result.rowCount && result.rowCount > 0;
  }

  async listUserCircles(userId: number): Promise<UserCircle[]> {
    return await db
      .select()
      .from(userCircles)
      .where(eq(userCircles.userId, userId));
  }

  async getUsersByCircle(circleId: number): Promise<UserCircle[]> {
    return await db
      .select()
      .from(userCircles)
      .where(eq(userCircles.circleId, circleId));
  }

  // User-Commodity operations
  async getUserCommodity(id: number): Promise<UserCommodity | undefined> {
    const [userCommodity] = await db
      .select()
      .from(userCommodities)
      .where(eq(userCommodities.id, id));
    return userCommodity || undefined;
  }

  async createUserCommodity(userCommodity: InsertUserCommodity): Promise<UserCommodity> {
    const [newUserCommodity] = await db
      .insert(userCommodities)
      .values(userCommodity)
      .returning();
    return newUserCommodity;
  }

  async deleteUserCommodity(userId: number, commodityId: number): Promise<boolean> {
    const result = await db
      .delete(userCommodities)
      .where(and(
        eq(userCommodities.userId, userId),
        eq(userCommodities.commodityId, commodityId)
      ));
    return !!result.rowCount && result.rowCount > 0;
  }

  async listUserCommodities(userId: number): Promise<UserCommodity[]> {
    return await db
      .select()
      .from(userCommodities)
      .where(eq(userCommodities.userId, userId));
  }

  async getUsersByCommodity(commodityId: number): Promise<UserCommodity[]> {
    return await db
      .select()
      .from(userCommodities)
      .where(eq(userCommodities.commodityId, commodityId));
  }

  // Connection operations
  async getConnection(id: number): Promise<Connection | undefined> {
    const [connection] = await db
      .select()
      .from(connections)
      .where(eq(connections.id, id));
    return connection || undefined;
  }

  async createConnection(connection: InsertConnection): Promise<Connection> {
    const [newConnection] = await db
      .insert(connections)
      .values(connection)
      .returning();
    return newConnection;
  }

  async updateConnectionStatus(id: number, status: string): Promise<Connection | undefined> {
    const [updatedConnection] = await db
      .update(connections)
      .set({ status })
      .where(eq(connections.id, id))
      .returning();
    return updatedConnection || undefined;
  }

  async getUserConnections(userId: number): Promise<Connection[]> {
    return await db
      .select()
      .from(connections)
      .where(and(
        or(
          eq(connections.requesterId, userId),
          eq(connections.receiverId, userId)
        ),
        eq(connections.status, "accepted")
      ));
  }

  async getPendingConnections(userId: number): Promise<Connection[]> {
    return await db
      .select()
      .from(connections)
      .where(and(
        eq(connections.receiverId, userId),
        eq(connections.status, "pending")
      ));
  }

  async getConnectionStatus(requesterId: number, receiverId: number): Promise<Connection | undefined> {
    const [connection] = await db
      .select()
      .from(connections)
      .where(or(
        and(
          eq(connections.requesterId, requesterId),
          eq(connections.receiverId, receiverId)
        ),
        and(
          eq(connections.requesterId, receiverId),
          eq(connections.receiverId, requesterId)
        )
      ));
    return connection || undefined;
  }

  // Post operations
  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id));
    return post || undefined;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db
      .insert(posts)
      .values(post)
      .returning();
    return newPost;
  }

  async updatePost(id: number, post: Partial<Post>): Promise<Post | undefined> {
    const [updatedPost] = await db
      .update(posts)
      .set(post)
      .where(eq(posts.id, id))
      .returning();
    return updatedPost || undefined;
  }

  async deletePost(id: number): Promise<boolean> {
    const result = await db
      .delete(posts)
      .where(eq(posts.id, id));
    return !!result.rowCount && result.rowCount > 0;
  }

  async listPosts(limit: number, offset: number): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getUserPosts(userId: number): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
  }

  async getCirclePosts(circleId: number): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.circleId, circleId))
      .orderBy(desc(posts.createdAt));
  }

  async getCommodityPosts(commodityId: number): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.commodityId, commodityId))
      .orderBy(desc(posts.createdAt));
  }

  // KYC operations
  async getKycRequest(id: number): Promise<KycRequest | undefined> {
    const [kycRequest] = await db
      .select()
      .from(kycRequests)
      .where(eq(kycRequests.id, id));
    return kycRequest || undefined;
  }

  async getKycRequestByUser(userId: number): Promise<KycRequest | undefined> {
    const [kycRequest] = await db
      .select()
      .from(kycRequests)
      .where(eq(kycRequests.userId, userId));
    return kycRequest || undefined;
  }

  async createKycRequest(kycRequest: InsertKycRequest): Promise<KycRequest> {
    const [newKycRequest] = await db
      .insert(kycRequests)
      .values(kycRequest)
      .returning();
    return newKycRequest;
  }

  async updateKycRequestStatus(id: number, status: string): Promise<KycRequest | undefined> {
    const [updatedKycRequest] = await db
      .update(kycRequests)
      .set({ status })
      .where(eq(kycRequests.id, id))
      .returning();
    
    // If approved, update user's KYC status
    if (status === "approved" && updatedKycRequest) {
      await db
        .update(users)
        .set({ kycVerified: true })
        .where(eq(users.id, updatedKycRequest.userId));
    }
    
    return updatedKycRequest || undefined;
  }

  async listKycRequests(): Promise<KycRequest[]> {
    return await db.select().from(kycRequests);
  }

  async getPendingKycRequests(): Promise<KycRequest[]> {
    return await db
      .select()
      .from(kycRequests)
      .where(eq(kycRequests.status, "pending"));
  }
}

export const storage = new DatabaseStorage();