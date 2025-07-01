#!/bin/bash

echo "🚀 Starting deployment process..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please create .env.local with your Supabase credentials"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Generating Prisma client..."
npm run db:generate

echo "🗄️ Pushing database schema..."
npm run db:push

echo "🌱 Seeding database..."
npm run db:seed

echo "✅ Local setup complete!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub"
echo "2. Connect your repository to Vercel"
echo "3. Add environment variables in Vercel dashboard"
echo "4. Deploy!"
echo ""
echo "See DEPLOYMENT.md for detailed instructions" 