import type { MiddlewareHandler } from "hono"

import { logger } from "../lib/logger"

export const requestLogger: MiddlewareHandler = async (c, next) => {
  const startedAt = Date.now()

  await next()

  logger.info("http.request", {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs: Date.now() - startedAt
  })
}

