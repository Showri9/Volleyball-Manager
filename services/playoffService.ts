
import type { Standing, PlayoffBracket, PlayoffMatch, Team } from '../types';

export const generatePlayoffBracket = (
  standings: Standing[],
  numTeams: number,
  setsToWin: number,
  firstRoundPairings: { team1: Team, team2: Team }[],
  teamsWithByes: Team[] // New parameter for user-selected byes
): PlayoffBracket => {
  if (numTeams < 2) {
    return { rounds: [], setsToWin };
  }

  const playoffTeams = standings.slice(0, numTeams).map(s => s.team);
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(numTeams)));
  const numRounds = Math.log2(bracketSize);

  // 1. Create all match shells for the entire bracket structure.
  const rounds: PlayoffMatch[][] = [];
  for (let r = 0; r < numRounds; r++) {
    const numMatchesInRound = bracketSize / Math.pow(2, r + 1);
    const round: PlayoffMatch[] = [];
    for (let m = 0; m < numMatchesInRound; m++) {
      round.push({
        id: `p-r${r + 1}-m${m + 1}`,
        round: r + 1,
        matchNumber: m + 1,
        scores: { team1: [], team2: [] },
      });
    }
    rounds.push(round);
  }

  // 2. Link matches to their next match.
  for (let r = 0; r < rounds.length - 1; r++) {
    for (let m = 0; m < rounds[r].length; m++) {
      rounds[r][m].nextMatchId = rounds[r + 1][Math.floor(m / 2)].id;
    }
  }

  // 3. Create a standard seeding order to determine ideal bracket positions.
  const getSeedOrder = (size: number): number[] => {
      let bracketRounds: number[][] = [[1, 2]];
      while (bracketRounds[bracketRounds.length - 1].length < size) {
          const lastRound = bracketRounds[bracketRounds.length - 1];
          const newRound: number[] = [];
          const sum = lastRound.length * 2 + 1;
          lastRound.forEach(seed => {
              newRound.push(seed);
              newRound.push(sum - seed);
          });
          bracketRounds.push(newRound);
      }
      return bracketRounds[bracketRounds.length - 1];
  };
  const seedOrder = getSeedOrder(bracketSize);

  // 4. Create an array representing the ideal placement of all playoff teams in the bracket.
  const seededPlayers: (Team | null)[] = Array(bracketSize).fill(null);
  playoffTeams.forEach((team, i) => {
      const seedNumber = i + 1; 
      const positionInBracket = seedOrder.indexOf(seedNumber);
      if (positionInBracket !== -1) {
          seededPlayers[positionInBracket] = team;
      }
  });
  
  // 5. Populate the first round based on user-selected byes and pairings.
  const firstRound = rounds[0];
  const teamsWithByesIds = new Set(teamsWithByes.map(t => t.id));
  const playableMatchSlots: PlayoffMatch[] = [];

  // 5a. Iterate through ideal first round matches, identify bye slots and playable slots.
  for (let i = 0; i < firstRound.length; i++) {
    const match = firstRound[i];
    const team1Seed = seededPlayers[i * 2];
    const team2Seed = seededPlayers[i * 2 + 1];

    // Case 1: Slot is for a team that gets a user-selected bye.
    if (team1Seed && teamsWithByesIds.has(team1Seed.id)) {
        match.team1 = team1Seed;
        match.winnerId = team1Seed.id; 
    }
    if (team2Seed && teamsWithByesIds.has(team2Seed.id)) {
        match.team2 = team2Seed;
        // If team1 also had a bye in this slot, winnerId is already set, which is fine.
        match.winnerId = team2Seed.id;
    }
    
    // Case 2: Natural bye due to empty slot in bracket (e.g. 5 teams in 8 bracket).
    if (team1Seed && !team2Seed) {
        match.team1 = team1Seed;
        match.winnerId = team1Seed.id;
    } else if (!team1Seed && team2Seed) {
        match.team2 = team2Seed;
        match.winnerId = team2Seed.id;
    }

    // Case 3: If both slots have teams and no winner has been declared, it's a playable match.
    if (team1Seed && team2Seed && !match.winnerId) {
        playableMatchSlots.push(match);
    }
  }

  // 5b. Populate the identified playable match slots with the user-defined pairings.
  if (playableMatchSlots.length !== firstRoundPairings.length) {
      console.error("Mismatch between available match slots and provided pairings. Bracket may be incorrect.");
  }
  firstRoundPairings.forEach((pairing, i) => {
      if (playableMatchSlots[i]) {
          playableMatchSlots[i].team1 = pairing.team1;
          playableMatchSlots[i].team2 = pairing.team2;
      }
  });

  // 6. Advance any winners from byes to the second round.
  for (const match of firstRound) {
    if (match.winnerId && match.nextMatchId) {
      const winner = match.team1?.id === match.winnerId ? match.team1 : match.team2;
      if (!winner) continue;
      
      const nextMatch = rounds.flat().find(m => m.id === match.nextMatchId);
      if (nextMatch) {
          if (!nextMatch.team1) {
              nextMatch.team1 = winner;
          } else {
              nextMatch.team2 = winner;
          }
      }
    }
  }

  return { rounds, setsToWin };
};
