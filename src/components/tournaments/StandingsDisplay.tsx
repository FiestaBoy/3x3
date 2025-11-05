"use client";

import { Trophy, Award, TrendingUp, Hash } from "lucide-react";

interface StandingsDisplayProps {
  teams: TeamStanding[];
  isLoading?: boolean;
  format: "single_elimination" | "round_robin";
}

interface TeamStanding {
  team_id: string;
  team_name: string;
  wins: number;
  losses: number;
  points_for: number;
  points_against: number;
  point_differential: number;
  matches_played: number;
  win_percentage?: number;
  rank?: number;
}

export default function StandingsDisplay({ teams, isLoading = false, format }: StandingsDisplayProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="bg-base-200 p-8 rounded-lg text-center">
        <Trophy size={48} className="mx-auto mb-4 text-base-content/50" />
        <h4 className="font-semibold mb-2">No Standings Available</h4>
        <p className="text-sm text-base-content/70">
          Standings will appear once matches have been completed.
        </p>
      </div>
    );
  }

  // Calculate win percentage and sort teams
  const sortedTeams = teams
    .map((team, index) => ({
      ...team,
      win_percentage: team.matches_played > 0 
        ? (team.wins / team.matches_played) * 100 
        : 0,
      rank: index + 1,
    }))
    .sort((a, b) => {
      // Sort by wins first
      if (b.wins !== a.wins) return b.wins - a.wins;
      // Then by point differential
      if (b.point_differential !== a.point_differential) {
        return b.point_differential - a.point_differential;
      }
      // Then by points for
      return b.points_for - a.points_for;
    })
    .map((team, index) => ({
      ...team,
      rank: index + 1,
    }));

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500 text-yellow-950">
          <Trophy size={16} className="font-bold" />
        </div>
      );
    } else if (rank === 2) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-400 text-gray-900">
          <Award size={16} />
        </div>
      );
    } else if (rank === 3) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-700 text-amber-100">
          <Award size={16} />
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-base-300 text-base-content">
          <span className="text-sm font-bold">{rank}</span>
        </div>
      );
    }
  };

  const getWinPercentageColor = (percentage: number) => {
    if (percentage >= 75) return "text-success";
    if (percentage >= 50) return "text-warning";
    return "text-error";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={24} className="text-primary" />
          <h4 className="font-bold text-lg">Tournament Standings</h4>
        </div>
        <span className="badge badge-lg badge-outline">
          {format === "round_robin" ? "Round Robin" : "Single Elimination"}
        </span>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th className="text-center">
                <Hash size={16} className="inline" />
              </th>
              <th>Team</th>
              <th className="text-center">
                <Trophy size={16} className="inline mr-1" />
                W
              </th>
              <th className="text-center">L</th>
              <th className="text-center">
                <TrendingUp size={16} className="inline mr-1" />
                Win %
              </th>
              <th className="text-center">PF</th>
              <th className="text-center">PA</th>
              <th className="text-center">DIFF</th>
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((team) => (
              <tr key={team.team_id} className={team.rank <= 3 ? "font-semibold" : ""}>
                <td className="text-center">
                  {getRankBadge(team.rank)}
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    {team.rank === 1 && (
                      <Trophy size={16} className="text-yellow-500" />
                    )}
                    <span className={team.rank === 1 ? "text-primary font-bold" : ""}>
                      {team.team_name}
                    </span>
                  </div>
                </td>
                <td className="text-center font-bold text-success">{team.wins}</td>
                <td className="text-center text-base-content/70">{team.losses}</td>
                <td className="text-center">
                  <span className={`font-semibold ${getWinPercentageColor(team.win_percentage || 0)}`}>
                    {(team.win_percentage || 0).toFixed(1)}%
                  </span>
                </td>
                <td className="text-center">{team.points_for}</td>
                <td className="text-center">{team.points_against}</td>
                <td className="text-center">
                  <span
                    className={`font-semibold ${
                      team.point_differential > 0
                        ? "text-success"
                        : team.point_differential < 0
                        ? "text-error"
                        : ""
                    }`}
                  >
                    {team.point_differential > 0 ? "+" : ""}
                    {team.point_differential}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {sortedTeams.map((team) => (
          <div
            key={team.team_id}
            className={`card bg-base-200 ${
              team.rank <= 3 ? "border-2 border-primary" : ""
            }`}
          >
            <div className="card-body p-4">
              {/* Team Name and Rank */}
              <div className="flex items-center gap-3 mb-3">
                {getRankBadge(team.rank)}
                <div className="flex-1">
                  <h5 className="font-bold">{team.team_name}</h5>
                  <span className="text-xs text-base-content/70">
                    {team.matches_played} matches played
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-xs text-base-content/70">Wins</div>
                  <div className="font-bold text-success">{team.wins}</div>
                </div>
                <div>
                  <div className="text-xs text-base-content/70">Losses</div>
                  <div className="font-bold">{team.losses}</div>
                </div>
                <div>
                  <div className="text-xs text-base-content/70">Win %</div>
                  <div
                    className={`font-bold ${getWinPercentageColor(
                      team.win_percentage || 0
                    )}`}
                  >
                    {(team.win_percentage || 0).toFixed(0)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-base-content/70">Diff</div>
                  <div
                    className={`font-bold ${
                      team.point_differential > 0
                        ? "text-success"
                        : team.point_differential < 0
                        ? "text-error"
                        : ""
                    }`}
                  >
                    {team.point_differential > 0 ? "+" : ""}
                    {team.point_differential}
                  </div>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="flex justify-between text-xs text-base-content/70 mt-2 pt-2 border-t border-base-300">
                <span>
                  PF: <span className="font-semibold">{team.points_for}</span>
                </span>
                <span>
                  PA: <span className="font-semibold">{team.points_against}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="text-xs text-base-content/60 mt-4 p-3 bg-base-200 rounded">
        <p className="font-semibold mb-1">Legend:</p>
        <div className="grid grid-cols-2 gap-2">
          <span>W = Wins</span>
          <span>L = Losses</span>
          <span>PF = Points For</span>
          <span>PA = Points Against</span>
          <span>DIFF = Point Differential</span>
          <span>Win % = Win Percentage</span>
        </div>
      </div>
    </div>
  );
}