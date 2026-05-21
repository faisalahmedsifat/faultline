import IORedis from "ioredis"

import { env } from "./env"

export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true
})

let connectPromise: Promise<void> | undefined

export function connectRedis() {
  if (!connectPromise) {
    connectPromise = redisConnection.connect().catch((error) => {
      connectPromise = undefined
      throw error
    })
  }

  return connectPromise
}

export async function closeRedis() {
  await redisConnection.quit()
}

