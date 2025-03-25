import { storage } from './storage';
import { User, Circle, UserCircle, UserCommodity, Trade, Connection } from '@shared/schema';
import { log } from './vite';

// Constants for recommendation weights
const WEIGHT = {
  COMMODITY_INTEREST: 3,
  GEOGRAPHIC_PROXIMITY: 2.5,
  COMPLEMENTARY_BUSINESS: 4,
  TRADING_HISTORY: 2,
  CIRCLE_OVERLAP: 1.5
};

// Maximum distance for proximity recommendations (in km)
const MAX_PROXIMITY_DISTANCE = 200;

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Score based on commodity interest similarity
async function scoreCommodityInterest(userId: number, otherUserId: number): Promise<number> {
  try {
    // Get user commodities
    const userCommodities = await storage.listUserCommodities(userId);
    const otherUserCommodities = await storage.listUserCommodities(otherUserId);
    
    if (!userCommodities.length || !otherUserCommodities.length) {
      return 0;
    }
    
    // Get the commodity IDs for both users
    const userCommodityIds = userCommodities.map(uc => uc.commodityId);
    const otherUserCommodityIds = otherUserCommodities.map(uc => uc.commodityId);
    
    // Calculate intersection (common commodities)
    const commonCommodities = userCommodityIds.filter(id => otherUserCommodityIds.includes(id));
    
    // Calculate union
    const allCommodities = [...new Set([...userCommodityIds, ...otherUserCommodityIds])];
    
    // Jaccard similarity: intersection / union
    return commonCommodities.length / allCommodities.length * WEIGHT.COMMODITY_INTEREST;
  } catch (error) {
    log(`Error scoring commodity interest: ${error}`, 'recommendations');
    return 0;
  }
}

// Score based on geographical proximity
async function scoreGeographicProximity(userId: number, otherUserId: number): Promise<number> {
  try {
    const user = await storage.getUser(userId);
    const otherUser = await storage.getUser(otherUserId);
    
    if (!user || !otherUser) {
      return 0;
    }
    
    // Get user's native circle
    const userCircle = user.nativeCircleId ? await storage.getCircle(user.nativeCircleId) : null;
    const otherUserCircle = otherUser.nativeCircleId ? await storage.getCircle(otherUser.nativeCircleId) : null;
    
    if (!userCircle || !otherUserCircle) {
      return 0;
    }
    
    // Calculate distance between circles
    const distance = calculateDistance(
      userCircle.latitude, 
      userCircle.longitude, 
      otherUserCircle.latitude, 
      otherUserCircle.longitude
    );
    
    // Normalize distance: closer = higher score, further = lower score
    // Using inverse relationship with a cutoff at MAX_PROXIMITY_DISTANCE
    if (distance > MAX_PROXIMITY_DISTANCE) {
      return 0;
    }
    
    return (1 - (distance / MAX_PROXIMITY_DISTANCE)) * WEIGHT.GEOGRAPHIC_PROXIMITY;
  } catch (error) {
    log(`Error scoring geographic proximity: ${error}`, 'recommendations');
    return 0;
  }
}

// Score based on complementary business needs (buyer/seller relationship)
async function scoreComplementaryBusiness(userId: number, otherUserId: number): Promise<number> {
  try {
    const user = await storage.getUser(userId);
    const otherUser = await storage.getUser(otherUserId);
    
    if (!user || !otherUser) {
      return 0;
    }
    
    // Check if users have complementary roles
    const complementaryRoles = (
      (user.userType === 'farmer' && ['trader', 'processor'].includes(otherUser.userType)) ||
      (user.userType === 'trader' && ['farmer', 'processor'].includes(otherUser.userType)) ||
      (user.userType === 'processor' && ['farmer', 'trader'].includes(otherUser.userType))
    );
    
    if (!complementaryRoles) {
      return 0;
    }
    
    // Get active listings for both users
    const userListings = await storage.getUserListings(userId);
    const otherUserListings = await storage.getUserListings(otherUserId);
    
    // Check if they have complementary listing types (buy/sell) for the same commodities
    let complementaryListingsScore = 0;
    
    // Map of user's commodities with listing type
    const userCommodityListingTypes: Record<number, Set<string>> = {};
    for (const listing of userListings) {
      if (!userCommodityListingTypes[listing.commodityId]) {
        userCommodityListingTypes[listing.commodityId] = new Set();
      }
      userCommodityListingTypes[listing.commodityId].add(listing.listingType);
    }
    
    // Check if other user has complementary listing types for the same commodities
    for (const otherListing of otherUserListings) {
      const userListingTypes = userCommodityListingTypes[otherListing.commodityId];
      if (userListingTypes) {
        const complementary = (
          (otherListing.listingType === 'buy' && userListingTypes.has('sell')) ||
          (otherListing.listingType === 'sell' && userListingTypes.has('buy'))
        );
        
        if (complementary) {
          complementaryListingsScore += 1;
        }
      }
    }
    
    // Normalize score based on the maximum possible complementary listings
    const maxPossibleScore = Math.min(userListings.length, otherUserListings.length);
    const normalizedScore = maxPossibleScore > 0 ? complementaryListingsScore / maxPossibleScore : 0;
    
    return normalizedScore * WEIGHT.COMPLEMENTARY_BUSINESS;
  } catch (error) {
    log(`Error scoring complementary business: ${error}`, 'recommendations');
    return 0;
  }
}

