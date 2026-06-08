import { Hono } from "hono"

import { toAppError } from "./lib/http"
import { logger } from "./lib/logger"
import { jsonError } from "./lib/http"
import { authMiddleware } from "./middleware/auth"
import { corsMiddleware } from "./middleware/cors"
import { rateLimitMiddleware } from "./middleware/rate-limit"
import { alertsRouter } from "./routes/alerts"
import { errorsRouter } from "./routes/errors"
import { requestLogger } from "./middleware/request-logger"
import { healthRouter } from "./routes/health"
import { ingestRouter } from "./routes/ingest"
import { projectsRouter } from "./routes/projects"
import { rootRouter } from "./routes/root"
import { sentryRouter } from "./routes/sentry"
import { sourcemapsRouter } from "./routes/sourcemaps"

export function createApp() {
  const app = new Hono()

  app.use("*", corsMiddleware)
  app.use("*", requestLogger)

  app.route("/", rootRouter)
  app.route("/", healthRouter)
  // ── Rate limiting for public ingest endpoints ──
  app.use(
    "/ingest/*",
    rateLimitMiddleware((c) => c.req.param("dsnKey"))
  )
  app.use(
    "/api/*/store",
    rateLimitMiddleware((c) => {
      const authHeader = c.req.header("x-sentry-auth") ?? ""
      const keyMatch = authHeader.match(/sentry_key=([^,]+)/)
      return keyMatch ? keyMatch[1] : "unknown"
    })
  )

  // ── Public routes (no auth) ──
  app.route("/", ingestRouter)     // DSN-based auth
  app.route("/", sentryRouter)     // DSN-based auth
  // ── Auth boundary ──
  app.use("/api/*", authMiddleware) // everything below requires Bearer token if AUTH_TOKEN is set
  app.route("/", projectsRouter)
  app.route("/", alertsRouter)
  app.route("/", errorsRouter)
  app.route("/", sourcemapsRouter)

  app.onError((error, c) => {
    const appError = toAppError(error)

    logger.error("http.error", {
      code: appError.code,
      status: appError.statusCode,
      message: appError.message
    })

    return jsonError(c, {
      code: appError.code,
      message: appError.message,
      status: appError.statusCode,
      details: appError.details
    })
  })

  app.notFound((c) =>
    jsonError(c, {
      code: "not_found",
      message: "Route not found",
      status: 404
    })
  )

  return app
}
