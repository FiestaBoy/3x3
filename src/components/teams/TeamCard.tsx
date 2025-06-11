import { TeamInfo } from "@/src/lib/db/getMyTeams";
import Link from "next/link";

export default function TeamCard(team: TeamInfo) {
  return (
    <div className="card bg-base-100 shadow-xl transform transition-all duration-300 hover:scale-105 ease-in-out">
      <div className="card-body items-center text-center">
        <h3 className="card-title text-xl font-semibold">{team.name}</h3>
        <p className="text-base-content/80">Age Group: {team.ageGroup}</p>
        <p className="text-base-content/80">Your Role: {team.role}</p>
        <p className="text-base-content/80">{team.joinCode}</p>
        <Link
          href={`/teams/my-teams/${team.teamId}`}
          className="btn btn-primary"
        >
          {team.role === "captain" ? "Manage Team" : "View Team"}
        </Link>
      </div>
    </div>
  );
}
