# 📱 Mobile Frontend Integration Guide

## Overview

This guide explains how to connect your Expo React Native frontend to the Wisdom Hub backend.

## Prerequisites

- Expo app running locally or on device
- Backend deployed (Railway) or running locally
- API URL configured

## Step 1: Configure API URL

### 1.1 Update Environment Variable

In `.env` file, set:

```env
EXPO_PUBLIC_API_URL=https://your-railway-app.up.railway.app
```

Or for local development:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### 1.2 Verify in AuthContext

The AuthContext automatically uses this URL:

```typescript
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
```

## Step 2: Authentication Flow

### 2.1 Signup

**Screen**: `app/auth/signup.tsx`

```typescript
const handleSignup = async () => {
  try {
    await signup(email, password, name);
    // User created, verification email sent
    // User should check email for verification link
  } catch (error) {
    Alert.alert('Signup failed', error.message);
  }
};
```

**What happens**:
1. User enters email, password, name
2. Account created in database
3. Verification email sent to Gmail
4. User must verify email before login

### 2.2 Email Verification

**Via Email Link**:
1. User receives verification email
2. Clicks link in email
3. Link opens app with verification token
4. Backend verifies token
5. Account activated

**Deep Link Setup** (optional):
```typescript
// In app/_layout.tsx
const linking = {
  prefixes: ['https://your-app.com', 'wisdomhub://'],
  config: {
    screens: {
      auth: {
        verify: 'verify/:token',
      },
    },
  },
};
```

### 2.3 Login

**Screen**: `app/auth/login.tsx`

```typescript
const handleLogin = async () => {
  try {
    await login(email, password);
    // Token saved securely
    // User redirected to home
  } catch (error) {
    if (error.response?.status === 403) {
      Alert.alert('Email not verified', 'Please check your email');
    } else {
      Alert.alert('Login failed', error.message);
    }
  }
};
```

**What happens**:
1. User enters email & password
2. Backend validates credentials
3. JWT token returned
4. Token saved in SecureStore
5. User logged in

### 2.4 Logout

```typescript
const handleLogout = async () => {
  try {
    await logout();
    // Token deleted
    // User redirected to login
  } catch (error) {
    Alert.alert('Logout failed', error.message);
  }
};
```

## Step 3: Protected Routes

### 3.1 Root Layout

In `app/_layout.tsx`:

```typescript
export default function RootLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack>
      {isAuthenticated ? (
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="auth" options={{ headerShown: false }} />
      )}
    </Stack>
  );
}
```

### 3.2 Automatic Redirection

- **Authenticated**: Shows home screen
- **Not authenticated**: Shows login screen
- **Loading**: Shows loading indicator

## Step 4: API Calls with Authentication

### 4.1 Using Axios with Token

```typescript
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

export function useApi() {
  const { token } = useAuth();

  const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
  });

  // Add token to all requests
  api.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return api;
}
```

### 4.2 Example: Fetch User Info

```typescript
const { token } = useAuth();

useEffect(() => {
  const fetchUser = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/auth/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  if (token) {
    fetchUser();
  }
}, [token]);
```

### 4.3 Example: Get Articles

```typescript
const [articles, setArticles] = useState([]);

useEffect(() => {
  const fetchArticles = async () => {
    try {
      const response = await axios.get(`${API_URL}/articles`);
      setArticles(response.data.articles);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    }
  };

  fetchArticles();
}, []);
```

### 4.4 Example: Create Payment

```typescript
const handlePayment = async (articleId: string, amount: number) => {
  try {
    // 1. Create payment intent
    const intentResponse = await axios.post(
      `${API_URL}/payments/create-intent`,
      {
        amount,
        article_id: articleId,
        description: 'Article Purchase',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const { clientSecret, paymentIntentId } = intentResponse.data;

    // 2. Process payment with Stripe (in real app)
    // ... Stripe payment processing ...

    // 3. Confirm payment
    const confirmResponse = await axios.post(
      `${API_URL}/payments/confirm`,
      {
        paymentIntentId,
        article_id: articleId,
        amount,
        itemName: 'Premium Article',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    Alert.alert('Success', 'Payment completed!');
  } catch (error) {
    Alert.alert('Payment failed', error.message);
  }
};
```

