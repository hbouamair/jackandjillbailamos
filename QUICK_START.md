# Quick Start: Deploy to Vercel + Supabase

## 🚀 5-Minute Deployment

### Step 1: Create Supabase Project

1. Go to [Supabase](https://supabase.com) → New Project
2. Name: `bachata-competition`
3. Set a strong database password
4. Choose your region
5. Wait for setup to complete

### Step 2: Get Your Credentials

1. Go to **Settings** → **Database**
2. Copy these values:
   - **Project URL** (starts with `https://`)
   - **Anon public key** (starts with `eyJ`)
   - **Service role key** (starts with `eyJ`)
   - **Database URL** (starts with `postgresql://`)

### Step 3: Set Up Environment

1. Create `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DATABASE_URL=postgresql://postgres:your_password@db.your-project-ref.supabase.co:5432/postgres
```

### Step 4: Set Up Database

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to Supabase
npm run db:push

# Seed demo data
npm run db:seed
```

### Step 5: Deploy to Vercel

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com) → New Project
3. Import your GitHub repo
4. Add environment variables (same as `.env.local`)
5. Deploy!

## 🎯 Your App Will Be Live At:

`https://your-project.vercel.app`

## 🔑 Demo Login Credentials:

- **Admin**: `admin` / `admin123`
- **MC**: `mc` / `mc123`
- **Leader Judges**: `judge1` / `judge123`
- **Follower Judges**: `judge3` / `judge123`

## 📱 Features Ready:

- ✅ Admin Dashboard
- ✅ Judge Scoring
- ✅ MC Controls
- ✅ Live Results Display
- ✅ Festival Logo
- ✅ Mobile Responsive

## 🆘 Need Help?

- Check `DEPLOYMENT.md` for detailed instructions
- Check Vercel deployment logs
- Check Supabase logs
- Verify environment variables are set correctly
