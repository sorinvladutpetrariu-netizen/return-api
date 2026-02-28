# 📧 Gmail + Nodemailer Setup Guide

## Overview

Wisdom Hub uses **Nodemailer + Gmail** for sending transactional emails. It's **100% free** and requires no external services.

## Setup Instructions (5 minutes)

### Step 1: Create Gmail Account

1. Go to [gmail.com](https://gmail.com)
2. Create a new Gmail account (or use existing)
3. Example: `wisdom-hub-noreply@gmail.com`

### Step 2: Enable 2-Factor Authentication

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **Security** (left menu)
3. Scroll to **2-Step Verification**
4. Click **Enable**
5. Follow the steps

### Step 3: Generate App Password

1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select **Mail** and **Windows Computer**
3. Click **Generate**
4. Copy the 16-character password (without spaces)

### Step 4: Configure Environment Variables

Add to `.env` file:

```env
GMAIL_USER=wisdom-hub-noreply@gmail.com
GMAIL_PASSWORD=xxxx xxxx xxxx xxxx
FROM_NAME=Wisdom Hub
APP_URL=http://localhost:3000
```

**Note**: Use the 16-character app password, not your Gmail password!

## Usage

### Send Verification Email

```typescript
import { sendVerificationEmail } from './server/gmail-service';

await sendVerificationEmail(
  'user@example.com',
  'John Doe',
  'verification_token_here',
  'http://localhost:3000'
);
```

### Send Password Reset Email

```typescript
import { sendPasswordResetEmail } from './server/gmail-service';

await sendPasswordResetEmail(
  'user@example.com',
  'John Doe',
  'reset_token_here',
  'http://localhost:3000'
);
```

### Send Welcome Email

```typescript
import { sendWelcomeEmail } from './server/gmail-service';

await sendWelcomeEmail('user@example.com', 'John Doe');
```

### Send Purchase Receipt

```typescript
import { sendPurchaseReceiptEmail } from './server/gmail-service';

await sendPurchaseReceiptEmail(
  'user@example.com',
  'John Doe',
  'Premium Article: The Art of Wisdom',
  999, // amount in cents
  'pi_1234567890'
);
```

## Testing

### Test Email Sending

```bash
# Create test script
cat > test-gmail.js << 'EOF'
const { sendVerificationEmail } = require('./server/gmail-service');

sendVerificationEmail(
  'your-email@gmail.com',
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
node test-gmail.js
```

### Check Gmail Sent Folder

1. Login to Gmail
2. Go to **Sent** folder
3. Verify emails are there

## Limits

- **Free tier**: Unlimited emails (Gmail's limit is ~500/day)
- **Perfect for**: Startups, small apps, testing
- **No setup costs**: 100% free

## Troubleshooting

### "Invalid login credentials"
- Check `GMAIL_USER` is correct
- Verify `GMAIL_PASSWORD` is the 16-char app password
- Make sure 2-Factor Auth is enabled
- Try generating a new app password

### "Less secure app access"
- This is NOT the issue with app passwords
- App passwords bypass this restriction
- Make sure you're using app password, not Gmail password

### "Email not received"
- Check spam/junk folder
- Verify recipient email is correct
- Check Gmail sent folder
- Wait a few seconds (sometimes slow)

### "Too many login attempts"
- Gmail temporarily blocked the account
- Wait 24 hours or use different Gmail account
- Or switch to app password (if not already)

## Production Checklist

- [ ] Gmail account created
- [ ] 2-Factor Authentication enabled
- [ ] App password generated
- [ ] Environment variables configured
- [ ] Email templates tested
- [ ] All endpoints integrated
- [ ] Sent folder monitored
- [ ] Bounce handling implemented

## Best Practices

✅ **Do's**:
- Use a dedicated Gmail account for sending
- Keep app password secure (in `.env` only)
- Monitor sent folder for issues
- Test emails before production
- Use meaningful FROM_NAME

❌ **Don'ts**:
- Don't expose app password in code
- Don't use your personal Gmail password
- Don't send to invalid emails
- Don't ignore bounce notifications
- Don't skip 2-Factor Auth

## Upgrade Path

When your app grows:

| Stage | Solution | Cost |
|-------|----------|------|
| Development | Gmail + Nodemailer | Free |
| Small startup | Gmail + Nodemailer | Free |
| Growing app | Mailgun / Resend | $10-50/mo |
| Enterprise | SendGrid / AWS SES | $100+/mo |

## Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Gmail Security](https://support.google.com/accounts/answer/3466521)

---

**Last Updated**: February 25, 2026
**Status**: ✅ Production Ready
**Version**: 1.0.0
**Cost**: FREE ✨
