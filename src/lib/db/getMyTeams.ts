import { getUserSession } from "./helpers";

type TeamCardType = {
    ageGroup: string;
    joinCode?: string;
    playerCount: number;
    captainName: string;
    name: string;
    role: string;
}

export default function getMyTeams() {
    const session = getUserSession()
}