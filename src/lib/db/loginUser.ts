"use server";

import { FormFields } from "@/src/app/auth/login/components/Form";
import { confirmLoginCredentials, LoginResult } from "./helpers";
import { createSession } from "../session";

export async function loginUser(user: FormFields) {
  const checkedCredentials: LoginResult = await confirmLoginCredentials(
    user.email,
    user.password,
  );
  if (!checkedCredentials?.success) {
    return {
      success: false,
      field: "root",
      message: "Invalid login credentials",
    };
  }

  try {
    await createSession(checkedCredentials.userId, "player");
  } catch (e) {
    console.log("Failed to create session", e);
    return {
      success: false,
      field: "root",
      message: "Could not establish session",
    };
  }

  return { success: true };
}
