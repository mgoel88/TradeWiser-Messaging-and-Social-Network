# WizXConnect - Detailed Code Documentation

## 🔧 Core Backend Components

### 1. Authentication System (`server/auth.ts`)

The authentication system uses Passport.js with local strategy and session-based authentication:

```typescript
// Key features:
// - Password hashing with scrypt for security
// - Session storage in PostgreSQL
// - User serialization/deserialization
// - Role-based access control

// Password hashing function
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Password comparison for login
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Main authentication routes:
// POST /api/register - User registration with password hashing
// POST /api/login - User login with credential verification
// POST /api/logout - Session termination
// GET /api/user - Current user session data
```

### 2. Database Layer (`server/db.ts` & `shared/schema.ts`)

The application uses Drizzle ORM with PostgreSQL for robust data management:

```typescript
// Database connection using Neon serverless
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

// Key database tables:
// - users: User profiles and authentication
// - circles: Geographic trading communities
// - commodities: Agricultural products catalog
// - marketplace_listings: Buy/sell listings
// - messages: Trading communication
// - contracts: Smart contract generation
// - notifications: Real-time alerts
```

### 3. Real-Time Notifications (`server/notifications.ts`)

WebSocket-based notification system for live updates:

```typescript
// Features:
// - Price update notifications
// - Trading opportunity alerts
// - Message notifications
// - Connection status updates
// - Auto-reconnection handling

// WebSocket server setup
const wss = new WebSocketServer({ 
  server: httpServer, 
  path: '/ws' 
});

// Notification types handled:
// - PRICE_UPDATE: Commodity price changes
// - NEW_LISTING: New marketplace listings
// - MESSAGE_RECEIVED: Chat messages
// - CONTRACT_UPDATE: Contract status changes
```

### 4. API Routes (`server/routes.ts`)

RESTful API endpoints organized by feature:

```typescript
// Authentication routes
app.post('/api/register', async (req, res) => { /* User registration */ });
app.post('/api/login', passport.authenticate('local'), (req, res) => { /* Login */ });
app.get('/api/user', (req, res) => { /* Get current user */ });

// Marketplace routes
app.get('/api/marketplace', async (req, res) => { /* Get listings */ });
app.post('/api/marketplace', async (req, res) => { /* Create listing */ });
app.put('/api/marketplace/:id', async (req, res) => { /* Update listing */ });

// Trading routes
app.get('/api/contracts', async (req, res) => { /* Get user contracts */ });
app.post('/api/contracts', async (req, res) => { /* Create contract */ });
app.put('/api/contracts/:id/sign', async (req, res) => { /* Sign contract */ });

// Market data routes
app.get('/api/commodities', async (req, res) => { /* Get commodities */ });
app.get('/api/commodities/trending', async (req, res) => { /* Trending data */ });
app.get('/api/circles', async (req, res) => { /* Get trading circles */ });
```

## 🎨 Frontend Architecture

### 1. Main Application (`client/src/App.tsx`)

The root component with routing and provider setup:

```typescript
// Provider hierarchy:
// QueryClientProvider (TanStack Query for data fetching)
//   └── AuthProvider (User authentication state)
//       └── OnboardingProvider (Tutorial system)
//           └── NotificationsProvider (Real-time updates)
//               └── Router (Page routing with wouter)

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OnboardingProvider>
          <NotificationsProvider>
            {!isAuthPage && <Header />}
            <Router />
            {!isAuthPage && <Footer />}
            {!isAuthPage && <MobileNavigation />}
            <Toaster />
          </NotificationsProvider>
        </OnboardingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### 2. Authentication Hook (`client/src/hooks/use-auth.tsx`)

Centralized authentication state management:

```typescript
// Features:
// - User session management
// - Login/logout mutations
// - Registration with automatic login
// - Error handling with toast notifications
// - Query invalidation on auth state changes

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Provides:
// - user: Current user data or null
// - isLoading: Authentication check in progress
// - loginMutation: Login function with error handling
// - registerMutation: Registration function
// - logoutMutation: Logout function
```

### 3. Protected Routes (`client/src/lib/protected-route.tsx`)

Route protection for authenticated-only pages:

```typescript
export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // Redirect to auth page if not logged in
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Render the protected component
  return <Component />
}
```

### 4. Onboarding System (`client/src/components/onboarding/`)

Interactive tutorial system with farmer/trader avatars:

```typescript
// OnboardingTutorial.tsx - Main tutorial component
// Features:
// - Step-by-step platform introduction
// - Animated farmer and trader avatars
// - Progress tracking with localStorage
// - Skip functionality
// - Responsive design

