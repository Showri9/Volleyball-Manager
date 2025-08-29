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

export enum View {
  Teams = 'TEAMS',
  Schedule = 'SCHEDULE',
  Standings = 'STANDINGS',
  Playoffs = 'PLAYOFFS',
}