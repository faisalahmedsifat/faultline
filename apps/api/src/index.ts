import { serve } from "@hono/node-server"

import { pingDb, runMigrations } from "./db/client"
import { createApp } from "./server"
import { env } from "./lib/env"
import { logger } from "./lib/logger"
import { connectRedis } from "./lib/redis"

async function start() {
  await runMigrations()
  await pingDb()
  await connectRedis()

  const app = createApp()

  serve(
    {
      fetch: app.fetch,
      port: env.PORT
    },
    (info) => {
      logger.info("api.started", {
        host: info.address,
        port: info.port,
        nodeEnv: env.NODE_ENV
      })
    }
  )
}

start().catch((error) => {
  logger.error("api.start_failed", {
    message: error instanceof Error ? error.message : "Unknown startup error"
  })
  process.exit(1)
})
