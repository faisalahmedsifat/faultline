# faultline

Self-hosted error tracking SDK. Zero dependencies, works everywhere.

```ts
import { Faultline } from "@xyph3r/faultline"

Faultline.init({
  dsn: process.env.FAULTLINE_DSN,
  baseUrl: process.env.FAULTLINE_BASE_URL
})

// Manual capture
Faultline.capture(err, { route: "/api/checkout", userId: "usr_123" })

// Wrap a handler
export const POST = Faultline.withCapture(async (req: Request) => {
  // thrown errors are captured and rethrown
})

// Observer hooks
Faultline.on("beforeCapture", (payload) => {
  delete payload.metadata?.password // strip PII
})
```

## Install

```bash
npm install @xyph3r/faultline
```

## Requirements

Node 18+, Bun, Deno, or any runtime with `fetch` and `crypto`.
