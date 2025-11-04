"use server";

import { TournamentFormFields } from "@/src/components/tournaments/CreateTournamentForm";
import { getUserSession } from "./helpers";
import { revalidatePath } from "next/cache";
import { generateJoinCode } from "./createTeam";

const db = require("@/src/lib/db/db");

export async function createTournament(data: TournamentFormFields) {
  try {
    const session = await getUserSession();

    if (session.role != "organizer") {
      throw new Error("Not an organizer");
    }

    const existingTournament = await db.query(
      "SELECT tournament_id FROM tournaments WHERE name = ? AND age_group = ?",
      [data.name, data.ageGroup],
    );

    if (existingTournament && existingTournament.length > 0) {
      return {
        success: false,
        message:
          "A tournament with this name already exists for this age group",
      };
    }
  
    const joinCode = data.isPrivate ? await generateJoinCode() : null

    const tournamentQuery = `
      INSERT INTO tournaments (
        name, description, start_date, end_date, 
        registration_start, registration_end, location, address, venue_details,
        age_group, max_teams, format, game_duration,
        organizer_id, contact_email, contact_phone, created_at, is_private, join_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
    `;

    const result = await db.query(tournamentQuery, [
      data.name,
      data.description || null,
      data.startDate,
      data.endDate,
      data.registrationStart,
      data.registrationEnd,
      data.location,
      data.address || null,
      data.venueDetails || null,
      data.ageGroup,
      data.maxTeams,
      data.format,
      data.gameDuration,
      session.userId,
      data.contactEmail || null,
      data.contactPhone || null,
      data.isPrivate,
      joinCode
    ]);

    const tournamentId = result.insertId;

    revalidatePath("/tournaments");

    return {
      success: true,
      message: "Tournament created successfully!",
      tournamentId,
    };
  } catch (error) {
    console.error("Error creating tournament:", error);
    return {
      success: false,
      message:
        "Failed to create tournament. Please make sure you are authorized as an organizer",
    };
  }
}

