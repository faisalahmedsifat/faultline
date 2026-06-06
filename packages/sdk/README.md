# @xyph3r/faultline

Self-hosted error tracking SDK for JavaScript and TypeScript. Zero dependencies, works everywhere.

- **Fire-and-forget** — `capture()` never throws, never blocks
- **Under 3KB** — safe to add to any project, no dependency conflicts
- **Runs anywhere** — Node 18+, Bun, Deno, Edge Runtime, browsers
- **Full TypeScript** — typed API with autocomplete
- **Observable** — hooks to filter, enrich, and log every event

---

## Install

```bash
npm install @xyph3r/faultline
# or
bun add @xyph3r/faultline
# or
pnpm add @xyph3r/faultline
```

---

## Quick Start

```ts
import { Faultline } from "@xyph3r/faultline"

// Reads FAULTLINE_DSN and FAULTLINE_BASE_URL from env
Faultline.init()

// Manual capture
try {
  await someRiskyOperation()
} catch (err) {
  Faultline.capture(err, {
    route: "/api/checkout",
    userId: currentUser.id,
    metadata: { cartId: cart.id }
  })
}
```

Set these environment variables:

```bash
# Required — your project's DSN key (from the faultline dashboard)
FAULTLINE_DSN=LV0l2yhx7QtWCkoumWCw660e

# Optional — defaults to https://faultline.dev
FAULTLINE_BASE_URL=https://faultline.example.com

# Optional — release version for source map resolution
FAULTLINE_RELEASE=v2.3.1
```

---

## API Reference

### `Faultline.init(options?)`

Initialize the global singleton. Call once at app startup. Reads `FAULTLINE_DSN` and `FAULTLINE_BASE_URL` from environment if not passed explicitly.

```ts
Faultline.init({
  dsn: "LV0l2yhx7QtWCkoumWCw660e",
  baseUrl: "https://faultline.example.com",
  env: "production",
  release: "v2.3.1",
  debug: false,       // enable console warnings
  enabled: true       // set false to disable in dev
})
```

All options are optional — if you set the env vars, `Faultline.init()` with no arguments is enough.

### `Faultline.capture(error, context?)`

Capture an error. Returns a `Promise<void>` — fire and forget.

```ts
Faultline.capture(error, {
  route: "/api/checkout",     // route where the error occurred
  userId: "usr_123",          // affected user
  level: "error",             // "error" | "warning" | "info" (default: "error")
  release: "v2.3.1",         // overrides the init-level release
  metadata: {                 // arbitrary JSON-serializable data
    cartId: "cart_456",
    paymentMethod: "stripe"
  }
})
```

The `context` is fully optional — you can call `Faultline.capture(err)` with no context at all.

### `Faultline.withCapture(handler, getContext?)`

Wrap any async function. If it throws, the error is captured and rethrown.

```ts
// Basic — auto-infers route from Request.url
export const POST = Faultline.withCapture(async (req: Request) => {
  const body = await req.json()
  return processCheckout(body)
})

// With custom context — use the error and arguments
export const GET = Faultline.withCapture(
  async (req: Request) => {
    // ... your handler logic
  },
  (error, [req]) => ({
    route: new URL(req.url).pathname,
    userId: getUserId(req)
  })
)
```

When wrapping a handler that receives a `Request` (Next.js App Router, Hono, etc.), the SDK auto-detects the route from `request.url`. Otherwise pass a `getContext` function.

### `Faultline.expressHandler()`

Returns an Express error-handling middleware. Place it **after** your routes.

```ts
import express from "express"
import { Faultline } from "@xyph3r/faultline"

const app = express()

Faultline.init()

app.get("/api/users", (req, res) => {
  throw new Error("something broke")
})

// Must come after all routes
app.use(Faultline.expressHandler())
```

The handler reads the route from `req.originalUrl` (or `req.route.path` / `req.url`) and calls `next(error)` after capture.

---

## Observer Hooks

Subscribe to events to filter sensitive data, enrich payloads, or log captures.

```ts
// Strip PII before sending
Faultline.on("beforeCapture", (payload) => {
  // Remove sensitive fields
  delete payload.metadata?.password
  delete payload.metadata?.ssn

  // Redact from message
  if (payload.message) {
    payload.message = payload.message.replace(/secret-\w+/g, "[REDACTED]")
  }
})

// Log to your own system
Faultline.on("afterCapture", (payload) => {
  console.log(`Captured: ${payload.title} at ${payload.route}`)
})

// Handle capture failures
Faultline.on("captureError", ({ error, ...payload }) => {
  console.error("Faultline failed to send:", error)
})
```

