export interface TeamRaw {
    team_id: number;
    tournament_id: number;
    name: string;
    registered_at: Date;
    join_code: string;
    code_expires?: Date;
}

export interface TeamInternal {
    teamId: number;
    tournamentId: number;
    name: string;
    registeredAt: Date;
    joinCode: string;
    codeExpires?: Date;
}

export interface TeamPublic {
    teamId: number;
    tournamentId: number;
    name: string;
}