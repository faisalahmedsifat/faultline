import { cors } from "hono/cors"

import { env } from "../lib/env"

const configuredOrigin = env.CORS_ORIGIN?.trim()

export const corsMiddleware = cors({
  origin: configuredOrigin ? configuredOrigin : "*",
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["content-type", "authorization"],
  exposeHeaders: ["content-length"],
  maxAge: 86400
})