const tutorialSteps = [
  {
    id: 1,
    title: 'Welcome to WizXConnect!',
    content: 'Your agricultural trading platform...',
    avatar: 'farmer',
    animation: 'wave'
  },
  // ... more steps
];

// OnboardingContext.tsx - State management
// - Global onboarding state
// - Tutorial visibility control
// - Completion tracking

// FeatureTutorial.tsx - Feature-specific tours
// - Context-sensitive tutorials
// - Element highlighting
// - Tooltip positioning
```

### 5. Messaging System (`client/src/components/messages/`)

WhatsApp-style trading communication:

```typescript
// TradeMessageComposer.tsx - Template-based messaging
// Features:
// - Pre-defined trade templates
// - Commodity specification forms
// - Quality and delivery terms
// - Attachment support

const messageTemplates = {
  buy_request: {
    title: "Looking to Buy",
    fields: ['commodity', 'quantity', 'priceRange', 'qualityGrade']
  },
  sell_offer: {
    title: "Available for Sale", 
    fields: ['commodity', 'quantity', 'price', 'location']
  },
  negotiation: {
    title: "Price Negotiation",
    fields: ['counterOffer', 'terms', 'deliveryDate']
  }
};

// MessageThread.tsx - Conversation interface
// - Real-time message updates
// - Template message rendering
// - File attachment display
// - Read status indicators
```

### 6. Marketplace Components (`client/src/pages/marketplace.tsx`)

Commodity trading marketplace:

```typescript
// Features:
// - Listing grid with filtering
// - Search by commodity, location, price
// - Sort by date, price, distance
// - Infinite scroll for large datasets
// - Quick inquiry system

// Key filtering options:
const filters = {
  commodity: 'All commodities',
  type: 'All listings', // buy/sell
  location: 'All locations',
  priceRange: { min: 0, max: 10000 },
  dateRange: { from: null, to: null }
};
```

### 7. Contract Management (`client/src/pages/contracts.tsx`)

Smart contract generation and management:

```typescript
// Features:
// - Contract creation from negotiations
// - Digital signature interface
// - WhatsApp sharing functionality
// - Contract status tracking
// - PDF generation for offline use

// Contract lifecycle:
// 1. Draft creation from trade agreement
// 2. Terms review and modification
// 3. Digital signature by both parties
// 4. WhatsApp sharing for external record
// 5. Fulfillment tracking
```

## 🎨 UI Components & Design System

### 1. Design Tokens (`client/src/index.css`)

Agricultural-themed color palette and typography:

```css
/* Primary color scheme - Green focus for agricultural theme */
:root {
  --primary: 96 35% 31%;        /* Deep green */
  --secondary: 45 77% 60%;      /* Golden yellow */
  --accent: 24 94% 41%;         /* Orange accent */
  --background: 60 30% 96%;     /* Light cream */
  --foreground: 20 14.3% 4.1%;  /* Dark brown */
}

/* Typography system */
.font-heading { font-family: "Source Sans Pro", sans-serif; }
.font-body { font-family: "Open Sans", sans-serif; }
.font-data { font-family: "Roboto", sans-serif; }

