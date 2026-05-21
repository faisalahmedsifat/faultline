import IORedis from "ioredis"

import { env } from "./env"

function createRedisClient() {
  return new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true
  })
}

export const redisConnection = createRedisClient()

let connectPromise: Promise<void> | undefined

export function connectRedis() {
  if (!connectPromise) {
    connectPromise = redisConnection.connect().catch((error: unknown) => {
      connectPromise = undefined
      throw error
    })
  }

  return connectPromise
}

export async function closeRedis() {
  await redisConnection.quit()
}

export function createRedisConnection() {
  return createRedisClient()
}
