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

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private circles: Map<number, Circle>;
  private assets: Map<number, Asset>;
  private commodities: Map<number, Commodity>;
  private circleCommodities: Map<number, CircleCommodity>;
  private userCircles: Map<number, UserCircle>;
  private userCommodities: Map<number, UserCommodity>;
  private connections: Map<number, Connection>;
  private posts: Map<number, Post>;
  private kycRequests: Map<number, KycRequest>;

  private userId: number;
  private circleId: number;
  private assetId: number;
  private commodityId: number;
  private circleCommodityId: number;
  private userCircleId: number;
  private userCommodityId: number;
  private connectionId: number;
  private postId: number;
  private kycRequestId: number;

  constructor() {
    this.users = new Map();
    this.circles = new Map();
    this.assets = new Map();
    this.commodities = new Map();
    this.circleCommodities = new Map();
    this.userCircles = new Map();
    this.userCommodities = new Map();
    this.connections = new Map();
    this.posts = new Map();
    this.kycRequests = new Map();

    this.userId = 1;
    this.circleId = 1;
    this.assetId = 1;
    this.commodityId = 1;
    this.circleCommodityId = 1;
    this.userCircleId = 1;
    this.userCommodityId = 1;
    this.connectionId = 1;
    this.postId = 1;
    this.kycRequestId = 1;

    // Initialize with sample data
    this.initializeData();
  }

  // Initialize with sample data for testing
  private initializeData() {
    // Create commodities
    const wheat = this.createCommodity({
      name: "Wheat",
      description: "Staple grain used for making flour",
      category: "grain",
      icon: "wheat-awn"
    });

    const chana = this.createCommodity({
      name: "Chana (Chickpea)",
      description: "Pulse crop used in various Indian dishes",
      category: "pulse",
      icon: "seedling"
    });

    const soybean = this.createCommodity({
      name: "Soybean",
      description: "Oilseed used for oil extraction and animal feed",
      category: "oilseed",
      icon: "seedling"
    });

    const mustard = this.createCommodity({
      name: "Mustard Seeds",
      description: "Oilseed used for oil extraction and condiment",
      category: "oilseed",
      icon: "seedling"
    });

    // Create circles
    const bikaner = this.createCircle({
      name: "Bikaner APMC Circle",
      description: "Major trading hub for pulses and grains in Rajasthan",
      latitude: 28.0229,
      longitude: 73.3119,
      radius: 50,
      mainCommodities: ["Chana (Chickpea)", "Wheat"],
      state: "Rajasthan",
      district: "Bikaner",
      isMandi: true
    });

    const delhi = this.createCircle({
      name: "Delhi Trading Hub",
      description: "Central trading hub connecting various production centers",
      latitude: 28.7041,
      longitude: 77.1025,
      radius: 30,
      mainCommodities: ["Wheat", "Chana (Chickpea)", "Mustard Seeds"],
      state: "Delhi",
      district: "Delhi",
      isMandi: true
    });

    const indore = this.createCircle({
      name: "Indore Soybean Circle",
      description: "Major trading center for soybean in central India",
      latitude: 22.7196,
      longitude: 75.8577,
      radius: 40,
      mainCommodities: ["Soybean"],
      state: "Madhya Pradesh",
      district: "Indore",
      isMandi: true
    });

    // Create circle commodities
    this.createCircleCommodity({
      circleId: bikaner.id,
      commodityId: chana.id,
      weight: 8,
      currentPrice: 5300,
      priceChange: -2.3,
      arrivals: 240,
      quality: "Fair to Good"
    });

    this.createCircleCommodity({
      circleId: bikaner.id,
      commodityId: wheat.id,
      weight: 7,
      currentPrice: 2100,
      priceChange: 0.5,
      arrivals: 3500,
      quality: "Good"
    });

    this.createCircleCommodity({
      circleId: delhi.id,
      commodityId: chana.id,
      weight: 6,
      currentPrice: 5250,
      priceChange: -2.3,
      arrivals: 180,
      quality: "Fair to Good"
    });

    this.createCircleCommodity({
      circleId: indore.id,
      commodityId: soybean.id,
      weight: 9,
      currentPrice: 4800,
      priceChange: 1.8,
      arrivals: 450,
      quality: "Good"
    });

    this.createCircleCommodity({
      circleId: delhi.id,
      commodityId: mustard.id,
      weight: 5,
      currentPrice: 6200,
      priceChange: -1.2,
      arrivals: 120,
      quality: "Good"
    });

    // Create users
    const priya = this.createUser({
      username: "priyasingh",
      password: "password123",
      name: "Priya Singh",
      email: "priya@example.com",
      phone: "9876543210",
      userType: "broker",
      bio: "Experienced commodity broker specializing in pulses and grains.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
      business: "Singh Trading Co.",
      kycVerified: true,
      nativeCircleId: bikaner.id
    });

    const rajesh = this.createUser({
      username: "rajeshkumar",
      password: "password123",
      name: "Rajesh Kumar",
      email: "rajesh@example.com",
      phone: "9876543211",
      userType: "trader",
      bio: "Delhi-based commodity trader with 15 years of experience.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
      business: "Kumar Enterprises",
      kycVerified: true,
      nativeCircleId: delhi.id
    });

    const sunita = this.createUser({
      username: "sunitadevi",
      password: "password123",
      name: "Sunita Devi",
      email: "sunita@example.com",
      phone: "9876543212",
      userType: "broker",
      bio: "Agricultural broker connecting farmers to buyers.",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
      business: "Kisan Connect Brokers",
      kycVerified: true,
      nativeCircleId: bikaner.id
    });

    const agrinews = this.createUser({
      username: "agrinews",
      password: "password123",
      name: "Agri News Network",
      email: "info@agrinews.com",
      phone: "9876543213",
      userType: "business",
      bio: "Agricultural news network covering market trends and policies.",
      avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5",
      business: "Agri News Network Pvt. Ltd.",
      kycVerified: true,
      nativeCircleId: delhi.id
    });

    const vijay = this.createUser({
      username: "vijayprocessors",
      password: "password123",
      name: "Vijay Processors Ltd.",
      email: "info@vijayprocessors.com",
      phone: "9876543214",
      userType: "processor",
      bio: "Leading processor of agricultural commodities in central India.",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a",
      business: "Vijay Processors Ltd.",
      kycVerified: true,
      nativeCircleId: indore.id
    });

    const amit = this.createUser({
      username: "amitsharma",
      password: "password123",
      name: "Amit Sharma",
      email: "amit@example.com",
      phone: "9876543215",
      userType: "trader",
      bio: "Trader specializing in pulses and grains.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
      business: "Sharma Trading",
      kycVerified: true,
      nativeCircleId: delhi.id
    });

    // Create user circles
    this.createUserCircle({
      userId: priya.id,
      circleId: bikaner.id,
      isNative: true
    });

    this.createUserCircle({
      userId: priya.id,
      circleId: delhi.id,
      isNative: false
    });

    this.createUserCircle({
      userId: rajesh.id,
      circleId: delhi.id,
      isNative: true
    });

    this.createUserCircle({
      userId: sunita.id,
      circleId: bikaner.id,
      isNative: true
    });

    // Create posts
    this.createPost({
      userId: rajesh.id,
      content: "Major price update for Chana: Prices have decreased by ₹120/quintal today in Delhi markets due to increased arrivals from Rajasthan. Good quality Chana is now trading at ₹5200-5350/quintal. #ChanaPrices #DelhiMarket",
      type: "price_update",
      circleId: delhi.id,
      commodityId: chana.id,
      metadata: {
        currentPrice: "₹5,200-5,350/quintal",
        priceChange: "₹120/quintal",
        changeDirection: "down",
        arrivals: "240 tonnes",
        quality: "Fair to Good"
      }
    });

    this.createPost({
      userId: agrinews.id,
      content: "Government announces new MSP policy for Kharif crops. The changes will affect pricing for paddy, maize, and soybean starting next season.",
      type: "news",
      imageUrl: "https://images.unsplash.com/photo-1590682680695-43b964a3ae17",
      metadata: {
        headline: "New MSP Policy to Benefit Farmers Across India",
        summary: "The Cabinet Committee on Economic Affairs has approved new Minimum Support Prices for Kharif crops, with an average increase of 6% across commodities...",
        url: "#"
      }
    });

    this.createPost({
      userId: sunita.id,
      content: "Bikaner APMC is experiencing high arrivals of wheat this week. Quality is excellent due to favorable weather conditions last month. Several processors from Delhi are at the mandi looking for bulk purchases. Good opportunity for local farmers! 🌾",
      type: "circle_update",
      circleId: bikaner.id,
      commodityId: wheat.id,
      metadata: {
        arrivals: "3,500 quintals",
        activeBuyers: "85+",
        topCommodity: "Wheat",
        priceTrend: "Stable to Rising",
        trendDirection: "up"
      }
    });

    // Create connections
    this.createConnection({
      requesterId: priya.id,
      receiverId: rajesh.id,
      status: "accepted"
    });

    this.createConnection({
      requesterId: priya.id,
      receiverId: sunita.id,
      status: "accepted"
    });

    this.createConnection({
      requesterId: priya.id,
      receiverId: agrinews.id,
      status: "accepted"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Circle methods
  async getCircle(id: number): Promise<Circle | undefined> {
    return this.circles.get(id);
  }

  async createCircle(insertCircle: InsertCircle): Promise<Circle> {
    const id = this.circleId++;
    const circle: Circle = { ...insertCircle, id };
    this.circles.set(id, circle);
    return circle;
  }

  async updateCircle(id: number, circle: Partial<Circle>): Promise<Circle | undefined> {
    const existingCircle = this.circles.get(id);
    if (!existingCircle) return undefined;
    
    const updatedCircle = { ...existingCircle, ...circle };
    this.circles.set(id, updatedCircle);
    return updatedCircle;
  }

  async listCircles(): Promise<Circle[]> {
    return Array.from(this.circles.values());
  }

  async getCirclesByState(state: string): Promise<Circle[]> {
    return Array.from(this.circles.values()).filter(
      (circle) => circle.state === state
    );
  }

  async getCirclesByDistrict(district: string): Promise<Circle[]> {
    return Array.from(this.circles.values()).filter(
      (circle) => circle.district === district
    );
  }

  async getNearbyCircles(lat: number, lng: number, radiusKm: number): Promise<Circle[]> {
    // Simple calculation for demo purposes
    return Array.from(this.circles.values()).filter((circle) => {
      const distance = Math.sqrt(
        Math.pow(circle.latitude - lat, 2) + Math.pow(circle.longitude - lng, 2)
      ) * 111; // Rough conversion to km
      return distance <= radiusKm;
    });
  }

  // Asset methods
  async getAsset(id: number): Promise<Asset | undefined> {
    return this.assets.get(id);
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const id = this.assetId++;
    const asset: Asset = { ...insertAsset, id };
    this.assets.set(id, asset);
    return asset;
  }

  async updateAsset(id: number, asset: Partial<Asset>): Promise<Asset | undefined> {
    const existingAsset = this.assets.get(id);
    if (!existingAsset) return undefined;
    
    const updatedAsset = { ...existingAsset, ...asset };
    this.assets.set(id, updatedAsset);
    return updatedAsset;
  }

  async listAssets(): Promise<Asset[]> {
    return Array.from(this.assets.values());
  }

  async getAssetsByCircle(circleId: number): Promise<Asset[]> {
    return Array.from(this.assets.values()).filter(
      (asset) => asset.circleId === circleId
    );
  }

  async getAssetsByOwner(ownerId: number): Promise<Asset[]> {
    return Array.from(this.assets.values()).filter(
      (asset) => asset.ownerId === ownerId
    );
  }

  // Commodity methods
  async getCommodity(id: number): Promise<Commodity | undefined> {
    return this.commodities.get(id);
  }

  async getCommodityByName(name: string): Promise<Commodity | undefined> {
    return Array.from(this.commodities.values()).find(
      (commodity) => commodity.name === name
    );
  }

  async createCommodity(insertCommodity: InsertCommodity): Promise<Commodity> {
    const id = this.commodityId++;
    const commodity: Commodity = { ...insertCommodity, id };
    this.commodities.set(id, commodity);
    return commodity;
  }

  async updateCommodity(id: number, commodity: Partial<Commodity>): Promise<Commodity | undefined> {
    const existingCommodity = this.commodities.get(id);
    if (!existingCommodity) return undefined;
    
    const updatedCommodity = { ...existingCommodity, ...commodity };
    this.commodities.set(id, updatedCommodity);
    return updatedCommodity;
  }

  async listCommodities(): Promise<Commodity[]> {
    return Array.from(this.commodities.values());
  }

  // Circle-Commodity methods
  async getCircleCommodity(id: number): Promise<CircleCommodity | undefined> {
    return this.circleCommodities.get(id);
  }

  async getCircleCommodityByIds(circleId: number, commodityId: number): Promise<CircleCommodity | undefined> {
    return Array.from(this.circleCommodities.values()).find(
      (cc) => cc.circleId === circleId && cc.commodityId === commodityId
    );
  }

  async createCircleCommodity(insertCircleCommodity: InsertCircleCommodity): Promise<CircleCommodity> {
    const id = this.circleCommodityId++;
    const circleCommodity: CircleCommodity = { ...insertCircleCommodity, id };
    this.circleCommodities.set(id, circleCommodity);
    return circleCommodity;
  }

  async updateCircleCommodity(id: number, circleCommodity: Partial<CircleCommodity>): Promise<CircleCommodity | undefined> {
    const existingCircleCommodity = this.circleCommodities.get(id);
    if (!existingCircleCommodity) return undefined;
    
    const updatedCircleCommodity = { ...existingCircleCommodity, ...circleCommodity };
    this.circleCommodities.set(id, updatedCircleCommodity);
    return updatedCircleCommodity;
  }

  async listCircleCommodities(): Promise<CircleCommodity[]> {
    return Array.from(this.circleCommodities.values());
  }

  async getCommoditiesByCircle(circleId: number): Promise<CircleCommodity[]> {
    return Array.from(this.circleCommodities.values()).filter(
      (cc) => cc.circleId === circleId
    );
  }

  async getCirclesByCommodity(commodityId: number): Promise<CircleCommodity[]> {
    return Array.from(this.circleCommodities.values()).filter(
      (cc) => cc.commodityId === commodityId
    );
  }

  async getTrendingCommodities(limit: number): Promise<CircleCommodity[]> {
    return Array.from(this.circleCommodities.values())
      .sort((a, b) => Math.abs(b.priceChange || 0) - Math.abs(a.priceChange || 0))
      .slice(0, limit);
  }

  // User-Circle methods
  async getUserCircle(id: number): Promise<UserCircle | undefined> {
    return this.userCircles.get(id);
  }

  async createUserCircle(insertUserCircle: InsertUserCircle): Promise<UserCircle> {
    const id = this.userCircleId++;
    const userCircle: UserCircle = { ...insertUserCircle, id };
    this.userCircles.set(id, userCircle);
    return userCircle;
  }

  async deleteUserCircle(userId: number, circleId: number): Promise<boolean> {
    const userCircleToDelete = Array.from(this.userCircles.values()).find(
      (uc) => uc.userId === userId && uc.circleId === circleId
    );
    if (!userCircleToDelete) return false;
    
    return this.userCircles.delete(userCircleToDelete.id);
  }

  async listUserCircles(userId: number): Promise<UserCircle[]> {
    return Array.from(this.userCircles.values()).filter(
      (uc) => uc.userId === userId
    );
  }

  async getUsersByCircle(circleId: number): Promise<UserCircle[]> {
    return Array.from(this.userCircles.values()).filter(
      (uc) => uc.circleId === circleId
    );
  }

  // User-Commodity methods
  async getUserCommodity(id: number): Promise<UserCommodity | undefined> {
    return this.userCommodities.get(id);
  }

  async createUserCommodity(insertUserCommodity: InsertUserCommodity): Promise<UserCommodity> {
    const id = this.userCommodityId++;
    const userCommodity: UserCommodity = { ...insertUserCommodity, id };
    this.userCommodities.set(id, userCommodity);
    return userCommodity;
  }

  async deleteUserCommodity(userId: number, commodityId: number): Promise<boolean> {
    const userCommodityToDelete = Array.from(this.userCommodities.values()).find(
      (uc) => uc.userId === userId && uc.commodityId === commodityId
    );
    if (!userCommodityToDelete) return false;
    
    return this.userCommodities.delete(userCommodityToDelete.id);
  }

  async listUserCommodities(userId: number): Promise<UserCommodity[]> {
    return Array.from(this.userCommodities.values()).filter(
      (uc) => uc.userId === userId
    );
  }

  async getUsersByCommodity(commodityId: number): Promise<UserCommodity[]> {
    return Array.from(this.userCommodities.values()).filter(
      (uc) => uc.commodityId === commodityId
    );
  }

  // Connection methods
  async getConnection(id: number): Promise<Connection | undefined> {
    return this.connections.get(id);
  }

  async createConnection(insertConnection: InsertConnection): Promise<Connection> {
    const id = this.connectionId++;
    const connection: Connection = { ...insertConnection, id };
    this.connections.set(id, connection);
    return connection;
  }

  async updateConnectionStatus(id: number, status: string): Promise<Connection | undefined> {
    const existingConnection = this.connections.get(id);
    if (!existingConnection) return undefined;
    
    const updatedConnection = { ...existingConnection, status };
    this.connections.set(id, updatedConnection);
    return updatedConnection;
  }

  async getUserConnections(userId: number): Promise<Connection[]> {
    return Array.from(this.connections.values()).filter(
      (connection) => 
        (connection.requesterId === userId || connection.receiverId === userId) &&
        connection.status === "accepted"
    );
  }

  async getPendingConnections(userId: number): Promise<Connection[]> {
    return Array.from(this.connections.values()).filter(
      (connection) => 
        connection.receiverId === userId && 
        connection.status === "pending"
    );
  }

  async getConnectionStatus(requesterId: number, receiverId: number): Promise<Connection | undefined> {
    return Array.from(this.connections.values()).find(
      (connection) => 
        (connection.requesterId === requesterId && connection.receiverId === receiverId) ||
        (connection.requesterId === receiverId && connection.receiverId === requesterId)
    );
  }

  // Post methods
  async getPost(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = this.postId++;
    const post: Post = { ...insertPost, id };
    this.posts.set(id, post);
    return post;
  }

  async updatePost(id: number, post: Partial<Post>): Promise<Post | undefined> {
    const existingPost = this.posts.get(id);
    if (!existingPost) return undefined;
    
    const updatedPost = { ...existingPost, ...post };
    this.posts.set(id, updatedPost);
    return updatedPost;
  }

  async deletePost(id: number): Promise<boolean> {
    return this.posts.delete(id);
  }

  async listPosts(limit: number, offset: number): Promise<Post[]> {
    return Array.from(this.posts.values())
      .sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime())
      .slice(offset, offset + limit);
  }

  async getUserPosts(userId: number): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter((post) => post.userId === userId)
      .sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
  }

  async getCirclePosts(circleId: number): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter((post) => post.circleId === circleId)
      .sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
  }

  async getCommodityPosts(commodityId: number): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter((post) => post.commodityId === commodityId)
      .sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
  }

  // KYC methods
  async getKycRequest(id: number): Promise<KycRequest | undefined> {
    return this.kycRequests.get(id);
  }

  async getKycRequestByUser(userId: number): Promise<KycRequest | undefined> {
    return Array.from(this.kycRequests.values()).find(
      (request) => request.userId === userId
    );
  }

  async createKycRequest(insertKycRequest: InsertKycRequest): Promise<KycRequest> {
    const id = this.kycRequestId++;
    const kycRequest: KycRequest = { ...insertKycRequest, id };
    this.kycRequests.set(id, kycRequest);
    return kycRequest;
  }

  async updateKycRequestStatus(id: number, status: string): Promise<KycRequest | undefined> {
    const existingKycRequest = this.kycRequests.get(id);
    if (!existingKycRequest) return undefined;
    
    const updatedKycRequest = { ...existingKycRequest, status };
    this.kycRequests.set(id, updatedKycRequest);

    // If approved, update user's KYC status
    if (status === "approved") {
      const user = this.users.get(existingKycRequest.userId);
      if (user) {
        this.updateUser(user.id, { kycVerified: true });
      }
    }
    
    return updatedKycRequest;
  }

  async listKycRequests(): Promise<KycRequest[]> {
    return Array.from(this.kycRequests.values());
  }

  async getPendingKycRequests(): Promise<KycRequest[]> {
    return Array.from(this.kycRequests.values()).filter(
      (request) => request.status === "pending"
    );
  }
}

export const storage = new MemStorage();
