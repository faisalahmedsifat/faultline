import type { Context, MiddlewareHandler } from "hono"
import { AppError } from "../lib/errors"

export async function parseJsonBody(c: Context) {
  try {
    return await c.req.json()
  } catch {
    throw new AppError({
      code: "invalid_json",
      message: "Request body must be valid JSON",
      statusCode: 400
    })
  }
}
