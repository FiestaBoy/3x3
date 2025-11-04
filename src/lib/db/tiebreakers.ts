"use server";

/**
 * Tiebreaker Logic for Tournament Rankings
 * 
 * Implements standardized tiebreaker rules:
 * 1. Wins (most wins ranked higher)
 * 2. Head-to-Head Record (only for 2-way ties)
 * 3. Point Differential (points scored - points allowed)
 * 4. Total Points Scored
 * 5. Original Seed Number (lower seed ranked higher)
 * 
 * Time Complexity: O(n log n + m) where n = teams, m = matches
 */

const db = require("@/src/lib/db/db");

export interface TeamStanding {
  teamId: number;
  teamName: string;
  wins: number;
  losses: number;
  pointsScored: number;
  pointsAllowed: number;
  pointDifferential: number;
  seedNumber: number;
  position?: number;
}

export interface HeadToHeadRecord {
  team1Id: number;
  team2Id: number;
  winnerId: number | null;
}

/**
 * Get complete standings for a tournament
 * Time Complexity: O(n log n + m)
 */
export async function getTournamentStandings(
  tournamentId: string
): Promise<TeamStanding[]> {
  // Get all teams with statistics
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
    WHERE tt.tournament_id = ?`,
    [tournamentId]
  );

  if (!teams || teams.length === 0) {
    return [];
  }

  // Get all completed matches for head-to-head
  const matches = await db.query(
    `SELECT team1_id, team2_id, winner_team_id
     FROM tournament_games
     WHERE tournament_id = ? AND game_status = 'completed'`,
    [tournamentId]
  );

  // Convert to TeamStanding format
  const standings: TeamStanding[] = teams.map((team: any) => ({
    teamId: team.team_id,
    teamName: team.team_name,
    wins: team.wins,
    losses: team.losses,
    pointsScored: team.points_scored,
    pointsAllowed: team.points_allowed,
    pointDifferential: team.point_differential,
    seedNumber: team.seed_number,
  }));

  // Apply tiebreakers
  const rankedStandings = applyTiebreakers(standings, matches);

  return rankedStandings;
}

/**
 * Get standings for a specific group in group stage
 * Time Complexity: O(n log n + m)
 */
export async function getGroupStandings(
  tournamentId: string,
  groupId: number
): Promise<TeamStanding[]> {
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
    AND EXISTS (
      SELECT 1 FROM tournament_games tg
      WHERE tg.tournament_id = tt.tournament_id
      AND tg.group_id = ?
      AND (tg.team1_id = tt.team_id OR tg.team2_id = tt.team_id)
    )`,
    [tournamentId, groupId]
  );

  const matches = await db.query(
    `SELECT team1_id, team2_id, winner_team_id
     FROM tournament_games
     WHERE tournament_id = ? AND group_id = ? AND game_status = 'completed'`,
    [tournamentId, groupId]
  );

  const standings: TeamStanding[] = teams.map((team: any) => ({
    teamId: team.team_id,
    teamName: team.team_name,
    wins: team.wins,
    losses: team.losses,
    pointsScored: team.points_scored,
    pointsAllowed: team.points_allowed,
    pointDifferential: team.point_differential,
    seedNumber: team.seed_number,
  }));

  return applyTiebreakers(standings, matches);
}

/**
 * Apply tiebreaker rules to determine final rankings
 * Time Complexity: O(n² log n) worst case for multi-way ties
 * 
 * Algorithm:
 * 1. Group teams by number of wins
 * 2. For each win group:
 *    - If 1 team: No tie, rank directly
 *    - If 2 teams: Use head-to-head
 *    - If 3+ teams: Use point differential → points scored → seed
 * 3. Assign position numbers
 */
