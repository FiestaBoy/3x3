"use server";

/**
 * Match Progression System
 * Handles match result entry and automatic bracket advancement
 * 
 * Key Features:
 * - Enter match scores
 * - Determine winner
 * - Auto-advance winner to next match
 * - Handle byes and forfeits
 * - Update team statistics
 * 
 * Time Complexity: O(1) per match result entry
 */

const db = require("@/src/lib/db/db");

export interface MatchResult {
  gameId: number;
  team1Score: number;
  team2Score: number;
  winnerTeamId: number;
  isForfeit?: boolean;
}

export interface MatchResultResponse {
  success: boolean;
  message: string;
  nextMatchGenerated?: boolean;
  tournamentComplete?: boolean;
}

/**
 * Enter match result and progress bracket
 * Time Complexity: O(1)
 * 
 * Algorithm:
 * 1. Validate match exists and is in correct state
 * 2. Validate scores (no ties, winner has higher score)
 * 3. Update match record with scores and winner
 * 4. Update team statistics
 * 5. Check if match has a child (next round match)
 * 6. If child exists, set winner as participant in child match
 * 7. Check if child match is now ready to be played
 */
export async function enterMatchResult(
  result: MatchResult
): Promise<MatchResultResponse> {
  try {
    console.log('Entering match result:', result);

    // Step 1: Fetch match details
    const match = await getMatchById(result.gameId);
    if (!match) {
      return {
        success: false,
        message: 'Match not found',
      };
    }

    // Step 2: Validate match state
    if (match.game_status === 'completed') {
      return {
        success: false,
        message: 'Match is already completed. Results cannot be changed.',
      };
    }

    if (match.game_status === 'cancelled') {
      return {
        success: false,
        message: 'Match is cancelled',
      };
    }

    // Step 3: Validate teams
    if (!match.team1_id || !match.team2_id) {
      return {
        success: false,
        message: 'Match does not have both teams assigned yet',
      };
    }

    // Step 4: Validate scores
    if (!result.isForfeit) {
      if (result.team1Score === result.team2Score) {
        return {
          success: false,
          message: 'Ties are not allowed. There must be a winner.',
        };
      }

      // Validate winner matches the scores
      const expectedWinner = result.team1Score > result.team2Score 
        ? match.team1_id 
        : match.team2_id;
      
      if (result.winnerTeamId !== expectedWinner) {
        return {
          success: false,
          message: 'Winner does not match the scores provided',
        };
      }

      if (result.team1Score < 0 || result.team2Score < 0) {
        return {
          success: false,
          message: 'Scores cannot be negative',
        };
      }
    }

    // Step 5: Update match record
    await db.query(
      `UPDATE tournament_games 
       SET team1_score = ?,
           team2_score = ?,
           winner_team_id = ?,
           game_status = 'completed',
           end_time = NOW(),
           updated_at = NOW()
       WHERE game_id = ?`,
      [
        result.isForfeit ? 0 : result.team1Score,
        result.isForfeit ? 0 : result.team2Score,
        result.winnerTeamId,
        result.gameId,
      ]
    );

    console.log(`Match ${result.gameId} marked as completed`);

    // Step 6: Update team statistics in team_tournament
    const loserTeamId = result.winnerTeamId === match.team1_id 
      ? match.team2_id 
      : match.team1_id;

    await updateTeamStatistics(
      match.tournament_id,
      result.winnerTeamId,
      loserTeamId,
      result.team1Score,
      result.team2Score,
      match.team1_id,
      result.isForfeit || false
    );

    // Step 7: Check if this match feeds into another match (child match)
    let nextMatchGenerated = false;
    
    if (match.child_match_id) {
      const childMatch = await getMatchById(match.child_match_id);
      
      if (childMatch) {
        // Determine which slot in the child match this winner goes to
        await advanceWinnerToNextMatch(
          match.child_match_id,
          result.winnerTeamId,
          result.gameId
        );
        
        nextMatchGenerated = true;
        console.log(`Winner advanced to match ${match.child_match_id}`);
      }
    }

    // Step 7b: Handle double elimination - loser drops to losers bracket
    if (match.bracket_type === 'winners') {
      const loserTeamId = result.winnerTeamId === match.team1_id 
        ? match.team2_id 
        : match.team1_id;

      // Check if this winners match has a loser destination
      const loserDestination = await db.query(
        `SELECT game_id FROM tournament_games 
         WHERE tournament_id = ? 
         AND bracket_type = 'losers'
         AND round_number = ?
         AND (team1_id IS NULL OR team2_id IS NULL)
         ORDER BY game_id ASC
         LIMIT 1`,
        [match.tournament_id, calculateLosersRound(match.round_number)]
      );

      if (loserDestination && loserDestination.length > 0) {
        await dropToLosersBracket(
          loserDestination[0].game_id,
          loserTeamId,
          result.gameId
        );
        console.log(`Loser dropped to losers bracket match ${loserDestination[0].game_id}`);
      }
    }

    // Step 7c: Handle grand finals bracket reset
    if (match.bracket_type === 'finals' && match.round_number === 1) {
      // Check if losers bracket champion won
      const losersChampion = await getLosersBracketChampion(match.tournament_id);
      
      if (losersChampion && result.winnerTeamId === losersChampion.team_id) {
        // Bracket reset! Enable second grand finals match
        const bracketResetMatch = await db.query(
          `SELECT game_id FROM tournament_games 
           WHERE tournament_id = ? 
           AND bracket_type = 'finals' 
           AND round_number = 2`,
          [match.tournament_id]
        );

        if (bracketResetMatch && bracketResetMatch.length > 0) {
          // Set both teams for bracket reset match
          await db.query(
            `UPDATE tournament_games 
             SET team1_id = ?, team2_id = ?, game_status = 'scheduled', updated_at = NOW()
             WHERE game_id = ?`,
            [match.team1_id, match.team2_id, bracketResetMatch[0].game_id]
          );
          console.log('Bracket reset activated!');
        }
      }
    }

    // Step 8: Check if tournament is complete
    const tournamentComplete = await checkTournamentComplete(match.tournament_id);

    // Step 8b: For group stage format, check if knockout should be generated
    if (match.group_id !== null && !tournamentComplete) {
      const { isGroupStageComplete } = require('../brackets/groupStage');
      const groupStageComplete = await isGroupStageComplete(match.tournament_id, db);
      
      if (groupStageComplete) {
        // Check if knockout already generated
        const knockoutExists = await db.query(
          'SELECT COUNT(*) as count FROM tournament_games WHERE tournament_id = ? AND group_id IS NULL',
          [match.tournament_id]
        );

        if (knockoutExists[0].count === 0) {
          // Generate knockout bracket
          console.log('Group stage complete, generating knockout bracket');
          await generateGroupStageKnockout(match.tournament_id);
        }
      }
    }

    // Step 9: If tournament complete, calculate final positions
    if (tournamentComplete) {
      await calculateFinalStandings(match.tournament_id);
    }

    return {
      success: true,
      message: result.isForfeit 
        ? 'Forfeit recorded successfully' 
        : 'Match result recorded successfully',
      nextMatchGenerated,
      tournamentComplete,
    };

  } catch (error) {
    console.error('Error entering match result:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to enter match result',
    };
  }
}

