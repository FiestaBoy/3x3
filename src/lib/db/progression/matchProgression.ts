"use server";

/**
 * Match Progression System - Binary Tree Version
 * Uses parent_match_id and child_match_id for proper tree structure
 * 
 * Binary Tree Logic:
 * - Each match can have ONE parent (the match it came from)
 * - Each match can have ONE child (the match winner advances to)
 * - Child matches fill team1 first, then team2 based on completion order
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

    console.log('Match details:', {
      game_id: match.game_id,
      team1: match.team1_id,
      team2: match.team2_id,
      child_match_id: match.child_match_id,
      status: match.game_status
    });

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
    const updateResult = await db.query(
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

    console.log(`Match ${result.gameId} update result:`, updateResult);

    // Step 6: Update team statistics
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

    // Step 7: Advance winner to child match
    let nextMatchGenerated = false;
    
    if (match.child_match_id) {
      console.log(`🔄 Attempting to advance winner ${result.winnerTeamId} to child match ${match.child_match_id}`);
      
      await advanceWinnerToNextMatch(
        match.child_match_id,
        result.winnerTeamId
      );
      
      nextMatchGenerated = true;
      console.log(`✅ Winner (Team ${result.winnerTeamId}) advanced to match ${match.child_match_id}`);

      // Check if child match is ready
      await checkAndActivateMatch(match.child_match_id);
    } else {
      console.log('⚠️ No child_match_id found - this might be a final match');
    }

    // Step 7b: Handle double elimination - loser drops to losers bracket
    if (match.bracket_type === 'winners') {
      await handleWinnersBracketLoser(
        match.tournament_id,
        loserTeamId,
        match.round_number,
        match.game_number,
        result.gameId
      );
    }

    // Step 7c: Handle grand finals bracket reset
    if (match.bracket_type === 'finals' && match.round_number === 1) {
      await handleGrandFinalsBracketReset(
        match.tournament_id,
        result.winnerTeamId,
        match.team1_id,
        match.team2_id
      );
    }

    // Step 8: Check if tournament is complete
    const tournamentComplete = await checkTournamentComplete(match.tournament_id);

    // Step 9: If tournament complete, calculate final positions
    if (tournamentComplete) {
      await calculateFinalStandings(match.tournament_id);
      
      await db.query(
        `UPDATE tournaments SET status = 'completed', updated_at = NOW() 
         WHERE tournament_id = ?`,
        [match.tournament_id]
      );
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
 * Advance winner to next match using binary tree logic
 * Time Complexity: O(1)
 * 
 * Binary Tree Logic:
 * - Child match fills team1 first, then team2 based on ORDER OF COMPLETION
 * - No parent tracking needed - just fill next empty slot
 */
async function advanceWinnerToNextMatch(
  childMatchId: number,
  winnerTeamId: number
): Promise<void> {
  console.log(`\n🔄 advanceWinnerToNextMatch called:`);
  console.log(`   - childMatchId: ${childMatchId}`);
  console.log(`   - winnerTeamId: ${winnerTeamId}`);

  const childMatch = await getMatchById(childMatchId);
  
  if (!childMatch) {
    console.error(`❌ Child match ${childMatchId} NOT FOUND in database!`);
    throw new Error('Child match not found');
  }

  console.log(`📋 Child match BEFORE update:`, {
    game_id: childMatch.game_id,
    team1_id: childMatch.team1_id,
    team2_id: childMatch.team2_id,
    game_status: childMatch.game_status,
    parent_match_id: childMatch.parent_match_id,
    child_match_id: childMatch.child_match_id
  });

  // Fill first empty slot: team1 first, then team2
  if (childMatch.team1_id === null || childMatch.team1_id === undefined) {
    console.log(`🎯 Setting team1_id = ${winnerTeamId} for match ${childMatchId}`);
    
    const updateResult = await db.query(
      'UPDATE tournament_games SET team1_id = ?, updated_at = NOW() WHERE game_id = ?',
      [winnerTeamId, childMatchId]
    );
    
    console.log(`📝 UPDATE query result:`, updateResult);
    console.log(`   - affectedRows: ${updateResult.affectedRows}`);
    console.log(`   - changedRows: ${updateResult.changedRows}`);
    
    // Verify the update
    const verifyMatch = await getMatchById(childMatchId);
    console.log(`✅ Child match AFTER update:`, {
      game_id: verifyMatch.game_id,
      team1_id: verifyMatch.team1_id,
      team2_id: verifyMatch.team2_id
    });
    
    if (verifyMatch.team1_id !== winnerTeamId) {
      console.error(`❌ UPDATE FAILED! team1_id is still ${verifyMatch.team1_id}, expected ${winnerTeamId}`);
      throw new Error('Failed to update team1_id in database');
    }
    
  } else if (childMatch.team2_id === null || childMatch.team2_id === undefined) {
    console.log(`🎯 Setting team2_id = ${winnerTeamId} for match ${childMatchId}`);
    
    const updateResult = await db.query(
      'UPDATE tournament_games SET team2_id = ?, updated_at = NOW() WHERE game_id = ?',
      [winnerTeamId, childMatchId]
    );
    
    console.log(`📝 UPDATE query result:`, updateResult);
    console.log(`   - affectedRows: ${updateResult.affectedRows}`);
    console.log(`   - changedRows: ${updateResult.changedRows}`);
    
    // Verify the update
    const verifyMatch = await getMatchById(childMatchId);
    console.log(`✅ Child match AFTER update:`, {
      game_id: verifyMatch.game_id,
      team1_id: verifyMatch.team1_id,
      team2_id: verifyMatch.team2_id
    });
    
    if (verifyMatch.team2_id !== winnerTeamId) {
      console.error(`❌ UPDATE FAILED! team2_id is still ${verifyMatch.team2_id}, expected ${winnerTeamId}`);
      throw new Error('Failed to update team2_id in database');
    }
    
  } else {
    console.warn(`⚠️ Match ${childMatchId} already has both teams assigned!`);
    console.warn(`   - team1_id: ${childMatch.team1_id}`);
    console.warn(`   - team2_id: ${childMatch.team2_id}`);
  }
}

