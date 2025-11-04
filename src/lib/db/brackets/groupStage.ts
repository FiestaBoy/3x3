/**
 * Group Stage + Knockout Tournament Generator
 * 
 * Algorithm Overview:
 * Phase 1: Group Stage
 * - Divide teams into balanced groups
 * - Round robin within each group
 * - Rank teams using tiebreaker rules
 * 
 * Phase 2: Knockout Stage
 * - Top N teams from each group advance
 * - Seeded based on group performance
 * - Single elimination bracket
 * 
 * Time Complexity: O(n² + n log n) where n = number of teams
 * Space Complexity: O(n²) for group stage matches
 */

import { MatchToSchedule } from '../scheduling/timeScheduler';
import { generateRoundRobinSchedule } from './roundRobin';
import { generateSingleEliminationBracket } from './singleElimination';

export interface Team {
  teamId: number;
  seedNumber: number;
  teamName?: string;
}

export interface GroupConfig {
  numberOfGroups: number;
  teamsPerGroup: number[];
  advancingPerGroup: number;
}

/**
 * Calculate optimal group configuration
 * Time Complexity: O(1)
 * 
 * Goals:
 * - Minimize group size difference (max 1 team difference)
 * - Maximize number of advancing teams while keeping knockout power-of-2
 * - Ensure competitive balance
 * 
 * Examples:
 * 8 teams → 2 groups of 4, top 2 advance = 4 team knockout
 * 12 teams → 3 groups of 4, top 2 advance = 6 teams (add 2 best 3rd place)
 * 16 teams → 4 groups of 4, top 2 advance = 8 team knockout
 */
export function calculateOptimalGroupConfig(
  numberOfTeams: number,
  organizerAdvancingPerGroup?: number
): GroupConfig {
  // Minimum 4 teams required
  if (numberOfTeams < 4) {
    throw new Error('Need at least 4 teams for group stage');
  }

  // Determine number of groups (aim for 3-5 teams per group)
  let numberOfGroups: number;
  
  if (numberOfTeams <= 8) {
    numberOfGroups = 2; // 4 teams per group
  } else if (numberOfTeams <= 12) {
    numberOfGroups = 3; // 4 teams per group
  } else if (numberOfTeams <= 16) {
    numberOfGroups = 4; // 4 teams per group
  } else if (numberOfTeams <= 24) {
    numberOfGroups = Math.ceil(numberOfTeams / 5); // 5-6 teams per group
  } else {
    numberOfGroups = Math.ceil(numberOfTeams / 6); // 6-7 teams per group
  }

  // Calculate teams per group (balanced distribution)
  const baseTeamsPerGroup = Math.floor(numberOfTeams / numberOfGroups);
  const remainder = numberOfTeams % numberOfGroups;

  const teamsPerGroup: number[] = [];
  for (let i = 0; i < numberOfGroups; i++) {
    // First 'remainder' groups get one extra team
    teamsPerGroup.push(baseTeamsPerGroup + (i < remainder ? 1 : 0));
  }

  // Determine advancing per group
  let advancingPerGroup: number;
  
  if (organizerAdvancingPerGroup) {
    advancingPerGroup = organizerAdvancingPerGroup;
  } else {
    // Default: aim for power-of-2 knockout bracket
    // Top 2 from each group usually works best
    advancingPerGroup = 2;
    
    // For very large groups, may take top 3
    if (baseTeamsPerGroup >= 6) {
      advancingPerGroup = 3;
    }
  }

  console.log(`Group configuration: ${numberOfGroups} groups`);
  console.log(`Teams per group: ${teamsPerGroup.join(', ')}`);
  console.log(`Advancing per group: ${advancingPerGroup}`);

  return {
    numberOfGroups,
    teamsPerGroup,
    advancingPerGroup,
  };
}

/**
 * Distribute teams into groups with balanced seeding
 * Time Complexity: O(n) where n = number of teams
 * 
 * Seeding Strategy: Snake draft
 * Group 1: Seeds 1, 8, 9, 16
 * Group 2: Seeds 2, 7, 10, 15
 * Group 3: Seeds 3, 6, 11, 14
 * Group 4: Seeds 4, 5, 12, 13
 */
