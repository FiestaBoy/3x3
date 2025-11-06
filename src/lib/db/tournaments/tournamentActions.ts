"use server";

import { TournamentFormFields } from "@/src/components/tournaments/CreateTournamentForm";
import { getUserSession } from "../utils/helpers";
import { revalidatePath } from "next/cache";
import { generateJoinCode } from "../teams/createTeam";

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

    const joinCode = data.isPrivate ? await generateJoinCode() : null;

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
      joinCode,
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

export async function joinPublicTournament(
  tournamentId: string,
  teamId: string,
) {
  try {
    const session = await getUserSession();

    // Verify team captain
    const captainCheck = await db.query(
      "SELECT captain_id FROM teams WHERE team_id = ?",
      [teamId],
    );

    if (!captainCheck || captainCheck.length === 0) {
      return { success: false, message: "Team not found" };
    }

    if (String(captainCheck[0].captain_id) !== String(session.userId)) {
      return {
        success: false,
        message: "Only team captains can register teams",
      };
    }

    // Check if already registered
    const existingReg = await db.query(
      "SELECT 1 FROM team_tournament WHERE tournament_id = ? AND team_id = ?",
      [tournamentId, teamId],
    );

    if (existingReg && existingReg.length > 0) {
      return { success: false, message: "Team already registered" };
    }

    // Check tournament capacity
    const capacityCheck = await db.query(
      "SELECT max_teams, (SELECT COUNT(*) FROM team_tournament WHERE tournament_id = ?) as current_teams FROM tournaments WHERE tournament_id = ?",
      [tournamentId, tournamentId],
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
      [tournamentId, teamId],
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
      [tournamentId, team_id],
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
      [tournamentId, session.userId],
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
        [newCode],
      );

      if (!existing || existing.length === 0) {
        break;
      }
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return { success: false, message: "Failed to generate unique code" };
    }

    await db.query(
      "UPDATE tournaments SET join_code = ? WHERE tournament_id = ?",
      [newCode, tournamentId],
    );

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

export async function updateTournamentSettings(
  tournamentId: string,
  data: Partial<TournamentFormFields>,
) {
  try {
    const session = await getUserSession();

    // Verify user is the organizer
    const organizerCheck = await db.query(
      "SELECT organizer_id FROM tournaments WHERE tournament_id = ?",
      [tournamentId],
    );

    if (!organizerCheck || organizerCheck.length === 0) {
      return { success: false, message: "Tournament not found" };
    }

    if (String(organizerCheck[0].organizer_id) !== String(session.userId)) {
      return {
        success: false,
        message: "Only organizers can update tournament settings",
      };
    }

    // Check if tournament has started
    const hasSchedule = await db.query(
      "SELECT COUNT(*) as count FROM tournament_games WHERE tournament_id = ?",
      [tournamentId],
    );

    if (hasSchedule[0].count > 0) {
      return {
        success: false,
        message:
          "Cannot modify tournament settings after schedule is generated",
      };
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      params.push(data.name);
    }

    if (data.description !== undefined) {
      updates.push("description = ?");
      params.push(data.description);
    }

    if (data.startDate !== undefined) {
      updates.push("start_date = ?");
      params.push(data.startDate);
    }

    if (data.endDate !== undefined) {
      updates.push("end_date = ?");
      params.push(data.endDate);
    }

    if (data.registrationStart !== undefined) {
      updates.push("registration_start = ?");
      params.push(data.registrationStart);
    }

    if (data.registrationEnd !== undefined) {
      updates.push("registration_end = ?");
      params.push(data.registrationEnd);
    }

    if (data.location !== undefined) {
      updates.push("location = ?");
      params.push(data.location);
    }

    if (data.address !== undefined) {
      updates.push("address = ?");
      params.push(data.address);
    }

    if (data.venueDetails !== undefined) {
      updates.push("venue_details = ?");
      params.push(data.venueDetails);
    }

    if (data.ageGroup !== undefined) {
      updates.push("age_group = ?");
      params.push(data.ageGroup);
    }

    if (data.maxTeams !== undefined) {
      // Check if reducing max teams below current registrations
      const currentTeams = await db.query(
        "SELECT COUNT(*) as count FROM team_tournament WHERE tournament_id = ?",
        [tournamentId],
      );

      if (data.maxTeams < currentTeams[0].count) {
        return {
          success: false,
          message: `Cannot reduce max teams below current registrations (${currentTeams[0].count})`,
        };
      }

      updates.push("max_teams = ?");
      params.push(data.maxTeams);
    }

    if (data.format !== undefined) {
      updates.push("format = ?");
      params.push(data.format);
    }

    if (data.gameDuration !== undefined) {
      updates.push("game_duration = ?");
      params.push(data.gameDuration);
    }

    if (data.contactEmail !== undefined) {
      updates.push("contact_email = ?");
      params.push(data.contactEmail);
    }

    if (data.contactPhone !== undefined) {
      updates.push("contact_phone = ?");
      params.push(data.contactPhone);
    }

    if (data.isPrivate !== undefined) {
      updates.push("is_private = ?");
      params.push(data.isPrivate);

      // If changing to private and no join code exists, generate one
      if (data.isPrivate && !organizerCheck[0].join_code) {
        const newCode = await generateJoinCode();
        updates.push("join_code = ?");
        params.push(newCode);
      }
    }

    if (updates.length === 0) {
      return { success: false, message: "No changes to update" };
    }

    // Add tournament_id to params
    params.push(tournamentId);

    const query = `UPDATE tournaments SET ${updates.join(", ")} WHERE tournament_id = ?`;

    await db.query(query, params);

    revalidatePath("/tournaments");

    return {
      success: true,
      message: "Tournament settings updated successfully",
    };
  } catch (error) {
    console.error("Error updating tournament settings:", error);
    return { success: false, message: "Failed to update tournament settings" };
  }
}

export async function deleteTournament(tournamentId: string) {
  try {
    const session = await getUserSession();

    // Verify user is the organizer
    const organizerCheck = await db.query(
      "SELECT organizer_id FROM tournaments WHERE tournament_id = ?",
      [tournamentId],
    );

    if (!organizerCheck || organizerCheck.length === 0) {
      return { success: false, message: "Tournament not found" };
    }

    if (String(organizerCheck[0].organizer_id) !== String(session.userId)) {
      return {
        success: false,
        message: "Only organizers can delete tournaments",
      };
    }

    // Check if tournament has started
    const hasSchedule = await db.query(
      "SELECT COUNT(*) as count FROM tournament_games WHERE tournament_id = ? AND game_status != 'pending'",
      [tournamentId],
    );

    if (hasSchedule[0].count > 0) {
      return {
        success: false,
        message: "Cannot delete tournament after matches have started",
      };
    }

    // Delete related records (cascading delete)
    await db.query("DELETE FROM tournament_games WHERE tournament_id = ?", [
      tournamentId,
    ]);
    await db.query("DELETE FROM team_tournament WHERE tournament_id = ?", [
      tournamentId,
    ]);
    await db.query("DELETE FROM tournaments WHERE tournament_id = ?", [
      tournamentId,
    ]);

    revalidatePath("/tournaments");

    return {
      success: true,
      message: "Tournament deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting tournament:", error);
    return { success: false, message: "Failed to delete tournament" };
  }
}

export async function removeTournamentTeam(
  tournamentId: string,
  teamId: string,
) {
  try {
    const session = await getUserSession();

    // Verify user is the organizer
    const organizerCheck = await db.query(
      "SELECT organizer_id FROM tournaments WHERE tournament_id = ?",
      [tournamentId],
    );

    if (!organizerCheck || organizerCheck.length === 0) {
      return { success: false, message: "Tournament not found" };
    }

    if (String(organizerCheck[0].organizer_id) !== String(session.userId)) {
      return {
        success: false,
        message: "Only organizers can remove teams",
      };
    }

    // Check if tournament has started (has completed or in-progress games)
    const hasStarted = await db.query(
      `SELECT COUNT(*) as count 
       FROM tournament_games 
       WHERE tournament_id = ? 
       AND (team1_id = ? OR team2_id = ?) 
       AND game_status IN ('completed', 'in_progress')`,
      [tournamentId, teamId, teamId],
    );

    if (hasStarted[0].count > 0) {
      return {
        success: false,
        message: "Cannot remove team after they have started playing matches",
      };
    }

    // Check if team is registered
    const registrationCheck = await db.query(
      "SELECT 1 FROM team_tournament WHERE tournament_id = ? AND team_id = ?",
      [tournamentId, teamId],
    );

    if (!registrationCheck || registrationCheck.length === 0) {
      return {
        success: false,
        message: "Team is not registered in this tournament",
      };
    }

    // Remove the team from tournament
    await db.query(
      "DELETE FROM team_tournament WHERE tournament_id = ? AND team_id = ?",
      [tournamentId, teamId],
    );

    // If there are scheduled games for this team, cancel them
    await db.query(
      `UPDATE tournament_games 
       SET game_status = 'cancelled' 
       WHERE tournament_id = ? 
       AND (team1_id = ? OR team2_id = ?) 
       AND game_status = 'scheduled'`,
      [tournamentId, teamId, teamId],
    );

    revalidatePath("/tournaments");

    return {
      success: true,
      message: "Team removed from tournament successfully",
    };
  } catch (error) {
    console.error("Error removing team from tournament:", error);
    return { success: false, message: "Failed to remove team from tournament" };
  }
}

export async function getTournamentStandings(tournamentId: string) {
  try {
    const query = `
      SELECT 
        t.team_id,
        t.name as team_name,
        COALESCE(SUM(CASE 
          WHEN tg.winner_team_id = t.team_id THEN 1 
          ELSE 0 
        END), 0) as wins,
        COALESCE(SUM(CASE 
          WHEN tg.game_status = 'completed' AND tg.winner_team_id != t.team_id 
            AND (tg.team1_id = t.team_id OR tg.team2_id = t.team_id)
          THEN 1 
          ELSE 0 
        END), 0) as losses,
        COALESCE(SUM(CASE 
          WHEN tg.team1_id = t.team_id THEN tg.team1_score
          WHEN tg.team2_id = t.team_id THEN tg.team2_score
          ELSE 0
        END), 0) as points_for,
        COALESCE(SUM(CASE 
          WHEN tg.team1_id = t.team_id THEN tg.team2_score
          WHEN tg.team2_id = t.team_id THEN tg.team1_score
          ELSE 0
        END), 0) as points_against,
        COALESCE(SUM(CASE 
          WHEN tg.team1_id = t.team_id THEN (tg.team1_score - tg.team2_score)
          WHEN tg.team2_id = t.team_id THEN (tg.team2_score - tg.team1_score)
          ELSE 0
        END), 0) as point_differential,
        COALESCE(COUNT(CASE 
          WHEN tg.game_status = 'completed' 
            AND (tg.team1_id = t.team_id OR tg.team2_id = t.team_id)
          THEN 1 
        END), 0) as matches_played
      FROM teams t
      INNER JOIN team_tournament tt ON t.team_id = tt.team_id
      LEFT JOIN tournament_games tg ON tt.tournament_id = tg.tournament_id
        AND (tg.team1_id = t.team_id OR tg.team2_id = t.team_id)
      WHERE tt.tournament_id = ?
      GROUP BY t.team_id, t.name
      ORDER BY wins DESC, point_differential DESC, points_for DESC
    `;

    const standings = await db.query(query, [tournamentId]);

    return { success: true, standings };
  } catch (error) {
    console.error("Error fetching tournament standings:", error);
    return { success: false, standings: [] };
  }
}
