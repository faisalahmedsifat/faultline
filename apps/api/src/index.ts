import { pingDb, runMigrations } from "./db/client"
import { createApp } from "./server"
import { env } from "./lib/env"
import { logger } from "./lib/logger"
import { connectRedis } from "./lib/redis"
import { addConnection, removeConnection, type WSData } from "./lib/ws"

async function start() {
  await runMigrations()
  await pingDb()
  await connectRedis()

  const app = createApp()

  Bun.serve({
    port: env.PORT,
    fetch(req, server) {
      const url = new URL(req.url)
      const wsMatch = url.pathname.match(/^\/ws\/([^/]+)$/)

      if (wsMatch) {
        const projectId = wsMatch[1]
        const upgraded = server.upgrade(req, {
          data: { projectId } satisfies WSData
        })
        if (upgraded) return
      }

      return app.fetch(req)
    },
    websocket: {
      open(ws) {
        addConnection(ws)
      },
      close(ws) {
        removeConnection(ws)
      },
      message(ws, _msg) {
        // Inbound messages not needed for this notification pattern
      }
    }
  })

  logger.info("api.started", {
    host: "0.0.0.0",
    port: env.PORT,
    nodeEnv: env.NODE_ENV
  })
}

start().catch((error) => {
  logger.error("api.start_failed", {
    message: error instanceof Error ? error.message : "Unknown startup error"
  })
  process.exit(1)
})
