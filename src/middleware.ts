import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "./lib/db/auth/session";

export const config = {
  matcher: ["/tournaments/:path*", "/teams/:path*", "/profile/:path*"],
};

export default async function middleware(req: NextRequest) {
  const cookie = req.cookies.get("session")?.value;
  if (!cookie) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }
  const session = await decrypt(cookie);

  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // if (
  //   req.nextUrl.pathname.startsWith("/tournaments/create") &&
  //   session.role !== "organizer"
  // ) {
  //   return NextResponse.redirect(new URL("/tournaments", req.url));
  // }

  return NextResponse.next();
}