function applyTiebreakers(
  teams: TeamStanding[],
  matches: any[]
): TeamStanding[] {
  // Group teams by wins
  const winGroups = new Map<number, TeamStanding[]>();

  for (const team of teams) {
    const wins = team.wins;
    if (!winGroups.has(wins)) {
      winGroups.set(wins, []);
    }
    winGroups.get(wins)!.push(team);
  }

  const rankedTeams: TeamStanding[] = [];

  // Process each win group (highest wins first)
  const sortedWins = Array.from(winGroups.keys()).sort((a, b) => b - a);

  for (const wins of sortedWins) {
    const groupTeams = winGroups.get(wins)!;

    if (groupTeams.length === 1) {
      // No tie
      rankedTeams.push(groupTeams[0]);
    } else if (groupTeams.length === 2) {
      // Two-way tie: use head-to-head
      const sorted = breakTwoWayTie(groupTeams[0], groupTeams[1], matches);
      rankedTeams.push(...sorted);
    } else {
      // Multi-way tie: use point differential → points scored → seed
      const sorted = breakMultiWayTie(groupTeams);
      rankedTeams.push(...sorted);
    }
  }

  // Assign positions
  return rankedTeams.map((team, index) => ({
    ...team,
    position: index + 1,
  }));
}

/**
 * Break two-way tie using head-to-head record
 * Time Complexity: O(m) where m = number of matches
 * 
 * Tiebreaker order:
 * 1. Winner of head-to-head matchup
 * 2. Point differential (if no h2h or match not played)
 * 3. Points scored
 * 4. Seed number
 */
function breakTwoWayTie(
  team1: TeamStanding,
  team2: TeamStanding,
  matches: any[]
): TeamStanding[] {
  // Find head-to-head match
  const h2hMatch = matches.find(
    (m: any) =>
      (m.team1_id === team1.teamId && m.team2_id === team2.teamId) ||
      (m.team1_id === team2.teamId && m.team2_id === team1.teamId)
  );

  if (h2hMatch && h2hMatch.winner_team_id) {
    // Winner of head-to-head ranked higher
    return h2hMatch.winner_team_id === team1.teamId
      ? [team1, team2]
      : [team2, team1];
  }

  // Fallback to other tiebreakers
  return breakMultiWayTie([team1, team2]);
}

/**
 * Break multi-way tie using point differential and other stats
 * Time Complexity: O(n log n) where n = number of tied teams
 * 
 * Tiebreaker order:
 * 1. Point Differential (higher is better)
 * 2. Total Points Scored (higher is better)
 * 3. Seed Number (lower is better)
 */
function breakMultiWayTie(teams: TeamStanding[]): TeamStanding[] {
  return [...teams].sort((a, b) => {
    // Point differential
    if (b.pointDifferential !== a.pointDifferential) {
      return b.pointDifferential - a.pointDifferential;
    }

    // Total points scored
    if (b.pointsScored !== a.pointsScored) {
      return b.pointsScored - a.pointsScored;
    }

    // Seed number (lower is better)
    return a.seedNumber - b.seedNumber;
  });
}

/**
 * Get head-to-head record between two teams
 * Time Complexity: O(m) where m = number of matches
 */
export async function getHeadToHeadRecord(
  tournamentId: string,
  team1Id: number,
  team2Id: number
): Promise<HeadToHeadRecord | null> {
  const match = await db.query(
    `SELECT team1_id, team2_id, winner_team_id
     FROM tournament_games
     WHERE tournament_id = ?
     AND game_status = 'completed'
     AND ((team1_id = ? AND team2_id = ?) OR (team1_id = ? AND team2_id = ?))`,
    [tournamentId, team1Id, team2Id, team2Id, team1Id]
  );

  if (!match || match.length === 0) {
    return null;
  }

  return {
    team1Id,
    team2Id,
    winnerId: match[0].winner_team_id,
  };
}

/**
 * Calculate winning percentage
 * Time Complexity: O(1)
 */
export function calculateWinningPercentage(wins: number, losses: number): number {
  const totalGames = wins + losses;
  if (totalGames === 0) return 0;
  return (wins / totalGames) * 100;
}

/**
 * Format standings for display
 * Time Complexity: O(n)
 */
export function formatStandings(standings: TeamStanding[]): string[][] {
  return standings.map((team) => [
    team.position?.toString() || '-',
    team.teamName,
    team.wins.toString(),
    team.losses.toString(),
    calculateWinningPercentage(team.wins, team.losses).toFixed(1) + '%',
    team.pointsScored.toString(),
    team.pointsAllowed.toString(),
    team.pointDifferential >= 0
      ? '+' + team.pointDifferential.toString()
      : team.pointDifferential.toString(),
  ]);
}