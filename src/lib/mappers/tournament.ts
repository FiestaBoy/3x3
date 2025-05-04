import {
  TournamentInternal,
  TournamentPublic,
  TournamentRaw,
} from "@/src/types/tournament";

export function mapTournamentRawToInternal(
  tournament: TournamentRaw,
): TournamentInternal {
  return {
    tournamentId: tournament.tournament_id,
    name: tournament.name,
    description: tournament.description,
    startDate: tournament.start_date,
    endDate: tournament.end_date,
    createdBy: tournament.created_by,
    createdAt: tournament.created_at,
  };
}

export function mapTournamentInternalToPublic(
  tournament: TournamentInternal,
): TournamentPublic {
  return {
    tournamentId: tournament.tournamentId,
    name: tournament.name,
    description: tournament.description,
    startDate: tournament.startDate,
    endDate: tournament.endDate,
  };
}

export function mapTournamentsRawToInternal(
  tournaments: TournamentRaw[],
): TournamentInternal[] {
  return tournaments.map((tournament) =>
    mapTournamentRawToInternal(tournament),
  );
}

export function mapTournamentsInternalToPublic(
  tournaments: TournamentInternal[],
): TournamentPublic[] {
  return tournaments.map((tournament) =>
    mapTournamentInternalToPublic(tournament),
  );
}