## Step 5: Error Handling

### 5.1 Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid/expired token | User needs to login again |
| 403 Forbidden | Email not verified | User needs to verify email |
| 404 Not Found | Endpoint doesn't exist | Check API URL and endpoint |
| 500 Server Error | Backend error | Check backend logs |

### 5.2 Error Handler

```typescript
const handleApiError = (error: any) => {
  if (error.response?.status === 401) {
    // Token expired, logout
    logout();
  } else if (error.response?.status === 403) {
    Alert.alert('Access Denied', error.response.data.error);
  } else if (error.response?.status === 404) {
    Alert.alert('Not Found', 'Resource not found');
  } else if (error.response?.status === 500) {
    Alert.alert('Server Error', 'Something went wrong on the server');
  } else {
    Alert.alert('Error', error.message);
  }
};
```

## Step 6: Testing

### 6.1 Local Testing

1. **Start backend**:
   ```bash
   cd /home/ubuntu/wisdom-hub
   npx tsx server/stripe-gmail-index.ts
   ```

2. **Set API URL**:
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:3000
   ```

3. **Start Expo**:
   ```bash
   npm start
   ```

4. **Test flow**:
   - Signup → Check email → Verify → Login → Home

### 6.2 Production Testing

1. **Deploy backend** to Railway
2. **Update API URL**:
   ```env
   EXPO_PUBLIC_API_URL=https://your-railway-app.up.railway.app
   ```
3. **Rebuild app** and test

### 6.3 Test Cases

- [ ] Signup with valid email
- [ ] Signup with duplicate email (should fail)
- [ ] Verify email with token
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Login with unverified email (should fail)
- [ ] Logout
- [ ] Auto-login on app restart
- [ ] Fetch articles
- [ ] Create payment
- [ ] Forgot password

## Step 7: Deployment

### 7.1 Build for iOS

```bash
eas build --platform ios
```

### 7.2 Build for Android

```bash
eas build --platform android
```

### 7.3 Submit to App Store

```bash
eas submit --platform ios
```

### 7.4 Submit to Google Play

```bash
eas submit --platform android
```

## Troubleshooting

### "Cannot reach backend"

**Check**:
- Backend is running
- API URL is correct
- Network connection is active
- Firewall not blocking

**Solution**:
```bash
# Test backend
curl https://your-api.com/health

# Check API URL in app
console.log(process.env.EXPO_PUBLIC_API_URL);
```

### "Token expired"

**Cause**: JWT token older than 7 days

**Solution**:
- User logs out automatically
- User needs to login again
- Implement token refresh (optional)

### "Email not sending"

**Check**:
- Gmail credentials in .env
- Sender email verified in Gmail
- 2FA enabled
- App password used (not Gmail password)

**Solution**:
```bash
# Test email
railway run node test-complete.js
```

### "Payment not working"

**Check**:
- Stripe keys configured
- Payment intent created successfully
- Webhook URL correct
- Test card used

**Solution**:
```bash
# Check Stripe logs
# Go to Stripe Dashboard → Logs
```

## Best Practices

✅ **Do's**:
- Always handle errors gracefully
- Show loading indicators
- Validate input before sending
- Use secure token storage
- Implement token refresh
- Log API errors for debugging

❌ **Don'ts**:
- Don't expose API URL in frontend code
- Don't store passwords
- Don't make API calls in render
- Don't ignore error responses
- Don't hardcode API keys

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [Axios Documentation](https://axios-http.com)
- [React Native Best Practices](https://reactnative.dev/docs/best-practices)
- [JWT Authentication](https://jwt.io)
- [Secure Storage](https://docs.expo.dev/modules/expo-secure-store/)

---

**Last Updated**: February 25, 2026
**Status**: ✅ Production Ready
**Version**: 1.0.0
