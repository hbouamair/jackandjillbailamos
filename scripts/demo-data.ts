import { competitionStore } from '../lib/store';

// Demo data for testing the application
export function populateDemoData() {
  // Add 15 leaders
  const leaders = [
    'Ahmed', 'Mohammed', 'Ali', 'Hassan', 'Omar',
    'Youssef', 'Karim', 'Samir', 'Tariq', 'Nabil',
    'Rachid', 'Adil', 'Fouad', 'Hicham', 'Zakaria'
  ];

  leaders.forEach(name => {
    competitionStore.addParticipant(name, 'leader');
  });

  // Add 15 followers
  const followers = [
    'Fatima', 'Aisha', 'Zineb', 'Khadija', 'Mariam',
    'Nour', 'Yasmin', 'Layla', 'Sara', 'Amina',
    'Hana', 'Rania', 'Dounia', 'Salma', 'Nadia'
  ];

  followers.forEach(name => {
    competitionStore.addParticipant(name, 'follower');
  });

  // Add some judges
  competitionStore.addJudge('Judge Leader 1', 'leader', 'judge1', 'judge123');
  competitionStore.addJudge('Judge Leader 2', 'leader', 'judge2', 'judge123');
  competitionStore.addJudge('Judge Follower 1', 'follower', 'judge3', 'judge123');
  competitionStore.addJudge('Judge Follower 2', 'follower', 'judge4', 'judge123');

  // Add MC user
  const users = competitionStore['users'] as any[];
  users.push({
    id: Math.random().toString(),
    username: 'mc',
    password: 'mc123',
    type: 'mc',
    name: 'Master of Ceremonies'
  });

  console.log('Demo data populated successfully!');
  console.log('Participants:', competitionStore.getParticipants().length);
  console.log('Judges:', competitionStore.getJudges().length);
}

// Run this function to populate demo data
if (typeof window !== 'undefined') {
  (window as any).populateDemoData = populateDemoData;
} 