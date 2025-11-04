/**
 * Double Elimination Tournament Generator
 * 
 * Algorithm Overview:
 * - Two parallel brackets: Winners Bracket and Losers Bracket
 * - Lose once → drop to losers bracket (specific position based on round)
 * - Lose twice → eliminated from tournament
 * - Grand Finals: Winners bracket champion vs Losers bracket champion
 * - Bracket Reset: If losers bracket wins grand finals, play one more match
 * 
 * Time Complexity: O(n log n) where n = number of teams
 * Space Complexity: O(n log n) for storing both brackets
 * 
 * Key Challenge: Determining correct losers bracket position for dropdowns
 * Dropdowns follow specific pattern to ensure competitive balance
 */

import { MatchToSchedule } from '../scheduling/timeScheduler';

export interface Team {
  teamId: number;
  seedNumber: number;
  teamName?: string;
}

interface BracketMatch {
  matchId: number;
  team1Id: number | null;
  team2Id: number | null;
  roundNumber: number;
  gameNumber: number;
  bracketType: 'winners' | 'losers' | 'finals';
  parentMatchId?: number;
  childMatchId?: number;
  loserDestinationMatchId?: number; // For winners bracket: where loser goes
}

/**
 * Calculate next power of 2 for bracket sizing
 * Time Complexity: O(log n)
 */
function nextPowerOf2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Generate complete double elimination bracket
 * Time Complexity: O(n log n) where n = number of teams
 * 
 * Structure:
 * - Winners Bracket: log2(n) rounds
 * - Losers Bracket: 2*log2(n) - 1 rounds (alternates dropdowns and progressions)
 * - Grand Finals: 1 or 2 matches (depending on bracket reset)
 */
export function generateDoubleEliminationBracket(teams: Team[]): MatchToSchedule[] {
  if (teams.length < 4) {
    throw new Error('Double elimination requires at least 4 teams');
  }

  console.log(`Generating double elimination bracket for ${teams.length} teams`);

  const bracketSize = nextPowerOf2(teams.length);
  const winnersRounds = Math.log2(bracketSize);
  const losersRounds = 2 * winnersRounds - 1;

  console.log(`Bracket size: ${bracketSize}`);
  console.log(`Winners bracket rounds: ${winnersRounds}`);
  console.log(`Losers bracket rounds: ${losersRounds}`);

  let currentMatchId = 1;
  const allMatches: BracketMatch[] = [];

  // Step 1: Generate Winners Bracket
  const { matches: winnersMatches, matchIdCounter } = generateWinnersBracket(
    teams,
    bracketSize,
    currentMatchId
  );
  allMatches.push(...winnersMatches);
  currentMatchId = matchIdCounter;

  // Step 2: Generate Losers Bracket structure
  const losersMatches = generateLosersBracket(
    bracketSize,
    winnersMatches,
    currentMatchId
  );
  allMatches.push(...losersMatches);
  currentMatchId += losersMatches.length;

  // Step 3: Generate Grand Finals
  const grandFinalsMatches = generateGrandFinals(
    winnersMatches,
    losersMatches,
    currentMatchId
  );
  allMatches.push(...grandFinalsMatches);

  // Convert to MatchToSchedule format
  const schedulableMatches: MatchToSchedule[] = allMatches.map((match) => ({
    gameId: match.matchId,
    team1Id: match.team1Id ?? -1,
    team2Id: match.team2Id ?? -1,
    roundNumber: match.roundNumber,
    gameNumber: match.gameNumber,
    bracketType: match.bracketType,
    parentMatchId: match.parentMatchId,
    childMatchId: match.childMatchId,
  }));

  console.log(`Generated ${schedulableMatches.length} total matches`);
  console.log(`Winners: ${winnersMatches.length}, Losers: ${losersMatches.length}, Finals: ${grandFinalsMatches.length}`);

  return schedulableMatches;
}

/**
 * Generate Winners Bracket (standard single elimination)
 * Time Complexity: O(n) where n = bracket size
 */
