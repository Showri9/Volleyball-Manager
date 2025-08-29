import type { Team, Match } from '../types';

/**
 * Generates the pairings for a standard round-robin tournament for a given set of teams.
 * If the number of teams is odd, a "bye" team is added to make it even.
 * @param teams The array of teams to schedule.
 * @returns An array of rounds, where each round is an array of match pairings.
 */
const generateRoundRobinRounds = (teams: Team[]): { team1: Team; team2: Team }[][] => {
    const localTeams = [...teams];
    const hasBye = localTeams.length % 2 !== 0;
    if (hasBye) {
        // Add a dummy team for byes
        localTeams.push({ id: 'bye', name: 'Bye' });
    }
    const numTeams = localTeams.length;
    const numRounds = numTeams - 1;
    const matchesPerRound = numTeams / 2;
    const rounds: { team1: Team; team2: Team }[][] = [];

    const teamRefs = [...localTeams];

    for (let r = 0; r < numRounds; r++) {
        const round: { team1: Team; team2: Team }[] = [];
        for (let i = 0; i < matchesPerRound; i++) {
            const team1 = teamRefs[i];
            const team2 = teamRefs[numTeams - 1 - i];
            // Add the match only if neither team is a bye
            if (team1.id !== 'bye' && team2.id !== 'bye') {
                // Randomize home/away for fairness
                if (Math.random() > 0.5) {
                    round.push({ team1, team2 });
                } else {
                    round.push({ team1: team2, team2: team1 });
                }
            }
        }
        rounds.push(round);

        // Rotate teams for the next round (circle method)
        // Keep the first team fixed, rotate the rest
        const lastTeam = teamRefs.pop()!;
        teamRefs.splice(1, 0, lastTeam);
    }
    return rounds;
};

export const generateSchedule = (
  teamsForDay: Team[],
  day: number,
  numCourts: number
): { schedule: Match[]; error?: string } => {
  if (teamsForDay.length < 2) {
    return { schedule: [], error: "Need at least 2 teams to generate a schedule for the day." };
  }

  if (numCourts < 1) {
    return { schedule: [], error: "Must have at least one court." };
  }
  
  const schedule: Match[] = [];

  // Generate a full, independent round-robin tournament for the provided teams on the given day.
  const allRoundsForThisDay = generateRoundRobinRounds(teamsForDay);
  
  // Shuffle the order of rounds to add variety to the match flow.
  for (let i = allRoundsForThisDay.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allRoundsForThisDay[i], allRoundsForThisDay[j]] = [allRoundsForThisDay[j], allRoundsForThisDay[i]];
  }

  // Process each round sequentially to prevent conflicts.
  let matchNumberInDay = 0;
  for (const round of allRoundsForThisDay) {
      // Shuffle matches within the round for court variety.
      for (let i = round.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [round[i], round[j]] = [round[j], round[i]];
      }

      // Assign matches from this round to courts.
      for (const pairing of round) {
          schedule.push({
            id: `match-d${day}-${Date.now()}-${Math.random()}-${schedule.length}`,
            team1: pairing.team1,
            team2: pairing.team2,
            scores: { team1: [], team2: [] },
            day: day,
            court: (matchNumberInDay % numCourts) + 1,
          });
          matchNumberInDay++;
      }
  }
  
  return { schedule };
};