export interface TeamMemberRaw {
  team_member_id: number;
  team_id: number;
  user_id: number;
  role_in_team: "player" | "captain";
}

export interface TeamMemberInternal {
  teamMemberId: number;
  teamId: number;
  userId: number;
  roleInTeam: "player" | "captain";
}

export interface TeamMemberPublic {
  userId: number;
  roleInTeam: "player" | "captain";
}