function generateWinnersBracket(
  teams: Team[],
  bracketSize: number,
  startMatchId: number
): { matches: BracketMatch[]; matchIdCounter: number } {
  const matches: BracketMatch[] = [];
  const rounds = Math.log2(bracketSize);
  let matchId = startMatchId;

  // Sort teams by seed
  const sortedTeams = [...teams].sort((a, b) => a.seedNumber - b.seedNumber);

  // Generate standard seeding pairings
  const firstRoundPairings = generateSeedPairings(sortedTeams, bracketSize);

  // Round 1: Initial matches
  const round1MatchIds: number[] = [];
  for (let i = 0; i < firstRoundPairings.length; i++) {
    const [team1, team2] = firstRoundPairings[i];
    
    matches.push({
      matchId,
      team1Id: team1?.teamId ?? null,
      team2Id: team2?.teamId ?? null,
      roundNumber: 1,
      gameNumber: i + 1,
      bracketType: 'winners',
      loserDestinationMatchId: undefined, // Will be set when creating losers bracket
    });

    round1MatchIds.push(matchId);
    matchId++;
  }

  // Subsequent rounds
  let previousRoundMatchIds = round1MatchIds;

  for (let round = 2; round <= rounds; round++) {
    const currentRoundMatchIds: number[] = [];
    const matchesInRound = previousRoundMatchIds.length / 2;

    for (let i = 0; i < matchesInRound; i++) {
      const parent1Id = previousRoundMatchIds[i * 2];
      const parent2Id = previousRoundMatchIds[i * 2 + 1];

      matches.push({
        matchId,
        team1Id: null, // TBD
        team2Id: null, // TBD
        roundNumber: round,
        gameNumber: i + 1,
        bracketType: 'winners',
        parentMatchId: parent1Id,
        loserDestinationMatchId: undefined,
      });

      // Update parent matches
      const parent1 = matches.find((m) => m.matchId === parent1Id);
      const parent2 = matches.find((m) => m.matchId === parent2Id);
      if (parent1) parent1.childMatchId = matchId;
      if (parent2) parent2.childMatchId = matchId;

      currentRoundMatchIds.push(matchId);
      matchId++;
    }

    previousRoundMatchIds = currentRoundMatchIds;
  }

  return { matches, matchIdCounter: matchId };
}

/**
 * Generate standard seeding pairings for bracket
 * Time Complexity: O(n)
 */
function generateSeedPairings(
  teams: Team[],
  bracketSize: number
): [Team | null, Team | null][] {
  const pairings: [Team | null, Team | null][] = [];

  // Generate seed order: 1 vs n, 2 vs n-1, etc.
  const seedOrder: number[] = [];
  for (let i = 0; i < bracketSize / 2; i++) {
    seedOrder.push(i);
    seedOrder.push(bracketSize - 1 - i);
  }

  for (let i = 0; i < seedOrder.length; i += 2) {
    const seed1 = seedOrder[i];
    const seed2 = seedOrder[i + 1];

    const team1 = seed1 < teams.length ? teams[seed1] : null;
    const team2 = seed2 < teams.length ? teams[seed2] : null;

    pairings.push([team1, team2]);
  }

  return pairings;
}

/**
 * Generate Losers Bracket with proper dropdown positioning
 * Time Complexity: O(n log n)
 * 
 * Losers bracket has alternating rounds:
 * - Dropdown rounds: Winners bracket losers drop down
 * - Progression rounds: Losers bracket winners progress
 * 
 * Critical: Dropdown positioning ensures fair matchups
 */