/**
 * Advance winner to the next round match
 * Time Complexity: O(1)
 * 
 * Logic:
 * - Each child match has two parent matches
 * - First parent's winner goes to team1_id
 * - Second parent's winner goes to team2_id
 */
async function advanceWinnerToNextMatch(
  childMatchId: number,
  winnerTeamId: number,
  parentMatchId: number
): Promise<void> {
  // Get the child match to determine which slot to fill
  const childMatch = await getMatchById(childMatchId);
  
  if (!childMatch) {
    throw new Error('Child match not found');
  }

  // Find all matches that feed into this child match
  const parentMatches = await db.query(
    'SELECT game_id FROM tournament_games WHERE child_match_id = ? ORDER BY game_id ASC',
    [childMatchId]
  );

  if (parentMatches.length !== 2) {
    throw new Error('Invalid bracket structure: child match should have exactly 2 parents');
  }

  // First parent's winner goes to team1, second parent's winner goes to team2
  const isFirstParent = parentMatches[0].game_id === parentMatchId;

  if (isFirstParent) {
    await db.query(
      'UPDATE tournament_games SET team1_id = ?, updated_at = NOW() WHERE game_id = ?',
      [winnerTeamId, childMatchId]
    );
  } else {
    await db.query(
      'UPDATE tournament_games SET team2_id = ?, updated_at = NOW() WHERE game_id = ?',
      [winnerTeamId, childMatchId]
    );
  }

  console.log(`Advanced team ${winnerTeamId} to match ${childMatchId} slot ${isFirstParent ? 1 : 2}`);
}

