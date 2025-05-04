import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createPool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  database: process.env.DB,
});

export async function query<T = any>(
  sql: string,
  params: (number | string)[] = [],
): Promise<T> {
  try {
    const connection = await db.getConnection();
    try {
      const [rows] = await connection.query(sql, params);
      return JSON.parse(JSON.stringify(rows));
    } finally {
      connection.release();
    }
  } catch (e) {
    console.log(e);
    throw e;
  }
}
