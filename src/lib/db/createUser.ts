"use server";

import { UserSignup } from "@/src/types/user";
import { z } from "zod";

export async function validateUserInput(user: UserSignup) {
  const userSchema = z
    .object({
      firstName: z.string(),
      lastName: z.string(),
      birthday: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      }),
      email: z.string().email(),
      password: z.string(),
      confirm: z.string(),
    })
    .refine((data) => data.password === data.confirm, {
      message: "Passwords don't match",
    });

  const result = userSchema.safeParse(user);
  if (!result.success) {
    return {
      success: false,
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }
  return {
    success: true,
    data: result.data,
  };
}

export async function createUser(user: UserSignup) {}