// Score based on trading history
async function scoreTradingHistory(userId: number, otherUserId: number): Promise<number> {
  try {
    // Get all trades between the two users (as buyer or seller)
    const userTrades = await storage.getUserTrades(userId);
    
    // Filter trades that involve the other user
    const tradesBetweenUsers = userTrades.filter(trade => 
      (trade.buyerId === userId && trade.sellerId === otherUserId) ||
      (trade.sellerId === userId && trade.buyerId === otherUserId)
    );
    
    // No previous trades
    if (tradesBetweenUsers.length === 0) {
      return 0;
    }
    
    // Calculate score based on completed trades and ratings
    let tradeScore = 0;
    for (const trade of tradesBetweenUsers) {
      // Base points for having a trade
      let points = 1;
      
      // Extra points for completed trades
      if (trade.paymentStatus === 'completed' && trade.deliveryStatus === 'delivered') {
        points += 1;
        
        // Extra points for positive ratings (if they exist)
        if (trade.buyerId === userId && trade.sellerRating && trade.sellerRating >= 4) {
          points += 1;
        } else if (trade.sellerId === userId && trade.buyerRating && trade.buyerRating >= 4) {
          points += 1;
        }
      }
      
      tradeScore += points;
    }
    
    // Cap and normalize the score
    const maxTradeScore = 10;
    const normalizedScore = Math.min(tradeScore, maxTradeScore) / maxTradeScore;
    
    return normalizedScore * WEIGHT.TRADING_HISTORY;
  } catch (error) {
    log(`Error scoring trading history: ${error}`, 'recommendations');
    return 0;
  }
}

// Score based on circle membership overlap
async function scoreCircleOverlap(userId: number, otherUserId: number): Promise<number> {
  try {
    // Get circles for both users
    const userCircles = await storage.listUserCircles(userId);
    const otherUserCircles = await storage.listUserCircles(otherUserId);
    
    if (!userCircles.length || !otherUserCircles.length) {
      return 0;
    }
    
    // Get the circle IDs for both users
    const userCircleIds = userCircles.map(uc => uc.circleId);
    const otherUserCircleIds = otherUserCircles.map(uc => uc.circleId);
    
    // Calculate intersection (common circles)
    const commonCircles = userCircleIds.filter(id => otherUserCircleIds.includes(id));
    
    // Calculate union
    const allCircles = [...new Set([...userCircleIds, ...otherUserCircleIds])];
    
    // Jaccard similarity: intersection / union
    return commonCircles.length / allCircles.length * WEIGHT.CIRCLE_OVERLAP;
  } catch (error) {
    log(`Error scoring circle overlap: ${error}`, 'recommendations');
    return 0;
  }
}

// Overall recommendation score between two users
async function calculateRecommendationScore(userId: number, otherUserId: number): Promise<number> {
  // Skip if users are the same
  if (userId === otherUserId) {
    return 0;
  }
  
  try {
    // Check if a connection already exists
    const existingConnection = await storage.getConnectionStatus(userId, otherUserId);
    
    // If there's already an accepted connection, no need to recommend
    if (existingConnection && existingConnection.status === 'accepted') {
      return 0;
    }
    
    // Calculate individual scores
    const commodityScore = await scoreCommodityInterest(userId, otherUserId);
    const proximityScore = await scoreGeographicProximity(userId, otherUserId);
    const businessScore = await scoreComplementaryBusiness(userId, otherUserId);
    const tradeScore = await scoreTradingHistory(userId, otherUserId);
    const circleScore = await scoreCircleOverlap(userId, otherUserId);
    
    // Calculate total score (sum of all weighted scores)
    const totalScore = commodityScore + proximityScore + businessScore + tradeScore + circleScore;
    
    // Get max possible score (sum of all weights)
    const maxPossibleScore = Object.values(WEIGHT).reduce((sum, weight) => sum + weight, 0);
    
    // Normalize to 0-100 scale
    return (totalScore / maxPossibleScore) * 100;
  } catch (error) {
    log(`Error calculating recommendation score: ${error}`, 'recommendations');
    return 0;
  }
}

