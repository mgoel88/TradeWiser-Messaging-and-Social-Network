import { db } from "./db";
import {
  users, circles, commodities, assets, 
  circleCommodities, userCircles, userCommodities, 
  connections, posts, kycRequests
} from "@shared/schema";

async function main() {
  console.log("Starting database seeding...");
  
  // Clean existing data
  console.log("Cleaning existing data...");
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
  const [wheat] = await db.insert(commodities).values({
    name: "Wheat",
    description: "Staple grain used for making flour",
    category: "grain",
    icon: "wheat-awn"
  }).returning();

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
  
  console.log("Seeding completed successfully!");
  process.exit(0);
}

main().catch(e => {
  console.error("Error during seeding:", e);
  process.exit(1);
});