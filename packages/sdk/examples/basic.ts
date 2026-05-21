import { Faultline } from "../src/index"

const faultline = new Faultline({
  dsn: process.env.FAULTLINE_DSN,
  env: process.env.NODE_ENV,
  debug: true
})

void faultline.capture(new Error("Example error"), {
  route: "/api/example",
  metadata: {
    example: true
  }
})
