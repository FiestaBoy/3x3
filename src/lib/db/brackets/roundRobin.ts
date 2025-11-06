/**
 * Round Robin Tournament Generator
 *
 * Algorithm Overview:
 * - Every team plays every other team exactly once
 * - Uses "circle method" for optimal scheduling
 * - Handles odd number of teams with rotating byes
 *
 * Time Complexity: O(n²) where n = number of teams
 * Space Complexity: O(n²) for storing all matches
 *
 * Circle Method Explanation:
 * Teams are arranged in two rows, one team stays fixed, others rotate
 * This ensures balanced scheduling and minimal waiting time
 */

import { MatchToSchedule } from "../scheduling/timeScheduler";

export interface Team {
  teamId: number;
  seedNumber: number;
  teamName?: string;
}

/**
 * Generate round robin tournament schedule
 * Time Complexity: O(n²) where n = number of teams
 *
 * For n teams, generates n-1 rounds (or n rounds for odd teams with byes)
 * Each round has n/2 matches (or (n-1)/2 for odd n)
 * Total matches: n(n-1)/2
 *
 * Example for 4 teams:
 * Round 1: 1vs2, 3vs4
 * Round 2: 1vs3, 2vs4
 * Round 3: 1vs4, 2vs3
 */
export function generateRoundRobinSchedule(teams: Team[]): MatchToSchedule[] {
  if (teams.length < 4) {
    throw new Error("Round robin requires at least 4 teams");
  }

  const matches: MatchToSchedule[] = [];
  const n = teams.length;
  const isOdd = n % 2 === 1;

  // If odd number of teams, add a dummy team for bye rotation
  const participants = isOdd ? [...teams, null] : [...teams];
  const totalParticipants = participants.length;
  const totalRounds = totalParticipants - 1;
  const matchesPerRound = totalParticipants / 2;

  /**
   * Circle Method Implementation
   *
   * Fixed position: participants[0] stays in place
   * Rotating positions: participants[1..n-1] rotate clockwise
   *
   * Visual representation for 6 teams:
   * Round 1: [1] 2 3    Round 2: [1] 6 2    Round 3: [1] 5 6
   *          6 5 4              5 4 3              4 3 2
   *
   * Matches: 1v6, 2v5, 3v4    1v5, 6v4, 2v3    1v4, 5v3, 6v2
   */
  let gameNumber = 1;

  for (let round = 0; round < totalRounds; round++) {
    const roundNumber = round + 1;

    // Generate matches for this round using circle method
    for (let match = 0; match < matchesPerRound; match++) {
      let home: Team | null;
      let away: Team | null;

      if (match === 0) {
        // First match: fixed team vs opposite end
        home = participants[0];
        away = participants[totalParticipants - 1];
      } else {
        // Other matches: pairs from top and bottom rows
        home = participants[match];
        away = participants[totalParticipants - 1 - match];
      }

      // Skip if either team is null (bye)
      if (!home || !away) {
        continue;
      }

      matches.push({
        team1Id: home.teamId,
        team2Id: away.teamId,
        roundNumber,
        gameNumber,
        bracketType: "winners", // Round robin uses 'winners' bracket type
      });

      gameNumber++;
    }

    // Rotate participants (except the fixed one at index 0)
    // Move last element to position 1, shift others right
    if (round < totalRounds - 1) {
      const last = participants.pop()!;
      participants.splice(1, 0, last);
    }
  }

  return matches;
}

/**
 * Calculate round robin statistics
 * Time Complexity: O(1)
 */
export function calculateRoundRobinStats(numberOfTeams: number): {
  totalRounds: number;
  totalMatches: number;
  matchesPerTeam: number;
  matchesPerRound: number;
} {
  const isOdd = numberOfTeams % 2 === 1;
  const totalRounds = isOdd ? numberOfTeams : numberOfTeams - 1;
  const totalMatches = (numberOfTeams * (numberOfTeams - 1)) / 2;
  const matchesPerTeam = numberOfTeams - 1;
  const matchesPerRound = Math.floor(numberOfTeams / 2);

  return {
    totalRounds,
    totalMatches,
    matchesPerTeam,
    matchesPerRound,
  };
}

/**
 * Get round robin standings with tiebreaker logic
 * Time Complexity: O(n log n + m) where n = teams, m = matches
 *
 * Tiebreaker order:
 * 1. Wins (most wins ranked higher)
 * 2. Head-to-Head record (if 2 teams tied)
 * 3. Point Differential (points scored - points allowed)
 * 4. Total Points Scored
 * 5. Seed number (lower seed ranked higher)
 */
export async function getRoundRobinStandings(
  tournamentId: string,
  db: any,
): Promise<any[]> {
  // Get all teams with their statistics
  const teams = await db.query(
    `SELECT 
      tt.team_id,
      t.name as team_name,
      tt.wins,
      tt.losses,
      tt.points_scored,
      tt.points_allowed,
      tt.seed_number,
      (tt.points_scored - tt.points_allowed) as point_differential
    FROM team_tournament tt
    INNER JOIN teams t ON tt.team_id = t.team_id
    WHERE tt.tournament_id = ?
    ORDER BY tt.wins DESC, point_differential DESC, tt.points_scored DESC, tt.seed_number ASC`,
    [tournamentId],
  );

  // Get all completed matches for head-to-head calculation
  const matches = await db.query(
    `SELECT team1_id, team2_id, winner_team_id
     FROM tournament_games
     WHERE tournament_id = ? AND game_status = 'completed'`,
    [tournamentId],
  );

  // Apply tiebreaker logic
  const standings = await applyTiebreakers(teams, matches);

  return standings;
}

