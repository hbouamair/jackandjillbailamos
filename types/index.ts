export type Role = 'leader' | 'follower';
export type UserType = 'admin' | 'judge' | 'mc';
export type CompetitionPhase = 'heats' | 'semifinal' | 'final';

export interface Participant {
  id: string;
  name: string;
  role: Role;
  number: number;
  pictureUrl?: string;
}

export interface Judge {
  id: string;
  name: string;
  role: Role; // Can only judge their own role
  username: string;
  password: string;
}

export interface Heat {
  id: string;
  number: number;
  participants: Participant[];
  rotations: Rotation[];
  scores: Score[];
}

export interface Rotation {
  id: string;
  number: number;
  songType: 'urban' | 'sensual' | 'traditional';
  duration: number; // in seconds
  scores: Score[];
}

export interface Score {
  id: string;
  judgeId: string;
  participantId: string;
  rotationId?: string;
  heatId?: string;
  phase: CompetitionPhase;
  score: number; // 1-10
  timestamp: Date;
}

export interface CompetitionState {
  currentPhase: CompetitionPhase;
  heats: Heat[];
  semifinalists: Participant[];
  finalists: Participant[];
  winners: {
    leader: {
      first: Participant | null;
      second: Participant | null;
      third: Participant | null;
    };
    follower: {
      first: Participant | null;
      second: Participant | null;
      third: Participant | null;
    };
  };
}

export interface User {
  id: string;
  username: string;
  password: string;
  type: UserType;
  name: string;
  role?: Role; // For judges
} 