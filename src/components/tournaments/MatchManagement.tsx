"use client";

import { useState } from "react";
import { Trophy, Clock, Flag, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";
import { enterMatchResult, forfeitMatch } from "@/src/lib/db/progression/matchProgression";

interface MatchManagementProps {
  matches: any[];
  onUpdate: () => void;
}

export default function MatchManagement({ matches, onUpdate }: MatchManagementProps) {
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [team1Score, setTeam1Score] = useState("");
  const [team2Score, setTeam2Score] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPending, setShowPending] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Separate matches by status
  const playableMatches = matches.filter(m => m.team1_id && m.team2_id);
  const pendingMatches = matches.filter(m => !m.team1_id || !m.team2_id);

  // Group matches by round
  const matchesByRound = playableMatches.reduce((acc: any, match: any) => {
    const round = match.round_number;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(match);
    return acc;
  }, {});

  const pendingByRound = pendingMatches.reduce((acc: any, match: any) => {
    const round = match.round_number;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(match);
    return acc;
  }, {});

  const sortedRounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  const sortedPendingRounds = Object.keys(pendingByRound)
    .map(Number)
    .sort((a, b) => a - b);

  const handleMatchSelect = (match: any) => {
    setSelectedMatch(match);
    setTeam1Score("");
    setTeam2Score("");
    setMessage(null);
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMatch) return;

    const score1 = parseInt(team1Score);
    const score2 = parseInt(team2Score);

    // Validate scores
    if (isNaN(score1) || isNaN(score2)) {
      showMessage("error", "Please enter valid scores");
      return;
    }

    if (score1 < 0 || score2 < 0) {
      showMessage("error", "Scores cannot be negative");
      return;
    }

    if (score1 === score2) {
      showMessage("error", "Ties are not allowed. There must be a winner.");
      return;
    }

    setIsSubmitting(true);

    try {
      const winnerTeamId = score1 > score2 ? selectedMatch.team1_id : selectedMatch.team2_id;

      const result = await enterMatchResult({
        gameId: selectedMatch.game_id,
        team1Score: score1,
        team2Score: score2,
        winnerTeamId,
      });

      if (result.success) {
        let successMsg = result.message;
        
        if (result.nextMatchGenerated) {
          successMsg += ' Winner advanced to next round!';
        }
        
        if (result.tournamentComplete) {
          successMsg += ' 🏆 Tournament Complete!';
        }
        
        showMessage("success", successMsg);
        
        // Reset form
        setTeam1Score("");
        setTeam2Score("");
        setSelectedMatch(null);

        // Trigger refresh
        setTimeout(() => {
          onUpdate();
        }, 1500);
      } else {
        showMessage("error", result.message);
      }
    } catch (error) {
      showMessage("error", "Failed to submit result");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForfeit = async (forfeitingTeamId: number) => {
    if (!selectedMatch) return;

    const teamName = forfeitingTeamId === selectedMatch.team1_id 
      ? selectedMatch.team1_name 
      : selectedMatch.team2_name;

    if (!confirm(`Are you sure ${teamName} is forfeiting this match?`)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await forfeitMatch(selectedMatch.game_id, forfeitingTeamId);

      if (result.success) {
        showMessage("success", result.message);
        setSelectedMatch(null);
        
        setTimeout(() => {
          onUpdate();
        }, 1000);
      } else {
        showMessage("error", result.message);
      }
    } catch (error) {
      showMessage("error", "Failed to process forfeit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getMatchStatusBadge = (match: any) => {
    if (match.game_status === "completed") {
      return <span className="badge badge-success badge-sm">Completed</span>;
    }
    if (match.game_status === "in_progress") {
      return <span className="badge badge-warning badge-sm">In Progress</span>;
    }
    // Check if teams are assigned
    if (!match.team1_id || !match.team2_id) {
      return <span className="badge badge-ghost badge-sm">Waiting for Teams</span>;
    }
    return <span className="badge badge-primary badge-sm">Scheduled</span>;
  };

  const canEnterResult = (match: any) => {
    return (
      match.game_status === "scheduled" &&
      match.team1_id &&
      match.team2_id
    );
  };


  if (matches.length === 0) {
    return (
      <div className="bg-base-200 p-8 rounded-lg text-center">
        <AlertCircle size={48} className="mx-auto mb-4 text-base-content/50" />
        <h4 className="font-semibold mb-2">No Matches Available</h4>
        <p className="text-sm text-base-content/70">
          Generate the tournament schedule to start managing matches.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Match List */}
      <div className="lg:col-span-2 space-y-6">
        {message && (
          <div
            className={`alert ${
              message.type === "success" ? "alert-success" : "alert-error"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Playable Matches */}
        {sortedRounds.map((round) => (
          <div key={round} className="space-y-3">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <Trophy size={18} />
              {matchesByRound[round][0].bracket_type === "finals"
                ? "Finals"
                : `Round ${round}`}
            </h4>

            <div className="space-y-2">
              {matchesByRound[round].map((match: any) => (
                <div
                  key={match.game_id}
                  className={`card bg-base-200 cursor-pointer transition-all ${
                    selectedMatch?.game_id === match.game_id
                      ? "ring-2 ring-primary"
                      : "hover:bg-base-300"
                  }`}
                  onClick={() =>
                    canEnterResult(match) && handleMatchSelect(match)
                  }
                >
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-sm text-base-content/70">
                        Match {match.game_number}
                      </div>
                      {getMatchStatusBadge(match)}
                    </div>

                    <div className="space-y-2">
                      {/* Team 1 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className={`font-semibold ${
                              match.winner_team_id === match.team1_id
                                ? "text-success"
                                : ""
                            }`}
                          >
                            {match.team1_name || "TBD"}
                          </div>
                          {match.winner_team_id === match.team1_id && (
                            <Trophy size={16} className="text-success" />
                          )}
                        </div>
                        {match.game_status === "completed" && (
                          <div className="text-lg font-bold">
                            {match.team1_score}
                          </div>
                        )}
                      </div>

                      {/* VS Divider */}
                      <div className="text-center text-xs text-base-content/50">
                        VS
                      </div>

                      {/* Team 2 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className={`font-semibold ${
                              match.winner_team_id === match.team2_id
                                ? "text-success"
                                : ""
                            }`}
                          >
                            {match.team2_name || "TBD"}
                          </div>
                          {match.winner_team_id === match.team2_id && (
                            <Trophy size={16} className="text-success" />
                          )}
                        </div>
                        {match.game_status === "completed" && (
                          <div className="text-lg font-bold">
                            {match.team2_score}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Match Details */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-base-content/70">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatDateTime(match.scheduled_time)}
                      </div>
                      <div>Court {match.court_number}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Pending Matches Section */}
        {pendingMatches.length > 0 && (
          <div className="space-y-3">
            <button
              className="btn btn-sm btn-ghost w-full justify-between"
              onClick={() => setShowPending(!showPending)}
            >
              <span className="font-semibold flex items-center gap-2">
                <HelpCircle size={18} />
                Upcoming Matches ({pendingMatches.length})
              </span>
              <span className="text-xs">
                {showPending ? "Hide" : "Show"}
              </span>
            </button>

            {showPending && (
              <div className="alert alert-info">
                <AlertCircle size={20} />
                <div className="text-sm">
                  <p className="font-semibold">These matches are waiting for teams to be determined</p>
                  <p className="text-xs opacity-80">Winners from previous rounds will automatically advance here</p>
                </div>
              </div>
            )}

            {showPending && sortedPendingRounds.map((round) => (
              <div key={`pending-${round}`} className="space-y-2">
                <h5 className="font-medium text-sm text-base-content/70 flex items-center gap-2">
                  Round {round} - Pending
                </h5>

                <div className="space-y-2">
                  {pendingByRound[round].map((match: any) => (
                    <div
                      key={match.game_id}
                      className="card bg-base-300 opacity-60"
                    >
                      <div className="card-body p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="text-sm text-base-content/70">
                            Match {match.game_number}
                          </div>
                          {getMatchStatusBadge(match)}
                        </div>

                        <div className="space-y-2 text-base-content/60">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <HelpCircle size={14} />
                              <span className="text-sm">
                                {match.team1_name || "Winner of previous match"}
                              </span>
                            </div>
                          </div>

                          <div className="text-center text-xs">VS</div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <HelpCircle size={14} />
                              <span className="text-sm">
                                {match.team2_name || "Winner of previous match"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-xs text-base-content/50">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            {formatDateTime(match.scheduled_time)}
                          </div>
                          <div>Court {match.court_number}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Score Entry Form */}
      <div className="lg:col-span-1">
        <div className="card bg-base-200 sticky top-4">
          <div className="card-body">
            <h4 className="card-title text-lg">Enter Match Result</h4>

            {!selectedMatch ? (
              <div className="text-center py-8 text-base-content/70">
                <AlertCircle size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  Select a scheduled match to enter results
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitResult} className="space-y-4">
                <div className="bg-base-300 p-3 rounded-lg">
                  <div className="text-sm text-base-content/70 mb-2">
                    Match {selectedMatch.game_number} - Round{" "}
                    {selectedMatch.round_number}
                  </div>
                  <div className="text-xs text-base-content/60">
                    Court {selectedMatch.court_number} •{" "}
                    {formatDateTime(selectedMatch.scheduled_time)}
                  </div>
                </div>

                {/* Team 1 Score */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      {selectedMatch.team1_name}
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input input-bordered"
                    placeholder="Score"
                    value={team1Score}
                    onChange={(e) => setTeam1Score(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Team 2 Score */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      {selectedMatch.team2_name}
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input input-bordered"
                    placeholder="Score"
                    value={team2Score}
                    onChange={(e) => setTeam2Score(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Submitting...
                    </>
                  ) : (
                    "Submit Result"
                  )}
                </button>

                {/* Forfeit Options */}
                <div className="divider text-xs">OR</div>

                <div className="space-y-2">
                  <p className="text-xs text-base-content/70 text-center mb-2">
                    Record Forfeit
                  </p>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline btn-error w-full"
                    onClick={() => handleForfeit(selectedMatch.team1_id)}
                    disabled={isSubmitting}
                  >
                    <Flag size={14} />
                    {selectedMatch.team1_name} Forfeits
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline btn-error w-full"
                    onClick={() => handleForfeit(selectedMatch.team2_id)}
                    disabled={isSubmitting}
                  >
                    <Flag size={14} />
                    {selectedMatch.team2_name} Forfeits
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}