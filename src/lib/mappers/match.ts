import { MatchInternal, MatchRaw } from "@/src/types/match";

export function mapMatchRawToInternal(match: MatchRaw): MatchInternal {
  return {
    matchId: match.match_id,
    tournamentId: match.tournament_id,
    team1Id: match.team1_id,
    team2Id: match.team2_id,
    scheduledAt: match.scheduled_at,
    score1: match.score1,
    score2: match.score2,
    status: match.status,
  };
}
