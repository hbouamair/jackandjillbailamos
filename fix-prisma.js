const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Prisma client...');

try {
  // Check if node_modules/.prisma exists
  const prismaPath = path.join(__dirname, 'node_modules', '.prisma');
  if (fs.existsSync(prismaPath)) {
    console.log('🗑️  Removing existing Prisma client...');
    fs.rmSync(prismaPath, { recursive: true, force: true });
  }

  // Check if node_modules/@prisma/client exists
  const clientPath = path.join(__dirname, 'node_modules', '@prisma', 'client');
  if (fs.existsSync(clientPath)) {
    console.log('🗑️  Removing existing Prisma client files...');
    fs.rmSync(clientPath, { recursive: true, force: true });
  }

  console.log('⚡ Generating new Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('✅ Prisma client generated successfully!');
} catch (error) {
  console.error('❌ Error fixing Prisma client:', error.message);
  process.exit(1);
} 