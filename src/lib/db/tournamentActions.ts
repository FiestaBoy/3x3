"use server";

import { TournamentFormFields } from "@/src/components/tournaments/CreateTournamentForm";
import { getUserSession } from "./helpers";
import { revalidatePath } from "next/cache";

const db = require("@/src/lib/db/db");

export async function createTournament(data: TournamentFormFields) {
  try {
    const session = await getUserSession();

    if (session.role != 'organizer') {
      throw new Error("Not an organizer")
    }
    
    const existingTournament = await db.query(
      'SELECT tournament_id FROM tournaments WHERE name = ? AND age_group = ?',
      [data.name, data.ageGroup]
    );

    if (existingTournament && existingTournament.length > 0) {
      return { 
        success: false, 
        message: 'A tournament with this name already exists for this age group' 
      };
    }

    const tournamentQuery = `
      INSERT INTO tournaments (
        name, description, start_date, end_date, 
        registration_start, registration_end, location, address, venue_details,
        age_group, max_teams, entry_fee, prize_pool, format, game_duration,
        organizer_id, contact_email, contact_phone, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
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
      data.entryFee,
      data.prizePool,
      data.format,
      data.gameDuration,
      session.userId,
      data.contactEmail || null,
      data.contactPhone || null,
      'upcoming'
    ]);

    const tournamentId = result.insertId;

    revalidatePath('/tournaments');

    return { 
      success: true, 
      message: 'Tournament created successfully!',
      tournamentId 
    };

  } catch (error) {
    console.error('Error creating tournament:', error);
    return { 
      success: false, 
      message: 'Failed to create tournament. Please make sure you are authorized as an organizer' 
    };
  }
}

export async function getTournaments(filters?: {
  ageGroup?: string;
  status?: string;
  location?: string;
}) {
  try {
    let query = `
      SELECT 
        tournament_id,
        name,
        start_date,
        end_date,
        location,
        age_group,
        max_teams,
        entry_fee,
        status,
        (SELECT COUNT(*) FROM team_tournament WHERE tournament_id = tournaments.tournament_id) as registered_teams
      FROM tournaments
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (filters?.ageGroup) {
      query += ' AND age_group = ?';
      params.push(filters.ageGroup);
    }

    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters?.location) {
      query += ' AND location LIKE ?';
      params.push(`%${filters.location}%`);
    }

    query += ' ORDER BY start_date ASC';

    const tournaments = await db.query(query, params);

    return { success: true, tournaments };

  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return { success: false, tournaments: [] };
  }
}

export async function updateTournamentStatus(tournamentId: number, status: string) {
  try {
    const session = await getUserSession();

    const tournament = await db.query(
      'SELECT organizer_id FROM tournaments WHERE tournament_id = ?',
      [tournamentId]
    );

    if (!tournament.length || tournament[0].organizer_id !== session.userId) {
      return { 
        success: false, 
        message: 'Only tournament organizers can update tournament status' 
      };
    }

    await db.query(
      'UPDATE tournaments SET status = ? WHERE tournament_id = ?',
      [status, tournamentId]
    );

    revalidatePath('/tournaments');

    return { 
      success: true, 
      message: 'Tournament status updated successfully' 
    };

  } catch (error) {
    console.error('Error updating tournament status:', error);
    return { 
      success: false, 
      message: 'Failed to update tournament status' 
    };
  }
}