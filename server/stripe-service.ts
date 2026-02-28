import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16',
});

export interface CreatePaymentIntentParams {
  amount: number; // in cents
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface ConfirmPaymentParams {
  paymentIntentId: string;
  paymentMethodId: string;
}

/**
 * Create a Stripe payment intent
 */
export async function createPaymentIntent(params: CreatePaymentIntentParams) {
  try {
    const intent = await stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency || 'usd',
      description: params.description,
      metadata: params.metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      status: intent.status,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

/**
 * Confirm a payment intent
 */
export async function confirmPaymentIntent(paymentIntentId: string) {
  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      paymentIntentId: intent.id,
      status: intent.status,
      amount: intent.amount,
      currency: intent.currency,
      charges: intent.charges.data,
    };
  } catch (error) {
    console.error('Error confirming payment intent:', error);
    throw error;
  }
}

/**
 * Create a customer
 */
export async function createCustomer(email: string, name: string) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
    });

    return {
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
    };
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

/**
 * Create a setup intent for saving payment methods
 */
export async function createSetupIntent(customerId: string) {
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });

    return {
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    };
  } catch (error) {
    console.error('Error creating setup intent:', error);
    throw error;
  }
}

/**
 * Retrieve payment method
 */
export async function getPaymentMethod(paymentMethodId: string) {
  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    return {
      id: paymentMethod.id,
      type: paymentMethod.type,
      card: paymentMethod.card,
      billing_details: paymentMethod.billing_details,
    };
  } catch (error) {
    console.error('Error retrieving payment method:', error);
    throw error;
  }
}

/**
 * Retrieve invoice
 */
export async function getInvoice(invoiceId: string) {
  try {
    const invoice = await stripe.invoices.retrieve(invoiceId);

    return {
      id: invoice.id,
      amount: invoice.amount_paid,
      status: invoice.status,
      paid: invoice.paid,
      url: invoice.hosted_invoice_url,
    };
  } catch (error) {
    console.error('Error retrieving invoice:', error);
    throw error;
  }
}

/**
 * Handle webhook event
 */
export async function handleWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('✅ Payment succeeded:', event.data.object);
      return { success: true, type: 'payment_succeeded' };

    case 'payment_intent.payment_failed':
      console.log('❌ Payment failed:', event.data.object);
      return { success: false, type: 'payment_failed' };

    case 'charge.refunded':
      console.log('💰 Charge refunded:', event.data.object);
      return { success: true, type: 'charge_refunded' };

    default:
      console.log('Unknown event type:', event.type);
      return { success: true, type: 'unknown' };
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(body: string, signature: string, secret: string): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw error;
  }
}
