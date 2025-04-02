import { db } from "./db";
import {
  users, circles, commodities, assets, 
  circleCommodities, userCircles, userCommodities, 
  connections, posts, kycRequests, listings,
  offers, trades, chats, chatMembers, messages,
  messageTemplates, tradeContracts
} from "@shared/schema";

async function main() {
  console.log("Starting database seeding...");

  // Clean existing data
  console.log("Cleaning existing data...");
  // Delete dependent data first (foreign key constraints)
  await db.delete(messages);
  await db.delete(chatMembers);
  await db.delete(chats);
  await db.delete(tradeContracts);
  await db.delete(trades);
  await db.delete(offers);
  await db.delete(listings);
  await db.delete(messageTemplates);
  await db.delete(kycRequests);
  await db.delete(posts);
  await db.delete(connections);
  await db.delete(userCommodities);
  await db.delete(userCircles);
  await db.delete(circleCommodities);
  await db.delete(assets);
  await db.delete(commodities);
  await db.delete(circles);
  await db.delete(users);

  console.log("Creating seed data...");

  // Create commodities
  console.log("Creating commodities...");
  const [wheat] = await db.insert(commodities).values([
  {
    name: "Wheat",
    description: "Premium quality wheat for flour production",
    category: "grain",
    icon: "wheat-awn"
  },
  {
    name: "Basmati Rice",
    description: "Premium long-grain aromatic rice",
    category: "grain",
    icon: "grain"
  },
  {
    name: "Yellow Soybean",
    description: "High protein content soybean for oil extraction",
    category: "oilseed",
    icon: "bean"
  },
  {
    name: "Black Pepper",
    description: "Premium quality black pepper",
    category: "spice", 
    icon: "pepper"
  },
  {
    name: "Cotton",
    description: "Raw cotton for textile industry",
    category: "fiber",
    icon: "cotton"
  }
]).returning();

  const [chana] = await db.insert(commodities).values({
    name: "Chana (Chickpea)",
    description: "Pulse crop used in various Indian dishes",
    category: "pulse",
    icon: "seedling"
  }).returning();

  const [soybean] = await db.insert(commodities).values({
    name: "Soybean",
    description: "Oilseed used for oil extraction and animal feed",
    category: "oilseed",
    icon: "seedling"
  }).returning();

  const [mustard] = await db.insert(commodities).values({
    name: "Mustard Seeds",
    description: "Oilseed used for oil extraction and condiment",
    category: "oilseed",
    icon: "seedling"
  }).returning();

  const [rice] = await db.insert(commodities).values({
    name: "Rice",
    description: "Staple grain consumed across India",
    category: "grain",
    icon: "seedling"
  }).returning();

  // Create circles
  console.log("Creating circles...");
  const [bikaner] = await db.insert(circles).values({
    name: "Bikaner APMC Circle",
    description: "Major trading hub for pulses and grains in Rajasthan",
    latitude: 28.0229,
    longitude: 73.3119,
    radius: 50,
    mainCommodities: ["Chana (Chickpea)", "Wheat"],
    state: "Rajasthan",
    district: "Bikaner",
    isMandi: true
  }).returning();

  const [delhi] = await db.insert(circles).values({
    name: "Delhi Trading Hub",
    description: "Central trading hub connecting various production centers",
    latitude: 28.7041,
    longitude: 77.1025,
    radius: 30,
    mainCommodities: ["Wheat", "Chana (Chickpea)", "Mustard Seeds"],
    state: "Delhi",
    district: "Delhi",
    isMandi: true
  }).returning();

  const [indore] = await db.insert(circles).values({
    name: "Indore Soybean Circle",
    description: "Major trading center for soybean in central India",
    latitude: 22.7196,
    longitude: 75.8577,
    radius: 40,
    mainCommodities: ["Soybean"],
    state: "Madhya Pradesh",
    district: "Indore",
    isMandi: true
  }).returning();

  const [kolkata] = await db.insert(circles).values({
    name: "Kolkata Rice Market",
    description: "Eastern India's primary rice trading market",
    latitude: 22.5726,
    longitude: 88.3639,
    radius: 35,
    mainCommodities: ["Rice"],
    state: "West Bengal",
    district: "Kolkata",
    isMandi: true
  }).returning();

  // Create users
  console.log("Creating users...");
  const [priya] = await db.insert(users).values({
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
  }).returning();

  const [rajesh] = await db.insert(users).values({
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
  }).returning();

  const [sunita] = await db.insert(users).values({
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
  }).returning();

  const [agrinews] = await db.insert(users).values({
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
  }).returning();

  const [vijay] = await db.insert(users).values({
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
  }).returning();

  const [amit] = await db.insert(users).values({
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
  }).returning();

  const [bengalTraders] = await db.insert(users).values({
    username: "bengaltraders",
    password: "password123",
    name: "Bengal Traders Co.",
    email: "contact@bengaltraders.com",
    phone: "9876543216",
    userType: "trader",
    bio: "Specialists in rice trading across Eastern India",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7",
    business: "Bengal Traders Co.",
    kycVerified: true,
    nativeCircleId: kolkata.id
  }).returning();

  // Create circle commodities
  console.log("Creating circle-commodity relationships...");
  await db.insert(circleCommodities).values({
    circleId: bikaner.id,
    commodityId: chana.id,
    weight: 8,
    currentPrice: 5300,
    priceChange: -2.3,
    arrivals: 240,
    quality: "Fair to Good"
  });

  await db.insert(circleCommodities).values({
    circleId: bikaner.id,
    commodityId: wheat.id,
    weight: 7,
    currentPrice: 2100,
    priceChange: 0.5,
    arrivals: 3500,
    quality: "Good"
  });

  await db.insert(circleCommodities).values({
    circleId: delhi.id,
    commodityId: chana.id,
    weight: 6,
    currentPrice: 5250,
    priceChange: -2.3,
    arrivals: 180,
    quality: "Fair to Good"
  });

  await db.insert(circleCommodities).values({
    circleId: indore.id,
    commodityId: soybean.id,
    weight: 9,
    currentPrice: 4800,
    priceChange: 1.8,
    arrivals: 450,
    quality: "Good"
  });

  await db.insert(circleCommodities).values({
    circleId: delhi.id,
    commodityId: mustard.id,
    weight: 5,
    currentPrice: 6200,
    priceChange: -1.2,
    arrivals: 120,
    quality: "Good"
  });

  await db.insert(circleCommodities).values({
    circleId: kolkata.id,
    commodityId: rice.id,
    weight: 9,
    currentPrice: 3200,
    priceChange: 2.5,
    arrivals: 560,
    quality: "Premium"
  });

  // Create user circles
  console.log("Creating user-circle relationships...");
  await db.insert(userCircles).values({
    userId: priya.id,
    circleId: bikaner.id,
    isNative: true
  });

  await db.insert(userCircles).values({
    userId: priya.id,
    circleId: delhi.id,
    isNative: false
  });

  await db.insert(userCircles).values({
    userId: rajesh.id,
    circleId: delhi.id,
    isNative: true
  });

  await db.insert(userCircles).values({
    userId: sunita.id,
    circleId: bikaner.id,
    isNative: true
  });

  await db.insert(userCircles).values({
    userId: amit.id,
    circleId: delhi.id,
    isNative: true
  });

  await db.insert(userCircles).values({
    userId: vijay.id,
    circleId: indore.id,
    isNative: true
  });

  await db.insert(userCircles).values({
    userId: agrinews.id,
    circleId: delhi.id,
    isNative: true
  });

  await db.insert(userCircles).values({
    userId: bengalTraders.id,
    circleId: kolkata.id,
    isNative: true
  });

  // Add some user commodity interests
  console.log("Creating user-commodity interests...");
  await db.insert(userCommodities).values({
    userId: priya.id,
    commodityId: chana.id
  });

  await db.insert(userCommodities).values({
    userId: priya.id,
    commodityId: wheat.id
  });

  await db.insert(userCommodities).values({
    userId: rajesh.id,
    commodityId: mustard.id
  });

  await db.insert(userCommodities).values({
    userId: vijay.id,
    commodityId: soybean.id
  });

  await db.insert(userCommodities).values({
    userId: sunita.id,
    commodityId: chana.id
  });

  await db.insert(userCommodities).values({
    userId: bengalTraders.id,
    commodityId: rice.id
  });

  // Create assets
  console.log("Creating assets...");
  await db.insert(assets).values({
    name: "Singh Trading Warehouse",
    type: "warehouse",
    latitude: 28.0229,
    longitude: 73.3119,
    capacity: "5000 MT",
    details: "Multi-commodity storage facility with cold storage options",
    ownerId: priya.id,
    circleId: bikaner.id
  });

  await db.insert(assets).values({
    name: "Kumar Enterprises Storage",
    type: "warehouse",
    latitude: 28.7041,
    longitude: 77.1025,
    capacity: "7500 MT",
    details: "Modern storage facility with quality testing lab",
    ownerId: rajesh.id,
    circleId: delhi.id
  });

  await db.insert(assets).values({
    name: "Vijay Processing Unit",
    type: "processing",
    latitude: 22.7196,
    longitude: 75.8577,
    capacity: "Processing 200 MT/day",
    details: "Advanced soybean processing unit with oil extraction facility",
    ownerId: vijay.id,
    circleId: indore.id
  });

  await db.insert(assets).values({
    name: "Bengal Rice Mills",
    type: "processing",
    latitude: 22.5726,
    longitude: 88.3639,
    capacity: "Processing 150 MT/day",
    details: "Specialized in premium basmati and non-basmati rice processing",
    ownerId: bengalTraders.id,
    circleId: kolkata.id
  });

  // Create connections
  console.log("Creating connections...");
  await db.insert(connections).values({
    requesterId: priya.id,
    receiverId: rajesh.id,
    status: "accepted"
  });

  await db.insert(connections).values({
    requesterId: priya.id,
    receiverId: sunita.id,
    status: "accepted"
  });

  await db.insert(connections).values({
    requesterId: priya.id,
    receiverId: agrinews.id,
    status: "accepted"
  });

  await db.insert(connections).values({
    requesterId: rajesh.id,
    receiverId: vijay.id,
    status: "accepted"
  });

  await db.insert(connections).values({
    requesterId: sunita.id,
    receiverId: bengalTraders.id,
    status: "pending"
  });

  await db.insert(connections).values({
    requesterId: vijay.id,
    receiverId: amit.id,
    status: "pending"
  });

  // Create posts
  console.log("Creating posts...");
  const now = new Date();

  await db.insert(posts).values({
    userId: rajesh.id,
    content: "Major price update for Chana: Prices have decreased by ₹120/quintal today in Delhi markets due to increased arrivals from Rajasthan. Good quality Chana is now trading at ₹5200-5350/quintal. #ChanaPrices #DelhiMarket",
    type: "price_update",
    circleId: delhi.id,
    commodityId: chana.id,
    createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
    metadata: {
      currentPrice: "₹5,200-5,350/quintal",
      priceChange: "₹120/quintal",
      changeDirection: "down",
      arrivals: "240 tonnes",
      quality: "Fair to Good"
    }
  });

  await db.insert(posts).values({
    userId: agrinews.id,
    content: "Government announces new MSP policy for Kharif crops. The changes will affect pricing for paddy, maize, and soybean starting next season.",
    type: "news",
    createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
    imageUrl: "https://images.unsplash.com/photo-1590682680695-43b964a3ae17",
    metadata: {
      headline: "New MSP Policy to Benefit Farmers Across India",
      summary: "The Cabinet Committee on Economic Affairs has approved new Minimum Support Prices for Kharif crops, with an average increase of 6% across commodities...",
      url: "#"
    }
  });

  await db.insert(posts).values({
    userId: sunita.id,
    content: "Bikaner APMC is experiencing high arrivals of wheat this week. Quality is excellent due to favorable weather conditions last month. Several processors from Delhi are at the mandi looking for bulk purchases. Good opportunity for local farmers! 🌾",
    type: "circle_update",
    circleId: bikaner.id,
    commodityId: wheat.id,
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    metadata: {
      arrivals: "3,500 quintals",
      activeBuyers: "85+",
      topCommodity: "Wheat",
      priceTrend: "Stable to Rising",
      trendDirection: "up"
    }
  });

  await db.insert(posts).values({
    userId: vijay.id,
    content: "Looking for high-quality soybean suppliers in Madhya Pradesh. Our processing unit has expanded capacity and we're now able to process an additional 50 MT/day. Competitive rates offered for consistent quality.",
    type: "general",
    circleId: indore.id,
    commodityId: soybean.id,
    createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000), // 8 hours ago
    metadata: {}
  });

  await db.insert(posts).values({
    userId: bengalTraders.id,
    content: "Rice prices at Kolkata market are trending upward due to increased export demand. Premium quality varieties seeing the highest gains. Current rate range: ₹3,150-3,300 per quintal.",
    type: "price_update",
    circleId: kolkata.id,
    commodityId: rice.id,
    createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
    metadata: {
      currentPrice: "₹3,150-3,300/quintal",
      priceChange: "₹80/quintal",
      changeDirection: "up",
      arrivals: "560 tonnes",
      quality: "Premium"
    }
  });

  // Create KYC requests
  console.log("Creating KYC requests...");
  await db.insert(kycRequests).values({
    userId: amit.id,
    idType: "Aadhar",
    idNumber: "1234-5678-9012",
    status: "approved",
    businessName: "Sharma Trading",
    businessType: "MSME",
    registrationNumber: "MSME-DEL-12345",
    documents: ["id.jpg", "business_registration.pdf"]
  });

  // Create marketplace listings
  console.log("Creating marketplace listings...");

  // Wheat listing by Priya
  const [wheatListing] = await db.insert(listings).values({
    userId: priya.id,
    commodityId: wheat.id,
    circleId: bikaner.id,
    listingType: "sell",
    quantity: 500,
    pricePerUnit: 2150,
    minQuantity: 50,
    quality: "Premium",
    description: "Fresh harvest, cleaned and sorted. Premium quality wheat with high protein content suitable for flour production. Direct from farmers in Bikaner region.",
    deliveryMethod: "Ex-Warehouse",
    availableFrom: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    availableTo: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    images: ["https://images.unsplash.com/photo-1574323347407-f5e1c5a1ec21"],
    status: "active",
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  }).returning();

  // Chana listing by Sunita
  const [chanaListing] = await db.insert(listings).values({
    userId: sunita.id,
    commodityId: chana.id,
    circleId: bikaner.id,
    listingType: "sell",
    quantity: 100,
    pricePerUnit: 5250,
    minQuantity: 10,
    quality: "Good",
    description: "High quality chickpeas cultivated in Bikaner region. Clean, uniform size, and good taste. Suitable for dal production and flour milling.",
    deliveryMethod: "Ex-Warehouse",
    availableFrom: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    availableTo: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    images: ["https://images.unsplash.com/photo-1515543904379-3d757abe3d54"],
    status: "active",
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  }).returning();

  // Buy request for Rice by Rajesh
  const [riceBuyListing] = await db.insert(listings).values({
    userId: rajesh.id,
    commodityId: rice.id,
    circleId: delhi.id,
    listingType: "buy",
    quantity: 200,
    pricePerUnit: 3300,
    minQuantity: 50,
    quality: "Premium",
    description: "Interested in procuring premium quality basmati rice for export. Need consistent quality with proper certification. Ready to offer competitive rates for the right product.",
    deliveryMethod: "Delivered to Delhi Warehouse",
    availableFrom: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    availableTo: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
    status: "active",
    createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
  }).returning();

  // Soybean buy request by Vijay
  const [soybeanBuyListing] = await db.insert(listings).values({
    userId: vijay.id,
    commodityId: soybean.id,
    circleId: indore.id,
    listingType: "buy",
    quantity: 1000,
    pricePerUnit: 4850,
    minQuantity: 100,
    quality: "High Protein",
    description: "Our processing unit requires high protein soybean (min 40% protein content) for oil extraction and meal production. Looking for regular suppliers who can provide consistent quality.",
    deliveryMethod: "Delivered to Indore Processing Unit",
    availableFrom: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    availableTo: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    status: "active",
    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
  }).returning();

  // Create offers for listings
  console.log("Creating offers for marketplace listings...");

  // Offer for wheat from Rajesh
  const [wheatOffer] = await db.insert(offers).values({
    listingId: wheatListing.id,
    buyerId: rajesh.id,
    sellerId: priya.id,
    quantity: 200,
    pricePerUnit: 2125,
    totalAmount: 200 * 2125,
    message: "I'm interested in buying 200 quintals of wheat. Can you confirm the protein content and gluten percentage? Also, can you deliver to Delhi at this price?",
    status: "pending",
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    expiresAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
  }).returning();

  // Offer for Chana from Amit
  const [chanaOffer] = await db.insert(offers).values({
    listingId: chanaListing.id,
    buyerId: amit.id,
    sellerId: sunita.id,
    quantity: 50,
    pricePerUnit: 5200,
    totalAmount: 50 * 5200,
    message: "Looking to procure 50 quintals of chickpeas for our processing unit. Can you share some sample images of the current lot?",
    status: "accepted",
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    expiresAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    acceptedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  }).returning();

  // Offer for rice buy listing from Bengal Traders
  const [riceOffer] = await db.insert(offers).values({
    listingId: riceBuyListing.id,
    buyerId: rajesh.id,
    sellerId: bengalTraders.id,
    quantity: 100,
    pricePerUnit: 3350,
    totalAmount: 100 * 3350,
    message: "We can supply 100 quintals of premium 1121 basmati rice with export quality certification. Would need 7 days for preparation and delivery to Delhi.",
    status: "accepted",
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    expiresAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    acceptedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  }).returning();

  // Create trades
  console.log("Creating trades...");

  // Trade from the accepted Chana offer
  const [chanaTrade] = await db.insert(trades).values({
    offerId: chanaOffer.id,
    listingId: chanaListing.id,
    buyerId: amit.id,
    sellerId: sunita.id,
    commodityId: chana.id,
    quantity: 50,
    pricePerUnit: 5200,
    totalAmount: 50 * 5200,
    status: "pending",
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    paymentStatus: "pending",
    deliveryStatus: "pending"
  }).returning();

  // Trade from the accepted Rice offer
  const [riceTrade] = await db.insert(trades).values({
    offerId: riceOffer.id,
    listingId: riceBuyListing.id,
    buyerId: rajesh.id,
    sellerId: bengalTraders.id,
    commodityId: rice.id,
    quantity: 100,
    pricePerUnit: 3350,
    totalAmount: 100 * 3350,
    status: "completed",
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    completedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    paymentStatus: "completed",
    deliveryStatus: "completed",
    buyerRating: 5,
    sellerRating: 4,
    buyerReview: "Excellent quality rice, exactly as described. Delivery was on time and packaging was secure.",
    sellerReview: "Prompt payment and good communication throughout the transaction. Would do business again."
  }).returning();

  // Create trade contracts
  console.log("Creating trade contracts...");

  // Contract for the Chana trade
  const [chanaContract] = await db.insert(tradeContracts).values({
    tradeId: chanaTrade.id,
    buyerId: amit.id,
    sellerId: sunita.id,
    title: "Purchase Agreement - 50 Quintals Chana",
    commodityId: chana.id,
    quantity: 50,
    unit: "quintals",
    pricePerUnit: 5200,
    totalAmount: 50 * 5200,
    status: "pending",
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    qualitySpecification: "Good quality chickpeas, size 8-10mm, moisture content 9-10%",
    deliveryTerms: "Ex-warehouse Bikaner, to be picked up by buyer within 5 days of contract signing",
    paymentTerms: "50% advance payment upon contract signing, 50% before pickup",
    legalTerms: "As per standard trading terms. Any disputes to be resolved through arbitration in Bikaner jurisdictional courts.",
    additionalTerms: "Quality check to be done at seller's warehouse before loading. Buyer to arrange transportation.",
    buyerSigned: true,
    sellerSigned: false,
    buyerSignedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000) // 12 hours ago
  }).returning();

  // Contract for the completed Rice trade
  await db.insert(tradeContracts).values({
    tradeId: riceTrade.id,
    buyerId: rajesh.id,
    sellerid,
    sellerId: bengalTraders.id,
    title: "Purchase Agreement - 100 Quintals Basmati Rice",
    commodityId: rice.id,
    quantity: 100,
    unit: "quintals",
    pricePerUnit: 3350,
    totalAmount: 100 * 3350,
    status: "completed",
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    completedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    qualitySpecification: "Premium 1121 Basmati Rice, minimum length 8.2mm, moisture content 12-13%, purity 99%",
    deliveryTerms: "Delivered to Kumar Enterprises Warehouse, Delhi. Delivery to be completed within 7 days of contract signing.",
    paymentTerms: "LC payment terms, 20% advance, 80% against delivery after quality verification",
    legalTerms: "As per standard trading terms. Any disputes to be resolved through arbitration in Delhi jurisdictional courts.",
    additionalTerms: "Quality check to be done at buyer's warehouse upon delivery. Certificate of Analysis to be provided by seller.",
    buyerSigned: true,
    sellerSigned: true,
    buyerSignedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 days - 2 hours ago
    sellerSignedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 2 days - 4 hours ago
    contractDocument: "rice_trade_contract.pdf"
  });

  // Create message templates
  console.log("Creating message templates...");

  // Buy request template
  await db.insert(messageTemplates).values({
    userId: rajesh.id,
    name: "Standard Buy Request",
    templateType: "buy_request",
    template: "Hello, I am interested in procuring {{commodity}} with the following specifications:\n\n- Quality: {{quality}}\n- Quantity: {{quantity}} {{unit}}\n- Price Range: {{priceRange}}\n- Delivery Location: {{deliveryLocation}}\n- Payment Terms: {{paymentTerms}}\n\nPlease let me know if you can supply according to these requirements. Looking forward to your response.",
    defaultValues: {
      commodity: "Wheat",
      quality: "Premium",
      quantity: "100",
      unit: "Quintals",
      priceRange: "₹2100-2200 per quintal",
      deliveryLocation: "Delhi Warehouse",
      paymentTerms: "50% advance, 50% on delivery"
    },
    isDefault: false,
    isFavorite: true,
    usageCount: 5,
    lastUsedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
  });

  // Sell offer template
  await db.insert(messageTemplates).values({
    userId: priya.id,
    name: "Wheat Sell Offer",
    templateType: "sell_offer",
    template: "Dear {{buyerName}},\n\nI have the following offer for you:\n\n- Commodity: Wheat ({{variety}})\n- Quantity Available: {{quantity}} {{unit}}\n- Price: {{price}} per {{unit}}\n- Quality: {{quality}}\n- Location: {{location}}\n- Dispatch Possible By: {{dispatchDate}}\n\nPlease let me know if you are interested. We can also arrange for samples if required.\n\nRegards,\nPriya Singh",
    defaultValues: {
      buyerName: "",
      variety: "MP 3016",
      quantity: "500",
      unit: "Quintals",
      price: "₹2150",
      quality: "Premium, Moisture 11-12%",
      location: "Bikaner",
      dispatchDate: "Within 3 days of order confirmation"
    },
    isDefault: false,
    isFavorite: true,
    usageCount: 8,
    lastUsedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000) // 45 days ago
  });

  // Negotiation template
  await db.insert(messageTemplates).values({
    userId: amit.id,
    name: "Standard Counter Offer",
    templateType: "negotiation",
    template: "Thank you for your offer. I would like to propose the following revised terms:\n\n- Quantity: {{quantity}} {{unit}}\n- Price: {{price}} per {{unit}}\n- Delivery Terms: {{deliveryTerms}}\n- Payment: {{paymentTerms}}\n\nPlease let me know if these terms are acceptable or if you would like to discuss further.",
    defaultValues: {
      quantity: "50",
      unit: "Quintals",
      price: "₹5200",
      deliveryTerms: "Ex-warehouse",
      paymentTerms: "50% advance, 50% before pickup"
    },
    isDefault: false,
    isFavorite: true,
    usageCount: 3,
    lastUsedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000) // 20 days ago
  });

  // Create chats and messages
  console.log("Creating chats and messages...");

  // Direct chat between Priya and Rajesh
  const [priyaRajeshChat] = await db.insert(chats).values({
    name: null, // Direct chats don't need a name
    type: "direct",
    creatorId: priya.id,
    isActive: true,
    lastMessageAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
    metadata: {}
  }).returning();

  // Add chat members
  await db.insert(chatMembers).values({
    chatId: priyaRajeshChat.id,
    userId: priya.id,
    role: "member",
    isActive: true
  });

  await db.insert(chatMembers).values({
    chatId: priyaRajeshChat.id,
    userId: rajesh.id,
    role: "member",
    isActive: true
  });

  // Add messages to the Priya-Rajesh chat
  await db.insert(messages).values({
    chatId: priyaRajeshChat.id,
    senderId: priya.id,
    type: "text",
    content: "Hello Rajesh, I saw your interest in wheat. I currently have 500 quintals of premium quality wheat available. Would you be interested?",
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    status: "read",
    metadata: {}
  });

  await db.insert(messages).values({
    chatId: priyaRajeshChat.id,
    senderId: rajesh.id,
    type: "text",
    content: "Hi Priya, yes I'm interested. What's the current rate you're offering and what's the quality like?",
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 1 day - 30 mins ago
    status: "read",
    metadata: {}
  });

  // Template-based sell offer message
  await db.insert(messages).values({
    chatId: priyaRajeshChat.id,
    senderId: priya.id,
    type: "template",
    content: "Dear Rajesh,\n\nI have the following offer for you:\n\n- Commodity: Wheat (MP 3016)\n- Quantity Available: 500 Quintals\n- Price: ₹2150 per Quintal\n- Quality: Premium, Moisture 11-12%\n- Location: Bikaner\n- Dispatch Possible By: Within 3 days of order confirmation\n\nPlease let me know if you are interested. We can also arrange for samples if required.\n\nRegards,\nPriya Singh",
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000), // 1 day - 1 hour ago
    status: "read",
    metadata: {
      templateType: "sell_offer",
      commodity: "Wheat",
      variety: "MP 3016",
      quantity: 500,
      unit: "Quintals",
      price: 2150,
      quality: "Premium, Moisture 11-12%"
    }
  });

  await db.insert(messages).values({
    chatId: priyaRajeshChat.id,
    senderId: rajesh.id,
    type: "text",
    content: "Thanks for the details. Price seems a bit high. Would you consider ₹2100 per quintal? I'm potentially interested in 200 quintals to start with.",
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 1 day - 2 hours ago
    status: "read",
    metadata: {}
  });

  await db.insert(messages).values({
    chatId: priyaRajeshChat.id,
    senderId: priya.id,
    type: "text",
    content: "I can do ₹2125 per quintal for 200 quintals. That's the best I can offer considering the quality.",
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 1 day - 3 hours ago
    status: "read",
    metadata: {}
  });

  await db.insert(messages).values({
    chatId: priyaRajeshChat.id,
    senderId: rajesh.id,
    type: "text",
    content: "That sounds fair. I'll send an official offer through the marketplace for 200 quintals at ₹2125.",
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 1 day - 4 hours ago
    status: "read",
    metadata: {}
  });

  await db.insert(messages).values({
    chatId: priyaRajeshChat.id,
    senderId: rajesh.id,
    type: "trade_request",
    content: "I've sent an offer for your wheat listing. You can view it in the marketplace or directly from this link.",
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000), // 1 day - 5 hours ago
    status: "read",
    metadata: {
      offerId: wheatOffer.id,
      listingId: wheatListing.id,
      quantity: 200,
      pricePerUnit: 2125,
      totalAmount: 200 * 2125
    }
  });

  await db.insert(messages).values({
    chatId: priyaRajeshChat.id,
    senderId: priya.id,
    type: "text",
    content: "I've received your offer. I'll review and get back to you shortly.",
    createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
    status: "read",
    metadata: {}
  });

  // Chat between Sunita and Amit (with contract)
  const [sunitaAmitChat] = await db.insert(chats).values({
    name: null, // Direct chats don't need a name
    type: "direct",
    creatorId: sunita.id,
    isActive: true,
    lastMessageAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
    metadata: {}
  }).returning();

  // Add chat members
  await db.insert(chatMembers).values({
    chatId: sunitaAmitChat.id,
    userId: sunita.id,
    role: "member",
    isActive: true
  });

  await db.insert(chatMembers).values({
    chatId: sunitaAmitChat.id,
    userId: amit.id,
    role: "member",
    isActive: true
  });

  // Add messages to the Sunita-Amit chat
  await db.insert(messages).values({
    chatId: sunitaAmitChat.id,
    senderId: amit.id,
    type: "text",
    content: "Hello Sunita, I'm interested in your chana listing. Can we discuss the details?",
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    status: "read",
    metadata: {}
  });

  // Trade request and contract messages
  await db.insert(messages).values({
    chatId: sunitaAmitChat.id,
    senderId: amit.id,
    type: "trade_request",
    content: "I'd like to place an offer for 50 quintals of chickpeas from your listing at ₹5200 per quintal.",
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 2 days - 6 hours ago
    status: "read",
    metadata: {
      offerId: chanaOffer.id,
      listingId: chanaListing.id,
      quantity: 50,
      pricePerUnit: 5200,
      totalAmount: 50 * 5200
    }
  });

  await db.insert(messages).values({
    chatId: sunitaAmitChat.id,
    senderId: sunita.id,
    type: "text",
    content: "I've accepted your offer. Let's proceed with the contract.",
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 2 days - 8 hours ago
    status: "read",
    metadata: {}
  });

  await db.insert(messages).values({
    chatId: sunitaAmitChat.id,
    senderId: sunita.id,
    type: "contract_proposal",
    content: "I've created a contract for our trade. Please review and sign if the terms are acceptable.",
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 1 day - 2 hours ago
    status: "read",
    metadata: {
      contractId: chanaContract.id,
      tradeId: chanaTrade.id,
      title: "Purchase Agreement - 50 Quintals Chana"
    }
  });

  await db.insert(messages).values({
    chatId: sunitaAmitChat.id,
    senderId: amit.id,
    type: "contract_signed",
    content: "I've reviewed and signed the contract. Please proceed with signing from your end.",
    createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
    status: "read",
    metadata: {
      contractId: chanaContract.id,
      tradeId: chanaTrade.id,
      title: "Purchase Agreement - 50 Quintals Chana"
    }
  });

  await db.insert(messages).values({
    chatId: sunitaAmitChat.id,
    senderId: sunita.id,
    type: "text",
    content: "I'll sign the contract today. Regarding delivery, are you arranging pickup or should I arrange delivery?",
    createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
    status: "read",
    metadata: {}
  });

  // Create a group chat for Bikaner circle
  const [bikanerGroupChat] = await db.insert(chats).values({
    name: "Bikaner APMC Traders",
    type: "group",
    creatorId: sunita.id,
    isActive: true,
    lastMessageAt: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
    metadata: {
      circleId: bikaner.id,
      description: "Group for traders operating in Bikaner APMC to discuss market trends and opportunities",
      icon: "group-chat"
    }
  }).returning();

  // Add members to the group
  await db.insert(chatMembers).values({
    chatId: bikanerGroupChat.id,
    userId: sunita.id,
    role: "admin",
    isActive: true
  });

  await db.insert(chatMembers).values({
    chatId: bikanerGroupChat.id,
    userId: priya.id,
    role: "member",
    isActive: true
  });

  await db.insert(chatMembers).values({
    chatId: bikanerGroupChat.id,
    userId: rajesh.id,
    role: "member",
    isActive: true
  });

  // Add some group messages
  await db.insert(messages).values({
    chatId: bikanerGroupChat.id,
    senderId: sunita.id,
    type: "text",
    content: "Welcome to the Bikaner APMC Traders group! This is a platform for us to discuss market trends, share price information, and collaborate on trading opportunities in our region.",
    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    status: "read",
    metadata: {}
  });

  await db.insert(messages).values({
    chatId: bikanerGroupChat.id,
    senderId: priya.id,
    type: "text",
    content: "Thanks for creating this group, Sunita. The wheat arrivals have increased significantly this week. Quality is excellent this season due to favorable weather conditions.",
    createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    status: "read",
    metadata: {}
  });

  await db.insert(messages).values({
    chatId: bikanerGroupChat.id,
    senderId: rajesh.id,
    type: "text",
    content: "I'm looking for quality wheat suppliers from Bikaner region. If anyone has good quality wheat available, please connect with me directly.",
    createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    status: "read",
    metadata: {}
  });

  await db.insert(messages).values({
    chatId: bikanerGroupChat.id,
    senderId: sunita.id,
    type: "text",
    content: "Latest price update: Chana prices have stabilized after the initial dip. Current range is ₹5250-5350 per quintal at the mandi.",
    createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
    status: "read",
    metadata: {}
  });

  console.log("Seeding completed successfully!");
  process.exit(0);
}

main().catch(e => {
  console.error("Error during seeding:", e);
  process.exit(1);
});