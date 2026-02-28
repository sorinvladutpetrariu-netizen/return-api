import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@wisdomhub.com';
const FROM_NAME = process.env.FROM_NAME || 'Wisdom Hub';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email via SendGrid
 */
export async function sendEmail(options: EmailOptions) {
  try {
    if (!SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured. Email not sent.');
      return { success: false, error: 'SendGrid not configured' };
    }

    const msg = {
      to: options.to,
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const response = await sgMail.send(msg);
    console.log(`✅ Email sent to ${options.to}`);
    return { success: true, messageId: response[0].headers['x-message-id'] };
  } catch (error: any) {
    console.error('❌ Error sending email:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(email: string, name: string, token: string, appUrl: string) {
  const verificationLink = `${appUrl}/auth/verify?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 32px; font-weight: bold; color: #efc07b; }
          .content { color: #333; line-height: 1.6; }
          .button { display: inline-block; background-color: #efc07b; color: #1A1A2E; padding: 12px 30px; border-radius: 4px; text-decoration: none; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">W</div>
            <h1>Wisdom Hub</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Welcome to Wisdom Hub! Please verify your email address to get started.</p>
            <p>
              <a href="${verificationLink}" class="button">Verify Email</a>
            </p>
            <p>Or copy this link:</p>
            <p><code>${verificationLink}</code></p>
            <p>This link will expire in 24 hours.</p>
            <p>Best regards,<br>The Wisdom Hub Team</p>
          </div>
          <div class="footer">
            <p>© 2026 Wisdom Hub. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify Your Email - Wisdom Hub',
    html,
    text: `Hi ${name}, please verify your email by visiting: ${verificationLink}`,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, name: string, token: string, appUrl: string) {
  const resetLink = `${appUrl}/auth/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 32px; font-weight: bold; color: #efc07b; }
          .content { color: #333; line-height: 1.6; }
          .button { display: inline-block; background-color: #efc07b; color: #1A1A2E; padding: 12px 30px; border-radius: 4px; text-decoration: none; font-weight: bold; margin: 20px 0; }
          .warning { background-color: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">W</div>
            <h1>Wisdom Hub</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password.</p>
            <p>
              <a href="${resetLink}" class="button">Reset Password</a>
            </p>
            <p>Or copy this link:</p>
            <p><code>${resetLink}</code></p>
            <div class="warning">
              <strong>⚠️ Important:</strong> This link will expire in 1 hour. If you didn't request this, please ignore this email.
            </div>
            <p>Best regards,<br>The Wisdom Hub Team</p>
          </div>
          <div class="footer">
            <p>© 2026 Wisdom Hub. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - Wisdom Hub',
    html,
    text: `Hi ${name}, please reset your password by visiting: ${resetLink}. This link expires in 1 hour.`,
  });
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(email: string, name: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 32px; font-weight: bold; color: #efc07b; }
          .content { color: #333; line-height: 1.6; }
          .features { list-style: none; padding: 0; }
          .features li { padding: 10px 0; border-bottom: 1px solid #eee; }
          .features li:before { content: "✨ "; color: #efc07b; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">W</div>
            <h1>Welcome to Wisdom Hub!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Your email has been verified and your account is now active. Get ready to explore a world of wisdom and knowledge!</p>
            <h3>What you can do:</h3>
            <ul class="features">
              <li>Read daily inspirational quotes</li>
              <li>Access premium articles and insights</li>
              <li>Purchase and read books</li>
              <li>Track your reading progress</li>
              <li>Save your favorite content</li>
            </ul>
            <p>Start exploring now and unlock your potential!</p>
            <p>Best regards,<br>The Wisdom Hub Team</p>
          </div>
          <div class="footer">
            <p>© 2026 Wisdom Hub. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to Wisdom Hub!',
    html,
    text: `Hi ${name}, welcome to Wisdom Hub! Your account is now active and ready to use.`,
  });
}

/**
 * Send purchase receipt email
 */
export async function sendPurchaseReceiptEmail(
  email: string,
  name: string,
  itemName: string,
  amount: number,
  transactionId: string
) {
  const amountInDollars = (amount / 100).toFixed(2);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 32px; font-weight: bold; color: #efc07b; }
          .receipt { background-color: #f9f9f9; padding: 20px; border-radius: 4px; margin: 20px 0; }
          .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .receipt-row.total { font-weight: bold; font-size: 18px; border-bottom: 2px solid #efc07b; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">W</div>
            <h1>Purchase Receipt</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for your purchase! Here's your receipt:</p>
            <div class="receipt">
              <div class="receipt-row">
                <span>Item:</span>
                <span>${itemName}</span>
              </div>
              <div class="receipt-row">
                <span>Amount:</span>
                <span>$${amountInDollars}</span>
              </div>
              <div class="receipt-row">
                <span>Transaction ID:</span>
                <span>${transactionId}</span>
              </div>
              <div class="receipt-row">
                <span>Date:</span>
                <span>${new Date().toLocaleDateString()}</span>
              </div>
              <div class="receipt-row total">
                <span>Total:</span>
                <span>$${amountInDollars}</span>
              </div>
            </div>
            <p>Your purchase is now available in your library. You can access it anytime from your account.</p>
            <p>Best regards,<br>The Wisdom Hub Team</p>
          </div>
          <div class="footer">
            <p>© 2026 Wisdom Hub. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Purchase Receipt - ${itemName}`,
    html,
    text: `Hi ${name}, thank you for purchasing "${itemName}" for $${amountInDollars}. Transaction ID: ${transactionId}`,
  });
}

/**
 * Send contact form response
 */
export async function sendContactFormResponse(email: string, name: string, message: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 32px; font-weight: bold; color: #efc07b; }
          .content { color: #333; line-height: 1.6; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">W</div>
            <h1>Wisdom Hub</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for contacting us! We have received your message and will get back to you as soon as possible.</p>
            <p><strong>Your message:</strong></p>
            <p>${message}</p>
            <p>We appreciate your feedback and will respond within 24 hours.</p>
            <p>Best regards,<br>The Wisdom Hub Team</p>
          </div>
          <div class="footer">
            <p>© 2026 Wisdom Hub. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'We received your message - Wisdom Hub',
    html,
    text: `Hi ${name}, thank you for contacting us. We have received your message and will respond soon.`,
  });
}
