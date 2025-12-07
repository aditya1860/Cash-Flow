# CashSwap - Peer-to-Peer Cash↔UPI Exchange App

## Overview

CashSwap is a mobile-first peer-to-peer exchange application built with React Native (Expo) that enables users to find and connect with nearby people for cash-to-UPI transactions. The app uses geolocation to match users who need cash with those who have cash, facilitating secure local exchanges through a chat-based request system.

**Core Purpose:** Enable seamless peer-to-peer cash/UPI exchanges by connecting nearby users in real-time, with integrated chat, ratings, and location-based matching.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React Native with Expo SDK 54
- **Navigation:** React Navigation v7 (Bottom Tabs + Native Stack)
- **State Management:** React Context API for authentication, TanStack Query for server state
- **UI Libraries:** Reanimated, Gesture Handler, Expo Blur effects
- **Platform Support:** iOS, Android, and Web

**Design Pattern:** Component-based architecture with custom themed components (ThemedView, ThemedText, Button, Card) that automatically adapt to light/dark mode.

**Navigation Structure:**
- Bottom tab navigation with 4 tabs: Map, Matches, Chats, Profile
- Floating Action Button (FAB) for creating new exchange requests
- Modal stack screens for detailed interactions (chat, user profiles, exchange setup)
- Authentication flow with phone OTP before accessing main app

**Rationale:** React Native + Expo provides cross-platform development with native performance and access to device features (location, camera, haptics). Component theming ensures consistent design while supporting system-level dark mode preferences.

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with Express.js
- **Language:** TypeScript with ES modules
- **Database ORM:** Drizzle ORM (PostgreSQL schema defined but in-memory storage currently used)
- **API Design:** RESTful endpoints with JSON payloads

**Current Implementation:** In-memory storage layer (`server/storage.ts`) that simulates database operations. This allows development without database setup but should be replaced with actual Drizzle + PostgreSQL implementation.

**API Structure:**
- Authentication: `/api/auth/send-otp`, `/api/auth/verify-otp`
- User management: `/api/user/me`, `/api/user/profile`
- Location services: `/api/location/publish`, `/api/location/nearby`
- Exchange requests: `/api/requests/create`, `/api/requests/*`
- Messaging: `/api/chats`, `/api/messages`
- Social: `/api/ratings`, `/api/reports`

**Authentication Middleware:** Custom `authMiddleware` validates `x-user-id` header on protected routes. Client stores user data in AsyncStorage after OTP verification.

**Rationale:** Express provides simple, flexible routing. In-memory storage enables rapid prototyping. Drizzle schema is pre-defined for seamless migration to PostgreSQL when database is provisioned.

**Alternatives Considered:**
- GraphQL: Rejected for simplicity; REST is sufficient for this app's needs
- Firebase Realtime Database: Rejected to maintain full control over backend logic
- Native database drivers: Drizzle ORM chosen for type safety and migration management

### Authentication & Security

**Authentication Flow:**
1. User enters phone number
2. Backend generates 6-digit OTP (currently returned in response for development)
3. User enters OTP to verify
4. Backend returns user object if valid
5. Client stores user data in AsyncStorage and sets `x-user-id` header for subsequent requests

**Session Management:** Client-side session persistence via AsyncStorage. No JWT tokens or cookies currently implemented.

**Security Considerations:**
- OTP verification prevents unauthorized access
- User IDs passed as headers (should be replaced with secure tokens in production)
- CORS configured for Replit deployment domains
- Future: Implement proper token-based authentication (JWT)

### Location & Geolocation

**Location Services:**
- Expo Location API for requesting permissions and getting current position
- Haversine distance calculation for finding nearby users within specified radius
- Location data includes: latitude, longitude, exchange mode, amount, conditions, radius
- Privacy: Actual coordinates offset slightly when displaying to other users

**Implementation Details:**
- Users publish their location when creating exchange requests
- Locations auto-expire and can be manually deactivated
- Nearby user search filters by distance, exchange mode compatibility
- Map view and list view both consume the same nearby users API

**Rationale:** GPS-based matching is core to the app's value proposition. Haversine formula provides accurate distance calculations without external services.

### Real-time Communication

**Current Implementation:** Polling-based message fetching in chat screens

**Architecture for Real-time Updates:**
- WebSocket server scaffolded (`ws` package installed)
- Message polling with periodic refresh
- Future: Implement WebSocket connections for instant message delivery and online status

**Rationale:** HTTP polling is simpler to implement initially. WebSocket infrastructure is prepared for future real-time enhancements.

### Data Models

**Core Entities:**
- **User:** id, phone, name, avatar, rating, completedExchanges, isOnline
- **UserLocation:** userId, lat/lng, mode (NEED_CASH/HAVE_CASH), amount, conditions, radius, expiry
- **ExchangeRequest:** fromUserId, toUserId, amount, mode, status (pending/accepted/rejected/completed/cancelled)
- **Chat:** exchangeRequestId with associated messages
- **ChatMessage:** exchangeRequestId, senderId, content, timestamp
- **Rating:** fromUserId, toUserId, rating (1-5), comment
- **Report:** fromUserId, toUserId, reason, description

**Relationships:**
- Exchange requests create chat threads
- Users can rate each other after completed exchanges
- Locations are tied to active exchange availability

## External Dependencies

### Third-Party Services

**Google Maps API:**
- **Purpose:** Display interactive maps showing user locations
- **Configuration:** API keys required in `app.json` for iOS and Android
- **Status:** Placeholders present, actual keys needed for deployment
- **Usage:** Map display, location visualization

**Expo Services:**
- **Expo Location:** GPS access and permissions
- **Expo Haptics:** Tactile feedback for user interactions
- **Expo Blur:** Native blur effects for tab bars and overlays
- **Expo Image:** Optimized image loading and caching

### Database

**Current:** In-memory JavaScript objects simulating database

**Planned:** PostgreSQL via Drizzle ORM
- Schema defined in `shared/schema.ts`
- Migration configuration in `drizzle.config.ts`
- Environment variable `DATABASE_URL` required when migrating to production
- Use `npm run db:push` to sync schema once database is provisioned

### Deployment Environment

**Replit-Specific Configuration:**
- Environment variables for domain detection (`REPLIT_DEV_DOMAIN`, `REPLIT_INTERNAL_APP_DOMAIN`)
- Custom build scripts for Expo web bundles
- CORS configured for Replit preview URLs
- Proxy middleware for development Metro bundler

**Build Commands:**
- Development: `npm run all:dev` (runs both Expo and Express concurrently)
- Production: `npm run expo:static:build` + `npm run server:build` + `npm run server:prod`

### Key NPM Packages

**Frontend:**
- `@react-navigation/*`: Navigation (tabs, stack, elements)
- `@tanstack/react-query`: Server state management
- `react-native-reanimated`: Performant animations
- `react-native-keyboard-controller`: Keyboard-aware UI
- `drizzle-zod`: Type-safe schema validation

**Backend:**
- `express`: HTTP server
- `drizzle-orm`: Database ORM (ready for PostgreSQL)
- `pg`: PostgreSQL driver
- `ws`: WebSocket support (scaffolded)
- `zod`: Runtime type validation

**Development:**
- `tsx`: TypeScript execution for development server
- `esbuild`: Production bundling
- `drizzle-kit`: Database migrations
- `prettier`/`eslint`: Code formatting and linting