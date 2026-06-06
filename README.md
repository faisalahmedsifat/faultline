# faultline

**Production errors, not production bills.**

faultline is a self-hosted error tracker. Drop-in Sentry replacement. Deploy in one command. Your data stays on your server. No per-event pricing, no per-seat pricing, no surprises.

---

## Quickstart

```bash
git clone https://github.com/faisalahmedsifat/faultline.git
cd faultline
docker compose up -d
```

Open `http://localhost:3000`. Create a project. Copy your DSN.

---

## Use Any Sentry SDK

faultline accepts Sentry's ingest format. Use any of Sentry's 20+ language SDKs by changing the DSN. Your DSN format:

```
https://{dsn_key}@your-instance.com/1
```

```python
# Python
import sentry_sdk
sentry_sdk.init(dsn="https://LV0l2yhx7QtWCkoumWCw660e@faultline.example.com/1")

try:
    1 / 0
except ZeroDivisionError:
    sentry_sdk.capture_exception()
```

```ts
// Node.js
import * as Sentry from "@sentry/node"
Sentry.init({ dsn: "https://LV0l2yhx7QtWCkoumWCw660e@faultline.example.com/1" })
Sentry.captureException(new Error("something broke"))
```

```go
// Go
import "github.com/getsentry/sentry-go"
sentry.Init(sentry.ClientOptions{
    Dsn: "https://LV0l2yhx7QtWCkoumWCw660e@faultline.example.com/1",
})
```

Works with Python, Go, Ruby, PHP, Java, .NET, iOS, Android — [all Sentry SDKs](https://docs.sentry.io/platforms/).

---

## Faultline SDK

For JavaScript/TypeScript, faultline has its own zero-dependency SDK:

```bash
npm install @xyph3r/faultline
```

```ts
import { Faultline } from "@xyph3r/faultline"

// Reads FAULTLINE_DSN and FAULTLINE_BASE_URL from env
Faultline.init()

// Manual capture
Faultline.capture(err, { route: "/api/checkout", userId: currentUser.id })

// Wrap a handler — error captured and rethrown
export const POST = Faultline.withCapture(async (req: Request) => {
  // any thrown error is automatically captured
})

// Observer hooks
Faultline.on("beforeCapture", (payload) => {
  delete payload.metadata?.password // strip PII
})
```

Zero dependencies. Under 3KB. Works in Node, Bun, Deno, and Edge runtimes.

---

## Raw HTTP

Any language works — just POST JSON:

```python
import requests
requests.post("https://faultline.example.com/ingest/<dsn>",
  json={"title": "ValueError", "message": "something broke"})
```

```bash
curl -X POST https://faultline.example.com/ingest/<dsn> \
  -H 'content-type: application/json' \
  -d '{"title":"TypeError","message":"cannot read properties of undefined"}'
```

Only `title` is required. All other fields are optional.

---

## Features

- **Drop-in Sentry replacement** — use any Sentry SDK by changing the DSN
- **Error inbox** — fingerprint-based deduplication. Same error, same location? Merged, not duplicated.
- **Multi-project** — one DSN per project. Track errors across all your services.
- **Alerts** — Slack, Discord, and Email. Threshold-based, per project, per channel.
- **Self-hosted** — your data never leaves your infrastructure. GDPR-friendly by default.
- **Zero-dep SDK** — safe to add to any project. No dependency conflicts.

---

## Configure Alerts

Create a `.env` file with your alert credentials:

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
RESEND_API_KEY=re_...
RESEND_FROM=errors@example.com
```

Then restart: `docker compose up -d`

---

## Architecture

```
SDK / Sentry SDK → POST /ingest/:dsn or /api/{dsn}/store → api (Bun + Hono) → Postgres
                                                              api → Redis → BullMQ
                                                                         → worker (Bun) → Slack / Discord / Email

dashboard (Next.js) → api (REST)
```

---

## Local Development

```bash
docker compose up -d db redis
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env
cp apps/web/.env.example apps/web/.env
bun install
bun run --cwd apps/api db:migrate
bun run dev
```

| Service | URL |
|---------|-----|
| Dashboard | `http://localhost:3000` |
| API | `http://localhost:4000` |

See [examples/](examples/) for runnable demo projects.

---

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — system design, data model, API reference, SDK design

---

## License

MIT © faultline
