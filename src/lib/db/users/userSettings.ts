"use server";

const db = require("@/src/lib/db/db");

import { getUserSession } from "../utils/helpers";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import bcrypt from "bcryptjs";
// import bcrypt from "bcrypt";

interface UserProfile {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  birthday: string;
  role: string;
  created_at: string;
}

export async function getUserProfile() {
  try {
    const session = await getUserSession();

    const rows: UserProfile[] = await db.query(
      `SELECT user_id, email, first_name, last_name, birthday, role, created_at 
       FROM users 
       WHERE user_id = ?`,
      [session.userId],
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return { success: false, message: "User not found" };
    }

    const user = rows[0];

    return {
      success: true,
      user: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        birthday: user.birthday,
        role: user.role,
        created_at: user.created_at,
      },
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { success: false, message: "Failed to fetch profile" };
  }
}

export async function updateUserProfile(data: {
  firstName: string;
  lastName: string;
  birthday: string;
  email: string;
}) {
  try {
    const session = await getUserSession();

    // Check if email is already taken by another user
    const existingUsers: { user_id: number }[] = await db.query(
      `SELECT user_id FROM users WHERE email = ? AND user_id != ?`,
      [data.email, session.userId],
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return {
        success: false,
        field: "email",
        message: "Email is already in use",
      };
    }

    // Update user profile
    await db.query(
      `UPDATE users 
       SET first_name = ?, last_name = ?, birthday = ?, email = ?, updated_at = NOW() 
       WHERE user_id = ?`,
      [
        data.firstName,
        data.lastName,
        data.birthday,
        data.email,
        session.userId,
      ],
    );

    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return {
      success: false,
      field: "root",
      message: "Failed to update profile",
    };
  }
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  try {
    const session = await getUserSession();

    // Get current password hash
    const rows: { password_hash: string }[] = await db.query(
      `SELECT password_hash FROM users WHERE user_id = ?`,
      [session.userId],
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return {
        success: false,
        field: "currentPassword",
        message: "User not found",
      };
    }

    const user = rows[0];

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      data.currentPassword,
      user.password_hash,
    );

    if (!isPasswordValid) {
      return {
        success: false,
        field: "currentPassword",
        message: "Current password is incorrect",
      };
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(data.newPassword, 10);

    // Update password
    await db.query(
      `UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?`,
      [newPasswordHash, session.userId],
    );

    return { success: true, message: "Password changed successfully" };
  } catch (error) {
    console.error("Error changing password:", error);
    return {
      success: false,
      field: "root",
      message: "Failed to change password",
    };
  }
}
