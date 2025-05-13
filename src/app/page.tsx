import { cookies } from "next/headers";
import LandingPage from "../components/landing/LandingPage";
import { decrypt } from "../lib/session";

const cookie = (await cookies()).get("session")?.value;
const session = cookie ? await decrypt(cookie) : null;

export default function page() {
  return <LandingPage session={session} />;
}
