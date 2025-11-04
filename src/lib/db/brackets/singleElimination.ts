/**
 * Single Elimination Tournament Bracket Generator
 * 
 * Algorithm Overview:
 * - Creates a binary tree structure where losers are eliminated
 * - Handles non-power-of-2 team counts with byes in first round
 * - Uses parent-child relationships to track match progression
 * 
 * Time Complexity: O(n) where n = number of teams
 * Space Complexity: O(n) for storing match tree
 */

import { MatchToSchedule } from '../scheduling/timeScheduler';

export interface Team {
  teamId: number;
  seedNumber: number;
  teamName?: string;
}

export interface BracketMatch {
  roundNumber: number;
  gameNumber: number;
  team1Id: number | null; // null for BYE
  team2Id: number | null; // null for BYE
  parentMatchId?: number; // Which match feeds into this one
  childMatchId?: number; // Which match this feeds into (next round)
  position: number; // Position in bracket tree (for visualization)
}

/**
 * Calculate the next power of 2 greater than or equal to n
 * Used to determine bracket size
 * Time Complexity: O(log n)
 */
function nextPowerOf2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Generate optimal seeding arrangement for single elimination
 * Standard seeding: 1 vs lowest, 2 vs 2nd lowest, etc.
 * Time Complexity: O(n)
 * 
 * Example for 8 teams:
 * Seed 1 vs Seed 8
 * Seed 4 vs Seed 5
 * Seed 2 vs Seed 7
 * Seed 3 vs Seed 6
 */
function generateSeedPairings(teams: Team[]): [Team | null, Team | null][] {
  const bracketSize = nextPowerOf2(teams.length);
  const numberOfByes = bracketSize - teams.length;
  
  // Sort teams by seed number
  const sortedTeams = [...teams].sort((a, b) => a.seedNumber - b.seedNumber);
  
  // Create initial pairings with standard seeding pattern
  const pairings: [Team | null, Team | null][] = [];
  
  // Generate seed matchups (1 vs n, 2 vs n-1, etc.)
  const seedOrder: number[] = [];
  for (let i = 0; i < bracketSize / 2; i++) {
    seedOrder.push(i);
    seedOrder.push(bracketSize - 1 - i);
  }
  
  // Create pairs from seed order
  for (let i = 0; i < seedOrder.length; i += 2) {
    const seed1 = seedOrder[i];
    const seed2 = seedOrder[i + 1];
    
    const team1 = seed1 < sortedTeams.length ? sortedTeams[seed1] : null;
    const team2 = seed2 < sortedTeams.length ? sortedTeams[seed2] : null;
    
    pairings.push([team1, team2]);
  }
  
  return pairings;
}

/**
 * Main function to generate single elimination bracket
 * Time Complexity: O(n log n) where n = number of teams
 * - O(n) for seeding
 * - O(n) for first round generation
 * - O(log n) rounds * O(n/2^r) matches per round = O(n)
 * - Total: O(n log n) dominated by sorting
 */
