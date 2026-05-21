import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { env } from "../lib/env"

const connection = postgres(env.DATABASE_URL, {
  max: 5,
  prepare: false
})

export const db = drizzle(connection)

export async function pingDb() {
  await db.execute(sql`select 1`)
}

export async function closeDbConnection() {
  await connection.end({ timeout: 5 })
}
