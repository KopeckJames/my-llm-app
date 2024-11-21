# Deployment Guide

This guide will help you deploy the Resume Analysis application to your personal website.

## Prerequisites

1. A Supabase account (for database)
2. A Vercel account (for hosting)
3. OpenAI API key
4. Google OAuth credentials (for authentication)

## Environment Variables

Create a `.env` file in production with these variables:

```env
# Database
DATABASE_URL="your-supabase-postgres-connection-string"

# Authentication
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-nextauth-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"
```

## Deployment Steps

1. **Prepare Database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   # Deploy database schema
   npx prisma db push
   ```

2. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

3. **Deploy to Vercel**
   ```bash
   # Login to Vercel
   vercel login

   # Deploy
   vercel
   ```

4. **Configure Domain**
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings > Domains
   - Add your custom domain

## Post-Deployment

1. Update NEXTAUTH_URL in your environment variables to match your domain
2. Configure Google OAuth consent screen with your domain
3. Add your domain to allowed origins in your OpenAI dashboard

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` with the same variables as above

4. Run development server:
   ```bash
   npm run dev
   ```

## Production Build

To create a production build locally:
```bash
npm run build
npm start
```

## Important Notes

1. Ensure all API keys and secrets are properly set in your production environment
2. Configure CORS policies if needed
3. Set up proper rate limiting for production use
4. Monitor API usage to control costs

## Troubleshooting

Common issues and solutions:

1. Database Connection:
   - Verify DATABASE_URL is correct
   - Ensure IP is whitelisted in Supabase

2. Authentication:
   - Check NEXTAUTH_URL matches your domain
   - Verify Google OAuth credentials are configured correctly

3. API Issues:
   - Verify API keys are set correctly
   - Check API rate limits and quotas

## Monitoring

Monitor your application using:
- Vercel Analytics
- Supabase Dashboard
- OpenAI Usage Dashboard

## Support

For issues:
1. Check the error logs in Vercel dashboard
2. Review database logs in Supabase
3. Check API responses in browser developer tools
