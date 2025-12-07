# CashSwap - Peer-to-Peer Cash Exchange App

A mobile-first peer-to-peer exchange application that connects nearby users for cash-to-UPI transactions. Built with React Native (Expo) and Node.js.

## Features

- **Phone OTP Authentication** - Secure login with phone verification
- **Interactive Map** - View nearby users looking to exchange cash/UPI
- **Smart Matching** - Geospatial matching finds partners within your radius
- **Real-time Chat** - Communicate with exchange partners directly
- **User Ratings** - Rate and review after completed exchanges
- **Safety Reporting** - Report suspicious activity for community safety
- **Profile Management** - Track your exchange history and stats

## Quick Start

### Running the App

```bash
# Start both frontend and backend servers
npm run all:dev
```

The app will be available at:
- **Web**: http://localhost:8081
- **Mobile**: Scan QR code with Expo Go app

### Demo Mode

The app comes with 10 demo users around Bangalore (12.9716, 77.5946) for testing:
- OTP is returned in the API response for demo purposes
- Check server console logs to see generated OTPs

## Architecture

```
client/           # React Native Expo frontend
├── screens/      # App screens (Login, Map, Chat, Profile, etc.)
├── components/   # Reusable UI components
├── contexts/     # React contexts (AuthContext)
├── hooks/        # Custom hooks (useTheme, useScreenOptions)
├── lib/          # API client and utilities
├── navigation/   # React Navigation setup
└── constants/    # Theme, colors, spacing

server/           # Express.js backend
├── index.ts      # Server entry point
├── routes.ts     # API endpoints
└── storage.ts    # In-memory data storage

shared/           # Shared TypeScript types
└── schema.ts     # Zod schemas and type definitions
```

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP and login

### User
- `GET /api/user/me` - Get current user profile
- `PUT /api/user/profile` - Update profile
- `GET /api/user/:id` - Get user by ID

### Location
- `POST /api/location/publish` - Publish exchange location
- `DELETE /api/location` - Deactivate location
- `GET /api/location/me` - Get my active location
- `GET /api/nearby` - Find nearby users

### Exchange
- `POST /api/exchange/request` - Create exchange request
- `GET /api/exchange/requests` - Get my exchange requests
- `PUT /api/exchange/request/:id/status` - Update request status

### Chat
- `GET /api/chats` - Get all chats
- `GET /api/chat/:id/messages` - Get chat messages
- `POST /api/chat/send` - Send message

### Social
- `POST /api/rating` - Rate a user
- `POST /api/report` - Report a user

## Production Setup

### 1. Database Setup (PostgreSQL)

The app is designed for PostgreSQL. To enable persistence:

```bash
# Create PostgreSQL database (use Replit's built-in DB or external provider)
# Set DATABASE_URL environment variable

# Push schema to database
npm run db:push
```

### 2. Google Maps API

For interactive maps on iOS/Android, add your API key to `app.json`:

```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_IOS_API_KEY"
      }
    },
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_ANDROID_API_KEY"
        }
      }
    }
  }
}
```

### 3. Firebase Phone Auth (Optional)

To replace mock OTP with production Firebase authentication:

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Phone Authentication
3. Add `@react-native-firebase/app` and `@react-native-firebase/auth`
4. Configure `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
5. Update auth logic in `client/contexts/AuthContext.tsx`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | For production |
| `SESSION_SECRET` | Session encryption key | Yes |
| `EXPO_PUBLIC_DOMAIN` | Public domain for API calls | Auto-set on Replit |

## Development Commands

```bash
# Start development servers
npm run all:dev

# Build Expo web bundle
npm run expo:static:build

# Build server for production
npm run server:build

# Run production server
npm run server:prod

# Database migrations
npm run db:push       # Push schema changes
npm run db:studio     # Open Drizzle Studio
```

## Future Roadmap

- [ ] Production Firebase phone authentication
- [ ] PostgreSQL database integration
- [ ] Real-time WebSocket messaging
- [ ] Push notifications
- [ ] End-to-end chat encryption
- [ ] Payment escrow integration
- [ ] KYC verification system
- [ ] Admin moderation panel
- [ ] Rate limiting and validation

## Tech Stack

**Frontend**
- React Native / Expo SDK 54
- React Navigation 7
- TanStack Query
- Reanimated 3
- TypeScript

**Backend**
- Node.js / Express.js
- Drizzle ORM
- PostgreSQL (ready)
- TypeScript
- Zod validation

## License

MIT