export function generateSingleEliminationBracket(teams: Team[]): MatchToSchedule[] {
  if (teams.length < 4) {
    throw new Error('Single elimination requires at least 4 teams');
  }

  const matches: MatchToSchedule[] = [];
  const bracketSize = nextPowerOf2(teams.length);
  const totalRounds = Math.log2(bracketSize);
  
  console.log(`Generating single elimination bracket for ${teams.length} teams`);
  console.log(`Bracket size: ${bracketSize}, Total rounds: ${totalRounds}`);

  // Generate first round pairings with byes
  const firstRoundPairings = generateSeedPairings(teams);
  
  // Track match IDs for parent-child relationships
  let currentMatchId = 1;
  const roundMatches: Map<number, number[]> = new Map();

  /**
   * Round 1: Create first round matches (including byes)
   * Time Complexity: O(n)
   */
  const firstRoundMatchIds: number[] = [];
  
  for (let i = 0; i < firstRoundPairings.length; i++) {
    const [team1, team2] = firstRoundPairings[i];
    
    // Skip if both teams are byes (shouldn't happen with proper seeding)
    if (!team1 && !team2) continue;
    
    // If one team has a bye, they auto-advance (handled in match progression)
    matches.push({
      gameId: currentMatchId,
      team1Id: team1?.teamId || -1, // -1 represents BYE
      team2Id: team2?.teamId || -1,
      roundNumber: 1,
      gameNumber: i + 1,
      bracketType: 'winners',
      parentMatchId: undefined,
      childMatchId: undefined, // Will be set when creating next round
    });
    
    firstRoundMatchIds.push(currentMatchId);
    currentMatchId++;
  }
  
  roundMatches.set(1, firstRoundMatchIds);

  /**
   * Generate subsequent rounds
   * Time Complexity: O(n) total across all rounds
   * Each round has half the matches of previous round
   */
  for (let round = 2; round <= totalRounds; round++) {
    const previousRoundMatchIds = roundMatches.get(round - 1)!;
    const currentRoundMatchIds: number[] = [];
    const matchesInRound = previousRoundMatchIds.length / 2;
    
    const isFinals = round === totalRounds;

    for (let i = 0; i < matchesInRound; i++) {
      const parent1Id = previousRoundMatchIds[i * 2];
      const parent2Id = previousRoundMatchIds[i * 2 + 1];
      
      matches.push({
        gameId: currentMatchId,
        team1Id: -1, // TBD - winner of parent1
        team2Id: -1, // TBD - winner of parent2
        roundNumber: round,
        gameNumber: i + 1,
        bracketType: isFinals ? 'finals' : 'winners',
        parentMatchId: parent1Id, // Store first parent (second parent implied by pairing)
        childMatchId: undefined,
      });
      
      // Update parent matches with child reference
      const parent1Match = matches.find(m => m.gameId === parent1Id);
      const parent2Match = matches.find(m => m.gameId === parent2Id);
      
      if (parent1Match) parent1Match.childMatchId = currentMatchId;
      if (parent2Match) parent2Match.childMatchId = currentMatchId;
      
      currentRoundMatchIds.push(currentMatchId);
      currentMatchId++;
    }
    
    roundMatches.set(round, currentRoundMatchIds);
  }

  console.log(`Generated ${matches.length} matches across ${totalRounds} rounds`);
  
  return matches;
}

/**
 * Calculate bracket statistics
 * Time Complexity: O(1)
 */
export function calculateBracketStats(numberOfTeams: number): {
  bracketSize: number;
  totalRounds: number;
  totalMatches: number;
  numberOfByes: number;
  firstRoundMatches: number;
} {
  const bracketSize = nextPowerOf2(numberOfTeams);
  const totalRounds = Math.log2(bracketSize);
  const numberOfByes = bracketSize - numberOfTeams;
  const firstRoundMatches = bracketSize / 2;
  const totalMatches = bracketSize - 1; // Always n-1 matches in single elimination

  return {
    bracketSize,
    totalRounds,
    totalMatches,
    numberOfByes,
    firstRoundMatches,
  };
}

/**
 * Determine which teams should receive byes
 * Top seeds get byes to ensure competitive balance
 * Time Complexity: O(n log n) for sorting
 */
export function getTeamsWithByes(teams: Team[]): Team[] {
  const numberOfByes = nextPowerOf2(teams.length) - teams.length;
  
  if (numberOfByes === 0) return [];
  
  // Top seeds get byes
  return [...teams]
    .sort((a, b) => a.seedNumber - b.seedNumber)
    .slice(0, numberOfByes);
}

/**
 * Validate bracket structure integrity
 * Ensures all parent-child relationships are correct
 * Time Complexity: O(n)
 */
export function validateBracket(matches: MatchToSchedule[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const matchIds = new Set(matches.map(m => m.gameId));
  
  // Check that all parent/child references exist
  for (const match of matches) {
    if (match.parentMatchId && !matchIds.has(match.parentMatchId)) {
      errors.push(
        `Match ${match.gameId} references non-existent parent ${match.parentMatchId}`
      );
    }
    
    if (match.childMatchId && !matchIds.has(match.childMatchId)) {
      errors.push(
        `Match ${match.gameId} references non-existent child ${match.childMatchId}`
      );
    }
  }
  
  // Check that rounds are sequential
  const rounds = [...new Set(matches.map(m => m.roundNumber))].sort((a, b) => a - b);
  for (let i = 0; i < rounds.length; i++) {
    if (rounds[i] !== i + 1) {
      errors.push(`Missing round ${i + 1} in bracket`);
    }
  }
  
  // Check that finals is marked correctly
  const finalRound = Math.max(...matches.map(m => m.roundNumber));
  const finalsMatches = matches.filter(
    m => m.roundNumber === finalRound && m.bracketType !== 'finals'
  );
  
  if (finalsMatches.length > 0) {
    errors.push(`Round ${finalRound} should be marked as finals`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}