/**
 * Check if match has both teams and activate it
 * Time Complexity: O(1)
 */
async function checkAndActivateMatch(matchId: number): Promise<void> {
  const match = await getMatchById(matchId);
  
  if (!match) {
    console.warn(`⚠️ checkAndActivateMatch: match ${matchId} not found`);
    return;
  }

  console.log(`🔍 Match ${matchId} status:`, {
    team1_id: match.team1_id,
    team2_id: match.team2_id,
    current_status: match.game_status
  });

  // Just log if both teams are now assigned - status is already 'scheduled'
  if (match.team1_id && match.team2_id) {
    console.log(`✅ Match ${matchId} ready to play (both teams assigned)`);
  } else {
    console.log(`⏸️ Match ${matchId} waiting for teams`);
  }
}
// ...existing code for rest of the functions...

/**
 * Handle loser from winners bracket dropping to losers bracket
 * Time Complexity: O(1)
 */
async function handleWinnersBracketLoser(
  tournamentId: string,
  loserTeamId: number,
  winnersRound: number,
  winnersGameNumber: number,
  winnersMatchId: number
): Promise<void> {
  const losersRound = 2 * winnersRound - 1;
  
  // Find losers bracket matches for this round
  const losersMatches = await db.query(
    `SELECT game_id, team1_id, team2_id FROM tournament_games 
     WHERE tournament_id = ? 
     AND bracket_type = 'losers'
     AND round_number = ?
     ORDER BY game_number ASC`,
    [tournamentId, losersRound]
  );

  if (!losersMatches || losersMatches.length === 0) {
    console.warn(`No losers bracket match found for round ${losersRound}`);
    return;
  }

  // Find first available slot
  for (const match of losersMatches) {
    if (!match.team1_id) {
      await db.query(
        'UPDATE tournament_games SET team1_id = ?, updated_at = NOW() WHERE game_id = ?',
        [loserTeamId, match.game_id]
      );
      console.log(`Team ${loserTeamId} dropped to losers match ${match.game_id} (team1)`);
      await checkAndActivateMatch(match.game_id);
      return;
    } else if (!match.team2_id) {
      await db.query(
        'UPDATE tournament_games SET team2_id = ?, updated_at = NOW() WHERE game_id = ?',
        [loserTeamId, match.game_id]
      );
      console.log(`Team ${loserTeamId} dropped to losers match ${match.game_id} (team2)`);
      await checkAndActivateMatch(match.game_id);
      return;
    }
  }
  
  console.warn(`No available slot in losers bracket round ${losersRound}`);
}

/**
 * Handle grand finals bracket reset
 * Time Complexity: O(1)
 */
