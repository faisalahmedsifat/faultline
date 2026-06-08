import type { MiddlewareHandler } from "hono"

import { logger } from "../lib/logger"
import { redisConnection } from "../lib/redis"

const RATE_LIMIT_WINDOW = 15 // seconds
const RATE_LIMIT_MAX = 100 // requests per window

const RATE_LIMIT_SCRIPT = `
  local current = redis.call('INCR', KEYS[1])
  if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
  end
  local ttl = redis.call('TTL', KEYS[1])
  return {current, ttl}
`

/**
 * Creates a rate-limit middleware that extracts a rate-limit key from the request
 * and enforces a fixed-window counter via Redis (100 req / 15s window).
 *
 * Fails open: if Redis is unreachable, the request is allowed through.
 */
export function rateLimitMiddleware(
  extractKey: (c: Parameters<MiddlewareHandler>[0]) => string
): MiddlewareHandler {
  return async (c, next) => {
    const key = extractKey(c)

    if (!key) return next()

    const redisKey = `fl:rl:${key}`

    try {
      const result = (await redisConnection.eval(
        RATE_LIMIT_SCRIPT,
        1,
        redisKey,
        RATE_LIMIT_WINDOW
      )) as [number, number]

      const count = Number(result[0])
      const ttl = Number(result[1])

      if (count > RATE_LIMIT_MAX) {
        c.header("Retry-After", String(Math.max(ttl, 1)))
        c.header("X-RateLimit-Limit", String(RATE_LIMIT_MAX))
        c.header("X-RateLimit-Remaining", "0")
        c.status(429)
        return c.json({
          error: {
            code: "rate_limit_exceeded",
            message: "Too many requests. Please try again later."
          }
        })
      }
    } catch (err) {
      logger.error("rate_limit.redis_error", {
        message: err instanceof Error ? err.message : "Unknown Redis error"
      })
      // Fail open — allow the request through if Redis is unavailable
    }

    await next()
  }
}
