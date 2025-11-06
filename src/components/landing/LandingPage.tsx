import Link from "next/link";
import { SessionPayload } from "@/src/lib/db/auth/session";
import {
  Trophy,
  Users,
  Calendar,
  BarChart3,
  Zap,
  Shield,
  Target,
  Globe,
  Award,
  Clock,
  MapPin,
  CheckCircle,
} from "lucide-react";

type SessionProps = {
  session: SessionPayload | null;
};

export default function LandingPage({ session }: SessionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-base-200 to-base-300">
      {/* Hero Section */}
      <div className="hero min-h-[70vh] bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-3xl">
            <div className="flex justify-center mb-6">
              <div className="badge badge-primary badge-lg gap-2">
                <Zap size={16} />
                Complete Tournament Management Platform
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Organize 3x3 Basketball
              <span className="block text-primary mt-2">Like a Pro</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-base-content/80">
              Create tournaments, manage teams, track standings, and run
              seamless basketball events. Everything you need in one powerful
              platform.
            </p>

            {session ? (
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/teams/create">
                  <button className="btn btn-primary btn-lg gap-2">
                    <Users size={20} />
                    Create a Team
                  </button>
                </Link>
                <Link href="/tournaments/create">
                  <button className="btn btn-secondary btn-lg gap-2">
                    <Trophy size={20} />
                    Host Tournament
                  </button>
                </Link>
              </div>
            ) : (
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/auth/signup">
                  <button className="btn btn-primary btn-lg gap-2">
                    <Trophy size={20} />
                    Get Started Free
                  </button>
                </Link>
                <Link href="/auth/login">
                  <button className="btn btn-outline btn-lg">Sign In</button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="stats stats-vertical lg:stats-horizontal shadow-2xl bg-base-100 w-full">
          <div className="stat">
            <div className="stat-figure text-primary">
              <Trophy size={32} />
            </div>
            <div className="stat-title">Tournament Formats</div>
            <div className="stat-value text-primary">2</div>
            <div className="stat-desc">Single Elimination & Round Robin</div>
          </div>

          <div className="stat">
            <div className="stat-figure text-secondary">
              <Users size={32} />
            </div>
            <div className="stat-title">Team Management</div>
            <div className="stat-value text-secondary">∞</div>
            <div className="stat-desc">Unlimited teams & players</div>
          </div>

          <div className="stat">
            <div className="stat-figure text-accent">
              <BarChart3 size={32} />
            </div>
            <div className="stat-title">Live Standings</div>
            <div className="stat-value text-accent">Real-time</div>
            <div className="stat-desc">Automatic calculations</div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to Run Tournaments
          </h2>
          <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
            Professional-grade tournament management tools designed for
            organizers, teams, and players.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all">
            <div className="card-body">
              <div className="bg-primary/10 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                <Trophy size={32} className="text-primary" />
              </div>
              <h3 className="card-title">Tournament Creation</h3>
              <p className="text-base-content/70">
                Set up single elimination or round robin tournaments in minutes.
                Configure teams, schedules, and brackets effortlessly.
              </p>
              <div className="flex gap-2 flex-wrap mt-2">
                <div className="badge badge-sm">Single Elimination</div>
                <div className="badge badge-sm">Round Robin</div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all">
            <div className="card-body">
              <div className="bg-secondary/10 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                <Calendar size={32} className="text-secondary" />
              </div>
              <h3 className="card-title">Smart Scheduling</h3>
              <p className="text-base-content/70">
                Automatic match scheduling with court assignments, time slots,
                and break management. Optimized for multi-day events.
              </p>
              <div className="flex gap-2 flex-wrap mt-2">
                <div className="badge badge-sm">Auto-scheduling</div>
                <div className="badge badge-sm">Court Management</div>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all">
            <div className="card-body">
              <div className="bg-accent/10 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                <Users size={32} className="text-accent" />
              </div>
              <h3 className="card-title">Team Management</h3>
              <p className="text-base-content/70">
                Create teams, invite players, assign captains. Manage rosters
                with age groups and player roles seamlessly.
              </p>
              <div className="flex gap-2 flex-wrap mt-2">
                <div className="badge badge-sm">Role Management</div>
                <div className="badge badge-sm">Invite System</div>
              </div>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all">
            <div className="card-body">
              <div className="bg-success/10 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 size={32} className="text-success" />
              </div>
              <h3 className="card-title">Live Standings</h3>
              <p className="text-base-content/70">
                Real-time standings with wins, losses, point differentials, and
                rankings. Automatically updated after each match.
              </p>
              <div className="flex gap-2 flex-wrap mt-2">
                <div className="badge badge-sm">Real-time Updates</div>
                <div className="badge badge-sm">Auto Rankings</div>
              </div>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all">
            <div className="card-body">
              <div className="bg-warning/10 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                <Target size={32} className="text-warning" />
              </div>
              <h3 className="card-title">Match Management</h3>
              <p className="text-base-content/70">
                Enter scores, record results, handle forfeits. Winner
                progression is automatic.
              </p>
              <div className="flex gap-2 flex-wrap mt-2">
                <div className="badge badge-sm">Score Entry</div>
                <div className="badge badge-sm">Auto Progression</div>
              </div>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all">
            <div className="card-body">
              <div className="bg-info/10 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                <Award size={32} className="text-info" />
              </div>
              <h3 className="card-title">Bracket Visualization</h3>
              <p className="text-base-content/70">
                Beautiful bracket views with match results, team progression,
                and tournament flow.
              </p>
              <div className="flex gap-2 flex-wrap mt-2">
                <div className="badge badge-sm">Visual Brackets</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-base-100 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-base-content/70">
              Get your tournament up and running in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="bg-primary text-primary-content w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Create & Configure</h3>
              <p className="text-base-content/70">
                Set up your tournament with format, teams, location, and
                schedule preferences
              </p>
            </div>

            <div className="text-center">
              <div className="bg-secondary text-secondary-content w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Generate Schedule</h3>
              <p className="text-base-content/70">
                Automatic bracket generation and smart scheduling across courts
                and days
              </p>
            </div>

            <div className="text-center">
              <div className="bg-accent text-accent-content w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Run & Track</h3>
              <p className="text-base-content/70">
                Enter results, track standings, and manage matches as your
                tournament progresses
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">
              Why Organizers Choose Us
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="bg-success/10 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={20} className="text-success" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Save Time</h4>
                  <p className="text-base-content/70">
                    Automated scheduling and bracket management saves hours of
                    manual work
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-success/10 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={20} className="text-success" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Professional Results</h4>
                  <p className="text-base-content/70">
                    Clean brackets, accurate standings, and real-time updates
                    for participants
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-success/10 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={20} className="text-success" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Easy Team Management</h4>
                  <p className="text-base-content/70">
                    Remove teams, track registrations, and manage participants
                    effortlessly
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-primary to-secondary text-primary-content shadow-2xl">
            <div className="card-body">
              <h3 className="card-title text-2xl mb-4">Tournament Features</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Shield size={20} />
                  <span>Public & Private tournaments</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock size={20} />
                  <span>Flexible scheduling system</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin size={20} />
                  <span>Location & venue management</span>
                </li>
                <li className="flex items-center gap-2">
                  <Globe size={20} />
                  <span>Age group filtering</span>
                </li>
                <li className="flex items-center gap-2">
                  <Trophy size={20} />
                  <span>Custom team limits</span>
                </li>
                <li className="flex items-center gap-2">
                  <Award size={20} />
                  <span>Final standings & rankings</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary to-secondary py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-content mb-6">
            Ready to Host Your Next Tournament?
          </h2>
          <p className="text-xl text-primary-content/90 mb-8 max-w-2xl mx-auto">
            Join organizers who trust our platform for professional 3x3
            basketball tournament management.
          </p>

          {session ? (
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/tournaments/create">
                <button className="btn btn-lg bg-base-100 text-primary hover:bg-base-200 gap-2">
                  <Trophy size={20} />
                  Create Tournament Now
                </button>
              </Link>
              <Link href="/tournaments">
                <button className="btn btn-lg btn-outline text-primary-content hover:bg-primary-content hover:text-primary gap-2">
                  Browse Tournaments
                </button>
              </Link>
            </div>
          ) : (
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/auth/signup">
                <button className="btn btn-lg bg-base-100 text-primary hover:bg-base-200 gap-2">
                  <Trophy size={20} />
                  Get Started Free
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
