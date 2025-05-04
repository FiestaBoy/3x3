export interface TournamentRaw {
  tournament_id: number;
  name: string;
  description: string;
  start_date: Date;
  end_date: Date;
  created_by: number;
  created_at: Date;
}

export interface TournamentInternal {
  tournamentId: number;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  createdBy: number;
  createdAt: Date;
}

export interface TournamentPublic {
  tournamentId: number;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
}
