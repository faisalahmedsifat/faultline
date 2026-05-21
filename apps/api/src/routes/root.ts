import { Hono } from "hono"

import { jsonOk } from "../lib/http"

export const rootRouter = new Hono()

rootRouter.get("/", (c) =>
  jsonOk(c, {
    service: "faultline-api",
    status: "ok",
    version: "0.1.0"
  })
)

