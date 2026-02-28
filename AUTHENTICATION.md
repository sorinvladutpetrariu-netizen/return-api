# 🔐 Wisdom Hub Authentication System

## Overview

Wisdom Hub implements a complete JWT-based authentication system with secure password hashing and token management. The system is designed to work seamlessly across web and mobile platforms.

## Architecture

### Components

1. **Backend (Node.js + Express)**
   - Authentication endpoints (signup, login, verify)
   - JWT token generation and validation
   - Password hashing with bcryptjs
   - User management

2. **Frontend (React Native + Expo)**
   - AuthContext for state management
   - Secure token storage (expo-secure-store)
   - Login/Signup screens with validation
   - Protected routes

3. **Database**
   - PostgreSQL (production)
   - In-memory storage (development/testing)

## Backend API Endpoints

### Authentication Routes

#### `POST /auth/signup`
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "user_1234567890",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `400`: Missing required fields
- `409`: User already exists

#### `POST /auth/login`
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user_1234567890",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `400`: Missing email or password
- `401`: Invalid email or password

#### `GET /auth/me`
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "user": {
    "id": "user_1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2026-02-25T23:32:22.581Z"
  }
}
```

**Errors:**
- `401`: No token or invalid token
- `404`: User not found

## Frontend Implementation

### AuthContext

The `AuthContext` manages authentication state and provides methods for login, signup, and logout.

**Location:** `context/AuthContext.tsx`

**Usage:**
```tsx
import { useAuth } from '@/hooks/use-auth';

export default function MyComponent() {
  const { user, token, isAuthenticated, login, signup, logout, loading } = useAuth();

  return (
    // Your component
  );
}
```

### Features

- **Automatic Token Persistence**: Tokens are automatically saved to secure storage
- **Token Validation**: Tokens are validated on app startup
- **Error Handling**: Comprehensive error messages for failed operations
- **Loading States**: Loading indicators during auth operations

### Login Screen

**Location:** `app/auth/login.tsx`

Features:
- Email and password validation
- Real-time error display
- Loading indicator during login
- Link to signup screen
- Premium dark theme with gold accents

### Signup Screen

**Location:** `app/auth/signup.tsx`

Features:
- Name, email, and password validation
- Password confirmation
- Real-time error display
- Loading indicator during signup
- Link to login screen
- Premium dark theme with gold accents

### Protected Routes

The root layout (`app/_layout.tsx`) automatically handles route protection:

```tsx
{isAuthenticated ? (
  <>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
  </>
) : (
  <Stack.Screen name="auth" options={{ headerShown: false }} />
)}
```

Unauthenticated users are automatically redirected to the login screen.

## Security Features

### Password Security
- Passwords are hashed using bcryptjs with 10 salt rounds
- Passwords are never stored in plain text
- Passwords are never transmitted in responses

### Token Security
- JWT tokens are signed with a secret key
- Tokens expire after 7 days
- Tokens are stored in secure storage (expo-secure-store on mobile)
- Tokens are validated on every protected request

### Data Protection
- CORS is enabled for secure cross-origin requests
- All sensitive endpoints require authentication
- Error messages don't reveal sensitive information

## Environment Variables

### Backend

```env
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wisdom_hub
```

### Frontend

```env
EXPO_PUBLIC_API_URL=http://192.168.100.8:3000
```

## Testing

Run the authentication tests:

```bash
node test-auth.js
```

This will test:
1. User signup
2. User login
3. Get current user info
4. Invalid login handling
5. Duplicate signup prevention

## Development vs Production

### Development
- Uses in-memory database (mock-index.ts)
- JWT secret is a default value
- CORS allows all origins

### Production
- Uses PostgreSQL database
- JWT secret should be a strong random value
- CORS should be restricted to your domain
- HTTPS should be enforced

## Common Issues

### Issue: "No token provided" error
**Solution**: Ensure you're including the Authorization header with the Bearer token.

### Issue: "Invalid token" error
**Solution**: Token may have expired. User needs to log in again.

### Issue: "User already exists" error
**Solution**: Use a different email address or log in with existing account.

### Issue: "Invalid email or password" error
**Solution**: Check that email and password are correct. Note: Passwords are case-sensitive.

## Next Steps

1. **Database Integration**: Connect to PostgreSQL for production
2. **Email Verification**: Add email verification on signup
3. **Password Reset**: Implement password reset functionality
4. **Two-Factor Authentication**: Add 2FA for enhanced security
5. **Social Login**: Add OAuth integration (Google, Apple, etc.)
6. **Session Management**: Implement refresh tokens for better security

## Support

For issues or questions about the authentication system, please check:
- Backend logs: `npm run server`
- Frontend logs: Browser console or Expo Go logs
- Test results: `node test-auth.js`