/**
 * Apply tiebreaker rules to determine final standings
 * Time Complexity: O(n² log n) where n = number of teams
 */
async function applyTiebreakers(teams: any[], matches: any[]): Promise<any[]> {
  // Group teams by number of wins
  const winGroups: Map<number, any[]> = new Map();

  for (const team of teams) {
    const wins = team.wins;
    if (!winGroups.has(wins)) {
      winGroups.set(wins, []);
    }
    winGroups.get(wins)!.push(team);
  }

  const finalStandings: any[] = [];

  // Process each win group separately
  for (const [wins, groupTeams] of Array.from(winGroups.entries()).sort(
    (a, b) => b[0] - a[0],
  )) {
    if (groupTeams.length === 1) {
      // No tie, add directly
      finalStandings.push(groupTeams[0]);
    } else if (groupTeams.length === 2) {
      // Two-way tie: use head-to-head
      const sorted = breakTwoWayTie(groupTeams[0], groupTeams[1], matches);
      finalStandings.push(...sorted);
    } else {
      // Multi-way tie: use point differential, then points scored, then seed
      const sorted = groupTeams.sort((a: any, b: any) => {
        // Point differential
        if (b.point_differential !== a.point_differential) {
          return b.point_differential - a.point_differential;
        }
        // Total points scored
        if (b.points_scored !== a.points_scored) {
          return b.points_scored - a.points_scored;
        }
        // Seed number (lower is better)
        return a.seed_number - b.seed_number;
      });
      finalStandings.push(...sorted);
    }
  }

  // Add position numbers
  return finalStandings.map((team, index) => ({
    ...team,
    position: index + 1,
  }));
}

/**
 * Break two-way tie using head-to-head record
 * Time Complexity: O(m) where m = number of matches
 */
function breakTwoWayTie(team1: any, team2: any, matches: any[]): any[] {
  // Find head-to-head match
  const h2hMatch = matches.find(
    (m: any) =>
      (m.team1_id === team1.team_id && m.team2_id === team2.team_id) ||
      (m.team1_id === team2.team_id && m.team2_id === team1.team_id),
  );

  if (h2hMatch) {
    // Winner of head-to-head ranked higher
    if (h2hMatch.winner_team_id === team1.team_id) {
      return [team1, team2];
    } else {
      return [team2, team1];
    }
  }

  // No head-to-head or not yet played, use point differential
  if (team1.point_differential !== team2.point_differential) {
    return team1.point_differential > team2.point_differential
      ? [team1, team2]
      : [team2, team1];
  }

  // Use total points scored
  if (team1.points_scored !== team2.points_scored) {
    return team1.points_scored > team2.points_scored
      ? [team1, team2]
      : [team2, team1];
  }

  // Use seed number (lower is better)
  return team1.seed_number < team2.seed_number
    ? [team1, team2]
    : [team2, team1];
}

/**
 * Validate round robin schedule
 * Ensures each team plays every other team exactly once
 * Time Complexity: O(n²) where n = number of teams
 */
export function validateRoundRobinSchedule(
  matches: MatchToSchedule[],
  teams: Team[],
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const n = teams.length;
  const expectedMatches = (n * (n - 1)) / 2;

  // Check total number of matches
  if (matches.length !== expectedMatches) {
    errors.push(
      `Expected ${expectedMatches} matches for ${n} teams, got ${matches.length}`,
    );
  }

  // Create matrix to track matchups
  const matchups: Set<string> = new Set();

  for (const match of matches) {
    // Skip matches with null teams
    if (match.team1Id === null || match.team2Id === null) {
      errors.push(`Match has null team assignment`);
      continue;
    }

    // Create unique key for matchup (sorted team IDs)
    const key =
      match.team1Id < match.team2Id
        ? `${match.team1Id}-${match.team2Id}`
        : `${match.team2Id}-${match.team1Id}`;

    if (matchups.has(key)) {
      errors.push(`Duplicate matchup found: ${key}`);
    }

    matchups.add(key);

    // Check that team doesn't play itself
    if (match.team1Id === match.team2Id) {
      errors.push(`Team ${match.team1Id} scheduled to play itself`);
    }
  }

  // Verify each team plays correct number of matches
  const teamMatchCounts: Map<number, number> = new Map();

  for (const match of matches) {
    if (match.team1Id !== null) {
      teamMatchCounts.set(
        match.team1Id,
        (teamMatchCounts.get(match.team1Id) || 0) + 1,
      );
    }
    if (match.team2Id !== null) {
      teamMatchCounts.set(
        match.team2Id,
        (teamMatchCounts.get(match.team2Id) || 0) + 1,
      );
    }
  }

  for (const team of teams) {
    const matchCount = teamMatchCounts.get(team.teamId) || 0;
    if (matchCount !== n - 1) {
      errors.push(
        `Team ${team.teamId} (${team.teamName}) plays ${matchCount} matches, expected ${n - 1}`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