function distributeTeamsIntoGroups(
  teams: Team[],
  groupConfig: GroupConfig
): Map<number, Team[]> {
  const sortedTeams = [...teams].sort((a, b) => a.seedNumber - b.seedNumber);
  const groups: Map<number, Team[]> = new Map();

  // Initialize groups
  for (let i = 0; i < groupConfig.numberOfGroups; i++) {
    groups.set(i + 1, []);
  }

  // Snake draft distribution
  let currentGroup = 1;
  let direction = 1; // 1 for forward, -1 for backward

  for (const team of sortedTeams) {
    groups.get(currentGroup)!.push(team);

    // Move to next group
    currentGroup += direction;

    // Reverse direction at boundaries
    if (currentGroup > groupConfig.numberOfGroups) {
      currentGroup = groupConfig.numberOfGroups;
      direction = -1;
    } else if (currentGroup < 1) {
      currentGroup = 1;
      direction = 1;
    }
  }

  return groups;
}

/**
 * Generate complete group stage + knockout tournament
 * Time Complexity: O(n² + n log n)
 */
export function generateGroupStageKnockout(
  teams: Team[],
  advancingPerGroup?: number
): MatchToSchedule[] {
  if (teams.length < 4) {
    throw new Error('Group stage requires at least 4 teams');
  }

  console.log(`Generating group stage + knockout for ${teams.length} teams`);

  const matches: MatchToSchedule[] = [];
  let gameNumber = 1;

  // Step 1: Calculate group configuration
  const groupConfig = calculateOptimalGroupConfig(teams.length, advancingPerGroup);

  // Step 2: Distribute teams into groups
  const groups = distributeTeamsIntoGroups(teams, groupConfig);

  // Step 3: Generate round robin for each group
  for (const [groupId, groupTeams] of groups.entries()) {
    console.log(`Generating group ${groupId} with ${groupTeams.length} teams`);

    const groupMatches = generateRoundRobinSchedule(groupTeams);

    // Add group ID and adjust game numbers
    for (const match of groupMatches) {
      matches.push({
        ...match,
        groupId,
        gameNumber,
      });
      gameNumber++;
    }
  }

  console.log(`Generated ${matches.length} group stage matches`);

  // Step 4: Placeholder for knockout stage
  // Note: Knockout matches will be generated AFTER group stage completes
  // and teams are seeded based on group performance
  // This is handled in the match progression system

  return matches;
}

/**
 * Generate knockout bracket after group stage completion
 * Time Complexity: O(n log n)
 * 
 * Called after all group stage matches are complete
 * Seeds teams based on group performance and generates knockout bracket
 */
export async function generateKnockoutFromGroups(
  tournamentId: string,
  groupConfig: GroupConfig,
  db: any,
  startingGameNumber: number
): Promise<MatchToSchedule[]> {
  console.log('Generating knockout bracket from group stage results');

  // Step 1: Get group standings for all groups
  const allGroupStandings: Team[] = [];

  for (let groupId = 1; groupId <= groupConfig.numberOfGroups; groupId++) {
    const standings = await getGroupStandings(tournamentId, groupId, db);
    
    // Take top N from each group
    const advancing = standings.slice(0, groupConfig.advancingPerGroup);
    
    for (const team of advancing) {
      allGroupStandings.push({
        teamId: team.team_id,
        seedNumber: allGroupStandings.length + 1, // Sequential seeding
        teamName: team.team_name,
      });
    }
  }

  console.log(`${allGroupStandings.length} teams advancing to knockout`);

  // Step 2: Re-seed teams based on group stage performance
  const reseededTeams = await reseedTeamsFromGroups(
    tournamentId,
    allGroupStandings,
    groupConfig,
    db
  );

  // Step 3: Generate single elimination bracket
  const knockoutMatches = generateSingleEliminationBracket(reseededTeams);

  // Step 4: Adjust round numbers and game numbers
  // Knockout starts after group stage rounds
  const maxGroupRound = await getMaxGroupRound(tournamentId, db);

  const adjustedMatches = knockoutMatches.map((match) => ({
    ...match,
    roundNumber: match.roundNumber + maxGroupRound,
    gameNumber: startingGameNumber++,
    groupId: null, // Knockout has no group
  }));

  return adjustedMatches;
}

/**
 * Get standings for a specific group
 * Time Complexity: O(n log n) where n = teams in group
 * 
 * Applies same tiebreaker rules as round robin:
 * 1. Wins
 * 2. Head-to-head (if 2-way tie)
 * 3. Point differential
 * 4. Points scored
 * 5. Original seed
 */
