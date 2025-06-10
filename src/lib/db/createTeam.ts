"use server";

import { FormFields } from "@/src/components/teams/RegisterForm";
import {
  canCreateMoreTeams,
  confirmAgeGroup,
  duplicateTeamName,
  getUserSession,
} from "./helpers";

const db = require("@/src/lib/db/db");

export type ReturnType = {
  success: boolean;
  field: keyof FormFields | "root";
  message: string;
};

export async function createTeam(team: FormFields): Promise<ReturnType> {
  const session = await getUserSession();

  if (!(await canCreateMoreTeams(session.userId))) {
    return {
      success: false,
      field: "root",
      message: "You can only create up to 3 teams",
    };
  }

  const ageOK = await confirmAgeGroup(team.ageGroup, session.userId);

  if (!ageOK) {
    throw new Error("Age confirmation failed");
  }

  if (!ageOK.result) {
    return {
      success: false,
      field: "ageGroup",
      message: "Select a valid age group",
    };
  }

  if (await duplicateTeamName(team.name, team.ageGroup)) {
    return {
      success: false,
      field: "name",
      message: "This team name already exists",
    };
  }

  try {
    const teamSQL =
      "INSERT INTO teams (age_group, captain_id, name) VALUES (?, ?, ?);";

    const teamResult = await db.query(teamSQL, [
      team.ageGroup,
      session.userId,
      team.name,
    ]);

    if (!teamResult) {
      throw new Error("Failed to create a team");
    }

    const memberSQL =
      "INSERT INTO team_member (team_id, user_id, role) VALUES (?, ?, ?)";

    await db.query(memberSQL, [teamResult.insertId, session.userId, "captain"]);

    return {
      success: true,
      field: "root",
      message: "Team created successfully",
    };
  } catch (e) {
    console.log("Failed to create a team", e);
    return {
      success: false,
      field: "root",
      message: "Failed to create a team",
    };
  }
}