`Faultline.on()` returns an unsubscribe function:

```ts
const unsubscribe = Faultline.on("beforeCapture", handler)
// later...
unsubscribe()
```

### Event Types

| Event | Payload | When |
|-------|---------|------|
| `beforeCapture` | `IngestPayload` | Before sending. Mutate the payload to filter/enrich. |  
| `afterCapture` | `IngestPayload` | After a successful send. |
| `captureError` | `IngestPayload & { error: string }` | When the HTTP request fails. |

---

## Configuration

### Options (all optional)

| Option | Env Fallback | Default | Description |
|--------|-------------|---------|-------------|
| `dsn` | `FAULTLINE_DSN` | — | Project DSN key (required to send) |
| `baseUrl` | `FAULTLINE_BASE_URL` | `https://faultline.dev` | Faultline server URL |
| `env` | `NODE_ENV` | `"production"` | Environment name (`production`, `staging`, etc.) |
| `release` | `FAULTLINE_RELEASE` | — | Release version for source map resolution |
| `enabled` | — | `true` | Set to `false` to disable all capture |
| `debug` | — | `false` | Enable console warnings for misconfiguration |
| `fetch` | — | `globalThis.fetch` | Custom fetch implementation (for polyfills) |

### Environment Variables

```bash
FAULTLINE_DSN=LV0l2yhx7QtWCkoumWCw660e
FAULTLINE_BASE_URL=https://faultline.example.com
FAULTLINE_RELEASE=v2.3.1
```

The SDK reads these at init time. Pass explicit options to override.

---

## Multiple Projects / Non-Singleton Usage

The singleton (`Faultline.init()` + `Faultline.capture()`) covers most use cases. When you need to report to multiple faultline projects from the same process, use instance mode:

```ts
import { Faultline } from "@xyph3r/faultline"

const backendFaultline = new Faultline({
  dsn: "dsk_backend_xxxxxxxxxxxx",
  baseUrl: "https://faultline.example.com"
})

const frontendFaultline = new Faultline({
  dsn: "dsk_frontend_yyyyyyyyyyy",
  baseUrl: "https://faultline.example.com"
})

await backendFaultline.capture(err, { route: "/api/internal" })
await frontendFaultline.capture(err, { route: "/checkout" })
```

Instances have the same `.capture()`, `.withCapture()`, and `.expressHandler()` methods as the singleton.

---

## CLI: Source Map Upload

The SDK ships with a CLI for uploading source maps. Upload them as part of your build pipeline — after the build produces `.map` files, but before the deploy ships to production.

```bash
npx faultline upload-sourcemaps --dir <path> --release <version>
```

Requires `FAULTLINE_DSN` and optionally `FAULTLINE_BASE_URL` in the environment.

### When to run it

Source maps must be uploaded **after the build** (when `.map` files exist) and **before errors hit production**. The `--release` flag ties source maps to a specific deployment — when faultline receives an error with a matching `release`, it uses the corresponding source map bundle to resolve the minified stack trace back to your original source code.

```
next build ──→ upload source maps ──→ deploy
                  ↑
            this is the critical step
            if you skip it, minified stacks stay minified
```

### CI/CD examples

**GitHub Actions:**

```yaml
- name: Build
  run: next build

- name: Upload source maps to faultline
  env:
    FAULTLINE_DSN: ${{ secrets.FAULTLINE_DSN }}
    FAULTLINE_BASE_URL: ${{ secrets.FAULTLINE_BASE_URL }}
  run: npx faultline upload-sourcemaps --dir .next/static --release ${{ github.ref_name }}

- name: Deploy
  run: docker push myapp:${{ github.ref_name }}
```

**Docker build (multi-stage):**

```dockerfile
# Stage 1: Build + upload
FROM oven/bun:1 AS build
WORKDIR /app
COPY . .
RUN bun install && next build
ENV FAULTLINE_DSN=${FAULTLINE_DSN}
ENV FAULTLINE_BASE_URL=${FAULTLINE_BASE_URL}
RUN npx faultline upload-sourcemaps --dir .next/static --release ${RELEASE_VERSION}

# Stage 2: Production image (no source maps)
FROM oven/bun:1 AS prod
WORKDIR /app
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
CMD ["bun", "start"]
```

**Vercel / Netlify / other platforms:**

On platforms where you can't run arbitrary CLI commands during build, use a post-build script in `package.json`:

```json
{
  "scripts": {
    "build": "next build",
    "postbuild": "faultline upload-sourcemaps --dir .next/static --release $VERCEL_GIT_COMMIT_REF"
  }
}
```

