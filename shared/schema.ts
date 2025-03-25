import { pgTable, text, serial, integer, boolean, jsonb, timestamp, real, varchar, date } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from "nanoid";

// Users table for storing user information
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  userType: text("user_type").notNull().default("user"),  // farmer, trader, broker, processor
  bio: text("bio"),
  avatar: text("avatar"),
  business: text("business"),
  kycVerified: boolean("kyc_verified").default(false),
  nativeCircleId: integer("native_circle_id"),
  createdAt: timestamp("created_at").defaultNow()
});

// Circles represent geographical areas with specific commodity specializations
export const circles = pgTable("circles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  radius: real("radius").notNull(), // in kilometers
  mainCommodities: text("main_commodities").array(),
  state: text("state").notNull(),
  district: text("district").notNull(),
  isMandi: boolean("is_mandi").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Assets like warehouses, processing plants, etc.
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // warehouse, mandi, processing_plant
  ownerId: integer("owner_id").notNull(),
  circleId: integer("circle_id").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  capacity: text("capacity"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow()
});

// Commodities traded in the system
export const commodities = pgTable("commodities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  category: text("category").notNull(), // grain, pulse, oilseed, spice, etc.
  icon: text("icon").default("wheat-awn"),
  createdAt: timestamp("created_at").defaultNow()
});

// Circle-commodity relationship with weight assignments
export const circleCommodities = pgTable("circle_commodities", {
  id: serial("id").primaryKey(),
  circleId: integer("circle_id").notNull(),
  commodityId: integer("commodity_id").notNull(),
  weight: integer("weight").notNull().default(1), // Importance weight of this commodity in this circle
  currentPrice: integer("current_price"), // in INR per quintal
  priceChange: real("price_change"), // percentage change
  arrivals: real("arrivals"), // in tons
  tradingVolume: real("trading_volume"), // Monthly trading volume in tons
  quality: text("quality"),
  updatedAt: timestamp("updated_at").defaultNow()
});

// User circle memberships
export const userCircles = pgTable("user_circles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  circleId: integer("circle_id").notNull(),
  isNative: boolean("is_native").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// User commodity interests
export const userCommodities = pgTable("user_commodities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  commodityId: integer("commodity_id").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Connections between users
export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow()
});

// Feed posts
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("update"), // update, price_update, news, circle_update
  circleId: integer("circle_id"),
  commodityId: integer("commodity_id"),
  imageUrl: text("image_url"),
  metadata: jsonb("metadata"), // For price updates, news links, etc.
  createdAt: timestamp("created_at").defaultNow()
});

// Document status enum
export const documentStatusEnum = pgEnum('document_status', ['pending', 'verified', 'rejected', 'resubmit']);

