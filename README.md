# Bachata Competition Management System

A Next.js application for managing Bachata dance competitions with real-time results display.

## Features

- **Admin Dashboard**: Manage participants, heats, and competition phases
- **Judge Dashboard**: Score participants in real-time
- **MC Dashboard**: Control competition flow and display
- **Results Display**: Live audience display with automatic slide transitions
- **Real-time Updates**: Automatic data refresh and notifications

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Authentication**: Custom user management

## Deployment Setup

### 1. Supabase Database Setup

1. Go to [Supabase](https://supabase.com) and create a new project
2. Get your database connection details from Settings > Database
3. Update your environment variables with Supabase credentials

### 2. Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database URL for Prisma
DATABASE_URL=your_supabase_database_url
```

### 3. Database Migration

Run the following commands to set up your database:

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to Supabase
npx prisma db push

# Seed demo data (optional)
npm run seed
```

### 4. Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Demo Credentials

- **Admin**: `admin` / `admin123`
- **MC**: `mc` / `mc123`
- **Leader Judges**: `judge1` / `judge123`
- **Follower Judges**: `judge3` / `judge123`

## File Structure

```
├── app/
│   ├── api/           # API routes
│   ├── results-display/ # Audience display
│   └── page.tsx       # Login page
├── components/        # React components
├── prisma/           # Database schema
├── public/           # Static assets
└── types/            # TypeScript types
```

## License

MIT
