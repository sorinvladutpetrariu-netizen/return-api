import nodemailer from 'nodemailer';

// Email configuration - using SendGrid or Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password',
  },
});

// Alternative: SendGrid configuration
// const transporter = nodemailer.createTransport({
//   host: 'smtp.sendgrid.net',
//   port: 587,
//   auth: {
//     user: 'apikey',
//     pass: process.env.SENDGRID_API_KEY,
//   },
// });

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@wisdomhub.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log(`Email sent to ${options.to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationToken: string,
  appUrl: string
): Promise<void> {
  const verificationLink = `${appUrl}/verify-email?token=${verificationToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1A1A2E; color: #ffffff; padding: 20px; border-radius: 8px; text-align: center;">
        <h1 style="color: #efc07b; margin: 0;">Wisdom Hub</h1>
        <p style="margin: 10px 0 0 0; color: #b0b0b0;">Verify Your Email</p>
      </div>

      <div style="background-color: #f5f5f5; padding: 30px; border-radius: 8px; margin-top: 20px;">
        <h2 style="color: #1A1A2E; margin-top: 0;">Welcome, ${name}!</h2>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Thank you for signing up for Wisdom Hub. To complete your registration and start your personal development journey, please verify your email address by clicking the button below.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="
            display: inline-block;
            background-color: #efc07b;
            color: #1A1A2E;
            padding: 12px 30px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
            font-size: 16px;
          ">
            Verify Email Address
          </a>
        </div>

        <p style="color: #666; font-size: 14px;">
          Or copy and paste this link in your browser:<br>
          <code style="background-color: #e0e0e0; padding: 5px 10px; border-radius: 4px; word-break: break-all;">
            ${verificationLink}
          </code>
        </p>

        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          This link will expire in 24 hours. If you didn't sign up for this account, please ignore this email.
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© 2026 Wisdom Hub. All rights reserved.</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'Verify Your Wisdom Hub Email Address',
    html,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string,
  appUrl: string
): Promise<void> {
  const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1A1A2E; color: #ffffff; padding: 20px; border-radius: 8px; text-align: center;">
        <h1 style="color: #efc07b; margin: 0;">Wisdom Hub</h1>
        <p style="margin: 10px 0 0 0; color: #b0b0b0;">Password Reset</p>
      </div>

      <div style="background-color: #f5f5f5; padding: 30px; border-radius: 8px; margin-top: 20px;">
        <h2 style="color: #1A1A2E; margin-top: 0;">Reset Your Password</h2>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Hi ${name},
        </p>

        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          We received a request to reset the password for your Wisdom Hub account. Click the button below to set a new password.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="
            display: inline-block;
            background-color: #efc07b;
            color: #1A1A2E;
            padding: 12px 30px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
            font-size: 16px;
          ">
            Reset Password
          </a>
        </div>

        <p style="color: #666; font-size: 14px;">
          Or copy and paste this link in your browser:<br>
          <code style="background-color: #e0e0e0; padding: 5px 10px; border-radius: 4px; word-break: break-all;">
            ${resetLink}
          </code>
        </p>

        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© 2026 Wisdom Hub. All rights reserved.</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'Reset Your Wisdom Hub Password',
    html,
  });
}

export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1A1A2E; color: #ffffff; padding: 20px; border-radius: 8px; text-align: center;">
        <h1 style="color: #efc07b; margin: 0;">Wisdom Hub</h1>
        <p style="margin: 10px 0 0 0; color: #b0b0b0;">Welcome to Your Journey</p>
      </div>

      <div style="background-color: #f5f5f5; padding: 30px; border-radius: 8px; margin-top: 20px;">
        <h2 style="color: #1A1A2E; margin-top: 0;">Welcome to Wisdom Hub, ${name}!</h2>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Your account has been successfully verified and activated. You're now ready to begin your personal development journey with Wisdom Hub.
        </p>

        <h3 style="color: #1A1A2E; margin-top: 30px;">What You Can Do Now:</h3>
        <ul style="color: #333; font-size: 14px; line-height: 1.8;">
          <li>📖 Read premium articles on personal development</li>
          <li>📚 Access exclusive books and audiobooks</li>
          <li>💡 Get daily quotes and tips for inspiration</li>
          <li>🎓 Enroll in transformative courses</li>
          <li>👥 Connect with a community of growth-minded individuals</li>
        </ul>

        <p style="color: #333; font-size: 16px; line-height: 1.6; margin-top: 20px;">
          If you have any questions or need assistance, don't hesitate to reach out to our support team.
        </p>

        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Happy learning!<br>
          The Wisdom Hub Team
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© 2026 Wisdom Hub. All rights reserved.</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to Wisdom Hub!',
    html,
  });
}
