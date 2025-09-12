import { SessionPayload } from "@/src/lib/session";
import Link from "next/link";
import Button from "../common/Button";

export default function WelcomeCard() {
  return (
    <div className="hero bg-base-200 pt-16 md:pt-24">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-4xl sm:text-5xl font-bold">Welcome to 3x3</h1>
          <p className="py-6 text-lg">
            Your ultimate platform for organizing and participating in 3x3
            basketball tournaments.
          </p>
          <Link href={"/auth/signup"}>
            <Button className="btn-wide" priority="secondary">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
