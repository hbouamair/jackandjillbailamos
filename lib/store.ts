import { v4 as uuidv4 } from 'uuid';
import { 
  Participant, 
  Judge, 
  Heat, 
  Rotation, 
  Score, 
  CompetitionState, 
  User,
  Role,
  CompetitionPhase 
} from '@/types';
import { 
  participantStorage, 
  judgeStorage, 
  userStorage, 
  competitionStorage,
  initializeDefaultData 
} from '@/lib/storage';

// Persistent data store with localStorage
class CompetitionStore {
  private participants: Participant[] = [];
  private judges: Judge[] = [];
  private users: User[] = [];
  private heats: Heat[] = [];
  private scores: Score[] = [];
  private currentPhase: CompetitionPhase = 'heats';
  private semifinalists: Participant[] = [];
  private finalists: Participant[] = [];
  private winners = {
    leader: null as Participant | null,
    follower: null as Participant | null
  };

  // Initialize with persistent storage
  constructor() {
    this.loadFromStorage();
    initializeDefaultData();
    this.loadFromStorage(); // Load again after initialization
  }

  private loadFromStorage() {
    this.participants = participantStorage.getAll();
    this.judges = judgeStorage.getAll();
    this.users = userStorage.getAll();
    
    const state = competitionStorage.getState();
    this.currentPhase = state.currentPhase;
    this.semifinalists = state.semifinalists;
    this.finalists = state.finalists;
    this.winners = state.winners;
    
    this.heats = competitionStorage.getHeats();
    this.scores = competitionStorage.getScores();
  }

  private saveToStorage() {
    participantStorage.clear();
    this.participants.forEach(p => participantStorage.add(p));
    
    judgeStorage.clear();
    this.judges.forEach(j => judgeStorage.add(j));
    
    userStorage.clear();
    this.users.forEach(u => userStorage.add(u));
    
    competitionStorage.setState({
      currentPhase: this.currentPhase,
      heats: this.heats,
      semifinalists: this.semifinalists,
      finalists: this.finalists,
      winners: this.winners
    });
    
    competitionStorage.setHeats(this.heats);
    competitionStorage.setScores(this.scores);
  }

  // Participant methods
  addParticipant(name: string, role: Role): Participant {
    const participant: Participant = {
      id: uuidv4(),
      name,
      role,
      number: this.participants.length + 1
    };
    this.participants.push(participant);
    this.saveToStorage();
    return participant;
  }

  getParticipants(): Participant[] {
    return this.participants;
  }

  getParticipantsByRole(role: Role): Participant[] {
    return this.participants.filter(p => p.role === role);
  }

  updateParticipant(id: string, updates: Partial<Participant>): boolean {
    const index = this.participants.findIndex(p => p.id === id);
    if (index !== -1) {
      this.participants[index] = { ...this.participants[index], ...updates };
      this.saveToStorage();
      return true;
    }
    return false;
  }

