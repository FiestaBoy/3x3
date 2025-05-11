import React from 'react';


// --- Reusable Components for your Landing Page ---

interface FeatureCardProps {
  title: string;
  description: string;
  // You could add an icon prop here if desired, e.g., icon?: React.ReactNode;
}

/**
 * A card component to highlight a feature.
 */
export const FeatureCard: React.FC<FeatureCardProps> = ({ title, description }) => {
  return (
    <div className="card bg-base-100 shadow-xl transform transition-all hover:scale-105 duration-300 ease-in-out">
      <div className="card-body items-center text-center">
        {/* Example: {icon && <div className="text-primary text-4xl mb-4">{icon}</div>} */}
        <h3 className="card-title text-xl md:text-2xl font-semibold">{title}</h3>
        <p className="text-base-content/80">{description}</p>
      </div>
    </div>
  );
};

interface InfoSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
}

/**
 * A section component for organizing content blocks.
 */
export const InfoSection: React.FC<InfoSectionProps> = ({
  title,
  subtitle,
  children,
  className = "py-12 md:py-16",
  titleClassName = "text-3xl md:text-4xl font-bold text-center mb-4",
  contentClassName = "max-w-4xl mx-auto",
}) => {
  return (
    <section className={className}>
      <h2 className={titleClassName}>{title}</h2>
      {subtitle && (
        <p className="text-lg md:text-xl text-center text-base-content/70 mb-8 md:mb-12">
          {subtitle}
        </p>
      )}
      <div className={contentClassName}>{children}</div>
    </section>
  );
};

// --- Main Landing Page Component ---

export default function page() {
  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      {/* Hero Section */}
      <header className="hero bg-base-200 py-16 md:py-24">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-4xl sm:text-5xl font-bold">Welcome to 3x3</h1>
            <p className="py-6 text-lg">
              Your ultimate platform for organizing and participating in 3x3 basketball tournaments.
            </p>
            {/* Consider using Next.js Link for navigation: import Link from 'next/link'; */}
            {/* <Link href="/signup"><button className="btn btn-secondary btn-wide">Get Started</button></Link> */}
            <button className="btn btn-secondary btn-wide">Get Started</button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
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
          className="py-12 md:py-16 bg-base-300/50 rounded-box my-12 md:my-16 px-4" // Added px-4 for padding on smaller screens
        >
          <ul className="steps steps-vertical lg:steps-horizontal w-full">
            <li data-content="●" className="step step-primary text-lg">Sign Up Free</li>
            <li data-content="●" className="step step-primary text-lg">Create or Join</li>
            <li data-content="●" className="step step-primary text-lg">Play & Compete</li>
          </ul>
        </InfoSection>

        <InfoSection title="Ready to Ball?" className="py-16 text-center">
          <p className="mb-8 text-xl max-w-xl mx-auto text-base-content/80">
            Sign up today and take your 3x3 game to the next level!
          </p>
          {/* Consider using Next.js Link for navigation: import Link from 'next/link'; */}
          {/* <Link href="/signup"><button className="btn btn-primary btn-lg">Sign Up Now</button></Link> */}
          <button className="btn btn-primary btn-lg">Sign Up Now</button>
        </InfoSection>
      </main>
      
    </div>
  );
}
