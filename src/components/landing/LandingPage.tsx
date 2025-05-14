import Link from "next/link";
import { SessionPayload } from "@/src/lib/session";
import InfoSection from "../common/InfoSection";
import FeatureCard from "./FeatureCard";
import WelcomeCard from "./WelcomeCard";

type SessionProps = {
  session: SessionPayload | null;
};

export default function LandingPage({ session }: SessionProps) {
  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      {session && (
        <div className="hero bg-base-200 pt-24">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h1 className="text-4xl font-bold">Create Your Team</h1>
              <p className="py-6 text-lg">
                It takes less than a minute.
              </p>
              <Link href={"/teams/create"}>
                <button className="btn btn-secondary btn-wide">Start Now</button>
              </Link>
            </div>
          </div>
        </div>
      )}
      {!session && <WelcomeCard />}
      <main
        className="flex-grow container mx-auto px-4"
      >
        <InfoSection
          title="Key Features"
          subtitle="Discover what makes 3x3 the best choice for your games."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <FeatureCard
              title="Easy Tournament Creation"
              description="Set up and manage tournaments in minutes with our intuitive interface."
            />
            <FeatureCard
              title="Team Management"
              description="Build your roster, invite players, and track team performance."
            />
            <FeatureCard
              title="Discover Local Games"
              description="Find 3x3 events and pickup games happening near you."
            />
            <FeatureCard
              title="Real-time Updates"
              description="Get live scores, standings, and notifications for your events."
            />
            <FeatureCard
              title="Player Profiles"
              description="Showcase your stats, achievements, and basketball journey."
            />
            <FeatureCard
              title="Community Focused"
              description="Connect with fellow players, organizers, and fans."
            />
          </div>
        </InfoSection>

        {!session && (
          <>
            <InfoSection
              title="How It Works"
              subtitle="Joining the action is simple."
              className="py-12 md:py-16 bg-base-300/50 rounded-box my-12 md:my-16 px-4"
            >
              <ul className="steps steps-vertical lg:steps-horizontal w-full">
                <li data-content="●" className="step step-primary text-lg">
                  Sign Up Free
                </li>
                <li data-content="●" className="step step-primary text-lg">
                  Create or Join
                </li>
                <li data-content="●" className="step step-primary text-lg">
                  Play & Compete
                </li>
              </ul>
            </InfoSection>

            <InfoSection title="Ready to Ball?" subtitle="Sign up today and take your 3x3 game to the next level!" className="py-16 text-center">
              <Link href={"/auth/signup"}>
                <button className="btn btn-primary btn-lg">Sign Up Now</button>
              </Link>
            </InfoSection>
          </>
        )}
      </main>
    </div>
  );
}
