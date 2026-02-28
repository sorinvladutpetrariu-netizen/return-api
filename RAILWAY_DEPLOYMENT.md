# 🚀 Railway Deployment Guide

## Overview

Railway is the easiest way to deploy Node.js applications. It's free tier supports production apps with automatic scaling.

## Prerequisites

- Railway account (free at [railway.app](https://railway.app))
- GitHub account
- Git installed locally

## Step 1: Prepare for Deployment

### 1.1 Create `.railwayignore` file

```bash
cat > .railwayignore << 'EOF'
node_modules
.env.local
.git
*.log
dist
build
EOF
```

### 1.2 Update `package.json` scripts

Ensure these scripts exist:

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "esbuild server/stripe-gmail-index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "dev": "npx tsx server/stripe-gmail-index.ts"
  }
}
```

### 1.3 Create Procfile

```bash
cat > Procfile << 'EOF'
web: npm run build && npm start
EOF
```

## Step 2: Deploy on Railway

### 2.1 Login to Railway

```bash
npm install -g @railway/cli
railway login
```

### 2.2 Initialize Railway Project

```bash
cd /home/ubuntu/wisdom-hub
railway init
```

Follow the prompts:
- Project name: `wisdom-hub`
- Select: `Node.js`

### 2.3 Add Environment Variables

```bash
railway variables set GMAIL_USER=mindset.evolutie@gmail.com
railway variables set GMAIL_PASSWORD="acnx pbln ywxd zhze"
railway variables set FROM_NAME="Wisdom Hub"
railway variables set JWT_SECRET="your-secret-key-change-in-production"
railway variables set STRIPE_SECRET_KEY="sk_test_your_key"
railway variables set STRIPE_PUBLIC_KEY="pk_test_your_key"
railway variables set STRIPE_WEBHOOK_SECRET="whsec_your_secret"
railway variables set APP_URL="https://your-railway-app.up.railway.app"
railway variables set NODE_ENV="production"
railway variables set PORT="3000"
```

### 2.4 Add PostgreSQL Database

```bash
railway add
```

Select: `PostgreSQL`

This automatically sets:
- `DATABASE_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

### 2.5 Deploy

```bash
railway up
```

Wait for deployment to complete. You'll get a public URL like:
```
https://wisdom-hub-production.up.railway.app
```

## Step 3: Verify Deployment

### 3.1 Test Health Endpoint

```bash
curl https://your-railway-app.up.railway.app/health
```

Expected response:
```json
{"status":"OK","message":"Wisdom Hub API is running"}
```

### 3.2 Test Signup

```bash
curl -X POST https://your-railway-app.up.railway.app/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### 3.3 Check Logs

```bash
railway logs
```

## Step 4: Configure Database

### 4.1 Run Migrations

```bash
railway run npm run db:push
```

This will create all tables in PostgreSQL.

### 4.2 Verify Tables

```bash
railway run psql $DATABASE_URL -c "\dt"
```

## Step 5: Setup Custom Domain (Optional)

1. Go to Railway Dashboard
2. Select your project
3. Go to **Settings** → **Domains**
4. Add custom domain
5. Update DNS records

## Environment Variables Reference

| Variable | Value | Required |
|----------|-------|----------|
| `GMAIL_USER` | mindset.evolutie@gmail.com | Yes |
| `GMAIL_PASSWORD` | acnx pbln ywxd zhze | Yes |
| `FROM_NAME` | Wisdom Hub | Yes |
| `JWT_SECRET` | your-secret-key | Yes |
| `STRIPE_SECRET_KEY` | sk_test_... | Yes |
| `STRIPE_PUBLIC_KEY` | pk_test_... | No |
| `STRIPE_WEBHOOK_SECRET` | whsec_... | No |
| `APP_URL` | https://your-app.up.railway.app | Yes |
| `NODE_ENV` | production | Yes |
| `PORT` | 3000 | No |
| `DB_HOST` | Auto (Railway) | Auto |
| `DB_PORT` | Auto (Railway) | Auto |
| `DB_NAME` | Auto (Railway) | Auto |
| `DB_USER` | Auto (Railway) | Auto |
| `DB_PASSWORD` | Auto (Railway) | Auto |

## Monitoring

### View Logs

```bash
railway logs -f
```

### View Metrics

In Railway Dashboard:
- CPU usage
- Memory usage
- Network I/O
- Deployment history

### Set Up Alerts

1. Go to Railway Dashboard
2. **Settings** → **Alerts**
3. Configure alerts for:
   - High CPU
   - High memory
   - Deployment failures

## Troubleshooting

### "Build failed"

Check logs:
```bash
railway logs
```

Common issues:
- Missing dependencies: `npm install`
- TypeScript errors: `npx tsc --noEmit`
- Build script error: Check `package.json`

### "Database connection failed"

Verify DATABASE_URL:
```bash
railway variables get DATABASE_URL
```

Run migrations:
```bash
railway run npm run db:push
```

### "Email not sending"

Check Gmail credentials:
```bash
railway variables get GMAIL_USER
railway variables get GMAIL_PASSWORD
```

Test email:
```bash
railway run node test-complete.js
```

### "Stripe webhook not working"

1. Get your Railway URL:
   ```bash
   railway domains
   ```

2. Update Stripe webhook:
   - Go to Stripe Dashboard
   - **Webhooks** → Edit endpoint
   - URL: `https://your-app.up.railway.app/webhooks/stripe`
   - Copy new webhook secret
   - Update: `railway variables set STRIPE_WEBHOOK_SECRET=whsec_...`

## Production Checklist

- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Health endpoint working
- [ ] Signup/Login tested
- [ ] Email sending tested
- [ ] Stripe payments tested
- [ ] Logs monitored
- [ ] Alerts configured
- [ ] Custom domain configured (optional)
- [ ] Backups configured

## Scaling

Railway automatically scales based on demand. To adjust:

1. Go to Railway Dashboard
2. Select project
3. **Settings** → **Scaling**
4. Set:
   - Min instances: 1
   - Max instances: 5
   - CPU limit: 1000m
   - Memory limit: 512MB

## Cost

- **Free tier**: $5/month credit
- **Pay as you go**: $0.50/GB RAM/month
- **Database**: Included in free tier

## Next Steps

1. **Frontend Deployment**: Deploy React/Expo app
2. **Custom Domain**: Add your domain
3. **Monitoring**: Set up error tracking
4. **CI/CD**: Automatic deployments on git push

## Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway CLI](https://docs.railway.app/cli/quick-start)
- [Node.js Deployment](https://docs.railway.app/guides/nodejs)
- [PostgreSQL Setup](https://docs.railway.app/databases/postgresql)

---

**Last Updated**: February 25, 2026
**Status**: ✅ Production Ready
**Version**: 1.0.0
