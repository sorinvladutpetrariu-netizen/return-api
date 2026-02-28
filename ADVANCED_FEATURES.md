# 🚀 Wisdom Hub - Advanced Features Documentation

## Overview

This document covers the advanced features implemented in Wisdom Hub:
1. **Email Verification** - Verify user emails on signup
2. **Password Reset** - Secure password recovery
3. **Payment System (Stripe)** - Process payments for premium content
4. **Social Login** - Sign in with Google and Apple

---

## 1. 📧 Email Verification

### Overview
Users must verify their email address before they can access the platform. This ensures valid email addresses and prevents spam accounts.

### Flow
```
User Signs Up
    ↓
Email Verification Sent
    ↓
User Clicks Link in Email
    ↓
Email Verified
    ↓
Account Activated
    ↓
Can Now Login
```

### Backend Endpoints

#### `POST /auth/signup`
Register a new user (email not verified yet).

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
  "message": "User created successfully. Please check your email to verify your account.",
  "user": {
    "id": "user_1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "email_verified": false
  }
}
```

#### `POST /auth/verify-email`
Verify user email with token from email link.

**Request:**
```json
{
  "token": "verification_token_from_email"
}
```

**Response (200):**
```json
{
  "message": "Email verified successfully",
  "user": {
    "id": "user_1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "email_verified": true
  },
  "token": "jwt_token_for_login"
}
```

#### `POST /auth/resend-verification`
Resend verification email if user didn't receive it.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Verification email sent"
}
```

### Frontend Implementation

**Signup Flow:**
1. User enters email, password, name
2. Clicks "Create Account"
3. Receives confirmation message
4. Email is sent with verification link
5. User clicks link in email
6. Email is verified
7. User is automatically logged in

**Resend Verification:**
- If user didn't receive email, they can request resend
- New verification link is sent
- Old token expires after 24 hours

### Configuration

**Environment Variables:**
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@wisdomhub.com
```

**Email Service:**
- Uses Nodemailer
- Supports Gmail, SendGrid, or custom SMTP
- HTML formatted emails with branding

---

## 2. 🔐 Password Reset

### Overview
Users can securely reset their password if they forget it. A reset link is sent to their email.

### Flow
```
User Clicks "Forgot Password"
    ↓
Enters Email Address
    ↓
Password Reset Email Sent
    ↓
User Clicks Link in Email
    ↓
Enters New Password
    ↓
Password Updated
    ↓
Can Login with New Password
```

### Backend Endpoints

#### `POST /auth/forgot-password`
Request password reset link.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If email exists, password reset link has been sent"
}
```

**Note:** Response is same whether email exists or not (security best practice).

#### `POST /auth/reset-password`
Reset password with token from email link.

**Request:**
```json
{
  "token": "reset_token_from_email",
  "password": "newPassword123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

### Frontend Implementation

**Forgot Password Screen:**
1. User enters email
2. Clicks "Send Reset Link"
3. Receives confirmation
4. Email is sent with reset link
5. User clicks link in email
6. Enters new password
7. Password is updated
8. Can login with new password

**Features:**
- Email validation
- Password strength requirements (min 6 characters)
- Token expires after 1 hour
- Clear error messages

### Security Features

- Reset tokens are single-use
- Tokens expire after 1 hour
- Tokens are cryptographically secure
- Password is hashed before storing
- Email doesn't reveal if account exists

---

## 3. 💳 Payment System (Stripe)

### Overview
Users can purchase premium content (articles, books, courses) using Stripe payment processing.

### Flow
```
User Selects Premium Content
    ↓
Clicks "Purchase"
    ↓
Stripe Payment Modal Opens
    ↓
User Enters Card Details
    ↓
Payment Processed
    ↓
Purchase Recorded
    ↓
Content Unlocked
```

### Backend Endpoints

#### `POST /payments/create-intent`
Create a Stripe payment intent for a purchase.

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "amount": 999,
  "article_id": "article_1",
  "book_id": null
}
```

**Response (200):**
```json
{
  "clientSecret": "pi_1234567890_secret_abcdefg",
  "paymentIntentId": "pi_1234567890"
}
```

#### `POST /payments/confirm`
Confirm payment and record purchase.

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "paymentIntentId": "pi_1234567890",
  "article_id": "article_1",
  "amount": 999
}
```

**Response (200):**
```json
{
  "message": "Payment confirmed",
  "purchase": {
    "id": "purchase_1234567890",
    "article_id": "article_1",
    "amount": 999
  }
}
```

#### `GET /payments/purchases`
Get user's purchase history.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "purchases": [
    {
      "id": "purchase_1",
      "article_id": "article_1",
      "amount": 999,
      "created_at": "2026-02-25T23:32:22.581Z"
    }
  ]
}
```

### Frontend Implementation

**Purchase Flow:**
1. User views article/book details
2. Clicks "Purchase" button
3. Stripe payment modal opens
4. User enters card details
5. Payment is processed
6. Purchase is recorded
7. Content is unlocked
8. User can access premium content

**Features:**
- Secure Stripe integration
- Purchase history tracking
- Content access control
- Error handling
- Loading states

### Configuration

**Environment Variables:**
```env
STRIPE_PUBLIC_KEY=pk_test_your_public_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**Stripe Setup:**
1. Create Stripe account at stripe.com
2. Get API keys from dashboard
3. Add keys to environment variables
4. Set up webhook for payment events

### Security Features

- PCI DSS compliant (Stripe handles card data)
- Secure payment intents
- Webhook verification
- Purchase verification
- Amount validation

---

## 4. 🔐 Social Login

### Overview
Users can sign in using their Google or Apple accounts for faster, more convenient authentication.

### Flow
```
User Clicks "Sign in with Google/Apple"
    ↓