/**
 * Update team statistics after match completion
 * Time Complexity: O(1)
 */
async function updateTeamStatistics(
  tournamentId: string,
  winnerTeamId: number,
  loserTeamId: number,
  team1Score: number,
  team2Score: number,
  team1Id: number,
  isForfeit: boolean
): Promise<void> {
  // Determine which team scored which points
  const winnerScore = winnerTeamId === team1Id ? team1Score : team2Score;
  const loserScore = winnerTeamId === team1Id ? team2Score : team1Score;

  // Update winner statistics
  await db.query(
    `UPDATE team_tournament 
     SET wins = wins + 1,
         points_scored = points_scored + ?,
         points_allowed = points_allowed + ?,
         updated_at = NOW()
     WHERE tournament_id = ? AND team_id = ?`,
    [isForfeit ? 0 : winnerScore, isForfeit ? 0 : loserScore, tournamentId, winnerTeamId]
  );

  // Update loser statistics
  await db.query(
    `UPDATE team_tournament 
     SET losses = losses + 1,
         points_scored = points_scored + ?,
         points_allowed = points_allowed + ?,
         updated_at = NOW()
     WHERE tournament_id = ? AND team_id = ?`,
    [isForfeit ? 0 : loserScore, isForfeit ? 0 : winnerScore, tournamentId, loserTeamId]
  );

  console.log(`Updated statistics for winner ${winnerTeamId} and loser ${loserTeamId}`);
}

/**
 * Check if tournament is complete (all matches played or finals complete)
 * Time Complexity: O(1)
 */
async function checkTournamentComplete(tournamentId: string): Promise<boolean> {
  // Check if there are any scheduled matches remaining
  const pendingMatches = await db.query(
    `SELECT COUNT(*) as count 
     FROM tournament_games 
     WHERE tournament_id = ? 
     AND game_status IN ('scheduled', 'in_progress')
     AND team1_id IS NOT NULL 
     AND team2_id IS NOT NULL`,
    [tournamentId]
  );

  // Check if finals match is complete
  const finalsComplete = await db.query(
    `SELECT COUNT(*) as count 
     FROM tournament_games 
     WHERE tournament_id = ? 
     AND bracket_type = 'finals' 
     AND game_status = 'completed'`,
    [tournamentId]
  );

  return pendingMatches[0].count === 0 || finalsComplete[0].count > 0;
}

/**
 * Calculate final standings for completed tournament
 * Time Complexity: O(n log n) where n = number of teams
 */
async function calculateFinalStandings(tournamentId: string): Promise<void> {
  // Get all teams with their statistics
  const teams = await db.query(
    `SELECT 
      team_id,
      wins,
      losses,
      points_scored,
      points_allowed,
      (points_scored - points_allowed) as point_differential
     FROM team_tournament
     WHERE tournament_id = ?`,
    [tournamentId]
  );

  // Sort teams by wins (descending), then point differential (descending)
  teams.sort((a: any, b: any) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.point_differential !== a.point_differential) {
      return b.point_differential - a.point_differential;
    }
    return b.points_scored - a.points_scored;
  });

  // Assign final positions
  for (let i = 0; i < teams.length; i++) {
    await db.query(
      'UPDATE team_tournament SET final_position = ? WHERE tournament_id = ? AND team_id = ?',
      [i + 1, tournamentId, teams[i].team_id]
    );
  }

  console.log(`Final standings calculated for tournament ${tournamentId}`);
}

