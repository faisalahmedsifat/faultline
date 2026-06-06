import IORedis from "ioredis"

import { env } from "./env"

export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null
})

export async function connectRedis() {
  if (redisConnection.status === "ready") return

  await new Promise<void>((resolve, reject) => {
    redisConnection.once("ready", () => resolve())
    redisConnection.once("error", (err) => reject(err))
  })
}

export async function closeRedis() {
  await redisConnection.quit()
}