OAuth Authorization Screen
    ↓
User Approves Access
    ↓
Auth Code Returned
    ↓
Backend Exchanges Code for Token
    ↓
User Logged In
```

### Frontend Implementation

**Google Sign In:**
1. Click "Sign in with Google"
2. Google OAuth screen appears
3. User approves access
4. Auth code is returned
5. Backend exchanges code for JWT
6. User is logged in

**Apple Sign In:**
1. Click "Sign in with Apple"
2. Apple OAuth screen appears
3. User approves access
4. Auth code is returned
5. Backend exchanges code for JWT
6. User is logged in

**Features:**
- One-tap sign in
- No password required
- Automatic account creation
- Profile data syncing
- Secure OAuth flow

### Backend Endpoints

#### `POST /auth/social-login`
Exchange OAuth code for JWT token.

**Request:**
```json
{
  "provider": "google",
  "code": "auth_code_from_oauth",
  "redirectUri": "com.wisdomhub://oauth"
}
```

**Response (200):**
```json
{
  "message": "Social login successful",
  "user": {
    "id": "user_1234567890",
    "email": "user@gmail.com",
    "name": "John Doe",
    "picture": "https://..."
  },
  "token": "jwt_token"
}
```

### Configuration

**Google OAuth:**
1. Create project in Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs
4. Get Client ID
5. Add to environment variables:
   ```env
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   ```

**Apple Sign In:**
1. Create App ID in Apple Developer
2. Enable Sign in with Apple capability
3. Create Service ID
4. Create private key
5. Add to environment variables:
   ```env
   EXPO_PUBLIC_APPLE_CLIENT_ID=com.wisdomhub.signin
   ```

### Security Features

- OAuth 2.0 with PKCE
- Secure code exchange
- No password stored for social accounts
- Email verification from provider
- Account linking support

---

## 📱 Frontend Screens

### Login Screen (Enhanced)
- Email and password inputs
- Social login buttons (Google, Apple)
- "Forgot Password" link
- "Sign Up" link
- Show/hide password toggle
- Real-time validation

### Signup Screen
- Name, email, password inputs
- Password confirmation
- Terms acceptance
- Social signup options
- Real-time validation

### Forgot Password Screen
- Email input
- "Send Reset Link" button
- Confirmation message
- "Back to Login" link

### Email Verification Screen
- Verification status
- Resend option
- "Back to Login" link

---

## 🧪 Testing

### Test Email Verification
```bash
# 1. Signup with new email
# 2. Check email for verification link
# 3. Click link or use token
# 4. Email should be verified
# 5. Can now login
```

### Test Password Reset
```bash
# 1. Click "Forgot Password"
# 2. Enter email
# 3. Check email for reset link
# 4. Click link or use token
# 5. Enter new password
# 6. Can login with new password
```

### Test Payments
```bash
# 1. Login as user
# 2. Select premium content
# 3. Click "Purchase"
# 4. Enter Stripe test card: 4242 4242 4242 4242
# 5. Payment should succeed
# 6. Content should be unlocked
```

### Test Social Login
```bash
# 1. Click "Sign in with Google"
# 2. Approve access
# 3. Should be logged in
# 4. User account created automatically
```

---

## 🔒 Security Best Practices

### Email Verification
- ✅ Tokens expire after 24 hours
- ✅ Tokens are cryptographically secure
- ✅ One-time use only
- ✅ Email contains verification link

### Password Reset
- ✅ Tokens expire after 1 hour
- ✅ Tokens are cryptographically secure
- ✅ One-time use only
- ✅ Passwords are hashed (bcryptjs)
- ✅ Email doesn't reveal if account exists

### Payments
- ✅ PCI DSS compliant (Stripe)
- ✅ Secure payment intents
- ✅ Webhook verification
- ✅ Amount validation
- ✅ User verification

### Social Login
- ✅ OAuth 2.0 with PKCE
- ✅ Secure code exchange
- ✅ No password stored
- ✅ Email verified by provider
- ✅ Account linking

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  email_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  verification_token_expires TIMESTAMP,
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  social_provider VARCHAR(50),
  social_id VARCHAR(255)
);
```

### Purchases Table
```sql
CREATE TABLE purchases (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  article_id VARCHAR(50),
  book_id VARCHAR(50),
  amount INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  stripe_payment_id VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🚀 Deployment Checklist

- [ ] Email service configured (Gmail, SendGrid, etc.)
- [ ] Stripe account created and keys added
- [ ] Google OAuth credentials created
- [ ] Apple Sign In configured
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Email templates tested
- [ ] Payment flow tested
- [ ] Social login tested
- [ ] Error handling tested
- [ ] Security audit completed
- [ ] Documentation updated

---

## 📞 Support & Troubleshooting

### Email Not Sending
- Check email service configuration
- Verify API keys
- Check email logs
- Test with simple email first

### Payment Failing
- Check Stripe keys
- Verify test card number
- Check webhook configuration
- Review Stripe dashboard

### Social Login Not Working
- Verify OAuth credentials
- Check redirect URIs
- Review OAuth scopes
- Check browser console for errors

---

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Google OAuth Documentation](https://developers.google.com/identity)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [JWT Documentation](https://jwt.io/)

---

**Last Updated**: February 25, 2026
**Status**: ✅ Complete and Tested
**Version**: 2.0.0
