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
        <p>
          No teams found, <Link href={"/teams/join"} className="text-primary">join one</Link> or <Link href={"/teams/create"} className="text-primary">create one</Link>
        </p>
      )}
    </>
  );
}
