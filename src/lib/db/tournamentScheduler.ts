"use server";

/**
 * Tournament Scheduler Orchestrator
 * Coordinates bracket generation, time scheduling, and database operations
 * 
 * This is the main entry point for tournament schedule generation
 * Handles all four tournament formats with unified interface
 * 
 * Time Complexity: O(n log n + m*c*d) where:
 *   n = number of teams
 *   m = number of matches
 *   c = number of courts
 *   d = number of days
 */

import { TimeScheduler, ScheduleConfig, ScheduledMatch } from './scheduling/timeScheduler';
import { generateSingleEliminationBracket, Team, calculateBracketStats } from './brackets/singleElimination';

const db = require("@/src/lib/db/db");

export interface ScheduleGenerationParams {
  tournamentId: string;
  numberOfCourts: number;
  gameDurationMinutes: number;
  breakDurationMinutes: number;
  tournamentStartDateTime: string; // ISO datetime
  numberOfDays: number;
  dailyStartTime: string; // "HH:MM"
  dailyEndTime: string; // "HH:MM"
}

export interface ScheduleGenerationResult {
  success: boolean;
  message: string;
  totalMatches?: number;
  estimatedEndTime?: string;
  daysUsed?: number;
}

/**
 * Main function to generate complete tournament schedule
 * Time Complexity: O(n log n + m*c*d)
 * 
 * Steps:
 * 1. Fetch tournament and registered teams from database
 * 2. Validate configuration
 * 3. Generate bracket based on tournament format
 * 4. Schedule matches with time/court assignments
 * 5. Save to database
 */
export async function generateTournamentSchedule(
  params: ScheduleGenerationParams
): Promise<ScheduleGenerationResult> {
  try {
    console.log('Starting tournament schedule generation:', params.tournamentId);

    // Step 1: Fetch tournament details
    const tournament = await getTournamentDetails(params.tournamentId);
    if (!tournament) {
      return {
        success: false,
        message: 'Tournament not found',
      };
    }

    // Step 2: Check if schedule already exists
    const existingMatches = await db.query(
      'SELECT COUNT(*) as count FROM tournament_games WHERE tournament_id = ? AND game_status != "cancelled"',
      [params.tournamentId]
    );

    if (existingMatches[0].count > 0) {
      return {
        success: false,
        message: 'Tournament schedule already exists. Delete existing schedule first.',
      };
    }

    // Step 3: Fetch registered teams
    const teams = await getRegisteredTeams(params.tournamentId);
    
    if (teams.length < 4) {
      return {
        success: false,
        message: `Insufficient teams. Need at least 4 teams, currently have ${teams.length}.`,
      };
    }

    console.log(`Found ${teams.length} registered teams`);

    // Step 4: Create scheduler configuration
    const scheduleConfig: ScheduleConfig = {
      numberOfCourts: params.numberOfCourts,
      gameDurationMinutes: params.gameDurationMinutes,
      breakDurationMinutes: params.breakDurationMinutes,
      tournamentStartDate: params.tournamentStartDateTime,
      numberOfDays: params.numberOfDays,
      dailyStartTime: params.dailyStartTime,
      dailyEndTime: params.dailyEndTime,
    };

    const scheduler = new TimeScheduler(scheduleConfig);

    // Step 5: Validate configuration
    const validation = scheduler.validateConfiguration();
    if (!validation.valid) {
      return {
        success: false,
        message: validation.message || 'Invalid schedule configuration',
      };
    }

    // Step 6: Generate bracket based on tournament format
    let bracketMatches;
    
    switch (tournament.format) {
      case 'single_elimination':
        const { generateSingleEliminationBracket: genSE } = require('./brackets/singleElimination');
        bracketMatches = genSE(teams);
        break;
      
      case 'round_robin':
        const { generateRoundRobinSchedule } = require('./brackets/roundRobin');
        bracketMatches = generateRoundRobinSchedule(teams);
        break;
      
      case 'double_elimination':
        const { generateDoubleEliminationBracket } = require('./brackets/doubleElimination');
        bracketMatches = generateDoubleEliminationBracket(teams);
        break;
      
      case 'group_stage':
        const { generateGroupStageKnockout } = require('./brackets/groupStage');
        // For group stage, organizer can specify advancing per group (default 2)
        bracketMatches = generateGroupStageKnockout(teams, 2);
        break;
      
      default:
        return {
          success: false,
          message: `Unknown tournament format: ${tournament.format}`,
        };
    }

    console.log(`Generated ${bracketMatches.length} matches for bracket`);

    // Step 7: Check if tournament duration is sufficient
    const estimation = scheduler.estimateTournamentDuration(bracketMatches.length);
    if (estimation.warning) {
      return {
        success: false,
        message: estimation.warning,
      };
    }

    // Step 8: Schedule matches with times and courts
    const scheduledMatches = scheduler.scheduleMatches(bracketMatches);
    
    console.log(`Scheduled ${scheduledMatches.length} matches`);

    // Step 9: Save to database
    await saveScheduleToDatabase(params.tournamentId, scheduledMatches);

    return {
      success: true,
      message: 'Tournament schedule generated successfully!',
      totalMatches: scheduledMatches.length,
      estimatedEndTime: estimation.estimatedEndTime.toISOString(),
      daysUsed: estimation.totalDaysUsed,
    };

  } catch (error) {
    console.error('Error generating tournament schedule:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate schedule',
    };
  }
}

/**
 * Fetch tournament details from database
 * Time Complexity: O(1)
 */
