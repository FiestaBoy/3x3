import { UserInternal, UserPublic, UserRaw } from "@/src/types/user";

export function mapUserRawToInternal(user: UserRaw): UserInternal {
  return {
    userId: user.user_id,
    email: user.email,
    passwordHash: user.password_hash,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

export function mapUserInternalToPublic(user: UserInternal): UserPublic {
  return {
    userId: user.userId,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };
}

export function mapUsersRawToInternal(users: UserRaw[]): UserInternal[] {
  return users.map((user) => mapUserRawToInternal(user));
}

export function mapUsersInternalToPublic(users: UserInternal[]): UserPublic[] {
  return users.map((user) => mapUserInternalToPublic(user));
}
