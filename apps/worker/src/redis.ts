import IORedis from "ioredis"

import { env } from "./env"

function createRedisClient() {
  return new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null
  })
}

export const redisConnection = createRedisClient()

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

export function createRedisConnection() {
  return createRedisClient()
}

export async function waitForConnection(redis: IORedis) {
  if (redis.status === "ready") return

  await new Promise<void>((resolve, reject) => {
    redis.once("ready", () => resolve())
    redis.once("error", (err) => reject(err))
  })
}