async function getTournamentDetails(tournamentId: string): Promise<any | null> {
  const result = await db.query(
    'SELECT * FROM tournaments WHERE tournament_id = ?',
    [tournamentId]
  );
  
  return result && result.length > 0 ? result[0] : null;
}

/**
 * Fetch registered teams with random initial seeding
 * Time Complexity: O(n log n) for sorting
 */
async function getRegisteredTeams(tournamentId: string): Promise<Team[]> {
  const result = await db.query(
    `SELECT 
      t.team_id,
      t.name as team_name,
      tt.seed_number
    FROM teams t
    INNER JOIN team_tournament tt ON t.team_id = tt.team_id
    WHERE tt.tournament_id = ?
    ORDER BY tt.registered_at ASC`,
    [tournamentId]
  );

  if (!result || result.length === 0) {
    return [];
  }

  // If seed numbers are not set, assign random seeding
  const teams: Team[] = result.map((row: any, index: number) => ({
    teamId: row.team_id,
    seedNumber: row.seed_number || index + 1,
    teamName: row.team_name,
  }));

  // If no seed numbers were set, update database with initial random seeding
  if (!result[0].seed_number) {
    // Shuffle teams for random seeding
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < shuffledTeams.length; i++) {
      await db.query(
        'UPDATE team_tournament SET seed_number = ? WHERE tournament_id = ? AND team_id = ?',
        [i + 1, tournamentId, shuffledTeams[i].teamId]
      );
      shuffledTeams[i].seedNumber = i + 1;
    }
    
    return shuffledTeams;
  }

  return teams;
}

/**
 * Save scheduled matches to database
 * Time Complexity: O(m) where m = number of matches
 * 
 * Uses batch insert for efficiency
 */
async function saveScheduleToDatabase(
  tournamentId: string,
  matches: ScheduledMatch[]
): Promise<void> {
  const insertQuery = `
    INSERT INTO tournament_games (
      tournament_id,
      team1_id,
      team2_id,
      round_number,
      game_number,
      bracket_type,
      scheduled_time,
      court_number,
      game_status,
      parent_match_id,
      child_match_id,
      group_id,
      created_at,
      updated_at
    ) VALUES ?
  `;

  const values = matches.map(match => [
    tournamentId,
    match.team1Id === -1 ? null : match.team1Id, // -1 represents BYE
    match.team2Id === -1 ? null : match.team2Id,
    match.roundNumber,
    match.gameNumber,
    match.bracketType,
    match.scheduledTime,
    match.courtNumber.toString(),
    'scheduled',
    match.parentMatchId || null,
    match.childMatchId || null,
    match.groupId || null,
    new Date(),
    new Date(),
  ]);

  await db.query(insertQuery, [values]);
  
  console.log(`Saved ${matches.length} matches to database`);
}

/**
 * Retrieve tournament schedule from database
 * Time Complexity: O(m) where m = number of matches
 */
export async function getTournamentSchedule(tournamentId: string): Promise<{
  success: boolean;
  matches: any[];
}> {
  try {
    const query = `
      SELECT 
        tg.*,
        t1.name as team1_name,
        t2.name as team2_name
      FROM tournament_games tg
      LEFT JOIN teams t1 ON tg.team1_id = t1.team_id
      LEFT JOIN teams t2 ON tg.team2_id = t2.team_id
      WHERE tg.tournament_id = ?
      ORDER BY tg.round_number ASC, tg.game_number ASC
    `;

    const matches = await db.query(query, [tournamentId]);

    return {
      success: true,
      matches: matches || [],
    };
  } catch (error) {
    console.error('Error fetching tournament schedule:', error);
    return {
      success: false,
      matches: [],
    };
  }
}

/**
 * Delete tournament schedule (only if no results entered)
 * Time Complexity: O(m) where m = number of matches
 */
export async function deleteTournamentSchedule(tournamentId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Check if any matches have results
    const matchesWithResults = await db.query(
      `SELECT COUNT(*) as count 
       FROM tournament_games 
       WHERE tournament_id = ? 
       AND (team1_score IS NOT NULL OR team2_score IS NOT NULL OR game_status = 'completed')`,
      [tournamentId]
    );

    if (matchesWithResults[0].count > 0) {
      return {
        success: false,
        message: 'Cannot delete schedule. Some matches already have results.',
      };
    }

    // Delete all scheduled matches
    await db.query(
      'DELETE FROM tournament_games WHERE tournament_id = ?',
      [tournamentId]
    );

    return {
      success: true,
      message: 'Tournament schedule deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting tournament schedule:', error);
    return {
      success: false,
      message: 'Failed to delete tournament schedule',
    };
  }
}

/**
 * Get bracket visualization data
 * Organizes matches by round for display
 * Time Complexity: O(m) where m = number of matches
 */
export async function getBracketData(tournamentId: string): Promise<{
  success: boolean;
  rounds: Map<number, any[]>;
  totalRounds: number;
}> {
  try {
    const { matches } = await getTournamentSchedule(tournamentId);

    const rounds = new Map<number, any[]>();
    let maxRound = 0;

    for (const match of matches) {
      const round = match.round_number;
      maxRound = Math.max(maxRound, round);

      if (!rounds.has(round)) {
        rounds.set(round, []);
      }

      rounds.get(round)!.push(match);
    }

    return {
      success: true,
      rounds,
      totalRounds: maxRound,
    };
  } catch (error) {
    console.error('Error getting bracket data:', error);
    return {
      success: false,
      rounds: new Map(),
      totalRounds: 0,
    };
  }
}