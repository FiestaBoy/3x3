"use server";

import bcrypt from "bcryptjs";
import {
  AgeGroup,
  getAgeGroupMinBirthdays,
} from "@/src/app/constants/ageGroups";
import { cookies } from "next/headers";
import { decrypt } from "../session";

type LoginSuccess = { success: true; userId: number; role: string };
type LoginFailure = { success: false };
export type LoginResult = LoginSuccess | LoginFailure;

const db = require("@/src/lib/db/db");

export async function emailInUse(email: string): Promise<boolean> {
  try {
    const statement = `SELECT email FROM users WHERE email = ?`;

    const response = await db.query(statement, [email]);

    return Array.isArray(response) && response.length > 0;
  } catch (e) {
    console.error("Error checking if email is in use:", e);
    return false;
  }
}

export async function confirmLoginCredentials(
  email: string,
  password: string,
): Promise<LoginResult> {
  try {
    const statement = `SELECT email, password_hash, user_id, role FROM users where email = ?`;

    const rows: {
      email: string;
      password_hash: string;
      user_id: number;
      role: string;
    }[] = await db.query(statement, [email]);

    if (rows.length === 0) return { success: false };

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return { success: false };
    }

    return {
      success: true,
      userId: user.user_id,
      role: user.role,
    };
  } catch (e) {
    console.log("Error confirming login credentials", e);
    return { success: false };
  }
}

export async function confirmAgeGroup(ageGroup: AgeGroup, userId: string) {
  try {
    const sql = "SELECT birthday FROM users WHERE user_id = ?";
    const rows: { birthday: string }[] = await db.query(sql, [userId]);

    const birthdayRaw = rows?.[0]?.birthday;

    const userBirthday = new Date(birthdayRaw);

    const minBirthday = getAgeGroupMinBirthdays()[ageGroup];

    return { result: userBirthday >= minBirthday };
  } catch (e) {
    console.error("Error confirming age group:", e);
    return { success: false };
  }
}

export async function duplicateTeamName(
  name: string,
  age_group: string,
): Promise<boolean> {
  try {
    const sql = "SELECT name FROM teams WHERE name = ? AND age_group = ?";

    const response = await db.query(sql, [name, age_group]);

    return response.length > 0;
  } catch (e) {
    console.log("Failed to check for a duplicate name", e);
    return false;
  }
}

export async function canCreateMoreTeams(userId: string) {
  try {
    const sql = "SELECT COUNT(*) as count FROM teams WHERE captain_id = ?";

    const response = await db.query(sql, userId);

    const count = response?.[0].count;

    return count < 3;
  } catch (e) {
    console.log("Failed to check if a user can create more teams");
  }
}

export async function getUserSession() {
  const cookie = (await cookies()).get("session")?.value;
  if (!cookie) throw new Error("Unauthenticated");
  const session = await decrypt(cookie);
  if (!session) throw new Error("Invalid session");

  return session;
}

export async function isFullTeam(teamId: string) {
  const sql =
    "SELECT COUNT(*) as member_count FROM team_member WHERE team_id = ?";

  const response = await db.query(sql, [teamId]);

  return response[0].member_count >= 4;
}

export async function getCaptainTeamNames(userId?: string): Promise<{ team_id: string; name: string }[]> {
  try {
    if (!userId) {
      const session = await getUserSession();
      userId = String(session.userId);
    }

    const sql = "SELECT team_id, name FROM teams WHERE captain_id = ?";
    const rows: { team_id: number | string; name: string }[] = await db.query(sql, [userId]);

    if (!Array.isArray(rows) || rows.length === 0) return [];
    return rows.map((r) => ({ team_id: String(r.team_id), name: r.name }));
  } catch (e) {
    console.error("Error fetching captain team names:", e);
    return [];
  }
}
