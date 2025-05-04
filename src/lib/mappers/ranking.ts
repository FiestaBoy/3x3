import {
  RankingInternal,
  RankingPublic,
  RankingRaw,
} from "@/src/types/ranking";

export function mapRankingRawToInternal(ranking: RankingRaw): RankingInternal {
  return {
    rankingId: ranking.ranking_id,
    tournamentId: ranking.tournament_id,
    teamId: ranking.team_id,
    wins: ranking.wins,
    losses: ranking.losses,
    draws: ranking.draws,
    points: ranking.points,
    updatedAt: ranking.updated_at,
    createdAt: ranking.created_at,
  };
}

export function mapRankingInternalToPublic(
  ranking: RankingInternal,
): RankingPublic {
  return {
    teamId: ranking.teamId,
    wins: ranking.wins,
    losses: ranking.losses,
    draws: ranking.draws,
    points: ranking.points,
  };
}

export function mapRankingsRawToInternal(
  rankings: RankingRaw[],
): RankingInternal[] {
  return rankings.map((ranking) => mapRankingRawToInternal(ranking));
}

export function mapRankingsInternalToPublic(
  rankings: RankingInternal[],
): RankingPublic[] {
  return rankings.map((ranking) => mapRankingInternalToPublic(ranking));
}
