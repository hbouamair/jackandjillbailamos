# Deployment Guide: Vercel + Supabase

This guide will help you deploy your Bachata Competition app to Vercel with Supabase as the database.

## Step 1: Set up Supabase Database

### 1.1 Create Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `bachata-competition` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 1.2 Get Database Connection Details

1. Go to **Settings** > **Database**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **Anon public key** (starts with `eyJ`)
   - **Service role key** (starts with `eyJ`)
   - **Database URL** (starts with `postgresql://`)

### 1.3 Set up Database Schema

1. In your local project, create a `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ivktyhogxehjmvpdqqxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database URL for Prisma (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres.ivktyhogxehjmvpdqqxx:Casahamza1234@@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
```

2. Run the database migration:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to Supabase
npm run db:push

# Seed demo data
npm run db:seed
```

## Step 2: Deploy to Vercel

### 2.1 Prepare Your Code

1. Make sure your code is pushed to GitHub
2. Ensure all environment variables are properly configured

### 2.2 Connect to Vercel

1. Go to [Vercel](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### 2.3 Add Environment Variables

In the Vercel project settings, add these environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ivktyhogxehjmvpdqqxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DATABASE_URL=postgresql://postgres.ivktyhogxehjmvpdqqxx:Casahamza1234@@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
```

### 2.4 Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be live at `https://your-project.vercel.app`

## Step 3: Post-Deployment Setup

### 3.1 Set up Database (if not done locally)

If you didn't run the database setup locally, you can do it after deployment:

1. Go to your Vercel project
2. Open the Functions tab
3. Create a temporary API route to run migrations
4. Or use Supabase's SQL editor to run the schema

### 3.2 Verify Everything Works

1. Visit your deployed app
2. Test login with demo credentials
3. Check that all features work properly
4. Test the results display

## Step 4: Custom Domain (Optional)

1. In Vercel, go to **Settings** > **Domains**
2. Add your custom domain
3. Configure DNS settings as instructed

## Troubleshooting

### Database Connection Issues

- Verify all environment variables are set correctly
- Check that the database password is correct
- Ensure the database URL format is correct

### Build Errors

- Check that all dependencies are in `package.json`
- Verify TypeScript types are correct
- Check for any missing environment variables

### Runtime Errors

- Check Vercel function logs
- Verify Supabase connection
- Check browser console for client-side errors

## Security Notes

- Never commit `.env.local` to version control
- Use environment variables for all sensitive data
- Regularly rotate your Supabase keys
- Set up proper Row Level Security (RLS) in Supabase if needed

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check Supabase logs
3. Review this guide again
4. Check the official documentation for both services
