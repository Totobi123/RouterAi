# Netlify Deployment Guide

This guide will help you deploy your full-stack React + Express application to Netlify.

## Prerequisites

- A [Netlify account](https://app.netlify.com/signup)
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- Node.js 20+ installed locally (for testing)

## Quick Start

### Method 1: Git Integration (Recommended for Continuous Deployment)

1. **Push your code to Git** (if you haven't already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_REPO_URL
   git push -u origin main
   ```

2. **Connect to Netlify**:
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Select your Git provider (GitHub/GitLab/Bitbucket)
   - Authorize Netlify to access your repositories
   - Select your repository

3. **Configure Build Settings**:
   Netlify should auto-detect these from `netlify.toml`, but verify:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist/public`
   - **Functions directory**: `netlify/functions`

4. **Add Environment Variables** (if needed):
   - Click "Site configuration" → "Environment variables"
   - Add any required variables:
     - `MURF_API_KEY` - For text-to-speech features
     - `DATABASE_URL` - For PostgreSQL database

5. **Deploy**:
   - Click "Deploy site"
   - Wait for the build to complete
   - Your site will be live at `https://random-name.netlify.app`

6. **Custom Domain** (optional):
   - Go to "Domain settings"
   - Add your custom domain
   - Follow DNS configuration instructions

### Method 2: Netlify CLI (For Manual Deployments)

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Initialize Site** (first time only):
   ```bash
   netlify init
   ```
   Follow the prompts to create a new site or link to an existing one.

4. **Build and Deploy**:
   ```bash
   npm run build
   netlify deploy --prod
   ```

## Testing Before Deployment

### Test Locally with Netlify Dev

1. **Install Netlify CLI** (if you haven't):
   ```bash
   npm install -g netlify-cli
   ```

2. **Start Netlify Dev**:
   ```bash
   netlify dev
   ```
   
   This runs your app at `http://localhost:8888` with:
   - Vite dev server for frontend
   - Netlify Functions for backend API
   - Environment variables from `.env`

3. **Test API Endpoints**:
   - Frontend: `http://localhost:8888`
   - API: `http://localhost:8888/api/chat-sessions`

### Test Production Build Locally

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Serve with Netlify CLI**:
   ```bash
   netlify dev --offline
   ```

## Environment Variables

### Required Variables

None required for basic functionality. The app uses in-memory storage by default.

### Optional Variables

- **MURF_API_KEY**: API key for Murf.ai text-to-speech service
  - Get your key from [Murf.ai Dashboard](https://murf.ai)
  
- **DATABASE_URL**: PostgreSQL connection string for persistent storage
  - Format: `postgresql://user:password@host:port/database`
  - Example providers: [Neon](https://neon.tech), [Supabase](https://supabase.com)

### Adding Variables on Netlify

1. Go to your site dashboard
2. Navigate to "Site configuration" → "Environment variables"
3. Click "Add a variable"
4. Enter key and value
5. Click "Create variable"
6. Redeploy your site for changes to take effect

## How It Works

### Architecture

Your app is deployed in two parts:

1. **Static Frontend**: 
   - Built with Vite
   - Served as static files from `dist/public`
   - Uses Wouter for client-side routing

2. **Serverless Backend**:
   - Express app wrapped with `serverless-http`
   - Deployed as Netlify Function at `netlify/functions/api.mts`
   - All `/api/*` requests are routed to this function

### Request Flow

```
User Request → Netlify CDN → Static Files or Serverless Function
                                 ↓
                            /api/* → /.netlify/functions/api
                            /*     → /index.html (SPA)
```

## Troubleshooting

### Build Fails

**Check build logs** on Netlify dashboard:
- Look for dependency installation errors
- Verify Node.js version (should be 20+)
- Check if all dependencies are in `package.json`

**Common fixes**:
```bash
# Clear cache and rebuild
netlify build --clear-cache
```

### 404 Errors on Routes

The `netlify.toml` and `_redirects` files handle SPA routing. If you get 404s:

1. Verify `netlify.toml` exists in root
2. Verify `client/public/_redirects` exists
3. Check redirect rules are correct
4. Redeploy the site

### API Endpoints Not Working

1. **Check function logs**:
   - Go to Netlify dashboard → Functions
   - Click on "api" function
   - View recent logs

2. **Verify environment variables**:
   - Ensure all required variables are set
   - Check for typos in variable names

3. **Test locally**:
   ```bash
   netlify dev
   curl http://localhost:8888/api/chat-sessions
   ```

### Database Connection Issues

If using PostgreSQL:

1. Verify `DATABASE_URL` is set correctly
2. Check database allows connections from Netlify IPs
3. Use connection pooling for serverless (e.g., Neon serverless driver)
4. Check function execution logs for specific errors

### CORS Errors

If you see CORS errors in browser console:

The Express app should handle CORS. If issues persist, you can add CORS middleware:

```javascript
// In netlify/functions/api.mts
import cors from 'cors';
app.use(cors());
```

## Performance Optimization

### Enable Caching

Static assets are automatically cached by Netlify CDN. For API responses:

```javascript
// Add cache headers in your routes
res.set('Cache-Control', 'public, max-age=300');
```

### Monitor Function Performance

1. Go to Netlify dashboard → Functions
2. Click "api" function
3. View execution time and invocation count
4. Optimize slow endpoints

### Database Connection Pooling

For PostgreSQL, use connection pooling:

```javascript
// Use @neondatabase/serverless for automatic pooling
import { Pool } from '@neondatabase/serverless';
```

## Monitoring

### Function Logs

View serverless function logs:
1. Netlify dashboard → Functions → api
2. See real-time invocations and errors

### Analytics

Enable Netlify Analytics:
1. Site dashboard → Analytics
2. View page views, top pages, and performance

## Rollback

If a deployment breaks your site:

1. Go to Netlify dashboard → Deploys
2. Find the last working deploy
3. Click "..." menu → "Publish deploy"

## Additional Resources

- [Netlify Documentation](https://docs.netlify.com)
- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [Vite on Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/)
- [Serverless HTTP Package](https://github.com/dougmoscrop/serverless-http)

## Support

- [Netlify Community Forums](https://answers.netlify.com)
- [Netlify Support](https://www.netlify.com/support/)
