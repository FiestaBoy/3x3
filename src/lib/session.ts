import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type SessionPayload = {
  userId: string;
  role: string;
  expires: string;
};

const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
  throw new Error("Missing JWT_SECRET");
}
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1day")
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload as SessionPayload;
  } catch (e) {
    return null;
  }
}

export async function createSession(userId: number, role: string) {
  const expires = new Date(Date.now() + 1000 * 24 * 60 * 60);
  const session = await encrypt({ userId, role, expires });

  (await cookies()).set({
    name: "session",
    value: session,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires,
  });
}
export async function verifySession() {
  const token = (await cookies()).get("session")?.value;
  if (!token) return { success: false, message: "Token not found" };
  const session = await decrypt(token);
  if (!session) {
    (await cookies()).delete("session");
    return { success: false, message: "Failed to verify the session" };
  }

  if (session.expires && new Date(session.expires) < new Date()) {
    (await cookies()).delete("session");
    return { success: false, message: "Session has expired" };
  }

  return {
    success: true,
    userId: session.userId,
    role: session.role,
    expires: session.expires,
  };
}
