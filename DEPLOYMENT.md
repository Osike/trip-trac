# Trip-Trac Logistics System Deployment Guide

This document provides instructions for deploying the Trip-Trac Logistics System to production environments.

## Prerequisites

- Node.js 18+ and npm
- Access to the production server/hosting environment
- Supabase project credentials

## Building for Production

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd trip-trac
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the production bundle:
   ```bash
   npm run build:prod
   ```
   This will create optimized files in the `dist` directory.

## Deployment Options

### Option 1: Static Site Hosting (Recommended)

The built application can be deployed to any static site hosting service:

- **Vercel**: Connect your repository and Vercel will automatically build and deploy the application.
- **Netlify**: Connect your repository or manually upload the `dist` directory.
- **GitHub Pages**: Upload the `dist` directory to a GitHub Pages branch.
- **AWS S3 + CloudFront**: Upload the `dist` directory to an S3 bucket and configure CloudFront for distribution.

For these platforms, make sure to configure redirects to handle client-side routing. Add a `_redirects` file or equivalent configuration to redirect all routes to `index.html`.

### Option 2: Self-Hosted Server

1. Copy the `dist` directory and `server.js` file to your server.
2. Install server dependencies:
   ```bash
   npm install express compression
   ```
3. Start the server:
   ```bash
   node server.js
   ```
4. For production use, consider using a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "trip-trac"
   ```

## Environment Configuration

Make sure to set up the correct environment variables for your production environment:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_PROJECT_ID`: Your Supabase project ID
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase publishable key (anon key)

## Database Migration

Ensure that all required Supabase migrations have been applied to your production Supabase instance.

## Testing the Production Build

Before final deployment, test the production build locally:

```bash
npm run build:prod
npm run serve
```

Visit `http://localhost:3000` to verify everything works correctly.

## Post-Deployment Checklist

- [ ] Verify all routes work correctly
- [ ] Test authentication flows
- [ ] Check data loading and submission
- [ ] Verify report generation functionality
- [ ] Test responsive design on multiple devices
- [ ] Verify Supabase connections
- [ ] Set up monitoring and analytics

## Rollback Procedure

If you need to rollback to a previous version:

1. Identify the last stable version tag
2. Checkout that version: `git checkout <tag>`
3. Rebuild and redeploy following the steps above

## Support

For any deployment issues, contact the development team at shadyabacus@gmail.com
