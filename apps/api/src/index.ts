import { closeDbConnection, pingDb, runMigrations } from "./db/client"
import { createApp } from "./server"
import { env } from "./lib/env"
import { logger } from "./lib/logger"
import { closeAlertQueue } from "./lib/queue"
import { closeRedis, connectRedis } from "./lib/redis"
import { addConnection, closeAllConnections, removeConnection, type WSData } from "./lib/ws"

async function start() {
  await runMigrations()
  await pingDb()
  await connectRedis()

  const app = createApp()

  const httpServer = Bun.serve({
    port: env.PORT,
    fetch(req, server) {
      const url = new URL(req.url)
      const wsMatch = url.pathname.match(/^\/ws\/([^/]+)$/)

      if (wsMatch) {
        const projectId = wsMatch[1]

        if (env.CORS_ORIGIN) {
          const origin = req.headers.get("Origin")
          if (origin !== env.CORS_ORIGIN) {
            return new Response("Forbidden", { status: 403 })
          }
        }

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
      message(_ws, _msg) {
        // Inbound messages not needed for this notification pattern
      }
    }
  })

  logger.info("api.started", {
    host: "0.0.0.0",
    port: env.PORT,
    nodeEnv: env.NODE_ENV
  })

  const shutdown = async (signal: string) => {
    logger.info("api.shutdown", { signal })
    httpServer.stop()
    closeAllConnections()
    await closeDbConnection()
    await closeRedis()
    await closeAlertQueue()
    process.exit(0)
  }

  process.on("SIGINT", () => {
    void shutdown("SIGINT")
    setTimeout(() => {
      logger.error("api.force_shutdown", { message: "Graceful shutdown timed out after 5s" })
      process.exit(0)
    }, 5000)
  })

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM")
    setTimeout(() => {
      logger.error("api.force_shutdown", { message: "Graceful shutdown timed out after 5s" })
      process.exit(0)
    }, 5000)
  })
}

start().catch((error) => {
  logger.error("api.start_failed", {
    message: error instanceof Error ? error.message : "Unknown startup error"
  })
  process.exit(1)
})