function generateLosersBracket(
  bracketSize: number,
  winnersMatches: BracketMatch[],
  startMatchId: number
): BracketMatch[] {
  const matches: BracketMatch[] = [];
  const winnersRounds = Math.log2(bracketSize);
  const losersRounds = 2 * winnersRounds - 1;
  let matchId = startMatchId;

  // Track current losers bracket round structure
  let losersRoundMatchIds: Map<number, number[]> = new Map();

  /**
   * Losers Bracket Round Pattern:
   * Round 1: First dropdown (from Winners R1 losers)
   * Round 2: First progression (R1 winners advance)
   * Round 3: Second dropdown (from Winners R2 losers) + R2 winners
   * Round 4: Third progression
   * ... continues alternating
   */

  for (let losersRound = 1; losersRound <= losersRounds; losersRound++) {
    const isDropdownRound = losersRound % 2 === 1;
    const currentRoundMatchIds: number[] = [];

    if (isDropdownRound) {
      // Dropdown round: Winners bracket losers enter
      const winnersRoundForDropdown = Math.ceil(losersRound / 2);
      const winnersMatching = winnersMatches.filter(
        (m) => m.roundNumber === winnersRoundForDropdown && m.bracketType === 'winners'
      );

      // Number of matches = winners matches in that round / 2
      const matchesInRound = winnersMatching.length / 2;

      for (let i = 0; i < matchesInRound; i++) {
        matches.push({
          matchId,
          team1Id: null, // TBD - loser from winners
          team2Id: null, // TBD - loser from winners or previous losers round
          roundNumber: losersRound,
          gameNumber: i + 1,
          bracketType: 'losers',
        });

        // Link winners bracket matches to this losers bracket match
        const winner1 = winnersMatching[i * 2];
        const winner2 = winnersMatching[i * 2 + 1];
        if (winner1) winner1.loserDestinationMatchId = matchId;
        if (winner2) winner2.loserDestinationMatchId = matchId;

        currentRoundMatchIds.push(matchId);
        matchId++;
      }
    } else {
      // Progression round: Previous losers bracket winners advance
      const previousRoundIds = losersRoundMatchIds.get(losersRound - 1) || [];
      const matchesInRound = previousRoundIds.length / 2;

      for (let i = 0; i < matchesInRound; i++) {
        const parent1Id = previousRoundIds[i * 2];
        const parent2Id = previousRoundIds[i * 2 + 1];

        matches.push({
          matchId,
          team1Id: null, // TBD
          team2Id: null, // TBD
          roundNumber: losersRound,
          gameNumber: i + 1,
          bracketType: 'losers',
          parentMatchId: parent1Id,
        });

        // Update parent matches
        const parent1 = matches.find((m) => m.matchId === parent1Id);
        const parent2 = matches.find((m) => m.matchId === parent2Id);
        if (parent1) parent1.childMatchId = matchId;
        if (parent2) parent2.childMatchId = matchId;

        currentRoundMatchIds.push(matchId);
        matchId++;
      }
    }

    losersRoundMatchIds.set(losersRound, currentRoundMatchIds);
  }

  return matches;
}

/**
 * Generate Grand Finals matches
 * Time Complexity: O(1)
 * 
 * Grand Finals has 2 potential matches:
 * 1. Initial grand finals: Winners bracket champ vs Losers bracket champ
 * 2. Bracket reset match: Only played if losers bracket wins first match
 */
function generateGrandFinals(
  winnersMatches: BracketMatch[],
  losersMatches: BracketMatch[],
  startMatchId: number
): BracketMatch[] {
  const matches: BracketMatch[] = [];

  // Find winners bracket finals (last match)
  const winnersFinals = winnersMatches[winnersMatches.length - 1];

  // Find losers bracket finals (last match)
  const losersFinals = losersMatches[losersMatches.length - 1];

  // Grand Finals Match 1
  matches.push({
    matchId: startMatchId,
    team1Id: null, // Winner from winners bracket
    team2Id: null, // Winner from losers bracket
    roundNumber: 1,
    gameNumber: 1,
    bracketType: 'finals',
    parentMatchId: winnersFinals.matchId,
  });

  winnersFinals.childMatchId = startMatchId;
  losersFinals.childMatchId = startMatchId;

  // Grand Finals Match 2 (Bracket Reset)
  // Only played if losers bracket champion wins first grand finals
  matches.push({
    matchId: startMatchId + 1,
    team1Id: null, // TBD based on first grand finals result
    team2Id: null, // TBD
    roundNumber: 2,
    gameNumber: 1,
    bracketType: 'finals',
    parentMatchId: startMatchId,
  });

  matches[0].childMatchId = startMatchId + 1;

  return matches;
}

/**
 * Calculate double elimination statistics
 * Time Complexity: O(1)
 */
export function calculateDoubleEliminationStats(numberOfTeams: number): {
  bracketSize: number;
  winnersRounds: number;
  losersRounds: number;
  totalRounds: number;
  minimumMatches: number;
  maximumMatches: number;
} {
  const bracketSize = nextPowerOf2(numberOfTeams);
  const winnersRounds = Math.log2(bracketSize);
  const losersRounds = 2 * winnersRounds - 1;

  // Minimum: No bracket reset (losers bracket loses grand finals)
  const winnersMatches = bracketSize - 1;
  const losersMatches = bracketSize - 2;
  const minimumMatches = winnersMatches + losersMatches + 1; // +1 for grand finals

  // Maximum: Bracket reset (losers bracket wins first grand finals)
  const maximumMatches = minimumMatches + 1;

  return {
    bracketSize,
    winnersRounds,
    losersRounds,
    totalRounds: winnersRounds + losersRounds + 2, // +2 for grand finals rounds
    minimumMatches,
    maximumMatches,
  };
}