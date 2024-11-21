# Deployment Guide

This guide will help you deploy the Resume Analysis application to your personal website.

## Prerequisites

1. A Supabase account (for database)
2. A Vercel account (for hosting)
3. OpenAI API key
4. Google OAuth credentials (for authentication)

## Environment Variables Setup

Before deploying, you need to set up these environment variables in your Vercel dashboard:

1. Go to your project settings in Vercel
2. Navigate to the "Environment Variables" section
3. Add the following variables:

```env
# Authentication
NEXTAUTH_SECRET="generate-a-secure-random-string"  # Run: openssl rand -base64 32
NEXTAUTH_URL="https://your-domain.com"  # Will be auto-set by Vercel
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Database
DATABASE_URL="your-supabase-postgres-connection-string"

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

## Important: First-time Deployment

1. Generate NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and add it to Vercel environment variables.

2. Set up Google OAuth:
   - Go to Google Cloud Console
   - Create OAuth 2.0 credentials
   - Add your Vercel deployment URL to authorized domains
   - Add authorized redirect URIs:
     ```
     https://your-domain.com/api/auth/callback/google
     ```

3. Set up Supabase:
   - Create a new project
   - Get the PostgreSQL connection string
   - Add it to Vercel environment variables

4. Set up OpenAI:
   - Get your API key from OpenAI dashboard
   - Add it to Vercel environment variables

## Post-Deployment

1. Verify environment variables are set correctly in Vercel dashboard
2. Test authentication flow
3. Test resume analysis functionality
4. Monitor API usage and database connections

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

## Troubleshooting

Common issues and solutions:

1. Authentication Errors:
   - Verify NEXTAUTH_SECRET is set
   - Check Google OAuth configuration
   - Ensure redirect URIs are correct

2. Database Connection:
   - Verify DATABASE_URL is correct
   - Check Supabase firewall rules
   - Ensure database is accessible from Vercel's IP range

3. API Issues:
   - Verify API keys are set correctly
   - Check API rate limits
   - Monitor API usage in respective dashboards

## Monitoring

Monitor your application using:
- Vercel Analytics
- Supabase Dashboard
- OpenAI Usage Dashboard

## Support

For issues:
1. Check Vercel deployment logs
2. Review database logs in Supabase
3. Check API responses in browser developer tools
4. Monitor NextAuth session handling

## Security Notes

1. Never commit environment variables to version control
2. Regularly rotate API keys and secrets
3. Monitor authentication attempts
4. Keep dependencies updated
