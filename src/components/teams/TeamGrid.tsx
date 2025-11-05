import getMyTeams from "@/src/lib/db/getMyTeams";
import TeamCard from "./TeamCard";
import Link from "next/link";

export default async function TeamGrid() {
  const response = await getMyTeams();

  return (
    <>
      {response.success ? (
        response.teams.map((team) => (
          <TeamCard
            key={team.teamId}
            name={team.name}
            role={team.role}
            ageGroup={team.ageGroup}
            joinCode={team.joinCode}
            teamId={team.teamId}
          />
        ))
      ) : (
        <div className="col-span-full">
          <div className="card bg-base-100 shadow-xl border border-base-300 p-8 text-center">
            <div className="space-y-4">
              <p className="text-lg text-base-content/70">
                No teams found. Get started by creating or joining a team!
              </p>
              <div className="flex gap-3 justify-center">
                <Link href={"/teams/create"} className="btn btn-primary gap-2 shadow-lg hover:shadow-xl transition-all">
                  Create Team
                </Link>
                <Link href={"/teams/join"} className="btn btn-outline btn-secondary gap-2 hover:shadow-lg transition-all">
                  Join Team
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
