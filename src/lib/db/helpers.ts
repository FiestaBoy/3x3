import bcrypt from "bcryptjs";
import {
  AgeGroup,
  getAgeGroupMinBirthdays,
} from "@/src/app/constants/ageGroups";

type LoginSuccess = { success: true; userId: number };
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
    const statement = `SELECT email, password_hash, user_id FROM users where email = ?`;

    const rows: {
      email: string;
      password_hash: string;
      user_id: number;
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

    return { success: userBirthday >= minBirthday };
  } catch (e) {
    console.error("Error confirming age group:", e);
    return { success: false };
  }
}