/* Tutorial highlight animations */
.tutorial-highlight {
  box-shadow: 0 0 0 4px hsl(var(--primary) / 0.5);
  animation: pulse 2s infinite;
}
```

### 2. Avatar System (`client/public/assets/avatars/`)

Custom SVG avatars for onboarding:

```svg
<!-- Farmer Avatar - Represents agricultural producers -->
<!-- Features: Traditional farming attire, warm colors -->

<!-- Trader Avatar - Represents commodity traders -->
<!-- Features: Business attire, professional appearance -->

<!-- Each avatar has normal and highlighted versions -->
<!-- Used in onboarding tutorial for user engagement -->
```

### 3. Component Library Structure

Built on shadcn/ui with custom agricultural-themed components:

```typescript
// Core UI components:
// - Button, Card, Input, Select (shadcn/ui base)
// - PriceCard (commodity price display)
// - FeedPost (social feed items)
// - TradingTemplate (message templates)
// - ContractCard (contract display)

// Layout components:
// - Header (navigation and user menu)
// - Sidebar (quick navigation)
// - Footer (links and info)
// - MobileNavigation (bottom tab bar)
```

## 📊 Data Flow & State Management

### 1. Global State with TanStack Query

Centralized data fetching and caching:

```typescript
// Query keys organized by feature:
const queryKeys = {
  user: ['/api/user'],
  marketplace: ['/api/marketplace'],
  commodities: ['/api/commodities'],
  circles: ['/api/circles'],
  messages: (conversationId: string) => ['/api/messages', conversationId],
  contracts: ['/api/contracts']
};

// Mutation patterns with optimistic updates:
const createListingMutation = useMutation({
  mutationFn: (data) => apiRequest('POST', '/api/marketplace', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/marketplace'] });
    toast({ title: "Listing created successfully" });
  }
});
```

### 2. Real-Time State with WebSocket

Live updates for dynamic data:

```typescript
// WebSocket hook for real-time updates
export function useWebSocket() {
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    
    socket.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      
      switch (notification.type) {
        case 'PRICE_UPDATE':
          queryClient.invalidateQueries({ queryKey: ['/api/commodities'] });
          break;
        case 'NEW_LISTING':
          queryClient.invalidateQueries({ queryKey: ['/api/marketplace'] });
          break;
        case 'MESSAGE_RECEIVED':
          queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
          break;
      }
    };
  }, []);
}
```

### 3. Form Management

React Hook Form with Zod validation:

```typescript
// Marketplace listing form example
const listingSchema = z.object({
  commodity: z.string().min(1, "Commodity is required"),
  quantity: z.number().min(1, "Quantity must be positive"),
  pricePerUnit: z.number().min(1, "Price must be positive"),
  qualityGrade: z.string().optional(),
  deliveryTerms: z.string().optional(),
  location: z.string().min(1, "Location is required")
});

const form = useForm({
  resolver: zodResolver(listingSchema),
  defaultValues: {
    commodity: '',
    quantity: 0,
    pricePerUnit: 0,
    // ...
  }
});
```

## 🔐 Security Implementation

### 1. Authentication Security

Multiple layers of security for user authentication:

```typescript
// Password security with scrypt
// - Random salt generation
// - Constant-time comparison
// - Session-based authentication
// - CSRF protection with session cookies

