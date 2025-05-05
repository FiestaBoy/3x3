export interface UserRaw {
  user_id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: "player" | "captain" | "organizer" | "admin";
  created_at: Date;
  updated_at: Date;
}

export interface UserInternal {
  userId: number;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: "player" | "captain" | "organizer" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPublic {
  userId: number;
  firstName: string;
  lastName: string;
  role: "player" | "captain" | "organizer" | "admin";
}

export interface UserSignup {
  firstName: string;
  lastName: string;
  birthday: string;
  email: string;
  password: string;
  confirm: string;
}
