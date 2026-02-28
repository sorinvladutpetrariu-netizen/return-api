# 📧 SendGrid Email Configuration Guide

## Overview

Wisdom Hub uses SendGrid to send transactional emails for:
- Email verification
- Password reset
- Welcome emails
- Purchase receipts
- Contact form responses

## Setup Instructions

### 1. Create SendGrid Account

1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up for a free account
3. Complete email verification
4. Verify your sender email address

### 2. Get API Key

1. Login to SendGrid Dashboard
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name it: `Wisdom Hub`
5. Select **Full Access** or **Mail Send** permission
6. Copy the API key

### 3. Configure Environment Variables

Add to `.env` file:

```env
SENDGRID_API_KEY=SG.your_api_key_here
FROM_EMAIL=noreply@wisdomhub.com
FROM_NAME=Wisdom Hub
APP_URL=http://localhost:3000
```

### 4. Verify Sender Email

1. In SendGrid Dashboard → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Enter your email address
4. Click verification link in email
5. Now you can send from that email

## Email Templates

### 1. Verification Email

Sent when user signs up. Contains:
- Welcome message
- Verification link
- 24-hour expiration notice

**Usage:**
```typescript
import { sendVerificationEmail } from './sendgrid-service';

await sendVerificationEmail(
  'user@example.com',
  'John Doe',
  'verification_token_here',
  'http://localhost:3000'
);
```

### 2. Password Reset Email

Sent when user requests password reset. Contains:
- Reset link
- 1-hour expiration warning
- Security notice

**Usage:**
```typescript
import { sendPasswordResetEmail } from './sendgrid-service';

await sendPasswordResetEmail(
  'user@example.com',
  'John Doe',
  'reset_token_here',
  'http://localhost:3000'
);
```

### 3. Welcome Email

Sent after email verification. Contains:
- Welcome message
- Feature list
- Call to action

**Usage:**
```typescript
import { sendWelcomeEmail } from './sendgrid-service';

await sendWelcomeEmail('user@example.com', 'John Doe');
```

### 4. Purchase Receipt Email

Sent after successful payment. Contains:
- Item name
- Amount paid
- Transaction ID
- Date

**Usage:**
```typescript
import { sendPurchaseReceiptEmail } from './sendgrid-service';

await sendPurchaseReceiptEmail(
  'user@example.com',
  'John Doe',
  'Premium Article: The Art of Wisdom',
  999, // amount in cents
  'pi_1234567890'
);
```

### 5. Contact Form Response

Sent when user submits contact form. Contains:
- Confirmation message
- User's message
- Response time estimate

**Usage:**
```typescript
import { sendContactFormResponse } from './sendgrid-service';

await sendContactFormResponse(
  'user@example.com',
  'John Doe',
  'I have a question about your service'
);
```

## Integration with Backend

### Update Auth Endpoints

In `server/stripe-index.ts`, update signup to send verification email:

```typescript
app.post('/auth/signup', async (req: Request, res: Response) => {
  try {
    // ... existing code ...
    
    const verificationToken = generateToken();
    
    // Send verification email
    await sendVerificationEmail(
      email,
      name,
      verificationToken,
      process.env.APP_URL || 'http://localhost:3000'
    );
    
    // ... rest of code ...
  } catch (error) {
    // ... error handling ...
  }
});
```

### Update Verification Endpoint

```typescript
app.post('/auth/verify-email', async (req: Request, res: Response) => {
  try {
    // ... existing verification code ...
    
    // Send welcome email
    await sendWelcomeEmail(user[0].email, user[0].name);
    
    // ... rest of code ...
  } catch (error) {
    // ... error handling ...
  }
});
```

### Update Password Reset Endpoint

```typescript
app.post('/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    // ... existing code ...
    
    if (user.length > 0) {
      const resetToken = generateToken();
      
      // Send reset email
      await sendPasswordResetEmail(
        email,
        user[0].name,
        resetToken,
        process.env.APP_URL || 'http://localhost:3000'
      );
    }
    
    // ... rest of code ...
  } catch (error) {
    // ... error handling ...
  }
});
```

### Update Payment Confirmation

```typescript
app.post('/payments/confirm', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    // ... existing payment code ...
    
    // Send receipt email
    await sendPurchaseReceiptEmail(
      req.user?.email || '',
      user[0].name,
      article[0].title,
      amount,
      paymentIntentId
    );
    
    // ... rest of code ...
  } catch (error) {
    // ... error handling ...
  }
});
```

## Testing

### Test Email Sending

```bash
# Create a test script
cat > test-email.js << 'EOF'
const { sendVerificationEmail } = require('./server/sendgrid-service');

sendVerificationEmail(
  'your-email@example.com',
  'Test User',
  'test_token_123',
  'http://localhost:3000'
).then(result => {
  console.log('Email result:', result);
}).catch(error => {
  console.error('Error:', error);
});
EOF

# Run it
node test-email.js
```

### Check Email Logs

In SendGrid Dashboard:
1. Go to **Mail Send** → **Statistics**
2. View delivery status
3. Check bounces and complaints
4. Monitor open rates and clicks

## Troubleshooting

### "Invalid API Key"
- Verify the API key is correct
- Make sure it's not expired
- Check that you copied the entire key

### "Sender email not verified"
- Go to **Sender Authentication**
- Verify your sender email
- Check spam folder for verification email

### "Email not received"
- Check spam/junk folder
- Verify recipient email is correct
- Check SendGrid activity log
- Review bounce/complaint reports

### "Rate limit exceeded"
- SendGrid free tier: 100 emails/day
- Upgrade plan for higher limits
- Implement email queue for bulk sends

## Production Checklist

- [ ] SendGrid account created
- [ ] API key generated and secured
- [ ] Sender email verified
- [ ] Environment variables configured
- [ ] Email templates tested
- [ ] All endpoints integrated
- [ ] Bounce handling implemented
- [ ] Unsubscribe link added
- [ ] Email logs monitored
- [ ] Compliance with CAN-SPAM verified

## Best Practices

✅ **Do's**:
- Always verify sender email
- Include unsubscribe link in emails
- Monitor bounce rates
- Use templates for consistency
- Test emails before production
- Keep API key secure

❌ **Don'ts**:
- Don't expose API key in frontend
- Don't send to invalid emails
- Don't ignore bounce notifications
- Don't use generic sender names
- Don't skip email verification

## Resources

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [SendGrid API Reference](https://docs.sendgrid.com/api-reference/)
- [SendGrid Pricing](https://sendgrid.com/pricing/)
- [Email Best Practices](https://docs.sendgrid.com/ui/sending-email/email-best-practices/)

---

**Last Updated**: February 25, 2026
**Status**: ✅ Ready for Integration
**Version**: 1.0.0