async function handleGrandFinalsBracketReset(
  tournamentId: string,
  winnerId: number,
  team1Id: number,
  team2Id: number
): Promise<void> {
  const losersChampion = await getLosersBracketChampion(tournamentId);
  
  if (losersChampion && winnerId === losersChampion.team_id) {
    const bracketResetMatch = await db.query(
      `SELECT game_id FROM tournament_games 
       WHERE tournament_id = ? 
       AND bracket_type = 'finals' 
       AND round_number = 2`,
      [tournamentId]
    );

    if (bracketResetMatch && bracketResetMatch.length > 0) {
      await db.query(
        `UPDATE tournament_games 
         SET team1_id = ?, team2_id = ?, game_status = 'scheduled', updated_at = NOW()
         WHERE game_id = ?`,
        [team1Id, team2Id, bracketResetMatch[0].game_id]
      );
      console.log('Bracket reset activated!');
    }
  }
}

/**
 * Update team statistics
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
  const winnerScore = winnerTeamId === team1Id ? team1Score : team2Score;
  const loserScore = winnerTeamId === team1Id ? team2Score : team1Score;

  await db.query(
    `UPDATE team_tournament 
     SET wins = wins + 1,
         points_scored = points_scored + ?,
         points_allowed = points_allowed + ?,
         updated_at = NOW()
     WHERE tournament_id = ? AND team_id = ?`,
    [isForfeit ? 0 : winnerScore, isForfeit ? 0 : loserScore, tournamentId, winnerTeamId]
  );

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
 * Check if tournament is complete
 * Time Complexity: O(1)
 */
async function checkTournamentComplete(tournamentId: string): Promise<boolean> {
  const pendingMatches = await db.query(
    `SELECT COUNT(*) as count 
     FROM tournament_games 
     WHERE tournament_id = ? 
     AND game_status IN ('scheduled', 'in_progress')
     AND team1_id IS NOT NULL 
     AND team2_id IS NOT NULL`,
    [tournamentId]
  );

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
 * Calculate final standings
 * Time Complexity: O(n log n)
 */
async function calculateFinalStandings(tournamentId: string): Promise<void> {
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

  teams.sort((a: any, b: any) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.point_differential !== a.point_differential) {
      return b.point_differential - a.point_differential;
    }
    return b.points_scored - a.points_scored;
  });

  for (let i = 0; i < teams.length; i++) {
    await db.query(
      'UPDATE team_tournament SET final_position = ?, updated_at = NOW() WHERE tournament_id = ? AND team_id = ?',
      [i + 1, tournamentId, teams[i].team_id]
    );
  }

  console.log(`Final standings calculated for tournament ${tournamentId}`);
}

/**
 * Handle forfeit
 * Time Complexity: O(1)
 */
export async function forfeitMatch(
  gameId: number,
  forfeitingTeamId: number
): Promise<MatchResultResponse> {
  try {
    const match = await getMatchById(gameId);
    
    if (!match) {
      return { success: false, message: 'Match not found' };
    }

    if (match.game_status === 'completed') {
      return { success: false, message: 'Match is already completed' };
    }

    const winnerTeamId = forfeitingTeamId === match.team1_id 
      ? match.team2_id 
      : match.team1_id;

    if (!winnerTeamId) {
      return { success: false, message: 'Cannot determine winner team' };
    }

    return await enterMatchResult({
      gameId,
      team1Score: 0,
      team2Score: 0,
      winnerTeamId,
      isForfeit: true,
    });

  } catch (error) {
    console.error('Error processing forfeit:', error);
    return { success: false, message: 'Failed to process forfeit' };
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
 * Get losers bracket champion
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
 * Process byes
 * Time Complexity: O(n)
 */
export async function processByes(tournamentId: string): Promise<void> {
  const byeMatches = await db.query(
    `SELECT * FROM tournament_games 
     WHERE tournament_id = ? 
     AND ((team1_id IS NULL AND team2_id IS NOT NULL) OR (team1_id IS NOT NULL AND team2_id IS NULL))
     AND game_status IN ('scheduled', 'pending')`,
    [tournamentId]
  );

  for (const match of byeMatches) {
    const advancingTeam = match.team1_id || match.team2_id;
    
    if (advancingTeam && match.child_match_id) {
      await db.query(
        `UPDATE tournament_games 
         SET game_status = 'completed',
             winner_team_id = ?,
             team1_score = 0,
             team2_score = 0,
             end_time = NOW(),
             updated_at = NOW()
         WHERE game_id = ?`,
        [advancingTeam, match.game_id]
      );

      await advanceWinnerToNextMatch(match.child_match_id, advancingTeam);
      await checkAndActivateMatch(match.child_match_id);

      console.log(`Team ${advancingTeam} auto-advanced from bye in match ${match.game_id}`);
    }
  }
}