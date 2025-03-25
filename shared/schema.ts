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

// Contract status enum
export const contractStatusEnum = pgEnum('contract_status', ['draft', 'pending', 'signed', 'active', 'completed', 'cancelled', 'disputed']);

// Trade contract schema for smart contracts generated from conversations
export const tradeContracts = pgTable("trade_contracts", {
  id: serial("id").primaryKey(),
  contractNumber: text("contract_number").notNull().unique(), // Unique identifier for the contract
  name: text("name").notNull(), // Contract name
  buyerId: integer("buyer_id").notNull(), // Buyer user ID
  sellerId: integer("seller_id").notNull(), // Seller user ID
  chatId: integer("chat_id").notNull(), // Reference to the chat where this contract was created
  messageId: integer("message_id"), // Optional reference to specific message that initiated the contract
  tradeId: integer("trade_id"), // Optional reference to a trade if one exists
  commodityId: integer("commodity_id").notNull(), // Commodity being traded
  commodityName: text("commodity_name").notNull(), // Name of commodity for quick reference
  quantity: integer("quantity").notNull(), // Quantity of the commodity
  unit: text("unit").notNull().default("kg"), // Unit of measurement (kg, ton, etc)
  pricePerUnit: integer("price_per_unit").notNull(), // Price per unit
  totalAmount: integer("total_amount").notNull(), // Total contract value
  quality: text("quality").notNull(), // Quality specifications
  qualityParams: jsonb("quality_params"), // Detailed quality parameters as JSON
  deliveryTerms: text("delivery_terms").notNull(), // Delivery terms
  deliveryLocation: text("delivery_location").notNull(), // Delivery location
  deliveryDate: date("delivery_date"), // Expected delivery date
  paymentTerms: text("payment_terms").notNull(), // Payment terms
  additionalTerms: text("additional_terms"), // Any additional terms
  buyerSignature: boolean("buyer_signature").default(false), // Buyer has signed
  sellerSignature: boolean("seller_signature").default(false), // Seller has signed
  status: contractStatusEnum("status").notNull().default('draft'), // Contract status
  contractPdf: text("contract_pdf"), // URL to the generated PDF
  sharedLink: text("shared_link"), // Shareable contract link
  whatsappShared: boolean("whatsapp_shared").default(false), // Flag if shared on WhatsApp
  createdBy: integer("created_by").notNull(), // User who created the contract
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Message type enum
export const messageTypeEnum = pgEnum('message_type', ['text', 'image', 'audio', 'document', 'location', 'contact', 'system', 'template', 'trade_request', 'buy_request', 'sell_offer', 'contract_proposal', 'contract_signed', 'contract_update']);

// Chat type enum
export const chatTypeEnum = pgEnum('chat_type', ['direct', 'group', 'broadcast']);

// Chats (conversations, groups, broadcasts) table
export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  type: chatTypeEnum("type").notNull(), // direct, group, broadcast
  name: text("name"), // Only used for groups and broadcasts
  description: text("description"),
  creatorId: integer("creator_id").notNull(), // User who created the group/broadcast
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"), // For any additional data like group settings
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Chat members junction table
export const chatMembers = pgTable("chat_members", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").default("member"), // admin, member
  isActive: boolean("is_active").default(true),
  joinedAt: timestamp("joined_at").defaultNow(),
  lastReadMessageId: integer("last_read_message_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Trade template type enum
export const templateTypeEnum = pgEnum('template_type', ['buy_request', 'sell_offer', 'negotiation', 'custom']);

// Message templates table
export const messageTemplates = pgTable("message_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  templateType: templateTypeEnum("template_type").notNull(),
  template: text("template").notNull(),
  defaultValues: jsonb("default_values"),
  isDefault: boolean("is_default").default(false),
  isFavorite: boolean("is_favorite").default(false),
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull(),
  senderId: integer("sender_id").notNull(),
  type: messageTypeEnum("type").notNull().default('text'),
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // For extra data like image dimensions, document size, etc.
  templateId: integer("template_id"), // Reference to message template if this is a template-based message
  commodityId: integer("commodity_id"), // For trade-related messages
  listingId: integer("listing_id"), // For messages related to listings
  offerId: integer("offer_id"), // For messages related to offers
  contractId: integer("contract_id"), // For messages related to trade contracts
  replyToId: integer("reply_to_id"),
  isEdited: boolean("is_edited").default(false),
  isDeleted: boolean("is_deleted").default(false),
  deliveredAt: timestamp("delivered_at"),
  readBy: integer("read_by").array(),
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
export const insertTradeContractSchema = createInsertSchema(tradeContracts).omit({ id: true });
export const insertChatSchema = createInsertSchema(chats).omit({ id: true });
export const insertChatMemberSchema = createInsertSchema(chatMembers).omit({ id: true });
export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({ id: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true });

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
export type InsertTradeContract = z.infer<typeof insertTradeContractSchema>;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type InsertChatMember = z.infer<typeof insertChatMemberSchema>;
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

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
export type TradeContract = typeof tradeContracts.$inferSelect;
export type Chat = typeof chats.$inferSelect;
export type ChatMember = typeof chatMembers.$inferSelect;
export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type Message = typeof messages.$inferSelect;

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

// Chat and message form schemas
export const messageFormSchema = insertMessageSchema.extend({
  chatId: z.number(),
  content: z.string().min(1, "Message cannot be empty"),
  type: z.enum(['text', 'image', 'audio', 'document', 'location', 'contact', 'system', 'template', 'trade_request', 'buy_request', 'sell_offer', 'contract_proposal', 'contract_signed', 'contract_update']).default('text'),
  templateId: z.number().optional(),
  commodityId: z.number().optional(),
  listingId: z.number().optional(),
  offerId: z.number().optional(),
  contractId: z.number().optional(),
});

// Template message schemas
export const messageTemplateSchema = insertMessageTemplateSchema.extend({
  name: z.string().min(3, "Template name must be at least 3 characters"),
  templateType: z.enum(['buy_request', 'sell_offer', 'negotiation', 'custom']),
  template: z.string().min(10, "Template content must be at least 10 characters"),
});

// Buy request template schema
export const buyRequestTemplateSchema = messageTemplateSchema.extend({
  templateType: z.literal('buy_request'),
  defaultValues: z.object({
    commodityName: z.string().optional(),
    commodityId: z.number().optional(),
    quantity: z.number().optional(),
    unit: z.string().optional(),
    pricePerUnit: z.number().optional(),
    quality: z.string().optional(),
    deliveryTerms: z.string().optional(),
    paymentTerms: z.string().optional(),
    location: z.string().optional(),
    validityPeriod: z.string().optional(),
    additionalRequirements: z.string().optional(),
  }).optional(),
});

// Sell offer template schema
export const sellOfferTemplateSchema = messageTemplateSchema.extend({
  templateType: z.literal('sell_offer'),
  defaultValues: z.object({
    commodityName: z.string().optional(),
    commodityId: z.number().optional(),
    quantity: z.number().optional(),
    unit: z.string().optional(),
    pricePerUnit: z.number().optional(),
    quality: z.string().optional(),
    qualitySpecs: z.record(z.string(), z.string()).optional(),
    deliveryTerms: z.string().optional(),
    paymentTerms: z.string().optional(),
    discounts: z.record(z.string(), z.string()).optional(),
    location: z.string().optional(),
    availableFrom: z.string().optional(),
    availableTo: z.string().optional(),
    samplesAvailable: z.boolean().optional(),
    certification: z.string().optional(),
  }).optional(),
});

// Negotiation template schema
export const negotiationTemplateSchema = messageTemplateSchema.extend({
  templateType: z.literal('negotiation'),
  defaultValues: z.object({
    counterOffer: z.number().optional(),
    proposedQuantity: z.number().optional(),
    proposedDeliveryDate: z.string().optional(),
    proposedPaymentTerms: z.string().optional(),
    additionalTerms: z.string().optional(),
  }).optional(),
});

export const chatGroupFormSchema = insertChatSchema.extend({
  name: z.string().min(3, "Group name must be at least 3 characters"),
  description: z.string().optional(),
  memberIds: z.array(z.number()).min(1, "Group must have at least one member"),
  type: z.literal('group'),
});

export const chatBroadcastFormSchema = insertChatSchema.extend({
  name: z.string().min(3, "Broadcast list name must be at least 3 characters"),
  description: z.string().optional(),
  recipientIds: z.array(z.number()).min(1, "Broadcast list must have at least one recipient"),
  type: z.literal('broadcast'),
});

// Template message form
export const templatedMessageFormSchema = z.object({
  chatId: z.number(),
  templateId: z.number(),
  templateType: z.enum(['buy_request', 'sell_offer', 'negotiation', 'custom']),
  values: z.record(z.string(), z.any()),
  commodityId: z.number().optional(),
  listingId: z.number().optional(),
  offerId: z.number().optional(),
  contractId: z.number().optional(),
});

// Trade contract form schema
export const tradeContractFormSchema = insertTradeContractSchema.extend({
  contractNumber: z.string().default(() => `CONTRACT-${Date.now()}`),
  name: z.string().min(3, "Contract name must be at least 3 characters"),
  buyerId: z.number(),
  sellerId: z.number(),
  chatId: z.number(),
  messageId: z.number().optional(),
  commodityId: z.number(),
  commodityName: z.string(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unit: z.string().default("kg"),
  pricePerUnit: z.number().min(1, "Price per unit must be at least 1"),
  totalAmount: z.number().min(1, "Total amount must be at least 1"),
  quality: z.string(),
  qualityParams: z.record(z.string(), z.any()).optional(),
  deliveryTerms: z.string(),
  deliveryLocation: z.string(),
  deliveryDate: z.coerce.date().optional(),
  paymentTerms: z.string(),
  additionalTerms: z.string().optional(),
  status: z.enum(['draft', 'pending', 'signed', 'active', 'completed', 'cancelled', 'disputed']).default('draft'),
  createdBy: z.number(),
});

// WhatsApp sharing schema for trade contracts
export const whatsappShareSchema = z.object({
  contractId: z.number(),
  phoneNumbers: z.array(z.string()),
  message: z.string().optional(),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type KycRequestFormInput = z.infer<typeof kycRequestFormSchema>;
export type KycDocumentInput = z.infer<typeof kycDocumentSchema>;
export type ListingFormInput = z.infer<typeof listingFormSchema>;
export type OfferFormInput = z.infer<typeof offerFormSchema>;
export type MessageFormInput = z.infer<typeof messageFormSchema>;
export type MessageTemplateInput = z.infer<typeof messageTemplateSchema>;
export type BuyRequestTemplateInput = z.infer<typeof buyRequestTemplateSchema>;
export type SellOfferTemplateInput = z.infer<typeof sellOfferTemplateSchema>;
export type NegotiationTemplateInput = z.infer<typeof negotiationTemplateSchema>;
export type TemplatedMessageInput = z.infer<typeof templatedMessageFormSchema>;
export type TradeContractFormInput = z.infer<typeof tradeContractFormSchema>;
export type WhatsappShareInput = z.infer<typeof whatsappShareSchema>;
export type ChatGroupFormInput = z.infer<typeof chatGroupFormSchema>;
export type ChatBroadcastFormInput = z.infer<typeof chatBroadcastFormSchema>;
