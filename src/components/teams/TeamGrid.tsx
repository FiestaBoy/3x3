import getMyTeams from "@/src/lib/db/getMyTeams";
import TeamCard from "./TeamCard";

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
        <p>No Teams Found, Join One!</p>
      )}
    </>
  );
}
