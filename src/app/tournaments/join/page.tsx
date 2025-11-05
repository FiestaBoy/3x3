import JoinTournamentForm from "@/src/components/tournaments/JoinTournamentForm";
import { getCaptainTeamNames, getUserSession } from "@/src/lib/db/helpers";
import { joinTournament } from "@/src/lib/db/joinTournament";
import { Trophy, Lock } from "lucide-react";

import { redirect } from "next/navigation";

export default async function Page() {
  // fetch teams for the current session user on the server
  const teams = await getCaptainTeamNames();

  // server action — will run on the server when invoked from the client component
  async function handleJoin(payload: { joinCode: string; teamId: string }) {
    "use server";
    const { joinCode, teamId } = payload ?? {};
    if (!joinCode || !teamId) {
      return { success: false, field: "joinCode", message: "Missing join code or team" };
    }

    const result = await joinTournament(String(joinCode), String(teamId));

    if (result?.success) {
      redirect("/tournaments");
    }

    return result;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-300 to-base-200 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Lock className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Join Private Tournament
            </h1>
          </div>
          <p className="text-lg text-base-content/70">
            Enter your join code to register your team
          </p>
        </div>

        <div className="card bg-base-100 shadow-2xl border border-base-300 hover:shadow-3xl transition-all">
          <div className="card-body">
            <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto mb-4">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <JoinTournamentForm teams={teams} joinAction={handleJoin} />
          </div>
        </div>
      </div>
    </div>
  );
}