/**
 * Handle forfeit - automatically award win to opponent
 * Time Complexity: O(1)
 */
export async function forfeitMatch(
  gameId: number,
  forfeitingTeamId: number
): Promise<MatchResultResponse> {
  try {
    const match = await getMatchById(gameId);
    
    if (!match) {
      return {
        success: false,
        message: 'Match not found',
      };
    }

    if (match.game_status === 'completed') {
      return {
        success: false,
        message: 'Match is already completed',
      };
    }

    // Determine winner (the team that didn't forfeit)
    const winnerTeamId = forfeitingTeamId === match.team1_id 
      ? match.team2_id 
      : match.team1_id;

    if (!winnerTeamId) {
      return {
        success: false,
        message: 'Cannot determine winner team',
      };
    }

    // Record forfeit as 0-0 with winner set
    return await enterMatchResult({
      gameId,
      team1Score: 0,
      team2Score: 0,
      winnerTeamId,
      isForfeit: true,
    });

  } catch (error) {
    console.error('Error processing forfeit:', error);
    return {
      success: false,
      message: 'Failed to process forfeit',
    };
  }
}

/**
 * Get match by ID
 * Time Complexity: O(1)
 */
async function getMatchById(gameId: number): Promise<any | null> {
  const result = await db.query(
    'SELECT * FROM tournament_games WHERE game_id = ?',
    [gameId]
  );
  
  return result && result.length > 0 ? result[0] : null;
}

/**
 * Calculate which losers bracket round a winners bracket loser drops to
 * Time Complexity: O(1)
 * 
 * Pattern:
 * Winners R1 losers → Losers R1
 * Winners R2 losers → Losers R3
 * Winners R3 losers → Losers R5
 * Formula: Losers Round = 2 * Winners Round - 1
 */
function calculateLosersRound(winnersRound: number): number {
  return 2 * winnersRound - 1;
}

/**
 * Drop loser from winners bracket to losers bracket
 * Time Complexity: O(1)
 */
async function dropToLosersBracket(
  losersMatchId: number,
  loserTeamId: number,
  winnersMatchId: number
): Promise<void> {
  const losersMatch = await getMatchById(losersMatchId);
  
  if (!losersMatch) {
    throw new Error('Losers bracket match not found');
  }

  // Assign to first empty slot
  if (!losersMatch.team1_id) {
    await db.query(
      'UPDATE tournament_games SET team1_id = ?, updated_at = NOW() WHERE game_id = ?',
      [loserTeamId, losersMatchId]
    );
  } else if (!losersMatch.team2_id) {
    await db.query(
      'UPDATE tournament_games SET team2_id = ?, updated_at = NOW() WHERE game_id = ?',
      [loserTeamId, losersMatchId]
    );
  }

  console.log(`Team ${loserTeamId} dropped to losers match ${losersMatchId}`);
}

/**
 * Get losers bracket champion (winner of last losers bracket match)
 * Time Complexity: O(1)
 */
async function getLosersBracketChampion(tournamentId: string): Promise<any | null> {
  const result = await db.query(
    `SELECT winner_team_id as team_id
     FROM tournament_games
     WHERE tournament_id = ?
     AND bracket_type = 'losers'
     AND game_status = 'completed'
     ORDER BY round_number DESC
     LIMIT 1`,
    [tournamentId]
  );

  return result && result.length > 0 ? result[0] : null;
}

/**
 * Generate knockout bracket after group stage completes
 * Time Complexity: O(n log n)
 */
