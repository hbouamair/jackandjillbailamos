import { Participant, Judge, User, CompetitionState, Score, Heat } from '@/types';

// Storage keys
const STORAGE_KEYS = {
  PARTICIPANTS: 'bachata_participants',
  JUDGES: 'bachata_judges',
  USERS: 'bachata_users',
  CURRENT_USER: 'currentUser',
  COMPETITION_STATE: 'bachata_competition_state',
  SCORES: 'bachata_scores',
  HEATS: 'bachata_heats'
};

// Generic storage functions
export const storage = {
  // Get data from localStorage
  get: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return null;
    }
  },

  // Set data to localStorage
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
    }
  },

  // Remove data from localStorage
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },

  // Clear all bachata data
  clearAll: (): void => {
    if (typeof window === 'undefined') return;
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
};

// Participant CRUD operations
export const participantStorage = {
  getAll: (): Participant[] => {
    return storage.get<Participant[]>(STORAGE_KEYS.PARTICIPANTS) || [];
  },

  add: (participant: Participant): void => {
    const participants = participantStorage.getAll();
    participants.push(participant);
    storage.set(STORAGE_KEYS.PARTICIPANTS, participants);
  },

  update: (id: string, updates: Partial<Participant>): boolean => {
    const participants = participantStorage.getAll();
    const index = participants.findIndex(p => p.id === id);
    if (index !== -1) {
      participants[index] = { ...participants[index], ...updates };
      storage.set(STORAGE_KEYS.PARTICIPANTS, participants);
      return true;
    }
    return false;
  },

  delete: (id: string): boolean => {
    const participants = participantStorage.getAll();
    const filtered = participants.filter(p => p.id !== id);
    if (filtered.length !== participants.length) {
      storage.set(STORAGE_KEYS.PARTICIPANTS, filtered);
      return true;
    }
    return false;
  },

  getById: (id: string): Participant | null => {
    const participants = participantStorage.getAll();
    return participants.find(p => p.id === id) || null;
  },

  getByRole: (role: 'leader' | 'follower'): Participant[] => {
    const participants = participantStorage.getAll();
    return participants.filter(p => p.role === role);
  },

  clear: (): void => {
    storage.remove(STORAGE_KEYS.PARTICIPANTS);
  }
};

// Judge CRUD operations
export const judgeStorage = {
  getAll: (): Judge[] => {
    return storage.get<Judge[]>(STORAGE_KEYS.JUDGES) || [];
  },

  add: (judge: Judge): void => {
    const judges = judgeStorage.getAll();
    judges.push(judge);
    storage.set(STORAGE_KEYS.JUDGES, judges);
  },

  update: (id: string, updates: Partial<Judge>): boolean => {
    const judges = judgeStorage.getAll();
    const index = judges.findIndex(j => j.id === id);
    if (index !== -1) {
      judges[index] = { ...judges[index], ...updates };
      storage.set(STORAGE_KEYS.JUDGES, judges);
      return true;
    }
    return false;
  },

  delete: (id: string): boolean => {
    const judges = judgeStorage.getAll();
    const filtered = judges.filter(j => j.id !== id);
    if (filtered.length !== judges.length) {
      storage.set(STORAGE_KEYS.JUDGES, filtered);
      return true;
    }
    return false;
  },

  getById: (id: string): Judge | null => {
    const judges = judgeStorage.getAll();
    return judges.find(j => j.id === id) || null;
  },

  getByRole: (role: 'leader' | 'follower'): Judge[] => {
    const judges = judgeStorage.getAll();
    return judges.filter(j => j.role === role);
  },

  clear: (): void => {
    storage.remove(STORAGE_KEYS.JUDGES);
  }
};

// User CRUD operations
export const userStorage = {
  getAll: (): User[] => {
    return storage.get<User[]>(STORAGE_KEYS.USERS) || [];
  },

  add: (user: User): void => {
    const users = userStorage.getAll();
    users.push(user);
    storage.set(STORAGE_KEYS.USERS, users);
  },

  update: (id: string, updates: Partial<User>): boolean => {
    const users = userStorage.getAll();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      storage.set(STORAGE_KEYS.USERS, users);
      return true;
    }
    return false;
  },

  delete: (id: string): boolean => {
    const users = userStorage.getAll();
    const filtered = users.filter(u => u.id !== id);
    if (filtered.length !== users.length) {
      storage.set(STORAGE_KEYS.USERS, filtered);
      return true;
    }
    return false;
  },

  getById: (id: string): User | null => {
    const users = userStorage.getAll();
    return users.find(u => u.id === id) || null;
  },

  getByUsername: (username: string): User | null => {
    const users = userStorage.getAll();
    return users.find(u => u.username === username) || null;
  },

  authenticate: (username: string, password: string): User | null => {
    const users = userStorage.getAll();
    return users.find(u => u.username === username && u.password === password) || null;
  },

  clear: (): void => {
    storage.remove(STORAGE_KEYS.USERS);
  }
};

// Competition state storage
export const competitionStorage = {
  getState: (): CompetitionState => {
    return storage.get<CompetitionState>(STORAGE_KEYS.COMPETITION_STATE) || {
      currentPhase: 'heats',
      heats: [],
      semifinalists: [],
      finalists: [],
      winners: {
        leader: {
          first: null,
          second: null,
          third: null
        },
        follower: {
          first: null,
          second: null,
          third: null
        }
      }
    };
  },

  setState: (state: any): void => {
    storage.set(STORAGE_KEYS.COMPETITION_STATE, state);
  },

  getScores: (): Score[] => {
    return storage.get<Score[]>(STORAGE_KEYS.SCORES) || [];
  },

  setScores: (scores: Score[]): void => {
    storage.set(STORAGE_KEYS.SCORES, scores);
  },

  getHeats: (): Heat[] => {
    return storage.get<Heat[]>(STORAGE_KEYS.HEATS) || [];
  },

  setHeats: (heats: Heat[]): void => {
    storage.set(STORAGE_KEYS.HEATS, heats);
  }
};

// Initialize default data if storage is empty
export const initializeDefaultData = () => {
  // Initialize users if empty
  if (userStorage.getAll().length === 0) {
    const defaultUsers: User[] = [
      {
        id: 'admin-1',
        username: 'admin',
        password: 'admin123',
        type: 'admin',
        name: 'Administrator'
      },
      {
        id: 'mc-1',
        username: 'mc',
        password: 'mc123',
        type: 'mc',
        name: 'Master of Ceremonies'
      }
    ];

    defaultUsers.forEach(user => userStorage.add(user));

    // Add default judges
    const defaultJudges: Judge[] = [
      {
        id: 'judge-1',
        name: 'Judge Leader 1',
        role: 'leader',
        username: 'judge1',
        password: 'judge123'
      },
      {
        id: 'judge-2',
        name: 'Judge Leader 2',
        role: 'leader',
        username: 'judge2',
        password: 'judge123'
      },
      {
        id: 'judge-3',
        name: 'Judge Follower 1',
        role: 'follower',
        username: 'judge3',
        password: 'judge123'
      },
      {
        id: 'judge-4',
        name: 'Judge Follower 2',
        role: 'follower',
        username: 'judge4',
        password: 'judge123'
      }
    ];

    defaultJudges.forEach(judge => {
      judgeStorage.add(judge);
      userStorage.add({
        id: judge.id,
        username: judge.username,
        password: judge.password,
        type: 'judge',
        name: judge.name,
        role: judge.role
      });
    });
  }
}; 