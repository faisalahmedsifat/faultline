import type { MiddlewareHandler } from "hono"
import { AppError } from "../lib/errors"

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const token = process.env.AUTH_TOKEN
  if (!token) return next()

  const header = c.req.header("authorization") ?? ""
  const bearer = header.replace(/^Bearer\s+/i, "")

  if (bearer !== token) {
    throw new AppError({
      code: "unauthorized",
      message: "Invalid or missing authentication token",
      statusCode: 401
    })
  }

  await next()
}
