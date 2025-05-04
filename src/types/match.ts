export interface MatchRaw {
  match_id: number;
  tournament_id: number;
  team1_id: number;
  team2_id: number;
  scheduled_at: Date;
  score1?: number;
  score2?: number;
  status: "scheduled" | "in_progress" | "completed";
}

export interface MatchInternal {
  matchId: number;
  tournamentId: number;
  team1Id: number;
  team2Id: number;
  scheduledAt: Date;
  score1?: number;
  score2?: number;
  status: "scheduled" | "in_progress" | "completed";
}

export interface MatchPublic {
  matchId: number;
  team1Id: number;
  team2Id: number;
  scheduledAt: Date;
  score1?: number;
  score2?: number;
  status: "scheduled" | "in_progress" | "completed";
}
