"use server";

import { revalidatePath } from "next/cache";

const db = require("@/src/lib/db/db");

interface Team {
  team_id: number;
  name: string;
}

interface ScheduleOptions {
  tournamentId: string;
  startDate: Date;
  gameDuration: number;
  courtCount: number;
  gamesPerDay: number;
  startTime: string;
  endTime: string;
  breakDuration: number;
  includeWeekends: boolean;
  restDaysBetweenMatches: number;
}

interface Match {
  team1_id: number | null;
  team2_id: number | null;
  round_number: number;
  game_number: number;
  bracket_type: "winners" | "losers" | "finals" | "group";
  scheduled_time: Date | null;
  court_number: string | null;
  group_id?: number;
  parent_match_id?: number | null;
  child_match_id?: number | null;
  winner_position?: 'team1' | 'team2'; // Which slot winner goes to in child
}

interface TeamSchedule {
  teamId: number;
  lastMatchDate: Date | null;
  matchCount: number;
}

/**
 * Main function to generate tournament schedule
 */
export async function generateTournamentSchedule(
  tournamentId: string,
  options: Partial<ScheduleOptions> = {}
) {
  try {
    const tournament = await db.query(
      "SELECT * FROM tournaments WHERE tournament_id = ?",
      [tournamentId]
    );

    if (!tournament || tournament.length === 0) {
      return { success: false, message: "Tournament not found" };
    }

    const tournamentData = tournament[0];

    const teams = await db.query(
      `SELECT t.team_id, t.name 
       FROM teams t
       INNER JOIN team_tournament tt ON t.team_id = tt.team_id
       WHERE tt.tournament_id = ?
       ORDER BY RAND()`,
      [tournamentId]
    );

    if (teams.length < 4) {
      return {
        success: false,
        message: "Need at least 4 teams to generate schedule",
      };
    }

    const scheduleOptions: ScheduleOptions = {
      tournamentId,
      startDate: new Date(tournamentData.start_date),
      gameDuration: tournamentData.game_duration || 10,
      courtCount: options.courtCount || 2,
      gamesPerDay: options.gamesPerDay || 8,
      startTime: options.startTime || "09:00",
      endTime: options.endTime || "18:00",
      breakDuration: options.breakDuration ?? 10,
      includeWeekends: options.includeWeekends ?? true,
      restDaysBetweenMatches: options.restDaysBetweenMatches ?? 0,
    };

    const validation = validateScheduleOptions(scheduleOptions, tournamentData);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    let matches: Match[] = [];

    switch (tournamentData.format) {
      case "single_elimination":
        matches = generateSingleEliminationBracketComplete(teams);
        break;
      case "round_robin":
        matches = generateRoundRobinSchedule(teams);
        break;
      default:
        return { success: false, message: "Unsupported tournament format" };
    }

    const scheduledMatches = await assignScheduleTimesAdvanced(
      matches,
      scheduleOptions,
      teams
    );

    await db.query("DELETE FROM tournament_games WHERE tournament_id = ?", [
      tournamentId,
    ]);

    // First pass: Insert all matches to get game_ids
    const insertedMatches: Map<number, number> = new Map(); // game_number -> game_id

    for (const match of scheduledMatches) {
      const result = await db.query(
        `INSERT INTO tournament_games 
        (tournament_id, team1_id, team2_id, round_number, game_number, 
         bracket_type, scheduled_time, court_number, game_status, group_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tournamentId,
          match.team1_id,
          match.team2_id,
          match.round_number,
          match.game_number,
          match.bracket_type,
          match.scheduled_time,
          match.court_number,
          match.team1_id && match.team2_id ? 'scheduled' : 'pending',
          match.group_id || null,
        ]
      );
      
      insertedMatches.set(match.game_number, result.insertId);
    }

    // Second pass: Update parent-child relationships
    for (const match of scheduledMatches) {
      if (match.parent_match_id) {
        const parentGameId = insertedMatches.get(match.parent_match_id);
        const currentGameId = insertedMatches.get(match.game_number);
        
        if (parentGameId && currentGameId) {
          // Update parent with child_match_id
          await db.query(
            `UPDATE tournament_games 
             SET child_match_id = ?
             WHERE game_id = ?`,
            [currentGameId, parentGameId]
          );
          
          // Update child with parent_match_id
          await db.query(
            `UPDATE tournament_games 
             SET parent_match_id = ?
             WHERE game_id = ?`,
            [parentGameId, currentGameId]
          );
        }
      }
    }

    await db.query(
      "UPDATE tournaments SET status = 'upcoming' WHERE tournament_id = ?",
      [tournamentId]
    );

    revalidatePath("/tournaments");

    return {
      success: true,
      message: "Tournament schedule generated successfully",
      matchCount: scheduledMatches.length,
    };
  } catch (error) {
    console.error("Error generating tournament schedule:", error);
    return { success: false, message: "Failed to generate tournament schedule" };
  }
}

/**
 * Validate schedule options
 */
function validateScheduleOptions(
  options: ScheduleOptions,
  tournament: any
): { valid: boolean; message: string } {
  const [startHour, startMin] = options.startTime.split(":").map(Number);
  const [endHour, endMin] = options.endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const availableMinutes = endMinutes - startMinutes;

  const timePerGame = options.gameDuration + options.breakDuration;
  const gamesPerDayPossible = Math.floor(availableMinutes / timePerGame);

  if (gamesPerDayPossible < options.gamesPerDay) {
    return {
      valid: false,
      message: `Time window only allows ${gamesPerDayPossible} games per day. Reduce games per day or extend time window.`,
    };
  }

  return { valid: true, message: "" };
}

/**
 * Generate Complete Single Elimination Bracket
 */
function generateSingleEliminationBracketComplete(teams: Team[]): Match[] {
  const matches: Match[] = [];
  const teamCount = teams.length;
  const rounds = Math.ceil(Math.log2(teamCount));
  const bracketSize = Math.pow(2, rounds);

  const seededTeams = seedTeams([...teams], bracketSize);

  // Map to track game_numbers for parent-child relationships
  const roundMatches: number[][] = [];

  // Round 1
  let gameNumber = 1;
  const round1GameNumbers: number[] = [];
  
  for (let i = 0; i < bracketSize / 2; i++) {
    const team1 = seededTeams[i * 2];
    const team2 = seededTeams[i * 2 + 1];

    matches.push({
      team1_id: team1?.team_id || null,
      team2_id: team2?.team_id || null,
      round_number: 1,
      game_number: gameNumber,
      bracket_type: "winners",
      scheduled_time: null,
      court_number: null,
      parent_match_id: null,
      child_match_id: null,
    });
    
    round1GameNumbers.push(gameNumber);
    gameNumber++;
  }
  
  roundMatches.push(round1GameNumbers);

  // Subsequent rounds with parent-child relationships
  for (let round = 2; round <= rounds; round++) {
    const prevRoundGameNumbers = roundMatches[round - 2];
    const currentRoundGameNumbers: number[] = [];
    const matchesInRound = Math.pow(2, rounds - round);

    for (let i = 0; i < matchesInRound; i++) {
      const parentMatch1GameNumber = prevRoundGameNumbers[i * 2];
      const parentMatch2GameNumber = prevRoundGameNumbers[i * 2 + 1];

      // For single elim, winner from each parent match advances
      // First parent's winner goes to team1, second parent's winner to team2
      matches.push({
        team1_id: null,
        team2_id: null,
        round_number: round,
        game_number: gameNumber,
        bracket_type: round === rounds ? "finals" : "winners",
        scheduled_time: null,
        court_number: null,
        parent_match_id: null, // Will be set for both parents in the linking phase
        child_match_id: null,
      });

      // Store relationship info (we'll process this after insertion)
      // Parent matches need to know about this child
      const parentMatch1 = matches.find(m => m.game_number === parentMatch1GameNumber);
      const parentMatch2 = matches.find(m => m.game_number === parentMatch2GameNumber);
      
      if (parentMatch1) parentMatch1.child_match_id = gameNumber;
      if (parentMatch2) parentMatch2.child_match_id = gameNumber;

      currentRoundGameNumbers.push(gameNumber);
      gameNumber++;
    }

    roundMatches.push(currentRoundGameNumbers);
  }

  return matches;
}

/**
 * Generate Complete Double Elimination Bracket
 */
function generateDoubleEliminationBracketComplete(teams: Team[]): Match[] {
  const matches: Match[] = [];
  const teamCount = teams.length;
  const winnersRounds = Math.ceil(Math.log2(teamCount));
  
  // Winners bracket
  const winnersBracket = generateSingleEliminationBracketComplete(teams);
  matches.push(...winnersBracket);

  // Losers bracket
  let losersGameNumber = 1000;
  const losersRounds = 2 * (winnersRounds - 1);

  for (let round = 1; round <= losersRounds; round++) {
    const matchCount = Math.ceil(teamCount / Math.pow(2, Math.ceil(round / 2) + 1));

    for (let i = 0; i < matchCount; i++) {
      matches.push({
        team1_id: null,
        team2_id: null,
        round_number: round,
        game_number: losersGameNumber++,
        bracket_type: "losers",
        scheduled_time: null,
        court_number: null,
        parent_match_id: null,
        child_match_id: null,
      });
    }
  }

  // Grand Finals
  matches.push({
    team1_id: null,
    team2_id: null,
    round_number: 1,
    game_number: 9999,
    bracket_type: "finals",
    scheduled_time: null,
    court_number: null,
    parent_match_id: null,
    child_match_id: null,
  });

  return matches;
}

/**
 * Seed teams for fair bracket
 */
function seedTeams(teams: Team[], bracketSize: number): (Team | null)[] {
  const seeded: (Team | null)[] = new Array(bracketSize).fill(null);
  
  const generateSeeds = (size: number): number[] => {
    if (size === 1) return [1];
    const prev = generateSeeds(size / 2);
    const result: number[] = [];
    for (const seed of prev) {
      result.push(seed);
      result.push(size + 1 - seed);
    }
    return result;
  };

  const seeds = generateSeeds(bracketSize);
  
  for (let i = 0; i < teams.length; i++) {
    seeded[seeds[i] - 1] = teams[i];
  }

  return seeded;
}

/**
 * Generate Round Robin Schedule
 */
function generateRoundRobinSchedule(teams: Team[]): Match[] {
  const matches: Match[] = [];
  const teamCount = teams.length;
  let gameNumber = 1;

  const teamsWithBye = [...teams];
  if (teamCount % 2 !== 0) {
    teamsWithBye.push({ team_id: -1, name: "BYE" } as Team);
  }

  const n = teamsWithBye.length;
  const rounds = n - 1;
  const matchesPerRound = n / 2;

  for (let round = 1; round <= rounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const home = (round + match) % (n - 1);
      const away = (n - 1 - match + round) % (n - 1);

      const team1Index = match === 0 ? n - 1 : home;
      const team2Index = away;

      const team1 = teamsWithBye[team1Index];
      const team2 = teamsWithBye[team2Index];

      if (team1.team_id === -1 || team2.team_id === -1) {
        continue;
      }

      matches.push({
        team1_id: team1.team_id,
        team2_id: team2.team_id,
        round_number: round,
        game_number: gameNumber++,
        bracket_type: "winners",
        scheduled_time: null,
        court_number: null,
        parent_match_id: null,
        child_match_id: null,
      });
    }
  }

  return matches;
}

/**
 * Advanced scheduling with multiple constraints
 */
async function assignScheduleTimesAdvanced(
  matches: Match[],
  options: ScheduleOptions,
  teams: Team[]
): Promise<Match[]> {
  const scheduledMatches = [...matches];
  const teamSchedules: Map<number, TeamSchedule> = new Map();

  teams.forEach((team) => {
    teamSchedules.set(team.team_id, {
      teamId: team.team_id,
      lastMatchDate: null,
      matchCount: 0,
    });
  });

  const [startHour, startMinute] = options.startTime.split(":").map(Number);
  const [endHour, endMinute] = options.endTime.split(":").map(Number);

  let currentDate = new Date(options.startDate);
  currentDate.setHours(0, 0, 0, 0);
  
  let currentTimeSlot = 0;
  let courtIndex = 0;

  const matchesToSchedule = scheduledMatches.filter((m) => {
    if (m.bracket_type === "group" || (m.bracket_type === "winners" && !m.parent_match_id)) {
      return m.team1_id && m.team2_id;
    }
    return m.team1_id && m.team2_id;
  });

  matchesToSchedule.sort((a, b) => {
    if (a.round_number !== b.round_number) {
      return a.round_number - b.round_number;
    }
    if (a.bracket_type !== b.bracket_type) {
      const order = { group: 0, winners: 1, losers: 2, finals: 3 };
      return order[a.bracket_type] - order[b.bracket_type];
    }
    return a.game_number - b.game_number;
  });

  for (const match of matchesToSchedule) {
    let scheduled = false;
    let attempts = 0;
    const maxAttempts = 365;

    while (!scheduled && attempts < maxAttempts) {
      attempts++;

      if (!options.includeWeekends) {
        while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
          currentDate.setDate(currentDate.getDate() + 1);
          currentTimeSlot = 0;
          courtIndex = 0;
        }
      }

      const matchDate = new Date(currentDate);
      matchDate.setHours(startHour, startMinute, 0, 0);
      matchDate.setMinutes(
        matchDate.getMinutes() +
          currentTimeSlot * (options.gameDuration + options.breakDuration)
      );

      const matchEndTime = new Date(matchDate);
      matchEndTime.setMinutes(matchEndTime.getMinutes() + options.gameDuration);

      const endTime = new Date(matchDate);
      endTime.setHours(endHour, endMinute, 0, 0);

      if (matchEndTime > endTime) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentTimeSlot = 0;
        courtIndex = 0;
        continue;
      }

      const team1Schedule = teamSchedules.get(match.team1_id!)!;
      const team2Schedule = teamSchedules.get(match.team2_id!)!;

      const daysSinceTeam1 = team1Schedule.lastMatchDate
        ? Math.floor(
            (matchDate.getTime() - team1Schedule.lastMatchDate.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : Infinity;
      const daysSinceTeam2 = team2Schedule.lastMatchDate
        ? Math.floor(
            (matchDate.getTime() - team2Schedule.lastMatchDate.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : Infinity;

      if (
        daysSinceTeam1 < options.restDaysBetweenMatches ||
        daysSinceTeam2 < options.restDaysBetweenMatches
      ) {
        courtIndex++;
        if (courtIndex >= options.courtCount) {
          courtIndex = 0;
          currentTimeSlot++;
          
          if (currentTimeSlot >= options.gamesPerDay) {
            currentDate.setDate(currentDate.getDate() + 1);
            currentTimeSlot = 0;
            courtIndex = 0;
          }
        }
        continue;
      }

      match.scheduled_time = matchDate;
      match.court_number = `Court ${courtIndex + 1}`;

      team1Schedule.lastMatchDate = matchDate;
      team1Schedule.matchCount++;
      team2Schedule.lastMatchDate = matchDate;
      team2Schedule.matchCount++;

      scheduled = true;

      courtIndex++;
      if (courtIndex >= options.courtCount) {
        courtIndex = 0;
        currentTimeSlot++;
        
        if (currentTimeSlot >= options.gamesPerDay) {
          currentDate.setDate(currentDate.getDate() + 1);
          currentTimeSlot = 0;
          courtIndex = 0;
        }
      }
    }
  }

  return scheduledMatches;
}

/**
 * Update match result and progress bracket
 */
export async function updateMatchResult(
  gameId: number,
  team1Score: number,
  team2Score: number
) {
  try {
    const match = await db.query(
      `SELECT tg.*, t.format as tournament_format 
       FROM tournament_games tg
       JOIN tournaments t ON tg.tournament_id = t.tournament_id
       WHERE tg.game_id = ?`,
      [gameId]
    );

    if (!match || match.length === 0) {
      return { success: false, message: "Match not found" };
    }

    const matchData = match[0];
    const winnerId = team1Score > team2Score ? matchData.team1_id : matchData.team2_id;
    const loserId = team1Score > team2Score ? matchData.team2_id : matchData.team1_id;

    await db.query(
      `UPDATE tournament_games 
       SET team1_score = ?, 
           team2_score = ?, 
           winner_team_id = ?,
           game_status = 'completed',
           end_time = NOW()
       WHERE game_id = ?`,
      [team1Score, team2Score, winnerId, gameId]
    );

    if (matchData.tournament_format === 'single_elimination') {
      await progressEliminationBracket(matchData.tournament_id, gameId, winnerId, loserId, matchData.tournament_format);
    }

    revalidatePath("/tournaments");

    return { success: true, message: "Match result updated and bracket progressed" };
  } catch (error) {
    console.error("Error updating match result:", error);
    return { success: false, message: "Failed to update match result" };
  }
}

/**
 * Progress elimination bracket using child_match_id
 */
async function progressEliminationBracket(
  tournamentId: string,
  completedGameId: number,
  winnerId: number,
  loserId: number,
  format: string
) {
  // Get the completed match to find its child
  const completedMatch = await db.query(
    `SELECT child_match_id FROM tournament_games WHERE game_id = ?`,
    [completedGameId]
  );

  if (!completedMatch || !completedMatch[0] || !completedMatch[0].child_match_id) {
    return; // No child match (finals or leaf node)
  }

  const childMatchId = completedMatch[0].child_match_id;

  // Get child match details
  const childMatch = await db.query(
    `SELECT * FROM tournament_games WHERE game_id = ?`,
    [childMatchId]
  );

  if (!childMatch || childMatch.length === 0) return;

  const child = childMatch[0];

  // Determine which parent match this was (check both team slots)
  // Get all parent matches of this child
  const parentMatches = await db.query(
    `SELECT game_id, winner_team_id FROM tournament_games 
     WHERE child_match_id = ? AND game_status = 'completed'`,
    [childMatchId]
  );

  // Update child match with winners
  let team1 = child.team1_id;
  let team2 = child.team2_id;

  if (parentMatches.length === 1) {
    // First parent completed
    if (!team1) {
      team1 = winnerId;
    } else if (!team2) {
      team2 = winnerId;
    }
  } else if (parentMatches.length >= 2) {
    // Both parents completed, assign winners
    team1 = parentMatches[0].winner_team_id;
    team2 = parentMatches[1].winner_team_id;
  }

  await db.query(
    `UPDATE tournament_games 
     SET team1_id = ?, team2_id = ?, game_status = ?
     WHERE game_id = ?`,
    [team1, team2, (team1 && team2) ? 'scheduled' : 'pending', childMatchId]
  );

  if (team1 && team2) {
    await scheduleNextMatch(tournamentId, childMatchId);
  }

  // Handle losers bracket for double elimination
  if (format === 'double_elimination') {
    const losersMatches = await db.query(
      `SELECT * FROM tournament_games 
       WHERE tournament_id = ? 
       AND bracket_type = 'losers'
       AND game_status = 'pending'
       AND (team1_id IS NULL OR team2_id IS NULL)
       ORDER BY round_number, game_number
       LIMIT 1`,
      [tournamentId]
    );

    if (losersMatches.length > 0) {
      const losersMatch = losersMatches[0];
      
      if (!losersMatch.team1_id) {
        await db.query(
          `UPDATE tournament_games 
           SET team1_id = ?, game_status = ?
           WHERE game_id = ?`,
          [loserId, losersMatch.team2_id ? 'scheduled' : 'pending', losersMatch.game_id]
        );
      } else if (!losersMatch.team2_id) {
        await db.query(
          `UPDATE tournament_games 
           SET team2_id = ?, game_status = 'scheduled'
           WHERE game_id = ?`,
          [loserId, losersMatch.game_id]
        );
      }

      if (losersMatch.team1_id || losersMatch.team2_id) {
        await scheduleNextMatch(tournamentId, losersMatch.game_id);
      }
    }
  }
}

/**
 * Schedule the next match after teams are determined
 */
async function scheduleNextMatch(tournamentId: string, gameId: number) {
  const tournament = await db.query(
    "SELECT * FROM tournaments WHERE tournament_id = ?",
    [tournamentId]
  );

  if (!tournament || tournament.length === 0) return;

  const tournamentData = tournament[0];

  const lastMatch = await db.query(
    `SELECT MAX(scheduled_time) as last_time 
     FROM tournament_games 
     WHERE tournament_id = ? AND scheduled_time IS NOT NULL`,
    [tournamentId]
  );

  let nextTime = lastMatch[0].last_time 
    ? new Date(lastMatch[0].last_time) 
    : new Date(tournamentData.start_date);

  nextTime.setMinutes(nextTime.getMinutes() + tournamentData.game_duration + 10);

  await db.query(
    `UPDATE tournament_games 
     SET scheduled_time = ?, court_number = 'Court 1'
     WHERE game_id = ?`,
    [nextTime, gameId]
  );
}

export async function getTournamentSchedule(tournamentId: string) {
  try {
    const matches = await db.query(
      `SELECT 
        tg.*,
        t1.name as team1_name,
        t2.name as team2_name
       FROM tournament_games tg
       LEFT JOIN teams t1 ON tg.team1_id = t1.team_id
       LEFT JOIN teams t2 ON tg.team2_id = t2.team_id
       WHERE tg.tournament_id = ?
       ORDER BY 
         CASE 
           WHEN tg.scheduled_time IS NULL THEN 1
           ELSE 0
         END,
         tg.scheduled_time, 
         tg.round_number, 
         tg.game_number`,
      [tournamentId]
    );

    return { success: true, matches };
  } catch (error) {
    console.error("Error fetching tournament schedule:", error);
    return { success: false, matches: [] };
  }
}

export async function getTeamSchedule(tournamentId: string, teamId: string) {
  try {
    const matches = await db.query(
      `SELECT 
        tg.*,
        t1.name as team1_name,
        t2.name as team2_name,
        CASE 
          WHEN tg.team1_id = ? THEN t2.name
          ELSE t1.name
        END as opponent_name
       FROM tournament_games tg
       LEFT JOIN teams t1 ON tg.team1_id = t1.team_id
       LEFT JOIN teams t2 ON tg.team2_id = t2.team_id
       WHERE tg.tournament_id = ? 
         AND (tg.team1_id = ? OR tg.team2_id = ?)
       ORDER BY tg.scheduled_time`,
      [teamId, tournamentId, teamId, teamId]
    );

    return { success: true, matches };
  } catch (error) {
    console.error("Error fetching team schedule:", error);
    return { success: false, matches: [] };
  }
}