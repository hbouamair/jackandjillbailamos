import { PrismaClient, UserType, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create users
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'admin123',
      type: UserType.ADMIN,
      name: 'Administrator'
    }
  });

  const mc = await prisma.user.upsert({
    where: { username: 'mc' },
    update: {},
    create: {
      username: 'mc',
      password: 'mc123',
      type: UserType.MC,
      name: 'Master of Ceremonies'
    }
  });

  // Create judges
  const judge1 = await prisma.user.upsert({
    where: { username: 'judge1' },
    update: {},
    create: {
      username: 'judge1',
      password: 'judge123',
      type: UserType.JUDGE,
      name: 'Leader Judge 1',
      role: Role.LEADER
    }
  });

  const judge2 = await prisma.user.upsert({
    where: { username: 'judge2' },
    update: {},
    create: {
      username: 'judge2',
      password: 'judge123',
      type: UserType.JUDGE,
      name: 'Leader Judge 2',
      role: Role.LEADER
    }
  });

  const judge3 = await prisma.user.upsert({
    where: { username: 'judge3' },
    update: {},
    create: {
      username: 'judge3',
      password: 'judge123',
      type: UserType.JUDGE,
      name: 'Follower Judge 1',
      role: Role.FOLLOWER
    }
  });

  const judge4 = await prisma.user.upsert({
    where: { username: 'judge4' },
    update: {},
    create: {
      username: 'judge4',
      password: 'judge123',
      type: UserType.JUDGE,
      name: 'Follower Judge 2',
      role: Role.FOLLOWER
    }
  });

  // Create judge records
  await prisma.judge.upsert({
    where: { userId: judge1.id },
    update: {},
    create: {
      userId: judge1.id,
      name: judge1.name,
      role: judge1.role!,
      username: judge1.username,
      password: judge1.password
    }
  });

  await prisma.judge.upsert({
    where: { userId: judge2.id },
    update: {},
    create: {
      userId: judge2.id,
      name: judge2.name,
      role: judge2.role!,
      username: judge2.username,
      password: judge2.password
    }
  });

  await prisma.judge.upsert({
    where: { userId: judge3.id },
    update: {},
    create: {
      userId: judge3.id,
      name: judge3.name,
      role: judge3.role!,
      username: judge3.username,
      password: judge3.password
    }
  });

  await prisma.judge.upsert({
    where: { userId: judge4.id },
    update: {},
    create: {
      userId: judge4.id,
      name: judge4.name,
      role: judge4.role!,
      username: judge4.username,
      password: judge4.password
    }
  });

  // Create demo participants
  const participants = [
    { name: 'Alice Johnson', role: Role.LEADER, number: 1 },
    { name: 'Bob Smith', role: Role.LEADER, number: 2 },
    { name: 'Charlie Brown', role: Role.LEADER, number: 3 },
    { name: 'Diana Prince', role: Role.LEADER, number: 4 },
    { name: 'Eve Wilson', role: Role.LEADER, number: 5 },
    { name: 'Frank Miller', role: Role.LEADER, number: 6 },
    { name: 'Grace Lee', role: Role.FOLLOWER, number: 7 },
    { name: 'Henry Davis', role: Role.FOLLOWER, number: 8 },
    { name: 'Ivy Chen', role: Role.FOLLOWER, number: 9 },
    { name: 'Jack Taylor', role: Role.FOLLOWER, number: 10 },
    { name: 'Kate Anderson', role: Role.FOLLOWER, number: 11 },
    { name: 'Liam O\'Connor', role: Role.FOLLOWER, number: 12 }
  ];

  for (const participantData of participants) {
    await prisma.participant.upsert({
      where: { number: participantData.number },
      update: {},
      create: participantData
    });
  }

  // Create initial competition state
  await prisma.competitionState.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      currentPhase: 'HEATS',
      semifinalists: '[]',
      finalists: '[]',
      winners: '{}'
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log('\nDemo credentials:');
  console.log('- Admin: admin / admin123');
  console.log('- MC: mc / mc123');
  console.log('- Leader Judges: judge1 / judge123, judge2 / judge123');
  console.log('- Follower Judges: judge3 / judge123, judge4 / judge123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 