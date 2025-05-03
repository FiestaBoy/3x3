export interface RankingRaw {
    ranking_id: number;
    tournament_id: number;
    team_id: number;
    wins: number;
    losses: number;
    draws: number;
    points: number;
    updated_at: Date;
    created_at: Date;
}

export interface RankingInternal {
    rankingId: number;
    tournamentId: number;
    teamId: number;
    wins: number;
    losses: number;
    draws: number;
    points: number;
    updatedAt: Date;
    createdAt: Date;
}

export interface RankingPublic {
    teamId: number;
    wins: number;
    losses: number;
    draws: number;
    points: number;
}