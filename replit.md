# WizXConnect - Agricultural Social Trading Platform

## Overview
WizXConnect is a Facebook/LinkedIn-style social networking application for agriculture commodity trading in India. The platform is organized around "circles" - geographical entities based on APMC mandi catchment areas with specific coverage radius. Each circle represents production regions with weighted importance based on trading volume.

## Key Features
- **Circle-based Network**: Geographic trading communities centered around APMC mandis
- **Interactive Onboarding**: Tutorial system with farmer/trader avatars for new user guidance
- **Marketplace Trading**: B2B commodity listings with filtering and search capabilities
- **WhatsApp-style Messaging**: Template-based trading communication with message types
- **Smart Contracts**: Auto-generated contracts with digital signatures and WhatsApp sharing
- **Real-time Notifications**: WebSocket-based alerts for price updates and trading opportunities
- **KYC System**: Complete document verification workflow with structured metadata
- **Mobile-first Design**: Responsive interface optimized for mobile devices

## Tech Stack
- **Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with session-based auth
- **Real-time**: WebSocket for live notifications
- **State Management**: TanStack Query + React Context

## Recent Changes

### ✓ January 25, 2025
- **Created comprehensive code documentation** (`CODE_DOCUMENTATION.md`)
  - Detailed backend component documentation (auth, database, API routes)
  - Frontend architecture with hooks, routing, and state management
  - Onboarding system with tutorial components
  - Security implementation patterns
  - Performance optimization strategies
  - Testing approaches and troubleshooting guide
  - Development workflow and environment setup

### ✓ Previous Sessions
- Interactive onboarding tutorial system with farmer/trader avatars
- Fixed authentication system with PostgreSQL session storage
- Messaging system with WhatsApp-style templates
- Contracts frontend with digital signatures
- Real-time notification system with WebSocket auto-reconnect
- Comprehensive APPLICATION_SUMMARY.md documentation

## User Preferences
- Focus on agricultural trading use cases
- Professional but approachable design language
- Mobile-first responsive design
- Real-time collaboration features
- Comprehensive documentation for codebase understanding

## Project Architecture
- **Database**: PostgreSQL with tables for users, circles, commodities, marketplace_listings, messages, contracts, notifications
- **Authentication**: Session-based with PostgreSQL session store
- **API Design**: RESTful endpoints with Zod validation
- **Real-time**: WebSocket server on `/ws` path for live updates
- **Frontend**: Component-based architecture with protected routes
- **State**: TanStack Query for server state, React Context for global state

## Login Credentials (Testing)
- farmer1 / password123
- trader1 / password123  
- aggregator1 / password123

## Development Commands
- `npm run dev` - Start development server
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open database browser

## Environment Variables
- DATABASE_URL: PostgreSQL connection string
- SESSION_SECRET: Authentication session secret
- NODE_ENV: Environment (development/production)