async function generateGroupStageKnockout(tournamentId: string): Promise<void> {
  const { generateKnockoutFromGroups, calculateOptimalGroupConfig } = require('../brackets/groupStage');
  
  // Get tournament details
  const tournament = await db.query(
    'SELECT * FROM tournaments WHERE tournament_id = ?',
    [tournamentId]
  );

  if (!tournament || tournament.length === 0) {
    throw new Error('Tournament not found');
  }

  // Get number of teams
  const teamCount = await db.query(
    `SELECT COUNT(DISTINCT team_id) as count 
     FROM team_tournament 
     WHERE tournament_id = ?`,
    [tournamentId]
  );

  const numberOfTeams = teamCount[0].count;

  // Calculate group configuration
  const groupConfig = calculateOptimalGroupConfig(numberOfTeams, 2);

  // Get next game number
  const maxGameNumber = await db.query(
    'SELECT MAX(game_number) as max_num FROM tournament_games WHERE tournament_id = ?',
    [tournamentId]
  );

  const startingGameNumber = (maxGameNumber[0].max_num || 0) + 1;

  // Generate knockout matches
  const knockoutMatches = await generateKnockoutFromGroups(
    tournamentId,
    groupConfig,
    db,
    startingGameNumber
  );

  // Get tournament schedule config from first match
  const firstMatch = await db.query(
    'SELECT scheduled_time FROM tournament_games WHERE tournament_id = ? ORDER BY game_id ASC LIMIT 1',
    [tournamentId]
  );

  if (!knockoutMatches || knockoutMatches.length === 0) {
    console.log('No knockout matches to generate');
    return;
  }

  // Calculate when knockout should start (after last group match)
  const lastGroupMatch = await db.query(
    `SELECT MAX(scheduled_time) as last_time 
     FROM tournament_games 
     WHERE tournament_id = ? AND group_id IS NOT NULL`,
    [tournamentId]
  );

  // Add knockout matches to database
  const { TimeScheduler } = require('../scheduling/timeScheduler');
  
  // Create a simplified schedule config for knockout (using tournament's game duration)
  const knockoutStartTime = new Date(lastGroupMatch[0].last_time);
  knockoutStartTime.setMinutes(knockoutStartTime.getMinutes() + tournament[0].game_duration + 30); // 30 min break

  const scheduleConfig = {
    numberOfCourts: 2, // Default
    gameDurationMinutes: tournament[0].game_duration,
    breakDurationMinutes: 5,
    tournamentStartDate: knockoutStartTime.toISOString(),
    numberOfDays: 1,
    dailyStartTime: '09:00',
    dailyEndTime: '18:00',
  };

  const scheduler = new TimeScheduler(scheduleConfig);
  const scheduledMatches = scheduler.scheduleMatches(knockoutMatches);

  // Save knockout matches
  for (const match of scheduledMatches) {
    await db.query(
      `INSERT INTO tournament_games (
        tournament_id, team1_id, team2_id, round_number, game_number,
        bracket_type, scheduled_time, court_number, game_status,
        parent_match_id, child_match_id, group_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        tournamentId,
        match.team1Id === -1 ? null : match.team1Id,
        match.team2Id === -1 ? null : match.team2Id,
        match.roundNumber,
        match.gameNumber,
        match.bracketType,
        match.scheduledTime,
        match.courtNumber.toString(),
        'scheduled',
        match.parentMatchId || null,
        match.childMatchId || null,
        null, // No group for knockout
      ]
    );
  }

  console.log(`Generated ${scheduledMatches.length} knockout matches`);
}

/**
 * Handle bye advancement (when a team gets a bye)
 * Time Complexity: O(1)
 * 
 * Automatically advances team with bye to next round
 */
export async function processByes(tournamentId: string): Promise<void> {
  // Find all matches where one team is BYE (represented as NULL)
  const byeMatches = await db.query(
    `SELECT * FROM tournament_games 
     WHERE tournament_id = ? 
     AND (team1_id IS NULL OR team2_id IS NULL)
     AND game_status = 'scheduled'`,
    [tournamentId]
  );

  for (const match of byeMatches) {
    const advancingTeam = match.team1_id || match.team2_id;
    
    if (advancingTeam && match.child_match_id) {
      // Auto-complete the bye match
      await db.query(
        `UPDATE tournament_games 
         SET game_status = 'completed',
             winner_team_id = ?,
             team1_score = 0,
             team2_score = 0,
             updated_at = NOW()
         WHERE game_id = ?`,
        [advancingTeam, match.game_id]
      );

      // Advance to next match
      await advanceWinnerToNextMatch(
        match.child_match_id,
        advancingTeam,
        match.game_id
      );

      console.log(`Team ${advancingTeam} auto-advanced from bye in match ${match.game_id}`);
    }
  }
}