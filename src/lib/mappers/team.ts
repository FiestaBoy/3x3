import { TeamInternal, TeamPublic, TeamRaw } from "@/src/types/team";

export function mapTeamRawToInternal(team: TeamRaw): TeamInternal {
  return {
    teamId: team.team_id,
    tournamentId: team.tournament_id,
    name: team.name,
    registeredAt: team.registered_at,
    joinCode: team.join_code,
    codeExpires: team.code_expires,
  };
}

export function mapTeamInternalToPublic(team: TeamInternal): TeamPublic {
  return {
    teamId: team.teamId,
    tournamentId: team.tournamentId,
    name: team.name,
  };
}

export function mapTeamsRawToInternal(teams: TeamRaw[]): TeamInternal[] {
  return teams.map((team) => mapTeamRawToInternal(team));
}

export function mapTeamsInternalToPublic(teams: TeamInternal[]): TeamPublic[] {
  return teams.map((team) => mapTeamInternalToPublic(team));
}