// Get recommended connections for a user
export async function getRecommendedConnections(userId: number, limit: number = 10): Promise<Array<{ user: User, score: number, matchReasons: string[] }>> {
  try {
    // Get all users except the current user
    const allUsers = await storage.listUsers();
    const otherUsers = allUsers.filter(user => user.id !== userId);
    
    // Calculate scores for each potential connection
    const scoredConnections = await Promise.all(
      otherUsers.map(async (otherUser) => {
        const score = await calculateRecommendationScore(userId, otherUser.id);
        
        // Get individual scores to determine match reasons
        const commodityScore = await scoreCommodityInterest(userId, otherUser.id);
        const proximityScore = await scoreGeographicProximity(userId, otherUser.id);
        const businessScore = await scoreComplementaryBusiness(userId, otherUser.id);
        const tradeScore = await scoreTradingHistory(userId, otherUser.id);
        const circleScore = await scoreCircleOverlap(userId, otherUser.id);
        
        // Generate match reasons based on scores
        const matchReasons: string[] = [];
        if (commodityScore > 0) matchReasons.push('Similar commodity interests');
        if (proximityScore > 0) matchReasons.push('Geographic proximity');
        if (businessScore > 0) matchReasons.push('Complementary business needs');
        if (tradeScore > 0) matchReasons.push('Successful trading history');
        if (circleScore > 0) matchReasons.push('Shared circle memberships');
        
        return {
          user: otherUser,
          score,
          matchReasons
        };
      })
    );
    
    // Filter out users with score 0 and sort by score (descending)
    const filteredConnections = scoredConnections
      .filter(conn => conn.score > 0)
      .sort((a, b) => b.score - a.score);
    
    // Return top N recommendations
    return filteredConnections.slice(0, limit);
  } catch (error) {
    log(`Error getting recommended connections: ${error}`, 'recommendations');
    return [];
  }
}

// Get recommended business connections with complementary needs
export async function getComplementaryBusinessConnections(userId: number, limit: number = 10): Promise<Array<{ user: User, score: number, matchReasons: string[] }>> {
  try {
    const allRecommendations = await getRecommendedConnections(userId, 50); // Get a larger pool
    
    // Filter for recommendations with complementary business needs
    const businessRecommendations = allRecommendations.filter(rec => 
      rec.matchReasons.includes('Complementary business needs')
    );
    
    // Sort by score and return top results
    return businessRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    log(`Error getting complementary business connections: ${error}`, 'recommendations');
    return [];
  }
}

// Get commodity-specific connection recommendations
export async function getCommodityConnectionRecommendations(
  userId: number,
  commodityId: number,
  limit: number = 10
): Promise<Array<{ user: User, score: number, matchReasons: string[] }>> {
  try {
    // Get users interested in this commodity
    const interestedUsers = await storage.getUsersByCommodity(commodityId);
    const otherUserIds = interestedUsers
      .filter(uc => uc.userId !== userId)
      .map(uc => uc.userId);
    
    // Get user details for these IDs
    const users = await Promise.all(otherUserIds.map(id => storage.getUser(id)));
    const validUsers = users.filter((user): user is User => !!user);
    
    // Calculate scores for these specific users
    const scoredConnections = await Promise.all(
      validUsers.map(async (otherUser) => {
        const score = await calculateRecommendationScore(userId, otherUser.id);
        
        // Get individual scores
        const commodityScore = await scoreCommodityInterest(userId, otherUser.id);
        const proximityScore = await scoreGeographicProximity(userId, otherUser.id);
        const businessScore = await scoreComplementaryBusiness(userId, otherUser.id);
        const tradeScore = await scoreTradingHistory(userId, otherUser.id);
        const circleScore = await scoreCircleOverlap(userId, otherUser.id);
        
        // Generate match reasons
        const matchReasons: string[] = [];
        if (commodityScore > 0) matchReasons.push('Similar commodity interests');
        if (proximityScore > 0) matchReasons.push('Geographic proximity');
        if (businessScore > 0) matchReasons.push('Complementary business needs');
        if (tradeScore > 0) matchReasons.push('Successful trading history');
        if (circleScore > 0) matchReasons.push('Shared circle memberships');
        
        // Add specific reason for this commodity
        const commodity = await storage.getCommodity(commodityId);
        if (commodity) {
          matchReasons.push(`Both interested in ${commodity.name}`);
        }
        
        return {
          user: otherUser,
          score,
          matchReasons
        };
      })
    );
    
    // Filter and sort by score
    return scoredConnections
      .filter(conn => conn.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    log(`Error getting commodity connection recommendations: ${error}`, 'recommendations');
    return [];
  }
}