Set `FAULTLINE_DSN` and `FAULTLINE_BASE_URL` as environment variables in your platform's dashboard.

---

## Framework Integration

### Next.js (App Router)

**Step 1: Initialize the SDK**

```ts
// app/faultline.ts — init once, import from anywhere
import { Faultline } from "@xyph3r/faultline"

Faultline.init({
  dsn: process.env.FAULTLINE_DSN!,
  baseUrl: process.env.FAULTLINE_BASE_URL,
  release: process.env.FAULTLINE_RELEASE // ties errors to this deploy
})

export { Faultline }
```

**Step 2: Wrap your API routes**

```ts
// app/api/checkout/route.ts
import { Faultline } from "@/app/faultline"

export const POST = Faultline.withCapture(async (req: Request) => {
  // thrown errors are captured and rethrown
})
```

**Step 3: Upload source maps after each build**

Add a `postbuild` script so source maps are uploaded every time you build:

```json
// package.json
{
  "scripts": {
    "build": "next build",
    "postbuild": "faultline upload-sourcemaps --dir .next/static --release $FAULTLINE_RELEASE"
  }
}
```

Set these environment variables in your CI/CD or `.env`:

```bash
FAULTLINE_DSN=LV0l2yhx7QtWCkoumWCw660e
FAULTLINE_BASE_URL=https://faultline.example.com
FAULTLINE_RELEASE=v2.3.1  # or $GIT_SHA, $VERCEL_GIT_COMMIT_SHA, etc.
```

**Step 4: (Optional) Client-side error boundary**

```ts
// app/global-error.tsx
"use client"
import { useEffect } from "react"
import { Faultline } from "@xyph3r/faultline"

export default function GlobalError({ error }: { error: Error }) {
  useEffect(() => {
    Faultline.capture(error)
  }, [error])
  return <html><body><h1>Something went wrong</h1></body></html>
}
```

**How the pieces fit together:**

```
next build           → produces .next/static/**/*.js.map
postbuild            → uploads .map files to faultline with --release v2.3.1
deploy               → ship to production
error occurs         → SDK sends error with release: "v2.3.1"
faultline dashboard  → resolves minified stack using the v2.3.1 source maps
                     → shows original source code in the error detail sheet
```

If you skip the postbuild step, faultline still tracks errors — the stack traces just show the minified file/line/col instead of the original source.
  return <html><body>Something went wrong</body></html>
}
```

### Express

```ts
import express from "express"
import { Faultline } from "@xyph3r/faultline"

const app = express()
Faultline.init()

app.use(Faultline.expressHandler())
app.listen(3000)
```

### Hono

```ts
import { Hono } from "hono"
import { Faultline } from "@xyph3r/faultline"

const app = new Hono()
Faultline.init()

app.onError((err, c) => {
  Faultline.capture(err, {
    route: c.req.path,
    userId: c.get("userId")
  })
  return c.json({ error: "Internal server error" }, 500)
})
```

### Plain Node.js

```ts
import { Faultline } from "@xyph3r/faultline"

Faultline.init()

process.on("uncaughtException", (err) => {
  Faultline.capture(err)
  process.exit(1)
})

process.on("unhandledRejection", (reason) => {
  Faultline.capture(reason)
})
```

---

## How It Works

```
your app → Faultline.capture(err)
          → normalize error (name, message, stack, file, line)
          → call beforeCapture hooks (filter/enrich)
          → POST /ingest/{dsn} (fire-and-forget)
          → call afterCapture hooks
```

The [faultline API](https://github.com/faisalahmedsifat/faultline) handles deduplication (fingerprint-based), persistence, and alerting. The SDK only normalizes and sends — it never blocks, and errors in the capture path itself are silently caught and surfaced via the `captureError` hook.

---

## Requirements

- Node 18+, Bun, Deno, or any runtime with `fetch` and `crypto`
- No polyfills needed
- Zero npm dependencies

---

## Comparison: Faultline SDK vs Sentry SDK

| | Faultline SDK | Sentry SDK |
|---|---|---|
| Dependencies | 0 | 40+ |
| Bundle size | < 3KB | 50KB+ |
| Runtimes | Node, Bun, Deno, Edge, browsers | Same |
| Self-hosted | Designed for faultline | Works with faultline via DSN |
| Features | Capture, hooks, source maps | Breadcrumbs, spans, profiling |

If you need breadcrumbs, performance tracing, or session replay, use any [Sentry SDK](https://docs.sentry.io/platforms/) pointed at your faultline instance. If you want a lightweight, zero-dependency error tracker, use the faultline SDK.

---

## License

MIT