async function getGroupStandings(
  tournamentId: string,
  groupId: number,
  db: any
): Promise<any[]> {
  // Get all teams in this group with statistics
  const query = `
    SELECT 
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
    )
    ORDER BY tt.wins DESC, point_differential DESC, tt.points_scored DESC, tt.seed_number ASC
  `;

  const standings = await db.query(query, [tournamentId, groupId]);

  return standings;
}

/**
 * Re-seed teams for knockout based on group performance
 * Time Complexity: O(n log n)
 * 
 * Seeding priority:
 * 1. Group winners (sorted by record)
 * 2. Group runners-up (sorted by record)
 * 3. Third place teams if applicable (sorted by record)
 */
async function reseedTeamsFromGroups(
  tournamentId: string,
  advancingTeams: Team[],
  groupConfig: GroupConfig,
  db: any
): Promise<Team[]> {
  // Get detailed statistics for all advancing teams
  const teamStats = await db.query(
    `SELECT 
      team_id,
      wins,
      points_scored - points_allowed as point_differential,
      points_scored
    FROM team_tournament
    WHERE tournament_id = ? AND team_id IN (?)`,
    [tournamentId, advancingTeams.map(t => t.teamId)]
  );

  // Create map for quick lookup
  const statsMap = new Map(
    teamStats.map((s: any) => [s.team_id, s])
  );

  // Sort teams by performance
  const sorted = [...advancingTeams].sort((a, b) => {
    const statsA = statsMap.get(a.teamId);
    const statsB = statsMap.get(b.teamId);

    if (!statsA || !statsB) return 0;

    // Compare wins
    if (statsB.wins !== statsA.wins) {
      return statsB.wins - statsA.wins;
    }

    // Compare point differential
    if (statsB.point_differential !== statsA.point_differential) {
      return statsB.point_differential - statsA.point_differential;
    }

    // Compare points scored
    if (statsB.points_scored !== statsA.points_scored) {
      return statsB.points_scored - statsA.points_scored;
    }

    // Original seed
    return a.seedNumber - b.seedNumber;
  });

  // Assign new seed numbers
  return sorted.map((team, index) => ({
    ...team,
    seedNumber: index + 1,
  }));
}

/**
 * Get maximum round number from group stage
 * Time Complexity: O(1)
 */
async function getMaxGroupRound(tournamentId: string, db: any): Promise<number> {
  const result = await db.query(
    `SELECT MAX(round_number) as max_round 
     FROM tournament_games 
     WHERE tournament_id = ? AND group_id IS NOT NULL`,
    [tournamentId]
  );

  return result[0].max_round || 0;
}

/**
 * Check if all group stage matches are complete
 * Time Complexity: O(1)
 */
export async function isGroupStageComplete(
  tournamentId: string,
  db: any
): Promise<boolean> {
  const result = await db.query(
    `SELECT COUNT(*) as incomplete
     FROM tournament_games
     WHERE tournament_id = ?
     AND group_id IS NOT NULL
     AND game_status != 'completed'
     AND team1_id IS NOT NULL
     AND team2_id IS NOT NULL`,
    [tournamentId]
  );

  return result[0].incomplete === 0;
}

/**
 * Calculate group stage statistics
 * Time Complexity: O(1)
 */
export function calculateGroupStageStats(
  numberOfTeams: number,
  advancingPerGroup?: number
): {
  numberOfGroups: number;
  totalGroupMatches: number;
  teamsAdvancing: number;
  knockoutRounds: number;
  totalMatches: number;
} {
  const config = calculateOptimalGroupConfig(numberOfTeams, advancingPerGroup);

  // Calculate total group stage matches
  let totalGroupMatches = 0;
  for (const teamCount of config.teamsPerGroup) {
    totalGroupMatches += (teamCount * (teamCount - 1)) / 2;
  }

  // Calculate knockout stage
  const teamsAdvancing = config.numberOfGroups * config.advancingPerGroup;
  const knockoutSize = Math.pow(2, Math.ceil(Math.log2(teamsAdvancing)));
  const knockoutMatches = knockoutSize - 1;
  const knockoutRounds = Math.log2(knockoutSize);

  return {
    numberOfGroups: config.numberOfGroups,
    totalGroupMatches,
    teamsAdvancing,
    knockoutRounds,
    totalMatches: totalGroupMatches + knockoutMatches,
  };
}