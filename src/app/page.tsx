import FeatureCard from "../components/landing/FeatureCard";
import InfoSection from "../components/common/InfoSection";
import Link from "next/link";

export default function page() {
  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <div className="hero bg-base-200 py-16 md:py-24">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-4xl sm:text-5xl font-bold">Welcome to 3x3</h1>
            <p className="py-6 text-lg">
              Your ultimate platform for organizing and participating in 3x3
              basketball tournaments.
            </p>
            <Link href={"/auth/signup"}>
              <button className="btn btn-secondary btn-wide">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-grow container mx-auto px-4">
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

        <InfoSection title="Ready to Ball?" className="py-16 text-center">
          <p className="mb-8 text-xl max-w-xl mx-auto text-base-content/80">
            Sign up today and take your 3x3 game to the next level!
          </p>
          <Link href={"/auth/signup"}>
            <button className="btn btn-primary btn-lg">Sign Up Now</button>
          </Link>
        </InfoSection>
      </main>
    </div>
  );
}
