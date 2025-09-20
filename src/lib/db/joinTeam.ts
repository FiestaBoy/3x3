"use server";

import { createTeamMember } from "./createTeam";
import { confirmAgeGroup, getUserSession, isFullTeam } from "./helpers";

const db = require("@/src/lib/db/db");

export async function joinTeam(joinCode: string) {
  const session = await getUserSession();
  try {
    const statement =
      "SELECT team_id, age_group from teams WHERE join_code = ?";

    const response = await db.query(statement, [joinCode]);

    if (!response || response.length === 0) {
      throw new Error("Join code is invalid");
    }

    const ageOK = await confirmAgeGroup(response[0].age_group, session.userId);

    if (!ageOK) {
      throw new Error("Age confirmation failed");
    }

    if (!ageOK.result) {
      return {
        success: false,
        field: "joinCode",
        message: "Age group mismatch",
      };
    }

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
