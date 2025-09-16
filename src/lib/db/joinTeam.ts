"use server";

import { createTeamMember } from "./createTeam";
import { getUserSession, isFullTeam } from "./helpers";

const db = require("@/src/lib/db/db");

export async function joinTeam(joinCode: string) {
  const session = await getUserSession();
  try {
    const statement = "SELECT team_id, age_group from teams WHERE join_code = ?";

    const response = await db.query(statement, [joinCode]);

    console.log("get team id repsonse: ", response);

    if (!response || response.length === 0) {
      throw new Error("Join code is invalid");
    }

    // TODO: add age group check for join team

    if (await isFullTeam(response[0].team_id)) {
      return {
        success: false,
        field: "joinCode",
        message: "Team is full",
      };
    }

    await createTeamMember(response[0].team_id, session.userId, "player");

    return {
      success: true,
      field: "root",
      message: "Team Joined successfully",
    };
  } catch (e) {
    console.log("Error occured trying to join a team: ", e);
    return {
      success: false,
      field: "joinCode",
      message: "Join code is invalid",
    };
  }
}
