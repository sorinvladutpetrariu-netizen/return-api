# 🚀 Authentication System Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
npm install expo-secure-store
```

### 2. Environment Setup

Create a `.env` file in the project root:

```env
# Backend
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wisdom_hub

# Frontend
EXPO_PUBLIC_API_URL=http://192.168.100.8:3000
```

### 3. Start Backend

**Option A: With PostgreSQL (Production)**
```bash
npx tsx server/index.ts
```

**Option B: Mock Backend (Development/Testing)**
```bash
npx tsx server/mock-index.ts
```

### 4. Start Frontend

```bash
npm start
```

Then choose:
- Press `w` for web
- Press `i` for iOS
- Press `a` for Android

### 5. Test Authentication

```bash
node test-auth.js
```

## File Structure

```
wisdom-hub/
├── app/
│   ├── auth/
│   │   ├── _layout.tsx          # Auth navigation layout
│   │   ├── login.tsx            # Login screen
│   │   └── signup.tsx           # Signup screen
│   ├── (tabs)/
│   │   └── index.tsx            # Home screen (protected)
│   └── _layout.tsx              # Root layout with auth flow
├── context/
│   └── AuthContext.tsx          # Authentication context & logic
├── hooks/
│   └── use-auth.ts              # Auth hook
├── server/
│   ├── index.ts                 # Production backend
│   └── mock-index.ts            # Mock backend for testing
├── AUTHENTICATION.md            # Full authentication docs
├── SETUP_AUTH.md               # This file
└── test-auth.js                # Authentication tests
```

## Features Implemented

### ✅ Authentication
- [x] User signup with email, password, and name
- [x] User login with email and password
- [x] JWT token generation and validation
- [x] Secure password hashing (bcryptjs)
- [x] Token persistence (expo-secure-store)
- [x] Automatic token validation on app start

### ✅ UI/UX
- [x] Login screen with form validation
- [x] Signup screen with form validation
- [x] Error messages for invalid inputs
- [x] Loading indicators during auth operations
- [x] Premium dark theme with gold accents
- [x] Responsive design for mobile and web

### ✅ Protected Routes
- [x] Automatic redirect to login for unauthenticated users
- [x] Protected home screen
- [x] Logout functionality
- [x] User info display on home screen

### ✅ Error Handling
- [x] Invalid email format validation
- [x] Password strength validation (min 6 characters)
- [x] Duplicate email prevention
- [x] Invalid password handling
- [x] Network error handling

## Testing Checklist

### Backend Tests
- [ ] Run `node test-auth.js`
- [ ] All 5 tests pass
- [ ] Signup creates new user
- [ ] Login authenticates user
- [ ] Token validation works
- [ ] Duplicate signup is rejected
- [ ] Invalid login is rejected

### Frontend Tests (Web)
- [ ] Start with `npm start` and press `w`
- [ ] See login screen
- [ ] Signup with new account
- [ ] Redirected to home screen
- [ ] User info displayed
- [ ] Logout button works
- [ ] Redirected back to login

### Frontend Tests (Mobile)
- [ ] Start with `npm start` and press `i`
- [ ] Scan QR code with Expo Go
- [ ] See login screen
- [ ] Signup with new account
- [ ] Redirected to home screen
- [ ] User info displayed
- [ ] Logout button works
- [ ] Redirected back to login

## Color Scheme

The authentication screens use Wisdom Hub's premium color palette:

- **Gold**: `#efc07b` - Primary accent color
- **Dark Background**: `#1A1A2E` - Main background
- **Dark Card**: `#0f3460` - Input fields and cards
- **Text**: `#ffffff` - Primary text
- **Text Secondary**: `#b0b0b0` - Secondary text
- **Error**: `#ff6b6b` - Error messages

## API Endpoints

### Public Endpoints
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Authenticate user
- `GET /quotes/today` - Get today's quote
- `GET /quotes` - Get all quotes
- `GET /health` - Health check

### Protected Endpoints
- `GET /auth/me` - Get current user
- `GET /articles` - Get articles (requires token)
- `GET /books` - Get books (requires token)

## Troubleshooting

### Issue: "Cannot find module 'expo-secure-store'"
```bash
npm install expo-secure-store
```

### Issue: "TypeScript not found"
```bash
npm install --save-dev typescript@~5.9.2
```

### Issue: Backend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill existing process
kill -9 <PID>

# Try mock backend
npx tsx server/mock-index.ts
```

### Issue: Frontend won't connect to backend
- Check `EXPO_PUBLIC_API_URL` in `.env`
- For mobile: Use your computer's IP address (e.g., 192.168.100.8)
- For web: Use localhost:3000
- Ensure backend is running on port 3000

### Issue: Login fails with "Invalid email or password"
- Check email spelling
- Ensure password is correct (case-sensitive)
- Try signup with a new account

## Next Steps

1. **Database Integration**
   - Set up PostgreSQL
   - Update `server/index.ts` with database connection

2. **Email Verification**
   - Add email verification on signup
   - Send verification emails

3. **Password Reset**
   - Implement password reset flow
   - Send reset emails

4. **Two-Factor Authentication**
   - Add 2FA option
   - SMS or authenticator app support

5. **Social Login**
   - Add Google OAuth
   - Add Apple Sign In
   - Add Facebook Login

## Support

For more information:
- See `AUTHENTICATION.md` for detailed API documentation
- Check backend logs: `tail -f /tmp/backend.log`
- Check frontend logs in browser console or Expo Go
- Run tests: `node test-auth.js`

## License

Wisdom Hub Authentication System - All rights reserved
