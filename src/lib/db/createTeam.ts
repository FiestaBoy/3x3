"use server";

import { FormFields } from "@/src/components/teams/RegisterForm";
import { confirmAgeGroup } from "./helpers";
import { cookies } from "next/headers";
import { decrypt } from "../session";

export type ReturnType = {
    success: boolean;
    field: keyof FormFields | "root";
    message: string
}

export async function createTeam(team: FormFields): Promise<ReturnType> {
  const cookie = (await cookies()).get("session")?.value;
  if (!cookie) throw new Error("No session found");

  const session = await decrypt(cookie);
  if (!session) throw new Error("Invalid session");

  const ageGroupConfirmationResponse = await confirmAgeGroup(
    team.ageGroup,
    session.userId,
  );

  console.log(ageGroupConfirmationResponse)
  if (ageGroupConfirmationResponse.success) {
    return {success: false, field: "ageGroup", message: "Select a valid age group"}
  }

  return {success: true, field: "root", message: "Success"}
}
