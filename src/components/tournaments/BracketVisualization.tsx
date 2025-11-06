"use client";

import { useState } from "react";
import { Trophy, ChevronDown, ChevronUp, Clock } from "lucide-react";

interface BracketVisualizationProps {
  matches: any[];
  tournament: any;
}

export default function BracketVisualization({
  matches,
  tournament,
}: BracketVisualizationProps) {
  const [collapsedRounds, setCollapsedRounds] = useState<Set<number>>(
    new Set(),
  );

  if (matches.length === 0) {
    return (
      <div className="bg-base-200 p-8 rounded-lg text-center">
        <Trophy size={48} className="mx-auto mb-4 text-base-content/50" />
        <h4 className="font-semibold mb-2">No Bracket Data</h4>
        <p className="text-sm text-base-content/70">
          Generate the tournament schedule to view the bracket.
        </p>
      </div>
    );
  }

  const toggleRound = (round: number) => {
    const newCollapsed = new Set(collapsedRounds);
    if (newCollapsed.has(round)) {
      newCollapsed.delete(round);
    } else {
      newCollapsed.add(round);
    }
    setCollapsedRounds(newCollapsed);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const renderMatch = (match: any) => {
    const isCompleted = match.game_status === "completed";
    const hasTeams = match.team1_id && match.team2_id;

    return (
      <div
        key={match.game_id}
        className={`card bg-base-200 border-2 ${
          isCompleted
            ? "border-success"
            : hasTeams
              ? "border-primary"
              : "border-base-300"
        } mb-3`}
      >
        <div className="card-body p-3">
          <div className="flex justify-between items-center mb-2 text-xs">
            <span className="text-base-content/70">
              Match {match.game_number}
            </span>
            <span className="text-base-content/70">
              Court {match.court_number}
            </span>
          </div>

          {/* Team 1 */}
          <div
            className={`flex items-center justify-between py-2 px-3 rounded ${
              match.winner_team_id === match.team1_id
                ? "bg-success/20 border-l-4 border-success"
                : "bg-base-300"
            }`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span
                className={`font-semibold truncate ${
                  match.winner_team_id === match.team1_id ? "text-success" : ""
                }`}
              >
                {match.team1_name || "TBD"}
              </span>
              {match.winner_team_id === match.team1_id && (
                <Trophy size={14} className="text-success flex-shrink-0" />
              )}
            </div>
            {isCompleted && match.team1_id && (
              <span className="text-lg font-bold ml-2">
                {match.team1_score}
              </span>
            )}
          </div>

          {/* VS Divider */}
          <div className="text-center text-xs text-base-content/50 my-1">
            VS
          </div>

          {/* Team 2 */}
          <div
            className={`flex items-center justify-between py-2 px-3 rounded ${
              match.winner_team_id === match.team2_id
                ? "bg-success/20 border-l-4 border-success"
                : "bg-base-300"
            }`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span
                className={`font-semibold truncate ${
                  match.winner_team_id === match.team2_id ? "text-success" : ""
                }`}
              >
                {match.team2_name || "TBD"}
              </span>
              {match.winner_team_id === match.team2_id && (
                <Trophy size={14} className="text-success flex-shrink-0" />
              )}
            </div>
            {isCompleted && match.team2_id && (
              <span className="text-lg font-bold ml-2">
                {match.team2_score}
              </span>
            )}
          </div>

          {/* Match Time */}
          <div className="flex items-center gap-1 mt-2 text-xs text-base-content/70">
            <Clock size={12} />
            {formatDateTime(match.scheduled_time)}
          </div>
        </div>
      </div>
    );
  };

  const renderRound = (
    roundNumber: number,
    roundMatches: any[],
    title: string,
  ) => {
    const isCollapsed = collapsedRounds.has(roundNumber);

    return (
      <div key={roundNumber} className="mb-4">
        <button
          className="btn btn-sm btn-ghost w-full justify-between mb-2"
          onClick={() => toggleRound(roundNumber)}
        >
          <span className="font-semibold">{title}</span>
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>

        {!isCollapsed && (
          <div className="space-y-3">
            {roundMatches.map((match) => renderMatch(match))}
          </div>
        )}
      </div>
    );
  };

  const groupByRound = (bracketMatches: any[]) => {
    const rounds = new Map<number, any[]>();
    bracketMatches.forEach((match) => {
      const round = match.round_number;
      if (!rounds.has(round)) {
        rounds.set(round, []);
      }
      rounds.get(round)!.push(match);
    });
    return rounds;
  };

  if (tournament.format === "round_robin") {
    const rounds = groupByRound(matches);
    const sortedRounds = Array.from(rounds.keys()).sort((a, b) => a - b);

    return (
      <div className="space-y-4">
        <div className="alert alert-info">
          <Trophy size={20} />
          <div>
            <div className="font-semibold">Round Robin Format</div>
            <div className="text-sm">
              Every team plays every other team once
            </div>
          </div>
        </div>

        {sortedRounds.map((round) =>
          renderRound(round, rounds.get(round)!, `Round ${round}`),
        )}
      </div>
    );
  }

  if (tournament.format === "single_elimination") {
    const rounds = groupByRound(matches);
    const sortedRounds = Array.from(rounds.keys()).sort((a, b) => a - b);

    return (
      <div className="space-y-4">
        <div className="alert alert-info">
          <Trophy size={20} />
          <div>
            <div className="font-semibold">Single Elimination Bracket</div>
            <div className="text-sm">Lose once and you're eliminated</div>
          </div>
        </div>

        {sortedRounds.map((round) => {
          const roundMatches = rounds.get(round)!;
          const isFinals = round === sortedRounds[sortedRounds.length - 1];
          const title = isFinals ? "Finals" : `Round ${round}`;
          return renderRound(round, roundMatches, title);
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => renderMatch(match))}
    </div>
  );
}
