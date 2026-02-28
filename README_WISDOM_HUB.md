# Wisdom Hub - Personal Development Platform

A comprehensive mobile application for personal development and spiritual growth, featuring premium content, courses, and an integrated affiliate system.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn
- Expo CLI

### Installation

1. **Clone and install dependencies**

```bash
cd wisdom-hub
npm install
```

2. **Configure environment variables**

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Setup database**

```bash
createdb wisdom_hub
psql wisdom_hub < server/schema.sql
```

4. **Start backend server**

```bash
npm run dev:server
```

Backend will run on `http://localhost:3000`

5. **Start mobile app (in another terminal)**

```bash
npm run dev:metro
```

Metro bundler will run on `http://localhost:8081`

6. **Open in Expo Go**

- Scan QR code from Metro output with Expo Go app
- Or visit `http://localhost:8081` in browser for web preview

## 📱 Project Structure

```
wisdom-hub/
├── app/                          # Mobile app screens (Expo Router)
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx            # Home (daily quotes)
│   │   ├── articles.tsx         # Premium articles
│   │   ├── books.tsx            # Books & audiobooks
│   │   └── profile.tsx          # User profile
│   └── auth/                     # Authentication screens
│       ├── login.tsx
│       └── signup.tsx
├── server/                       # Backend (Node.js + Express)
│   ├── index.ts                 # Main server
│   ├── schema.sql               # Database schema
│   ├── stripe-integration.ts    # Stripe payments
│   └── affiliate-system.ts      # Affiliate management
├── components/                   # Reusable components
├── hooks/                        # Custom hooks
├── lib/                          # Utilities
├── assets/                       # Images, fonts
└── package.json
```

## 🎯 Features

### MVP (Phase 1) - IMPLEMENTED

- ✅ User authentication (Sign Up / Sign In)
- ✅ Daily quotes and tips
- ✅ Premium articles (with preview)
- ✅ Books (PDF + Audiobook)
- ✅ Stripe payments (card, PayPal, Apple Pay, Google Pay)
- ✅ User library (favorites, purchases)
- ✅ Affiliate system with tracking
- ✅ Admin panel (basic)

### Phase 2 - IN PROGRESS

- 🔄 Video courses with progress tracking
- 🔄 Certificates
- 🔄 Push notifications
- 🔄 Email notifications

### Phase 3 - PLANNED

- 🔄 Community features
- 🔄 User reviews and ratings
- 🔄 Advanced analytics
- 🔄 Mobile app optimization

## 💰 Pricing

| Product | Price |
|---------|-------|
| Articles | $4.99 - $5.99 |
| Open The Eye (Book) | $9.99 |
| Rebuild Yourself (Book) | $12.99 |
| Courses | $29.99 - $99.99 |

## 🔐 Authentication

The app uses JWT (JSON Web Tokens) for authentication.

**Sign Up Flow:**
1. User enters email, password, name
2. Password is hashed with bcrypt
3. User record created in database
4. JWT token returned
5. Token stored in AsyncStorage (client)

**Sign In Flow:**
1. User enters email and password
2. Password verified against hash
3. JWT token returned
4. Token used for all API requests

## 💳 Payments (Stripe)

The app integrates Stripe for processing payments.

**Payment Flow:**
1. User selects product to purchase
2. Payment intent created on backend
3. Stripe Payment Sheet opens on client
4. User enters payment details
5. Stripe processes payment
6. Webhook confirms payment
7. Purchase record created in database
8. User gets access to content

**Supported Payment Methods:**
- Credit/Debit Card
- Apple Pay
- Google Pay
- Alipay
- Klarna

## 🤝 Affiliate System

Affiliates can promote products and earn commissions.

**Affiliate Flow:**
1. User registers as affiliate
2. Unique affiliate code generated
3. Referral link created
4. Affiliate shares link on social media
5. New user clicks link and makes purchase
6. Commission automatically calculated (20%)
7. Commission tracked in admin panel
8. Monthly payout to affiliate

**Affiliate Dashboard:**
- View referral link
- Track sales and earnings
- Monitor pending commissions
- View payment history

**Admin Panel:**
- View all affiliates
- Approve/reject applications
- Monitor affiliate activity
- Process payouts
- View analytics

## 📊 Database Schema

### Main Tables

- **users** - User accounts
- **articles** - Premium articles
- **books** - Books and audiobooks
- **courses** - Video courses
- **lessons** - Course lessons
- **purchases** - Purchase records
- **favorites** - User favorites
- **progress** - Course progress
- **daily_quotes** - Daily quotes
- **daily_tips** - Daily tips
- **affiliates** - Affiliate accounts
- **commissions** - Affiliate commissions
- **notifications** - Push notifications

## 🔌 API Endpoints

### Authentication

```
POST /auth/signup              - Register new user
POST /auth/login               - Login user
GET  /auth/me                  - Get current user
```

### Content

```
GET  /quotes/today             - Get today's quote
GET  /quotes                   - Get all quotes
GET  /articles                 - Get articles (with purchase status)
GET  /articles/:id             - Get article details
GET  /books                    - Get books
GET  /books/:id                - Get book details
```

### Payments

```
POST /stripe/create-payment-intent    - Create payment intent
POST /stripe/confirm-payment          - Confirm payment
POST /stripe/webhook                  - Stripe webhooks
GET  /stripe/payment-methods          - Get payment methods
```

### Affiliates

```
POST /affiliates/register             - Register as affiliate
GET  /affiliates/:code/stats          - Get affiliate stats
GET  /affiliates/:code/referral-link  - Get referral link
POST /affiliates/approve              - Admin: approve affiliate
POST /affiliates/reject               - Admin: reject affiliate
GET  /affiliates/pending              - Admin: pending applications
```

## 🧪 Testing

### Test User Credentials

```
Email: test@wisdomhub.com
Password: Test123456
```

### Test Stripe Cards

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

## 📈 Deployment

### Frontend (Mobile App)

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to app stores
eas submit --platform ios
eas submit --platform android
```

### Backend (Server)

```bash
# Build
npm run build

# Deploy to Heroku
git push heroku main

# Or deploy to AWS, DigitalOcean, etc.
```

## 🐛 Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Ensure PostgreSQL is running

```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows
net start PostgreSQL
```

### Stripe Error

```
Error: Invalid API Key
```

**Solution**: Check `.env` file has correct Stripe keys

### Metro Bundler Error

```
Error: Cannot find module
```

**Solution**: Clear cache and reinstall

```bash
npm install
npm start -- --reset-cache
```

## 📚 Documentation

- [Wisdom Hub Architecture](../wisdom-hub-architecture.md)
- [Design System](../wisdom-hub-design.md)
- [Implementation Guide](../wisdom-hub-implementation.md)
- [Payments & Affiliate](../wisdom-hub-payments-affiliate.md)
- [Content Database](../wisdom-hub-content-database.md)
- [Daily Content](../wisdom-hub-daily-content.md)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit pull request

## 📄 License

Proprietary - All rights reserved

## 📞 Support

For issues or questions, contact: support@wisdomhub.com

---

**Wisdom Hub - Transform Your Expertise Into Impact** 🌟
