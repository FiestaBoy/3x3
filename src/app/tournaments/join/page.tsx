import JoinTournamentForm from "@/src/components/tournaments/JoinTournamentForm";
import { getCaptainTeamNames, getUserSession } from "@/src/lib/db/helpers";
import { joinTournament } from "@/src/lib/db/joinTournament";

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
    <div className="min-h-screen bg-base-200 flex items-center">
      <div className="w-full max-w-2xl mx-auto p-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="text-center mb-4">
              <h1 className="text-3xl md:text-4xl font-bold">Private Tournament Registration</h1>
            </div>

            <div className="w-full">
              <JoinTournamentForm teams={teams} joinAction={handleJoin} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}