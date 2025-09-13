"use server";

import { generateJoinCode } from "./createTeam";
import { getUserSession } from "./helpers";
import { revalidatePath } from "next/cache";

const db = require("@/src/lib/db/db");

export interface TeamMember {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  role: 'captain' | 'player';
  joinedAt: string;
}

export interface Tournament {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

export interface TeamDetails {
  id: number;
  name: string;
  joinCode: string;
  ageGroup: string;
  members: TeamMember[];
  tournaments: Tournament[];
  maxMembers: number;
}

export async function getTeamDetails(teamId: number): Promise<TeamDetails | null> {
  try {
    const session = await getUserSession();

    const teamQuery = `
      SELECT t.team_id, t.name, t.join_code, t.age_group
      FROM teams t
      INNER JOIN team_member tm ON t.team_id = tm.team_id
      WHERE t.team_id = ? AND tm.user_id = ?
    `;
    const teamResult = await db.query(teamQuery, [teamId, session.userId]);

    if (!teamResult || teamResult.length === 0) {
      return null;
    }

    const team = teamResult[0];

    const membersQuery = `
      SELECT 
        tm.team_member_id as id,
        tm.user_id,
        u.first_name,
        u.last_name,
        tm.role,
        tm.joined_at
      FROM team_member tm
      INNER JOIN users u ON tm.user_id = u.user_id
      WHERE tm.team_id = ?
      ORDER BY 
        CASE tm.role 
          WHEN 'captain' THEN 1 
          ELSE 2 
        END,
        tm.joined_at ASC
    `;
    const members = await db.query(membersQuery, [teamId]);

    let tournaments = [];
    try {
      const tournamentsQuery = `
        SELECT 
          t.tournament_id as id,
          t.name,
          t.start_date,
          t.end_date,
          t.location,
          CASE 
            WHEN t.start_date > NOW() THEN 'upcoming'
            WHEN t.end_date < NOW() THEN 'completed'
            ELSE 'ongoing'
          END as status
        FROM tournaments t
        INNER JOIN team_tournament tt ON t.tournament_id = tt.tournament_id
        WHERE tt.team_id = ?
        ORDER BY t.start_date ASC
      `;
      tournaments = await db.query(tournamentsQuery, [teamId]);
    } catch (error) {
      tournaments = [];
    }

    return {
      id: team.team_id,
      name: team.name,
      joinCode: team.join_code,
      ageGroup: team.age_group,
      maxMembers: 4, 
      members: members.map((member: any) => ({
        id: member.id,
        userId: member.user_id,
        firstName: member.first_name,
        lastName: member.last_name,
        role: member.role,
        joinedAt: member.joined_at
      })),
      tournaments: tournaments.map((tournament: any) => ({
        id: tournament.id,
        name: tournament.name,
        startDate: tournament.start_date,
        endDate: tournament.end_date,
        location: tournament.location || 'TBD',
        status: tournament.status
      }))
    };
  } catch (error) {
    console.error('Error fetching team details:', error);
    return null;
  }
}

export async function removeMemberFromTeam(teamId: number, memberId: number) {
  try {
    const session = await getUserSession();

    const captainCheck = await db.query(
      'SELECT 1 FROM team_member WHERE team_id = ? AND user_id = ? AND role = "captain"',
      [teamId, session.userId]
    );

    if (!captainCheck || captainCheck.length === 0) {
      return { success: false, message: 'Only captains can remove members' };
    }

    await db.query('DELETE FROM team_member WHERE team_member_id = ? AND team_id = ?', [memberId, teamId]);

    revalidatePath('/teams/my-teams');
    return { success: true, message: 'Member removed successfully' };
  } catch (error) {
    console.error('Error removing member:', error);
    return { success: false, message: 'Failed to remove member' };
  }
}

export async function promoteMemberToCaptain(teamId: number, memberId: number) {
  try {
    const session = await getUserSession();

    const captainCheck = await db.query(
      'SELECT 1 FROM team_member WHERE team_id = ? AND user_id = ? AND role = "captain"',
      [teamId, session.userId]
    );

    if (!captainCheck || captainCheck.length === 0) {
      return { success: false, message: 'Only captains can promote members' };
    }

    await db.query('START TRANSACTION');

    try {
      await db.query(
        'UPDATE team_member SET role = "player" WHERE team_id = ? AND user_id = ?',
        [teamId, session.userId]
      );

      await db.query(
        'UPDATE team_member SET role = "captain" WHERE team_member_id = ? AND team_id = ?',
        [memberId, teamId]
      );

      const newCaptainQuery = await db.query(
        'SELECT user_id FROM team_member WHERE team_member_id = ?',
        [memberId]
      );
      
      await db.query(
        'UPDATE teams SET captain_id = ? WHERE team_id = ?',
        [newCaptainQuery[0].user_id, teamId]
      );

      await db.query('COMMIT');

      revalidatePath('/teams/my-teams');
      return { success: true, message: 'Member promoted to captain successfully' };
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error promoting member:', error);
    return { success: false, message: 'Failed to promote member' };
  }
}

export async function leaveTeam(teamId: number) {
  try {
    const session = await getUserSession();

    const memberCheck = await db.query(
      'SELECT role FROM team_member WHERE team_id = ? AND user_id = ?',
      [teamId, session.userId]
    );

    if (!memberCheck || memberCheck.length === 0) {
      return { success: false, message: 'Not a member of this team' };
    }

    if (memberCheck[0].role === 'captain') {
      return { 
        success: false, 
        message: 'Captains cannot leave. Transfer captaincy first or delete the team.' 
      };
    }

    await db.query(
      'DELETE FROM team_member WHERE team_id = ? AND user_id = ?',
      [teamId, session.userId]
    );

    revalidatePath('/teams/my-teams');
    return { success: true, message: 'Left team successfully' };
  } catch (error) {
    console.error('Error leaving team:', error);
    return { success: false, message: 'Failed to leave team' };
  }
}

export async function regenerateJoinCode(teamId: number) {
  try {
    const session = await getUserSession();

    const captainCheck = await db.query(
      'SELECT 1 FROM team_member WHERE team_id = ? AND user_id = ? AND role = "captain"',
      [teamId, session.userId]
    );

    if (!captainCheck || captainCheck.length === 0) {
      return { success: false, message: 'Only captains can regenerate join codes' };
    }

    let newCode;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      newCode = await generateJoinCode()
      
      const existing = await db.query(
        'SELECT 1 FROM teams WHERE join_code = ?',
        [newCode]
      );

      if (!existing || existing.length === 0) {
        break;
      }
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return { success: false, message: 'Failed to generate unique code' };
    }

    await db.query(
      'UPDATE teams SET join_code = ? WHERE team_id = ?',
      [newCode, teamId]
    );

    revalidatePath('/teams/my-teams');
    return { success: true, message: 'Join code regenerated successfully', joinCode: newCode };
  } catch (error) {
    console.error('Error regenerating join code:', error);
    return { success: false, message: 'Failed to regenerate join code' };
  }
}

export async function deleteTeam(teamId: number) {
  try {
    const session = await getUserSession();

    const captainCheck = await db.query(
      'SELECT 1 FROM team_member WHERE team_id = ? AND user_id = ? AND role = "captain"',
      [teamId, session.userId]
    );

    if (!captainCheck || captainCheck.length === 0) {
      return { success: false, message: 'Only captains can delete teams' };
    }

    await db.query('START TRANSACTION');

    try {
      await db.query(
        'DELETE FROM team_tournament WHERE team_id = ?',
        [teamId]
      );

      await db.query(
        'DELETE FROM team_member WHERE team_id = ?',
        [teamId]
      );

      await db.query(
        'DELETE FROM teams WHERE team_id = ?',
        [teamId]
      );

      await db.query('COMMIT');

      revalidatePath('/teams/my-teams');
      return { success: true, message: 'Team deleted successfully' };
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error deleting team:', error);
    return { success: false, message: 'Failed to delete team' };
  }
}