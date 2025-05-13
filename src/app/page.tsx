import { cookies } from "next/headers";
import LandingPage from "../components/landing/LandingPage";
import { decrypt } from "../lib/session";

export default async function page() {
  const cookie = (await cookies()).get("session")?.value;
  const session = cookie ? await decrypt(cookie) : null;
  return <LandingPage session={session} />;
}
