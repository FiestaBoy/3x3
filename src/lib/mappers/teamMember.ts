import { TeamMemberInternal, TeamMemberRaw } from "@/src/types/teamMember";

export function mapTeamMemberRawToInternal(teamMember: TeamMemberRaw): TeamMemberInternal {
    return {
        teamMemberId: teamMember.team_member_id,
        teamId: teamMember.team_id,
        userId: teamMember.user_id,
        roleInTeam: teamMember.role_in_team
    }
}

export function mapTeamMembersRawToInternal(members: TeamMemberRaw[]): TeamMemberInternal[] {
    return members.map(mapTeamMemberRawToInternal);
}
  