  deleteParticipant(id: string): boolean {
    const filtered = this.participants.filter(p => p.id !== id);
    if (filtered.length !== this.participants.length) {
      this.participants = filtered;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Judge methods
  addJudge(name: string, role: Role, username: string, password: string): Judge {
    const judge: Judge = {
      id: uuidv4(),
      name,
      role,
      username,
      password
    };
    this.judges.push(judge);
    
    // Also add as user
    this.users.push({
      id: uuidv4(),
      username,
      password,
      type: 'judge',
      name,
      role
    });
    
    this.saveToStorage();
    return judge;
  }

  getJudges(): Judge[] {
    return this.judges;
  }

  updateJudge(id: string, updates: Partial<Judge>): boolean {
    const index = this.judges.findIndex(j => j.id === id);
    if (index !== -1) {
      this.judges[index] = { ...this.judges[index], ...updates };
      this.saveToStorage();
      return true;
    }
    return false;
  }

  deleteJudge(id: string): boolean {
    const filtered = this.judges.filter(j => j.id !== id);
    if (filtered.length !== this.judges.length) {
      this.judges = filtered;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Heat methods
  generateHeats(): Heat[] {
    if (this.participants.length !== 30) {
      throw new Error('Need exactly 30 participants (15 leaders + 15 followers)');
    }

    const leaders = this.getParticipantsByRole('leader');
    const followers = this.getParticipantsByRole('follower');

    // Shuffle arrays
    const shuffledLeaders = [...leaders].sort(() => Math.random() - 0.5);
    const shuffledFollowers = [...followers].sort(() => Math.random() - 0.5);

    this.heats = [];
    for (let i = 0; i < 3; i++) {
      const heatLeaders = shuffledLeaders.slice(i * 5, (i + 1) * 5);
      const heatFollowers = shuffledFollowers.slice(i * 5, (i + 1) * 5);
      
      const heat: Heat = {
        id: uuidv4(),
        number: i + 1,
        participants: [...heatLeaders, ...heatFollowers],
        rotations: [],
        scores: []
      };

      // Create rotations for this heat
      const songTypes: ('urban' | 'sensual' | 'traditional')[] = ['urban', 'sensual', 'traditional'];
      for (let j = 0; j < 3; j++) {
        const rotation: Rotation = {
          id: uuidv4(),
          number: j + 1,
          songType: songTypes[j],
          duration: 60, // 1 minute
          scores: []
        };
        heat.rotations.push(rotation);
      }

      this.heats.push(heat);
    }

    this.saveToStorage();
    return this.heats;
  }

  getHeats(): Heat[] {
    return this.heats;
  }

  // Score methods
  addScore(judgeId: string, participantId: string, rotationId: string, score: number): Score {
    const scoreObj: Score = {
      id: uuidv4(),
      judgeId,
      participantId,
      rotationId,
      phase: this.currentPhase,
      score,
      timestamp: new Date()
    };
    this.scores.push(scoreObj);
    this.saveToStorage();
    return scoreObj;
  }

  getScores(): Score[] {
    return this.scores;
  }

  // Phase progression
  advanceToSemifinal(): Participant[] {
    if (this.currentPhase !== 'heats') {
      throw new Error('Can only advance to semifinal from heats phase');
    }

    // Calculate total scores for each participant
    const participantScores = new Map<string, number>();
    
    this.participants.forEach(participant => {
      const participantScoresList = this.scores.filter(s => s.participantId === participant.id);
      const totalScore = participantScoresList.reduce((sum, s) => sum + s.score, 0);
      participantScores.set(participant.id, totalScore);
    });

    // Get top 8 leaders and top 8 followers
    const leaders = this.getParticipantsByRole('leader')
      .sort((a, b) => (participantScores.get(b.id) || 0) - (participantScores.get(a.id) || 0))
      .slice(0, 8);

    const followers = this.getParticipantsByRole('follower')
      .sort((a, b) => (participantScores.get(b.id) || 0) - (participantScores.get(a.id) || 0))
      .slice(0, 8);

    this.semifinalists = [...leaders, ...followers];
    this.currentPhase = 'semifinal';
    this.saveToStorage();
    
    return this.semifinalists;
  }

  advanceToFinal(): Participant[] {
    if (this.currentPhase !== 'semifinal') {
      throw new Error('Can only advance to final from semifinal phase');
    }

    // Calculate semifinal scores
    const participantScores = new Map<string, number>();
    
    this.semifinalists.forEach(participant => {
      const participantScoresList = this.scores.filter(s => 
        s.participantId === participant.id && s.phase === 'semifinal'
      );
      const totalScore = participantScoresList.reduce((sum, s) => sum + s.score, 0);
      participantScores.set(participant.id, totalScore);
    });

    // Get top 5 leaders and top 5 followers
    const leaders = this.semifinalists
      .filter(p => p.role === 'leader')
      .sort((a, b) => (participantScores.get(b.id) || 0) - (participantScores.get(a.id) || 0))
      .slice(0, 5);

    const followers = this.semifinalists
      .filter(p => p.role === 'follower')
      .sort((a, b) => (participantScores.get(b.id) || 0) - (participantScores.get(a.id) || 0))
      .slice(0, 5);

    this.finalists = [...leaders, ...followers];
    this.currentPhase = 'final';
    
    return this.finalists;
  }

  // Authentication
  authenticateUser(username: string, password: string): User | null {
    return userStorage.authenticate(username, password);
  }

  // Getters
  getCurrentPhase(): CompetitionPhase {
    return this.currentPhase;
  }

  getSemifinalists(): Participant[] {
    return this.semifinalists;
  }

  getFinalists(): Participant[] {
    return this.finalists;
  }

  getWinners() {
    return this.winners;
  }

  // Set winners
  setWinners(leader: Participant, follower: Participant) {
    this.winners.leader = leader;
    this.winners.follower = follower;
  }

  // Get competition state
  getCompetitionState(): CompetitionState {
    return {
      currentPhase: this.currentPhase,
      heats: this.heats,
      semifinalists: this.semifinalists,
      finalists: this.finalists,
      winners: this.winners
    };
  }
}

// Export singleton instance
export const competitionStore = new CompetitionStore(); 