import Link from "next/link";
import {
  getTournaments,
  getJoinedTournaments,
  getHostedTournaments,
} from "@/src/lib/db/tournaments/tournamentActions";
import PublicTournamentCard from "@/src/components/tournaments/PublicTournamentCard";
import JoinedTournamentCard from "@/src/components/tournaments/JoinedTournamentCard";
import HostedTournamentCard from "@/src/components/tournaments/HostedTournamentCard";

export default async function Page() {
  const publicResponse = await getTournaments({ isPrivate: false });
  const joinedResponse = await getJoinedTournaments();
  const hostedResponse = await getHostedTournaments();

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-300 to-base-200 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Tournaments
          </h1>
          <p className="text-lg text-base-content/70 mb-6">
            Browse upcoming 3x3 basketball tournaments or create your own
          </p>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
            <Link href="/tournaments/create">
              <div className="card bg-primary text-primary-content hover:shadow-xl transition-shadow cursor-pointer">
                <div className="card-body items-center text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <h2 className="card-title">Create Tournament</h2>
                  <p className="text-sm">Organize your own 3x3 tournament</p>
                </div>
              </div>
            </Link>

            <Link href="/tournaments/join">
              <div className="card bg-secondary text-secondary-content hover:shadow-xl transition-shadow cursor-pointer">
                <div className="card-body items-center text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                  <h2 className="card-title">Join Private Tournament</h2>
                  <p className="text-sm">Enter a join code to register</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Joined Tournaments Section */}
        {joinedResponse.success &&
          joinedResponse.tournaments &&
          joinedResponse.tournaments.length > 0 && (
            <>
              <div className="divider">JOINED TOURNAMENTS</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {joinedResponse.tournaments.map(
                  (tournament: any, index: any) => (
                    <JoinedTournamentCard
                      key={`${tournament.name}-${index}`}
                      tournament={tournament}
                    />
                  ),
                )}
              </div>
            </>
          )}

        {/* Hosted Tournaments Section */}
        {hostedResponse.success &&
          hostedResponse.tournaments &&
          hostedResponse.tournaments.length > 0 && (
            <>
              <div className="divider">HOSTED TOURNAMENTS</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {hostedResponse.tournaments.map((tournament: any) => (
                  <HostedTournamentCard
                    key={tournament.tournament_id}
                    tournament={tournament}
                  />
                ))}
              </div>
            </>
          )}

        {/* Public Tournaments Section */}
        <div className="divider">PUBLIC TOURNAMENTS</div>

        {publicResponse.success &&
        publicResponse.tournaments &&
        publicResponse.tournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicResponse.tournaments.map((tournament: any) => (
              <PublicTournamentCard
                key={tournament.tournament_id}
                tournament={tournament}
              />
            ))}
          </div>
        ) : (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center py-12">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-base-300 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-2xl font-bold mb-2">No Public Tournaments</h3>
              <p className="text-muted-foreground mb-6">
                There are currently no public tournaments available. Be the
                first to create one!
              </p>
              <Link href="/tournaments/create">
                <button className="btn btn-primary">Create Tournament</button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
