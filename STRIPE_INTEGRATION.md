# 💳 Stripe Integration Guide

## Overview

Wisdom Hub now includes full Stripe payment integration for processing purchases of premium content (articles, books, courses).

## Setup Instructions

### 1. Create Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Sign up for a new account
3. Complete verification process
4. Go to Dashboard → API Keys

### 2. Get API Keys

In Stripe Dashboard:
- **Publishable Key**: `pk_test_...` (for frontend)
- **Secret Key**: `sk_test_...` (for backend)
- **Webhook Secret**: `whsec_...` (for webhooks)

### 3. Configure Environment Variables

Add to `.env` file:

```env
STRIPE_PUBLIC_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 4. Set Up Webhook

1. In Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy webhook secret to `.env`

## API Endpoints

### Create Payment Intent

**Endpoint**: `POST /payments/create-intent`

**Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request**:
```json
{
  "amount": 999,
  "article_id": "article_1",
  "description": "Premium Article"
}
```

**Response**:
```json
{
  "clientSecret": "pi_1234567890_secret_abcdefg",
  "paymentIntentId": "pi_1234567890",
  "amount": 999,
  "currency": "usd",
  "status": "requires_payment_method"
}
```

### Confirm Payment

**Endpoint**: `POST /payments/confirm`

**Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request**:
```json
{
  "paymentIntentId": "pi_1234567890",
  "article_id": "article_1",
  "amount": 999
}
```

**Response**:
```json
{
  "message": "Payment confirmed and purchase recorded",
  "purchase": {
    "id": "purchase_1234567890",
    "article_id": "article_1",
    "amount": 999,
    "stripe_payment_id": "pi_1234567890"
  }
}
```

### Get Purchase History

**Endpoint**: `GET /payments/purchases`

**Headers**:
```
Authorization: Bearer {jwt_token}
```

**Response**:
```json
{
  "purchases": [
    {
      "id": "purchase_1",
      "user_id": "user_1",
      "article_id": "article_1",
      "amount": 999,
      "created_at": "2026-02-25T23:32:22.581Z",
      "stripe_payment_id": "pi_1234567890"
    }
  ]
}
```

## Frontend Integration

### 1. Install Stripe Libraries

```bash
npm install @stripe/react-stripe-js @stripe/js
```

### 2. Create Payment Component

```tsx
import { loadStripe } from '@stripe/js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

export function PaymentForm({ articleId, amount, token }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      // 1. Create payment intent
      const intentRes = await axios.post(
        'http://localhost:3000/payments/create-intent',
        { amount, article_id: articleId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { clientSecret, paymentIntentId } = intentRes.data;

      // 2. Confirm payment with Stripe
      const cardElement = elements?.getElement(CardElement);
      const result = await stripe?.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result?.paymentIntent?.status === 'succeeded') {
        // 3. Confirm on backend
        const confirmRes = await axios.post(
          'http://localhost:3000/payments/confirm',
          {
            paymentIntentId,
            article_id: articleId,
            amount,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('Payment successful:', confirmRes.data);
        // Show success message
      } else {
        console.error('Payment failed:', result?.error);
        // Show error message
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <CardElement />
      <button onClick={handlePayment} disabled={loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm articleId="article_1" amount={999} token={userToken} />
    </Elements>
  );
}
```

## Test Cards

Use these cards for testing in Stripe test mode:

| Card Number | Expiry | CVC | Result |
|-------------|--------|-----|--------|
| 4242 4242 4242 4242 | Any future date | Any 3 digits | Success |
| 4000 0000 0000 0002 | Any future date | Any 3 digits | Decline |
| 4000 0025 0000 3155 | Any future date | Any 3 digits | Require auth |

## Webhook Events

The backend automatically handles these webhook events:

- **payment_intent.succeeded** - Payment completed successfully
- **payment_intent.payment_failed** - Payment failed
- **charge.refunded** - Charge was refunded

## Security Best Practices

✅ **Do's**:
- Always verify payment intent on backend before granting access
- Store Stripe keys in environment variables
- Use HTTPS for all API calls
- Validate webhook signatures
- Never log sensitive payment data

❌ **Don'ts**:
- Never expose secret key in frontend code
- Never store raw card data
- Never skip webhook verification
- Never trust client-side payment status

## Testing Payment Flow

### 1. Create User

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### 2. Create Payment Intent

```bash
curl -X POST http://localhost:3000/payments/create-intent \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 999,
    "article_id": "article_1",
    "description": "Test Article"
  }'
```

### 3. Confirm Payment (in real app, Stripe handles this)

```bash
curl -X POST http://localhost:3000/payments/confirm \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_test_123",
    "article_id": "article_1",
    "amount": 999
  }'
```

### 4. Get Purchases

```bash
curl http://localhost:3000/payments/purchases \
  -H "Authorization: Bearer {token}"
```

## Troubleshooting

### "Invalid API Key"
- Check that `STRIPE_SECRET_KEY` is set correctly
- Make sure you're using the secret key, not the publishable key
- Verify the key is for the correct environment (test vs live)

### "Webhook signature verification failed"
- Check that `STRIPE_WEBHOOK_SECRET` is set correctly
- Verify the webhook endpoint URL is correct
- Make sure the webhook is configured for the correct events

### "Payment intent not found"
- Verify the payment intent ID is correct
- Check that the payment intent hasn't expired (24 hours)
- Ensure you're using the same Stripe account

## Production Checklist

- [ ] Switch to live Stripe keys
- [ ] Update webhook endpoint to production URL
- [ ] Enable SSL/HTTPS
- [ ] Set up error logging
- [ ] Configure email receipts
- [ ] Test refund process
- [ ] Set up monitoring and alerts
- [ ] Review security settings
- [ ] Test with real payment methods
- [ ] Set up accounting integration

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Security](https://stripe.com/docs/security)

---

**Last Updated**: February 25, 2026
**Status**: ✅ Production Ready
**Version**: 1.0.0
