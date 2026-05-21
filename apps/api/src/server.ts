import { Hono } from "hono"

import { toAppError } from "./lib/http"
import { logger } from "./lib/logger"
import { jsonError } from "./lib/http"
import { corsMiddleware } from "./middleware/cors"
import { requestLogger } from "./middleware/request-logger"
import { healthRouter } from "./routes/health"
import { rootRouter } from "./routes/root"

export function createApp() {
  const app = new Hono()

  app.use("*", corsMiddleware)
  app.use("*", requestLogger)

  app.route("/", rootRouter)
  app.route("/", healthRouter)

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
