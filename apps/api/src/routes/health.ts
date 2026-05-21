import { Hono } from "hono"

import { jsonOk } from "../lib/http"

export const healthRouter = new Hono()

healthRouter.get("/health", (c) =>
  jsonOk(c, {
    service: "api",
    status: "ok"
  })
)

