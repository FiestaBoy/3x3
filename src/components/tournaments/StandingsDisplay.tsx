"use client";

import { useEffect, useState } from "react";
import { Trophy, TrendingUp, Award } from "lucide-react";
import { getTournamentStandings, calculateWinningPercentage } from "@/src/lib/db/tiebreakers";

interface StandingsDisplayProps {
  tournamentId: string;
  tournament: any;
}

export default function StandingsDisplay({
  tournamentId,
  tournament,
}: StandingsDisplayProps) {
  const [standings, setStandings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStandings();
  }, [tournamentId]);

  const loadStandings = async () => {
    setIsLoading(true);
    try {
      const result = await getTournamentStandings(tournamentId);
      setStandings(result);
    } catch (error) {
      console.error('Failed to load standings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="bg-base-200 p-8 rounded-lg text-center">
        <Trophy size={48} className="mx-auto mb-4 text-base-content/50" />
        <h4 className="font-semibold mb-2">No Standings Available</h4>
        <p className="text-sm text-base-content/70">
          Standings will appear once matches have been played.
        </p>
      </div>
    );
  }

  const getPositionBadge = (position: number) => {
    if (position === 1) {
      return (
        <div className="badge badge-warning gap-1">
          <Trophy size={12} />
          1st
        </div>
      );
    }
    if (position === 2) {
      return (
        <div className="badge badge-sm">
          <Award size={12} />
          2nd
        </div>
      );
    }
    if (position === 3) {
      return (
        <div className="badge badge-sm">
          <Award size={12} />
          3rd
        </div>
      );
    }
    return <div className="badge badge-ghost badge-sm">{position}th</div>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp size={24} />
          Tournament Standings
        </h3>
        <span className="badge badge-lg">{standings.length} Teams</span>
      </div>

      {/* Standings Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Team</th>
              <th className="text-center">W</th>
              <th className="text-center">L</th>
              <th className="text-center">Win %</th>
              <th className="text-center">PF</th>
              <th className="text-center">PA</th>
              <th className="text-center">Diff</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team) => (
              <tr
                key={team.teamId}
                className={team.position === 1 ? 'bg-warning/10' : ''}
              >
                <td>{getPositionBadge(team.position)}</td>
                <td>
                  <div className="font-semibold">{team.teamName}</div>
                </td>
                <td className="text-center font-bold text-success">
                  {team.wins}
                </td>
                <td className="text-center font-bold text-error">
                  {team.losses}
                </td>
                <td className="text-center">
                  {calculateWinningPercentage(team.wins, team.losses).toFixed(1)}%
                </td>
                <td className="text-center">{team.pointsScored}</td>
                <td className="text-center">{team.pointsAllowed}</td>
                <td className="text-center">
                  <span
                    className={`font-semibold ${
                      team.pointDifferential > 0
                        ? 'text-success'
                        : team.pointDifferential < 0
                        ? 'text-error'
                        : ''
                    }`}
                  >
                    {team.pointDifferential > 0 ? '+' : ''}
                    {team.pointDifferential}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="bg-base-200 p-4 rounded-lg">
        <h4 className="font-semibold mb-3 text-sm">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="font-semibold">W:</span> Wins
          </div>
          <div>
            <span className="font-semibold">L:</span> Losses
          </div>
          <div>
            <span className="font-semibold">PF:</span> Points For
          </div>
          <div>
            <span className="font-semibold">PA:</span> Points Against
          </div>
          <div className="col-span-2">
            <span className="font-semibold">Diff:</span> Point Differential
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-base-300">
          <p className="text-xs text-base-content/70">
            <span className="font-semibold">Tiebreaker Rules:</span> 1. Wins 2. Head-to-Head (2-way tie) 3. Point Differential 4. Points Scored 5. Seed Number
          </p>
        </div>
      </div>
    </div>
  );
}