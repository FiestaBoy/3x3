

const db = require("@/src/lib/db/db")

export async function emailInUse(email: string) {
    const statement = `SELECT email FROM users WHERE email = ?`
    const response = await db.query(statement, [email])

    return response.success
}