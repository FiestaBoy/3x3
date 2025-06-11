"use server";

import { getUserSession } from "./helpers";

const db = require("@/src/lib/db/db");

type TeamCardType = { success: true; teams: TeamInfo[] } | { success: false };

export type TeamInfo = {
  ageGroup: string;
  joinCode?: string;
  //playerCount: number;
  //captainName: string;
  name: string;
  role: string;
  teamId: number;
};

export default async function getMyTeams(): Promise<TeamCardType> {
  const session = await getUserSession();

  const sql = `SELECT teams.*, team_member.role FROM teams 
    JOIN team_member ON team_member.team_id = teams.team_id 
    WHERE team_member.user_id = ?`;

  try {
    const response = await db.query(sql, [session.userId]);

    if (!response || response.length === 0) {
      return { success: false };
    }

    const teams: TeamInfo[] = response.map((team: any) => ({
      name: team.name,
      ageGroup: team.age_group,
      joinCode: team?.join_code,
      role: team.role,
      teamId: team.team_id,
    }));

    return { success: true, teams };
  } catch (e) {
    console.log("Error fetching teams", e);
    return { success: false };
  }
}
