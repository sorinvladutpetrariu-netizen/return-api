import Stripe from 'stripe';
import { Pool } from 'pg';
import express, { Request, Response } from 'express';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'wisdom_hub',
});

const router = express.Router();

/**
 * POST /stripe/create-payment-intent
 * Create a Stripe payment intent for purchasing content
 */
router.post('/stripe/create-payment-intent', async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'usd', description, user_id, content_type, content_id } = req.body;

    if (!amount || !user_id || !content_type || !content_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      description,
      metadata: {
        user_id,
        content_type, // 'article', 'book', 'course'
        content_id,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

/**
 * POST /stripe/confirm-payment
 * Confirm payment and create purchase record
 */
router.post('/stripe/confirm-payment', async (req: Request, res: Response) => {
  try {
    const { paymentIntentId, user_id, content_type, content_id, price } = req.body;

    if (!paymentIntentId || !user_id || !content_type || !content_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    // Create purchase record in database
    let purchaseQuery = '';
    const values = [user_id, price, 'stripe', paymentIntentId, 'completed'];

    if (content_type === 'article') {
      purchaseQuery = `
        INSERT INTO purchases (user_id, article_id, price, payment_method, stripe_payment_id, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, created_at
      `;
      values.splice(1, 0, content_id);
    } else if (content_type === 'book') {
      purchaseQuery = `
        INSERT INTO purchases (user_id, book_id, price, payment_method, stripe_payment_id, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, created_at
      `;
      values.splice(1, 0, content_id);
    } else if (content_type === 'course') {
      purchaseQuery = `
        INSERT INTO purchases (user_id, course_id, price, payment_method, stripe_payment_id, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, created_at
      `;
      values.splice(1, 0, content_id);
    }

    const result = await pool.query(purchaseQuery, values);
    const purchase = result.rows[0];

    // If affiliate code is provided, create commission
    const affiliateCode = paymentIntent.metadata?.affiliate_code;
    if (affiliateCode) {
      const affiliateResult = await pool.query(
        'SELECT id FROM affiliates WHERE affiliate_code = $1',
        [affiliateCode]
      );

      if (affiliateResult.rows.length > 0) {
        const affiliate = affiliateResult.rows[0];
        const commissionAmount = price * 0.2; // 20% commission

        await pool.query(
          `INSERT INTO commissions (affiliate_id, purchase_id, amount, status)
           VALUES ($1, $2, $3, $4)`,
          [affiliate.id, purchase.id, commissionAmount, 'pending']
        );
      }
    }

    res.json({
      message: 'Payment successful',
      purchase: {
        id: purchase.id,
        created_at: purchase.created_at,
      },
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

/**
 * POST /stripe/webhook
 * Handle Stripe webhook events
 */
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', event.data.object);
        break;

      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object);
        break;

      case 'charge.refunded':
        const refund = event.data.object;
        // Update purchase status to refunded
        await pool.query(
          'UPDATE purchases SET status = $1 WHERE stripe_payment_id = $2',
          ['refunded', refund.payment_intent]
        );
        console.log('Refund processed:', refund);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

/**
 * GET /stripe/payment-methods
 * Get available payment methods for user
 */
router.get('/stripe/payment-methods', async (req: Request, res: Response) => {
  try {
    // Return supported payment methods
    res.json({
      paymentMethods: [
        { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
        { id: 'apple_pay', name: 'Apple Pay', icon: '🍎' },
        { id: 'google_pay', name: 'Google Pay', icon: '🔵' },
        { id: 'alipay', name: 'Alipay', icon: '🇨🇳' },
        { id: 'klarna', name: 'Klarna', icon: '📦' },
      ],
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

export default router;
