"use server";

import { FormFields } from "@/src/components/auth/LoginForm";
import { confirmLoginCredentials, LoginResult } from "./helpers";
import { createSession } from "../session";

type ReturnType = {
  success: boolean;
  field: keyof FormFields | "root";
  message: string;
}

export async function loginUser(user: FormFields): Promise<ReturnType> {
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
    await createSession(checkedCredentials.userId, checkedCredentials.role);
  } catch (e) {
    console.log("Failed to create session", e);
    return {
      success: false,
      field: "root",
      message: "Could not establish session",
    };
  }

  return { success: true, field: "root", message: "Login successful" };
}
