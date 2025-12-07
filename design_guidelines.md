# Design Guidelines: Peer-to-Peer Cash↔UPI Exchange App

## Architecture Decisions

### Authentication
**Auth Required** - This app explicitly requires user accounts for P2P transactions and safety.

**Implementation:**
- **Primary:** Phone OTP authentication via Firebase Auth
- **Login Flow:**
  - Splash screen with app branding
  - Phone number entry screen (with country code selector)
  - OTP verification screen (6-digit code entry)
  - First-time users: profile setup (name, optional photo)
- **Account Screen Requirements:**
  - Display name and phone number (partially masked: +91 ****5678)
  - Profile photo (camera/gallery picker)
  - Exchange history (completed transactions count)
  - Trust score/rating display
  - Settings access
  - Log out with confirmation
  - Delete account (Settings > Account > Delete Account, double confirmation alert)

### Navigation
**Tab Navigation** (4 tabs with floating action button for core action)

**Tab Structure:**
1. **Map** (Home) - Shows nearby users on interactive map
2. **Matches** - List of potential exchange partners
3. **FAB (Floating)** - "New Exchange" core action (+ icon)
4. **Chats** - Active conversations
5. **Profile** - User account and settings

**Modal Screens:**
- New Exchange Setup (opened from FAB)
- Chat Detail (opened from Chats or Match cards)
- User Profile Preview (opened from map pins or match cards)
- Rating/Report Modal

### Screen Specifications

#### 1. Map Screen (Home Tab)
- **Purpose:** Discover nearby users offering/seeking cash exchange
- **Header:** 
  - Transparent background overlaying map
  - Left: Profile photo (touchable → Profile tab)
  - Right: Filter icon (touchable → Filter modal)
  - No title text
- **Layout:**
  - Full-screen map component (React Native Maps)
  - Colored pins: Blue circle (NEED_CASH), Green circle (HAVE_CASH)
  - Pin size indicates amount range (small: <₹500, medium: ₹500-2000, large: >₹2000)
  - User's current location: pulsing dot in accent color
  - Bottom sheet overlay (draggable):
    - Quick stats: "5 users nearby • 3km radius"
    - List preview of closest 3 matches (scrollable to see all)
- **Safe Area:** 
  - Top: insets.top + Spacing.xl
  - Bottom: tabBarHeight + Spacing.xl

#### 2. Matches Screen
- **Purpose:** Browse list view of potential exchange partners
- **Header:**
  - Default navigation header (opaque)
  - Title: "Nearby Matches"
  - Right: Filter icon
- **Layout:**
  - Scrollable list (FlatList) of match cards
  - Each card displays:
    - User avatar, name, distance
    - Mode badge (NEED_CASH/HAVE_CASH in corresponding color)
    - Amount: "₹1,500" (bold, large)
    - Trust score (star icon + rating out of 5)
    - Conditions preview (1 line, truncated)
    - Primary CTA: "Request Exchange" button
- **Safe Area:**
  - Top: Spacing.xl
  - Bottom: tabBarHeight + Spacing.xl

#### 3. New Exchange Modal (FAB trigger)
- **Purpose:** Create new exchange listing
- **Header:**
  - Title: "New Exchange"
  - Left: Cancel button
  - Right: Publish button (disabled until form valid)
- **Layout:**
  - Scrollable form with sections:
    - Mode selector (segmented control): "I Need Cash" | "I Have Cash"
    - Amount input (₹, numeric keyboard)
    - Conditions (optional textarea, 200 char limit)
    - Location toggle (ON by default): "Share approximate location"
    - Range slider: "Show to users within X km" (1-10km)
  - Submit button below form (fixed at bottom)
- **Safe Area:**
  - Top: Spacing.xl
  - Bottom: insets.bottom + Spacing.xl

#### 4. Chat Detail Screen
- **Purpose:** Real-time messaging with matched user
- **Header:**
  - Default navigation header
  - Left: Back arrow
  - Title: User name + status indicator (online/offline dot)
  - Right: More menu (Report, Block)
- **Layout:**
  - Inverted FlatList (chat messages, scrollable)
  - Message bubbles: user's messages (right, accent color), other's messages (left, gray)
  - Input bar (fixed at bottom):
    - Text input field (auto-expanding, max 3 lines)
    - Send button (paper plane icon)
- **Safe Area:**
  - Top: Spacing.xl
  - Bottom: insets.bottom + Spacing.lg (for keyboard avoidance)

#### 5. Profile/Account Screen
- **Purpose:** User settings, exchange history, account management
- **Header:**
  - Default navigation header
  - Title: "Profile"
  - Right: Settings icon
- **Layout:**
  - Scrollable content:
    - Profile section (avatar, name, phone, edit button)
    - Trust score card (rating, completed exchanges, member since)
    - Exchange history list (past transactions with status badges)
    - Help & Support links
    - Log out button (secondary style, bottom of scroll)
- **Safe Area:**
  - Top: Spacing.xl
  - Bottom: tabBarHeight + Spacing.xl

## Design System

### Color Palette
- **Primary:** Deep Blue (#1E3A8A) - trust, security
- **Accent:** Vibrant Orange (#F97316) - action, urgency
- **Success/HAVE_CASH:** Green (#10B981)
- **Info/NEED_CASH:** Blue (#3B82F6)
- **Warning:** Amber (#F59E0B) - caution for reports
- **Error:** Red (#EF4444)
- **Background:** White (#FFFFFF)
- **Surface:** Light Gray (#F3F4F6)
- **Text Primary:** Dark Gray (#111827)
- **Text Secondary:** Medium Gray (#6B7280)

### Typography
- **Headers:** SF Pro Display (iOS) / Roboto (Android), Bold, 24-28px
- **Body:** SF Pro Text / Roboto, Regular, 16px
- **Captions:** 14px, Medium weight
- **Amount Display:** 32px, Bold (for prominence)

### Interaction Design
- **Map Pins:** Tap to show bottom sheet preview, double-tap to open user profile
- **Cards:** Entire card touchable with subtle press scale (0.98)
- **Buttons:** Primary (filled accent), Secondary (outlined), Tertiary (text only)
- **FAB:** Floating Action Button with drop shadow:
  - shadowOffset: {width: 0, height: 2}
  - shadowOpacity: 0.10
  - shadowRadius: 2
- **Pull-to-Refresh:** On Matches and Chats screens
- **Haptic Feedback:** On important actions (publish exchange, send request, rate user)

### Assets Required
1. **App Icon:** Circular icon with ₹ symbol and bidirectional arrow (cash ↔ UPI theme)
2. **Splash Screen:** Simple logo on solid background
3. **Empty States:**
   - No matches found (magnifying glass icon)
   - No active chats (chat bubble icon)
   - No exchange history (receipt icon)
4. **Map Markers:** Custom pin SVGs (blue circle, green circle with ₹ symbol inside)
5. **System Icons:** Use Feather icons from @expo/vector-icons for all UI actions

### Accessibility
- Minimum touch target: 44x44pt
- Color contrast ratio: 4.5:1 for text
- Map pins distinguishable by shape + color (not color alone)
- Screen reader labels for all interactive elements
- Form inputs with clear labels and error states
- Bottom sheet overlay must be dismissable via swipe-down gesture

### Safety & Trust Signals
- Display trust score prominently (star rating + number of completed exchanges)
- Verified phone badge (checkmark icon)
- Report button accessible but not prominent (nested in menus)
- Exchange requests show preview of both users' ratings before confirmation
- Clear status indicators for active/completed/cancelled exchanges