export async function getTournaments(filters?: {
  ageGroup?: string;
  location?: string;
  isPrivate?: boolean;
}) {
  try {
    let query = `
      SELECT 
        tournament_id,
        name,
        description,
        start_date,
        end_date,
        registration_start,
        registration_end,
        location,
        address,
        venue_details,
        age_group,
        max_teams,
        format,
        game_duration,
        contact_email,
        contact_phone,
        (SELECT COUNT(*) FROM team_tournament WHERE tournament_id = tournaments.tournament_id) as registered_teams
      FROM tournaments
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters?.ageGroup) {
      query += " AND age_group = ?";
      params.push(filters.ageGroup);
    }

    if (filters?.location != null) {
      query += " AND location LIKE ?";
      params.push(`%${filters.location}%`);
    }

    if (filters?.isPrivate !== undefined) {
      query += " AND is_private = ?";
      params.push(filters.isPrivate ? 1 : 0);
    }

    query += " ORDER BY start_date ASC";

    const tournaments = await db.query(query, params);

    return { success: true, tournaments };
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return { success: false, tournaments: [] };
  }
}

export async function joinPublicTournament(tournamentId: string, teamId: string) {
  try {
    const session = await getUserSession();

    // Verify team captain
    const captainCheck = await db.query(
      "SELECT captain_id FROM teams WHERE team_id = ?",
      [teamId]
    );

    if (!captainCheck || captainCheck.length === 0) {
      return { success: false, message: "Team not found" };
    }

    if (String(captainCheck[0].captain_id) !== String(session.userId)) {
      return { success: false, message: "Only team captains can register teams" };
    }

    // Check if already registered
    const existingReg = await db.query(
      "SELECT 1 FROM team_tournament WHERE tournament_id = ? AND team_id = ?",
      [tournamentId, teamId]
    );

    if (existingReg && existingReg.length > 0) {
      return { success: false, message: "Team already registered" };
    }

    // Check tournament capacity
    const capacityCheck = await db.query(
      "SELECT max_teams, (SELECT COUNT(*) FROM team_tournament WHERE tournament_id = ?) as current_teams FROM tournaments WHERE tournament_id = ?",
      [tournamentId, tournamentId]
    );

    if (capacityCheck && capacityCheck.length > 0) {
      const { max_teams, current_teams } = capacityCheck[0];
      if (current_teams >= max_teams) {
        return { success: false, message: "Tournament is full" };
      }
    }

    // Register team
    await db.query(
      "INSERT INTO team_tournament (tournament_id, team_id) VALUES (?, ?)",
      [tournamentId, teamId]
    );

    revalidatePath("/tournaments");

    return { success: true, message: "Team registered successfully!" };
  } catch (error) {
    console.error("Error joining tournament:", error);
    return { success: false, message: "Failed to register team" };
  }
}

export async function getJoinedTournaments() {
  try {
    const session = await getUserSession();

    const query = `
      SELECT 
        t.*,
        teams.name as team_name,
        teams.team_id,
        teams.captain_id,
        CASE 
          WHEN teams.captain_id = ? THEN 'captain'
          ELSE 'player'
        END as user_role,
        (SELECT COUNT(*) FROM team_tournament WHERE tournament_id = t.tournament_id) as registered_teams
      FROM tournaments t
      INNER JOIN team_tournament tt ON t.tournament_id = tt.tournament_id
      INNER JOIN teams ON tt.team_id = teams.team_id
      WHERE teams.captain_id = ? OR teams.team_id IN (
        SELECT team_id FROM team_member WHERE user_id = ?
      )
      ORDER BY t.start_date ASC
    `;

    const tournaments = await db.query(query, [
      session.userId,
      session.userId,
      session.userId,
    ]);

    return { success: true, tournaments };
  } catch (error) {
    console.error("Error fetching joined tournaments:", error);
    return { success: false, tournaments: [] };
  }
}

export async function getHostedTournaments() {
  try {
    const session = await getUserSession();

    const query = `
      SELECT 
        t.*,
        (SELECT COUNT(*) FROM team_tournament WHERE tournament_id = t.tournament_id) as registered_teams
      FROM tournaments t
      WHERE t.organizer_id = ?
      ORDER BY t.start_date DESC
    `;

    const tournaments = await db.query(query, [session.userId]);

    return { success: true, tournaments };
  } catch (error) {
    console.error("Error fetching hosted tournaments:", error);
    return { success: false, tournaments: [] };
  }
}

export async function withdrawFromTournament(tournamentId: string) {
  try {
    const session = await getUserSession();

    // Get the team_id and verify the user is the captain
    const teamQuery = `
      SELECT tt.team_id, t.captain_id
      FROM team_tournament tt
      INNER JOIN teams t ON tt.team_id = t.team_id
      WHERE tt.tournament_id = ? 
        AND (t.captain_id = ? OR t.team_id IN (
          SELECT team_id FROM team_member WHERE user_id = ?
        ))
    `;

    const teamResult = await db.query(teamQuery, [
      tournamentId,
      session.userId,
      session.userId,
    ]);

    if (!teamResult || teamResult.length === 0) {
      return { success: false, message: "Team not found in tournament" };
    }

    const { team_id, captain_id } = teamResult[0];

    // Only captains can withdraw their team
    if (String(captain_id) !== String(session.userId)) {
      return {
        success: false,
        message: "Only team captains can withdraw from tournaments",
      };
    }

    // Delete the registration
    await db.query(
      "DELETE FROM team_tournament WHERE tournament_id = ? AND team_id = ?",
      [tournamentId, team_id]
    );

    revalidatePath("/tournaments");

    return { success: true, message: "Successfully withdrawn from tournament" };
  } catch (error) {
    console.error("Error withdrawing from tournament:", error);
    return { success: false, message: "Failed to withdraw from tournament" };
  }
}

export async function getTournamentTeams(tournamentId: string) {
  try {
    const query = `
      SELECT 
        t.team_id,
        t.name,
        t.age_group,
        CONCAT(u.first_name, ' ', u.last_name) as captain_name,
        (SELECT COUNT(*) FROM team_member WHERE team_id = t.team_id) as member_count,
        tt.registered_at
      FROM teams t
      INNER JOIN team_tournament tt ON t.team_id = tt.team_id
      INNER JOIN users u ON t.captain_id = u.user_id
      WHERE tt.tournament_id = ?
      ORDER BY tt.registered_at ASC
    `;

    const teams = await db.query(query, [tournamentId]);

    return { success: true, teams };
  } catch (error) {
    console.error("Error fetching tournament teams:", error);
    return { success: false, teams: [] };
  }
}

export async function regenerateTournamentJoinCode(tournamentId: string) {
  try {
    const session = await getUserSession();

    // Check if user is the organizer
    const organizerCheck = await db.query(
      "SELECT 1 FROM tournaments WHERE tournament_id = ? AND organizer_id = ?",
      [tournamentId, session.userId]
    );

    if (!organizerCheck || organizerCheck.length === 0) {
      return {
        success: false,
        message: "Only organizers can regenerate join codes",
      };
    }

    let newCode;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      newCode = await generateJoinCode();

      const existing = await db.query(
        "SELECT 1 FROM tournaments WHERE join_code = ?",
        [newCode]
      );

      if (!existing || existing.length === 0) {
        break;
      }
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return { success: false, message: "Failed to generate unique code" };
    }

    await db.query("UPDATE tournaments SET join_code = ? WHERE tournament_id = ?", [
      newCode,
      tournamentId,
    ]);

    revalidatePath("/tournaments");
    return {
      success: true,
      message: "Join code regenerated successfully",
      joinCode: newCode,
    };
  } catch (error) {
    console.error("Error regenerating join code:", error);
    return { success: false, message: "Failed to regenerate join code" };
  }
}