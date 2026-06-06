# faultline

**Production errors, not production bills.**

faultline is a self-hosted error tracker for teams who are tired of paying per-event, per-seat, per-gigabyte. Deploy in one command. Your data, your server, your rules.

---

## Quickstart

```bash
git clone https://github.com/your-org/faultline.git
cd faultline
docker compose up -d
```

Open `http://localhost:3000` → create a project → copy your DSN.

---

## SDK

```bash
npm install faultline
# or: bun add faultline
```

```typescript
import { Faultline } from "faultline"

// Reads FAULTLINE_DSN and FAULTLINE_BASE_URL from env
Faultline.init()

// Manual capture
try {
  await riskyThing()
} catch (err) {
  Faultline.capture(err, { route: "/api/checkout" })
}

// Wrap a handler (error captured + rethrown)
export const POST = Faultline.withCapture(async (req: Request) => {
  // ...
})
```

The SDK is **zero-dependency**, under 3KB, and works in Node, Bun, Deno, and Edge runtimes.

---

## Features

- **Error inbox** — fingerprint-based deduplication keeps noise down
- **Alerts** — Slack, Discord, and Email via configurable thresholds
- **Multi-project** — one DSN per project, one dashboard
- **Self-hosted** — your data never leaves your infrastructure
- **Zero-dep SDK** — safe to add to any project

---

## Local Development

```bash
# Start Postgres and Redis
docker compose up -d db redis

# Create your local .env files
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env
cp apps/web/.env.example apps/web/.env

# Run migrations
bun run --cwd apps/api db:migrate

# Start all services
bun run dev
```

| Service | URL |
|---------|-----|
| Dashboard | `http://localhost:3000` |
| API | `http://localhost:4000` |

---

## Architecture

```
SDK → POST /ingest/:dsn → api (Bun + Hono) → Postgres
                           api → Redis (counters) → BullMQ
                                                   → worker (Bun + BullMQ) → Slack/Discord/Email
web (Next.js 14) → api (dashboard data)
```

- **`apps/api`** — Bun + Hono: ingest endpoint, CRUD APIs, queue producer
- **`apps/web`** — Next.js 14: dashboard UI
- **`apps/worker`** — Bun + BullMQ: alert delivery
- **`packages/sdk`** — `faultline` npm package

Full docs: [docs/SYSTEM.md](docs/SYSTEM.md)

---

## License

MIT © faultline
