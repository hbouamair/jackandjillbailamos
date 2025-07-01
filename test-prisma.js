const { PrismaClient } = require('@prisma/client');

console.log('Testing Prisma client...');

try {
  const prisma = new PrismaClient();
  console.log('✅ Prisma client created successfully');
  
  // Test a simple query
  prisma.participant.findMany().then(participants => {
    console.log(`✅ Found ${participants.length} participants`);
    prisma.$disconnect();
  }).catch(error => {
    console.error('❌ Error querying database:', error);
    prisma.$disconnect();
  });
} catch (error) {
  console.error('❌ Error creating Prisma client:', error);
} 