// Session configuration
const sessionSettings = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new PostgresSessionStore({ 
    pool, 
    createTableIfMissing: true 
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};
```

### 2. Input Validation

Comprehensive validation at multiple levels:

```typescript
// API level validation with Zod
const createListingSchema = z.object({
  commodityId: z.number().int().positive(),
  quantity: z.number().positive(),
  pricePerUnit: z.number().positive(),
  type: z.enum(['buy', 'sell']),
  location: z.string().min(1).max(100)
});

// Route validation middleware
app.post('/api/marketplace', async (req, res) => {
  try {
    const validatedData = createListingSchema.parse(req.body);
    // Process validated data
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});
```

### 3. Database Security

Secure database operations and access control:

```typescript
// Parameterized queries with Drizzle ORM prevent SQL injection
const getUserListings = async (userId: number) => {
  return await db
    .select()
    .from(marketplaceListings)
    .where(eq(marketplaceListings.userId, userId));
};

// Row-level security for user data isolation
// Only allow users to access their own data
const authMiddleware = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
};
```

## 📱 Responsive Design & Accessibility

### 1. Mobile-First Design

Responsive layout system for all device sizes:

```css
/* Mobile navigation for small screens */
@media (max-width: 1024px) {
  main {
    padding-bottom: 4rem; /* Account for bottom navigation */
  }
  
  .desktop-only {
    display: none;
  }
  
  .mobile-nav {
    display: flex;
  }
}

/* Tablet and desktop optimizations */
@media (min-width: 768px) {
  .grid-responsive {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid-responsive {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### 2. Accessibility Features

WCAG 2.1 compliance with keyboard navigation:

```typescript
// Focus management in tutorials
const FeatureTutorial = () => {
  useEffect(() => {
    const targetElement = document.querySelector(currentStep.targetSelector);
    
    if (targetElement) {
      targetElement.classList.add('tutorial-highlight');
      targetElement.setAttribute('aria-describedby', 'tutorial-tooltip');
      
      // Ensure element is in viewport
      targetElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
    
    return () => {
      targetElement?.classList.remove('tutorial-highlight');
      targetElement?.removeAttribute('aria-describedby');
    };
  }, [currentStep]);
};

// Keyboard navigation support
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    skipTutorial();
  } else if (e.key === 'ArrowRight') {
    nextStep();
  } else if (e.key === 'ArrowLeft') {
    prevStep();
  }
};
```

## 🚀 Performance Optimizations

### 1. Frontend Performance

Optimized loading and rendering:

```typescript
// Lazy loading for large components
const LazyMarketplace = lazy(() => import('@/pages/marketplace'));
const LazyContracts = lazy(() => import('@/pages/contracts'));

// Memoization for expensive calculations
const MemoizedPriceChart = memo(({ data }) => {
  const chartData = useMemo(() => {
    return processChartData(data);
  }, [data]);
  
  return <Chart data={chartData} />;
});

// Virtual scrolling for large lists
const VirtualizedListings = ({ items }) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={120}
      itemData={items}
    >
      {ListingItem}
    </FixedSizeList>
  );
};
```

### 2. Backend Performance

Database optimization and caching:

```typescript
// Database indexing for common queries
// - User ID on all user-related tables
// - Commodity ID for marketplace searches
// - Location for geographic queries
// - Created date for temporal sorting

// Query optimization with proper joins
const getListingsWithDetails = async () => {
  return await db
    .select({
      listing: marketplaceListings,
      commodity: commodities,
      user: users,
      circle: circles
    })
    .from(marketplaceListings)
    .leftJoin(commodities, eq(marketplaceListings.commodityId, commodities.id))
    .leftJoin(users, eq(marketplaceListings.userId, users.id))
    .leftJoin(circles, eq(marketplaceListings.circleId, circles.id))
    .where(eq(marketplaceListings.status, 'active'))
    .orderBy(desc(marketplaceListings.createdAt));
};

// WebSocket connection pooling
const connectionPool = new Map();
const cleanupStaleConnections = () => {
  for (const [id, ws] of connectionPool.entries()) {
    if (ws.readyState !== WebSocket.OPEN) {
      connectionPool.delete(id);
    }
  }
};
```

## 🧪 Testing Strategy

### 1. Component Testing

Testing key user interactions:

```typescript
// Example test for onboarding tutorial
describe('OnboardingTutorial', () => {
  it('should navigate through tutorial steps', async () => {
    const onComplete = jest.fn();
    render(<OnboardingTutorial onComplete={onComplete} isFirstLogin={true} />);
    
    // Check first step is displayed
    expect(screen.getByText('Welcome to WizXConnect!')).toBeInTheDocument();
    
    // Navigate to next step
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Connect with Regional Circles')).toBeInTheDocument();
    
    // Complete tutorial
    fireEvent.click(screen.getByText('Finish'));
    expect(onComplete).toHaveBeenCalled();
  });
});

// API route testing
describe('Marketplace API', () => {
  it('should create a new listing', async () => {
    const listingData = {
      commodityId: 1,
      quantity: 100,
      pricePerUnit: 1500,
      type: 'sell'
    };
    
    const response = await request(app)
      .post('/api/marketplace')
      .send(listingData)
      .expect(201);
    
    expect(response.body.listing.quantity).toBe(100);
  });
});
```

### 2. Integration Testing

End-to-end user workflows:

```typescript
// Trading workflow test
describe('Complete Trading Flow', () => {
  it('should complete a trade from listing to contract', async () => {
    // 1. Create marketplace listing
    // 2. Send trade inquiry message
    // 3. Negotiate terms
    // 4. Generate contract
    // 5. Sign contract
    // 6. Share via WhatsApp
  });
});
```

## 📋 Development Workflow

### 1. Code Organization

File structure and naming conventions:

```
client/src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   ├── onboarding/     # Tutorial system
│   ├── messages/       # Trading communication
│   └── marketplace/    # Trading components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── pages/              # Route components
└── stores/             # State management

server/
├── auth.ts             # Authentication system
├── db.ts               # Database connection
├── routes.ts           # API endpoints
├── storage.ts          # Data access layer
└── notifications.ts    # WebSocket system

shared/
└── schema.ts           # Database schema and types
```

### 2. Development Commands

Common development tasks:

```bash
# Start development server
npm run dev

# Database operations
npm run db:push          # Push schema changes
npm run db:generate      # Generate migrations
npm run db:studio        # Open database browser

# Type checking
npm run type-check       # TypeScript validation

# Code formatting
npm run format          # Prettier formatting
npm run lint            # ESLint checking
```

### 3. Environment Setup

Required environment variables:

```env
# Database
DATABASE_URL=postgresql://...

# Authentication
SESSION_SECRET=your-secret-key

# Development
NODE_ENV=development
VITE_API_URL=http://localhost:5000
```

## 🔍 Troubleshooting Guide

### 1. Common Issues

Authentication problems:

```typescript
// Check session configuration
// Ensure DATABASE_URL is set
// Verify session secret is configured
// Check CORS settings for production

// Debug authentication
console.log('User authenticated:', req.isAuthenticated());
console.log('Session:', req.session);
console.log('User:', req.user);
```

Database connection issues:

```typescript
// Check connection
import { pool } from './db';

const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Database connected:', result.rows[0]);
    client.release();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};
```

### 2. Performance Issues

Query optimization:

```typescript
// Identify slow queries
// Add database indexes
// Implement query caching
// Use connection pooling
// Monitor WebSocket connections

// Example query optimization
const optimizedQuery = await db
  .select()
  .from(marketplaceListings)
  .where(
    and(
      eq(marketplaceListings.status, 'active'),
      gte(marketplaceListings.createdAt, lastWeek)
    )
  )
  .orderBy(desc(marketplaceListings.createdAt))
  .limit(20);
```

### 3. Frontend Issues

React component debugging:

```typescript
// Check component state
// Verify prop types
// Use React DevTools
// Check network requests
// Validate form schemas

// Debug form validation
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: initialValues,
  mode: 'onChange' // Real-time validation
});

console.log('Form errors:', form.formState.errors);
console.log('Form values:', form.getValues());
```

This comprehensive code documentation provides detailed insights into the WizXConnect platform's architecture, implementation patterns, and best practices. Use this as a reference for understanding the codebase and planning future enhancements.
```

## 🚀 Performance Optimizations
