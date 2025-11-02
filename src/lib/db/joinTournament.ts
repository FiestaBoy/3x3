"use server"

import { getUserSession } from "./helpers"

const db = require("@/src/lib/db/db");

export async function joinTournament(joinCode: string, teamId: string) {
    const session = await getUserSession()
    try {
        const teamSqlStatement = "SELECT captain_id, age_group FROM teams WHERE team_id = ?"
        const teamSqlResponse = await db.query(teamSqlStatement, [teamId])

        if (!teamSqlResponse || teamSqlResponse.length === 0) {
            throw new Error("Failed to fetch team information")
        }

        if (String(session.userId) !== String(teamSqlResponse[0].captain_id)) {
            return {
                success: false,
                field: "joinCode",
                message: "Only team captains can register their teams"
            }
        }

        const tournamentSqlFetchStatement = "SELECT tournament_id, age_group, max_teams, registration_start, registration_end FROM tournaments WHERE join_code = ?"
        const tournamentSqlFetchResponse = await db.query(tournamentSqlFetchStatement, [joinCode])

        if (!tournamentSqlFetchResponse || tournamentSqlFetchResponse.length === 0) {
            throw new Error("Failed to join the tournament")
        }

        const existsSql = "SELECT 1 FROM team_tournament WHERE tournament_id = ? AND team_id = ? LIMIT 1"
        const existsResp = await db.query(existsSql, [tournamentSqlFetchResponse[0].tournament_id, teamId])
        if (existsResp && existsResp.length > 0) {
            return {
                success: false,
                field: "joinCode",
                message: "Team already registered for this tournament"
            }
        }

        const teamCountSqlStatement = "SELECT COUNT(*) as count FROM team_tournament WHERE tournament_id = ?"
        const teamCountSqlResponse = await db.query(teamCountSqlStatement, [tournamentSqlFetchResponse[0].tournament_id])
        const teamCount = teamCountSqlResponse?.[0]?.count ?? 0
        const maxTeams = tournamentSqlFetchResponse[0].max_teams

        if (maxTeams !== null && maxTeams!== undefined && maxTeams <= teamCount) {
            return {
                success: false,
                field: "joinCode",
                message: "Tournament is full"
            }
        }
        
        const teamAge = (teamSqlResponse[0].age_group)
        const tournamentAge = (tournamentSqlFetchResponse[0].age_group)

        const ageRank: Record<string, number> = {
            "U12": 0,
            "U14": 1,
            "U16": 2,
            "Adult": 3
        }

        if (!(teamAge in ageRank) || !(tournamentAge in ageRank)) {
            throw new Error("Invalid age group")
        }

        if (ageRank[teamAge] > ageRank[tournamentAge]) {
            return {
                success: false,
                field: "joinCode",
                message: "Age group mismatch",
            };
        }

        const regStartRaw = tournamentSqlFetchResponse[0].registration_start
        const regEndRaw = tournamentSqlFetchResponse[0].registration_end
        const now = new Date()

        const regStart = regStartRaw ? new Date(regStartRaw) : null
        const regEnd = regEndRaw ? new Date(regEndRaw) : null

        if (regStart && isNaN(regStart.getTime())) {
            throw new Error("Invalid registration_start date")
        }
        if (regEnd && isNaN(regEnd.getTime())) {
            throw new Error("Invalid registration_end date")
        }

        if (regStart && now < regStart) {
            return {
                success: false,
                field: "joinCode",
                message: "Registration has not started",
            }
        }

        if (regEnd && now > regEnd) {
            return {
                success: false,
                field: "joinCode",
                message: "Registration has ended",
            }
        }

        const insertTeamSql = "INSERT INTO team_tournament (tournament_id, team_id) VALUES (?, ?)"
        await db.query(insertTeamSql, [tournamentSqlFetchResponse[0].tournament_id, teamId])

        return { success: true }
    } catch (e) {
        console.log("Failed to join a tournament", e)
        return {
            success: false,
            field: "joinCode",
            message: "Join code is invalid"
        }
    }
}