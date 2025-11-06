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

import { MatchToSchedule } from "../scheduling/timeScheduler";

export interface Team {
  teamId: number;
  seedNumber: number;
  teamName?: string;
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
export function generateSingleEliminationBracket(
  teams: Team[],
): MatchToSchedule[] {
  if (teams.length < 4) {
    throw new Error("Single elimination requires at least 4 teams");
  }

  const matches: MatchToSchedule[] = [];
  const totalMatchesNeeded = teams.length - 1; // Single elimination: exactly n-1 matches
  const bracketSize = nextPowerOf2(teams.length);
  const totalRounds = Math.log2(bracketSize);

  console.log(
    `Generating single elimination bracket for ${teams.length} teams`,
  );
  console.log(`Total matches needed: ${totalMatchesNeeded}`);
  console.log(`Bracket size: ${bracketSize}, Total rounds: ${totalRounds}`);

  // Generate first round pairings with byes
  const firstRoundPairings = generateSeedPairings(teams);

  // Track match IDs for parent-child relationships
  let currentMatchId = 1;
  const roundMatches: Map<number, number[]> = new Map();

  /**
   * Round 1: Create first round matches (only real matches, not byes)
   * Byes will be handled by placing teams directly into round 2
   * Time Complexity: O(n)
   */
  const firstRoundMatchIds: number[] = [];
  const byeTeams: Team[] = [];

  for (let i = 0; i < firstRoundPairings.length; i++) {
    const [team1, team2] = firstRoundPairings[i];

    // Skip if both teams are byes
    if (!team1 && !team2) continue;

    // Track teams with byes (they advance automatically to round 2)
    if (!team1 && team2) {
      byeTeams.push(team2);
      continue;
    }
    if (team1 && !team2) {
      byeTeams.push(team1);
      continue;
    }

    // Both teams exist - create actual match
    matches.push({
      gameId: currentMatchId,
      team1Id: team1!.teamId,
      team2Id: team2!.teamId,
      roundNumber: 1,
      gameNumber: firstRoundMatchIds.length + 1,
      bracketType: "winners",
      parentMatchId: undefined,
      childMatchId: undefined,
    });

    firstRoundMatchIds.push(currentMatchId);
    currentMatchId++;
  }

  roundMatches.set(1, firstRoundMatchIds);

  console.log(
    `Round 1: ${firstRoundMatchIds.length} matches, ${byeTeams.length} teams with byes`,
  );

  /**
   * Generate subsequent rounds
   * Only create as many matches as needed to reach n-1 total
   * Bye teams are placed into round 2 matches directly
   */
  let currentRound = 2;
  let teamsInCurrentRound = firstRoundMatchIds.length + byeTeams.length;

  while (teamsInCurrentRound > 1 && matches.length < totalMatchesNeeded) {
    const matchesInRound = Math.floor(teamsInCurrentRound / 2);
    const nextRoundTeams = matchesInRound;
    const isFinals = nextRoundTeams === 1;

    console.log(
      `Round ${currentRound}: ${teamsInCurrentRound} teams → ${matchesInRound} matches (Finals: ${isFinals})`,
    );

    const currentRoundMatchIds: number[] = [];
    const previousRoundMatchIds = roundMatches.get(currentRound - 1) || [];

    for (let i = 0; i < matchesInRound; i++) {
      // Stop if we've created enough matches
      if (matches.length >= totalMatchesNeeded) break;

      // For round 2, place bye teams into matches
      let team1Id = null;
      let team2Id = null;

      if (currentRound === 2 && byeTeams.length > 0) {
        // Fill matches with bye teams first
        const byeIndex = i * 2;
        if (byeIndex < byeTeams.length) {
          team1Id = byeTeams[byeIndex].teamId;
        }
        if (byeIndex + 1 < byeTeams.length) {
          team2Id = byeTeams[byeIndex + 1].teamId;
        }
      }

      matches.push({
        gameId: currentMatchId,
        team1Id: team1Id,
        team2Id: team2Id,
        roundNumber: currentRound,
        gameNumber: i + 1,
        bracketType: isFinals ? "finals" : "winners",
        parentMatchId: undefined,
        childMatchId: undefined,
      });

      // Link parent matches to this child match
      // For round 2 with byes: bye teams are already placed, R1 winners fill remaining slots
      if (currentRound === 2 && byeTeams.length > 0) {
        // Determine which R2 match should receive the R1 winner
        // Bye teams fill matches from the beginning
        // R1 winners fill the remaining empty slots

        const byeSlotsUsed = Math.min(byeTeams.length, matchesInRound * 2);
        const r2MatchesFullyFilledByByes = Math.floor(byeSlotsUsed / 2);

        // If this R2 match index is beyond fully-filled bye matches, it needs R1 winners
        if (
          i >= r2MatchesFullyFilledByByes &&
          previousRoundMatchIds.length > 0
        ) {
          const r1MatchIndex = i - r2MatchesFullyFilledByByes;
          if (r1MatchIndex < previousRoundMatchIds.length) {
            const parentMatchId = previousRoundMatchIds[r1MatchIndex];
            const parentMatch = matches.find((m) => m.gameId === parentMatchId);
            if (parentMatch) {
              parentMatch.childMatchId = currentMatchId;
              console.log(
                `  ✓ Linked R1 match ${parentMatchId} → R2 match ${currentMatchId} (slot for winner)`,
              );
            }
          }
        } else {
          console.log(
            `  ○ R2 match ${currentMatchId} filled with bye teams, no R1 parent needed`,
          );
        }
      } else {
        // For rounds 3+, standard pairing: two parent matches per child
        if (previousRoundMatchIds.length > i * 2) {
          const parent1Id = previousRoundMatchIds[i * 2];
          const parent1Match = matches.find((m) => m.gameId === parent1Id);
          if (parent1Match) {
            parent1Match.childMatchId = currentMatchId;
          }
        }

        if (previousRoundMatchIds.length > i * 2 + 1) {
          const parent2Id = previousRoundMatchIds[i * 2 + 1];
          const parent2Match = matches.find((m) => m.gameId === parent2Id);
          if (parent2Match) {
            parent2Match.childMatchId = currentMatchId;
          }
        }
      }

      currentRoundMatchIds.push(currentMatchId);
      currentMatchId++;
    }

    roundMatches.set(currentRound, currentRoundMatchIds);
    teamsInCurrentRound = matchesInRound;
    currentRound++;
  }

  console.log(
    `✓ Generated ${matches.length} matches (expected ${totalMatchesNeeded})`,
  );

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
  const totalMatches = numberOfTeams - 1; // Single elimination: always n-1 matches

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
  const matchIds = new Set(matches.map((m) => m.gameId));

  // Check that all parent/child references exist
  for (const match of matches) {
    if (match.parentMatchId && !matchIds.has(match.parentMatchId)) {
      errors.push(
        `Match ${match.gameId} references non-existent parent ${match.parentMatchId}`,
      );
    }

    if (match.childMatchId && !matchIds.has(match.childMatchId)) {
      errors.push(
        `Match ${match.gameId} references non-existent child ${match.childMatchId}`,
      );
    }
  }

  // Check that rounds are sequential
  const rounds = [...new Set(matches.map((m) => m.roundNumber))].sort(
    (a, b) => a - b,
  );
  for (let i = 0; i < rounds.length; i++) {
    if (rounds[i] !== i + 1) {
      errors.push(`Missing round ${i + 1} in bracket`);
    }
  }

  // Check that finals is marked correctly
  const finalRound = Math.max(...matches.map((m) => m.roundNumber));
  const finalsMatches = matches.filter(
    (m) => m.roundNumber === finalRound && m.bracketType !== "finals",
  );

  if (finalsMatches.length > 0) {
    errors.push(`Round ${finalRound} should be marked as finals`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
