# faultline

> **Self-hosted error inbox for people who would rather `docker compose up` than pay for Sentry.**

faultline tracks production errors from your apps, deduplicates them by fingerprint, and alerts you via Slack, Discord, or Email — all running on your own infrastructure.

---

## Quickstart (Production)

```bash
curl -O https://raw.githubusercontent.com/.../compose.yml
cp .env.example .env
docker compose up -d
```

Open `http://localhost:3000`, create a project, copy the DSN, and configure the SDK.

---

## SDK Usage

```bash
npm install faultline
```

```typescript
import { Faultline } from "faultline"

const fl = new Faultline({
  dsn: process.env.FAULTLINE_DSN
})

// Manual capture
try {
  await riskyThing()
} catch (err) {
  await fl.capture(err, { route: "/api/example" })
}

// Wrap a handler
export const POST = fl.withCapture(async (req: Request) => {
  // thrown errors are captured and rethrown
})
```

---

## Local Development

```bash
# Start Postgres and Redis
docker compose -f docker-compose.yml up -d

# Run migrations (or the API will auto-migrate on boot)
bun run --cwd apps/api db:migrate

# Start all services
bun run dev
```

| Service | URL |
|---------|-----|
| Dashboard | `http://localhost:3000` |
| API | `http://localhost:4000` |
| Worker | background — consumes `alert.deliver` queue |

---

## Architecture

```
SDK → POST /ingest/:dsn → api (Bun + Hono) → Postgres (errors, projects, alerts)
                           api → Redis (rate counters) → BullMQ queue
                                                        → worker (Bun + BullMQ) → Slack / Discord / Email
web (Next.js) → api (dashboard data)
```

- **`apps/api`** — Bun + Hono: ingest, CRUD APIs, queue producer
- **`apps/web`** — Next.js 14: dashboard UI
- **`apps/worker`** — Bun + BullMQ: alert delivery
- **`packages/sdk`** — `faultline` npm package: zero-dep error capture

Full documentation: [docs/SYSTEM.md](docs/SYSTEM.md)
