import bcrypt from "bcryptjs";
import { query } from "./db";

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

    const rows = await query<
      {
        email: string;
        password_hash: string;
        user_id: number;
      }[]
    >(statement, [email]);

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