// KYC Verification requests
export const kycRequests = pgTable("kyc_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  idType: text("id_type").notNull(), // aadhar, pan, etc.
  idNumber: text("id_number").notNull(),
  businessName: text("business_name"),
  businessType: text("business_type"),
  registrationNumber: text("registration_number"),
  status: text("status").notNull().default("pending"), // pending, in_review, approved, rejected
  verificationNotes: text("verification_notes"),
  verifiedBy: integer("verified_by"),
  verifiedAt: timestamp("verified_at"),
  documents: text("documents").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// KYC Documents 
export const kycDocuments = pgTable("kyc_documents", {
  id: serial("id").primaryKey(),
  kycRequestId: integer("kyc_request_id").notNull(),
  documentType: text("document_type").notNull(), // id_proof, address_proof, business_registration, etc.
  documentName: text("document_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(), // pdf, jpg, png, etc.
  fileSize: integer("file_size").notNull(), // in bytes
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  status: documentStatusEnum("status").notNull().default('pending'),
  verificationNotes: text("verification_notes"),
  verifiedAt: timestamp("verified_at")
});

// Listing type enum
export const listingTypeEnum = pgEnum('listing_type', ['sell', 'buy']);

// Listing status enum
export const listingStatusEnum = pgEnum('listing_status', ['active', 'completed', 'cancelled', 'expired']);

// Trade status enum
export const tradeStatusEnum = pgEnum('trade_status', ['pending', 'accepted', 'rejected', 'completed', 'cancelled']);

// Marketplace listings
export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  commodityId: integer("commodity_id").notNull(),
  circleId: integer("circle_id").notNull(),
  listingType: listingTypeEnum("listing_type").notNull(), // sell or buy
  quantity: integer("quantity").notNull(), // in quintals
  pricePerUnit: integer("price_per_unit").notNull(), // in INR per quintal
  minQuantity: integer("min_quantity"), // minimum order quantity
  quality: text("quality").notNull(),
  description: text("description"),
  deliveryMethod: text("delivery_method").notNull(), // pickup, delivery, negotiable
  deliveryLocation: text("delivery_location"),
  availableFrom: date("available_from").notNull(),
  availableTo: date("available_to").notNull(),
  images: text("images").array(),
  status: listingStatusEnum("status").notNull().default('active'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Trade offers
export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull(),
  buyerId: integer("buyer_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  quantity: integer("quantity").notNull(),
  pricePerUnit: integer("price_per_unit").notNull(),
  totalAmount: integer("total_amount").notNull(),
  message: text("message"),
  status: tradeStatusEnum("status").notNull().default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Completed trades
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  offerId: integer("offer_id").notNull().unique(),
  listingId: integer("listing_id").notNull(),
  buyerId: integer("buyer_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  commodityId: integer("commodity_id").notNull(),
  quantity: integer("quantity").notNull(),
  pricePerUnit: integer("price_per_unit").notNull(),
  totalAmount: integer("total_amount").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, completed
  deliveryStatus: text("delivery_status").notNull().default("pending"), // pending, in_transit, delivered
  buyerRating: integer("buyer_rating"),
  sellerRating: integer("seller_rating"),
  buyerReview: text("buyer_review"),
  sellerReview: text("seller_review"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCircleSchema = createInsertSchema(circles).omit({ id: true });
export const insertAssetSchema = createInsertSchema(assets).omit({ id: true });
export const insertCommoditySchema = createInsertSchema(commodities).omit({ id: true });
export const insertCircleCommoditySchema = createInsertSchema(circleCommodities).omit({ id: true });
export const insertUserCircleSchema = createInsertSchema(userCircles).omit({ id: true });
export const insertUserCommoditySchema = createInsertSchema(userCommodities).omit({ id: true });
export const insertConnectionSchema = createInsertSchema(connections).omit({ id: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true });
export const insertKycRequestSchema = createInsertSchema(kycRequests).omit({ id: true });
export const insertKycDocumentSchema = createInsertSchema(kycDocuments).omit({ id: true });
export const insertListingSchema = createInsertSchema(listings).omit({ id: true });
export const insertOfferSchema = createInsertSchema(offers).omit({ id: true });
export const insertTradeSchema = createInsertSchema(trades).omit({ id: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCircle = z.infer<typeof insertCircleSchema>;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type InsertCommodity = z.infer<typeof insertCommoditySchema>;
export type InsertCircleCommodity = z.infer<typeof insertCircleCommoditySchema>;
export type InsertUserCircle = z.infer<typeof insertUserCircleSchema>;
export type InsertUserCommodity = z.infer<typeof insertUserCommoditySchema>;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type InsertKycRequest = z.infer<typeof insertKycRequestSchema>;
export type InsertKycDocument = z.infer<typeof insertKycDocumentSchema>;
export type InsertListing = z.infer<typeof insertListingSchema>;
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type InsertTrade = z.infer<typeof insertTradeSchema>;

export type User = typeof users.$inferSelect;
export type Circle = typeof circles.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type Commodity = typeof commodities.$inferSelect;
export type CircleCommodity = typeof circleCommodities.$inferSelect;
export type UserCircle = typeof userCircles.$inferSelect;
export type UserCommodity = typeof userCommodities.$inferSelect;
export type Connection = typeof connections.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type KycRequest = typeof kycRequests.$inferSelect;
export type KycDocument = typeof kycDocuments.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type Trade = typeof trades.$inferSelect;

// Extended Schemas for form validation
export const registerUserSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const userLoginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Document metadata schema
const documentMetadataSchema = z.object({
  fileName: z.string(),
  fileType: z.string(),
  documentType: z.string(),
  size: z.number(),
});

export const kycRequestFormSchema = insertKycRequestSchema.extend({
  idNumberConfirm: z.string(),
  documents: z.array(documentMetadataSchema).optional(),
}).refine(data => data.idNumber === data.idNumberConfirm, {
  message: "ID numbers do not match",
  path: ["idNumberConfirm"],
});

export const kycDocumentSchema = insertKycDocumentSchema.extend({
  documentFile: z.any(),
});

export const listingFormSchema = insertListingSchema.extend({
  availableFrom: z.coerce.date(),
  availableTo: z.coerce.date(),
  listingType: z.enum(['sell', 'buy']),
  status: z.enum(['active', 'completed', 'cancelled', 'expired']).default('active')
}).refine((data: any) => {
  return data.availableFrom <= data.availableTo;
}, {
  message: "Available to date must be after available from date",
  path: ["availableTo"],
});

export const offerFormSchema = insertOfferSchema.extend({
  confirmQuantity: z.number(),
  status: z.enum(['pending', 'accepted', 'rejected', 'completed', 'cancelled']).default('pending')
}).refine(data => data.quantity === data.confirmQuantity, {
  message: "Quantities do not match",
  path: ["confirmQuantity"],
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type KycRequestFormInput = z.infer<typeof kycRequestFormSchema>;
export type KycDocumentInput = z.infer<typeof kycDocumentSchema>;
export type ListingFormInput = z.infer<typeof listingFormSchema>;
export type OfferFormInput = z.infer<typeof offerFormSchema>;
