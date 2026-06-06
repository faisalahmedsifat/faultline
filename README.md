# faultline

**Production errors, not production bills.**

faultline is a self-hosted error tracker. Deploy in one command. Your data stays on your server. No per-event pricing, no per-seat pricing, no surprises.

---

## Quickstart

```bash
git clone https://github.com/faisalahmedsifat/faultline.git
cd faultline
docker compose up -d
```

Open `http://localhost:3000`. Create a project. Copy your DSN.

---

## SDK

```bash
npm install faultline
```

```ts
import { Faultline } from "faultline"

// Reads FAULTLINE_DSN and FAULTLINE_BASE_URL from env
Faultline.init()

// Manual capture with full context
Faultline.capture(err, {
  route: "/api/checkout",
  userId: currentUser.id,
  metadata: { orderId }
})

// Wrap a handler — error captured and rethrown
export const POST = Faultline.withCapture(async (req: Request) => {
  // any thrown error is automatically captured
})
```

The SDK is zero-dependency, under 3KB, and works in Node, Bun, Deno, and Edge runtimes.

Works from any language — it's just HTTP:

```python
import requests
requests.post("https://faultline.example.com/ingest/<dsn>",
  json={"title": "ValueError", "message": "something broke"})
```

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

Alerts fire when an error hits the configured threshold within a 15-minute window. Configure thresholds per project in the dashboard under Alert Settings.

---

## Architecture

```
your app → POST /ingest/:dsn → api (Bun + Hono) → Postgres
                                api → Redis → BullMQ queue
                                             → worker (Bun) → Slack / Discord / Email

dashboard (Next.js) → api (REST)
```

| Service | Runtime | Purpose |
|---------|---------|---------|
| `api` | Bun + Hono | Ingest endpoint, CRUD APIs, queue producer |
| `web` | Next.js 14 | Dashboard UI |
| `worker` | Bun + BullMQ | Alert delivery |
| `sdk` | TypeScript | Client library for error capture |

---

## Features

- **Error inbox** — fingerprint-based deduplication. Same error at the same location? Merged, not duplicated.
- **Multi-project** — one DSN per project. Track errors across all your services.
- **Alerts** — Slack, Discord, and Email. Threshold-based, per project, per channel.
- **Self-hosted** — your data never leaves your infrastructure. GDPR-friendly by default.
- **Zero-dep SDK** — safe to add to any project. No dependency conflicts.
- **DSN-based ingest** — no user accounts, no OAuth, no SAML. Just works.

---

## Local Development

```bash
# Start infrastructure
docker compose up -d db redis

# Create env files from templates
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env
cp apps/web/.env.example apps/web/.env

# Install dependencies
bun install

# Run migrations
bun run --cwd apps/api db:migrate

# Start all services in dev mode
bun run dev
```

| Service | URL |
|---------|-----|
| Dashboard | `http://localhost:3000` |
| API | `http://localhost:4000` |

Seed test data:

```bash
curl -X POST http://localhost:4000/ingest/<dsn> \
  -H 'content-type: application/json' \
  -d '{"title":"TypeError","message":"cannot read properties of undefined","env":"production","route":"/api/test","file":"src/app.ts","line":42}'
```

---

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — system design, data model, API reference, SDK design

---

## License

MIT © faultline
