"use server";

import { FormFields } from "@/src/components/auth/SignupForm";
import bcrypt from "bcryptjs";
import { emailInUse } from "./helpers";

const db = require("@/src/lib/db/db");

type FormFieldName = keyof FormFields;
type CreateUserResponse =
  | { success: true }
  | { success: false; field: FormFieldName | "root"; message: string };

export async function createUser(
  user: FormFields,
): Promise<CreateUserResponse> {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user.password, salt);

    if (await emailInUse(user.email)) {
      return {
        success: false,
        field: "email",
        message: "Email already in use",
      };
    }

    const statement = `INSERT INTO users (email, password_hash, birthday, first_name, last_name) VALUES (?, ?, ?, ?, ?);`;

    await db.query(statement, [
      user.email,
      hash,
      user.birthday,
      user.firstName,
      user.lastName,
    ]);

    return { success: true };
  } catch (e: any) {
    console.log("Error creating a user", e);
    return { success: false, field: "root", message: "Internal server error" };
  }
}
