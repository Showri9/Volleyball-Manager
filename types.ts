export interface Team {
  id: string;
  name: string;
}

export interface Match {
  id: string;
  team1: Team;
  team2: Team;
  scores: {
    team1: number[];
    team2: number[];
  };
  winnerId?: string;
  day: number;
  court: number;
}

export interface ScheduleConstraints {
  numCourts: number;
}

export interface Standing {
  team: Team;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface PlayoffMatch {
  id: string;
  round: number;
  matchNumber: number;
  team1?: Team;
  team2?: Team;
  scores: {
    team1: number[];
    team2: number[];
  };
  winnerId?: string;
  nextMatchId?: string;
}

export interface PlayoffBracket {
  rounds: PlayoffMatch[][];
  setsToWin: number;
}

export interface Tournament {
  id: string;
  name: string;
  teams: Team[];
  schedule: Match[];
  playoffBracket: PlayoffBracket | null;
  setsToWin: number;
}

export type Action =
  | { type: 'SET_TOURNAMENTS'; payload: Tournament[] }
  | { type: 'ADD_TOURNAMENT'; payload: Tournament }
  | { type: 'DELETE_TOURNAMENT'; payload: string } // Use string for ID
  | { type: 'ADD_TEAM'; payload: { tournamentId: string; team: Team } }
  | { type: 'UPDATE_TEAM'; payload: { tournamentId: string; team: Team } }
  | { type: 'DELETE_TEAM'; payload: { tournamentId: string; teamId: string } }


export enum View {
  Teams = 'TEAMS',
  Schedule = 'SCHEDULE',
  Standings = 'STANDINGS',
  Playoffs = 'PLAYOFFS',
}