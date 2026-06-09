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
https://{dsn_key}@your-instance.com/{project_id}
```

The `{project_id}` is your faultline project ID (e.g., `prj_abc123def`). Get it from your project card in the dashboard.

```python
# Python
import sentry_sdk
sentry_sdk.init(dsn="https://LV0l2yhx7QtWCkoumWCw660e@faultline.example.com/prj_abc123def")

try:
    1 / 0
except ZeroDivisionError:
    sentry_sdk.capture_exception()
```

```ts
// Node.js
import * as Sentry from "@sentry/node"
Sentry.init({ dsn: "https://LV0l2yhx7QtWCkoumWCw660e@faultline.example.com/prj_abc123def" })
Sentry.captureException(new Error("something broke"))
```

```go
// Go
import "github.com/getsentry/sentry-go"
sentry.Init(sentry.ClientOptions{
    Dsn: "https://LV0l2yhx7QtWCkoumWCw660e@faultline.example.com/prj_abc123def",
})
```

Works with Python, Go, Ruby, PHP, Java, .NET, iOS, Android — [all Sentry SDKs](https://docs.sentry.io/platforms/).

---

## Faultline SDK

For JavaScript/TypeScript, use the zero-dependency faultline SDK:

```bash
npm install @xyph3r/faultline
```

```ts
import { Faultline } from "@xyph3r/faultline"

// Reads FAULTLINE_DSN and FAULTLINE_BASE_URL from env
Faultline.init()

// Manual capture — fire and forget
Faultline.capture(err, {
  route: "/api/checkout",
  userId: currentUser.id,
  metadata: { cartId: cart.id }
})

// Wrap any handler — error is captured and rethrown
export const POST = Faultline.withCapture(async (req: Request) => {
  // any thrown error is automatically captured
})

// Strip PII before sending
Faultline.on("beforeCapture", (payload) => {
  delete payload.metadata?.password
})

// Express middleware
app.use(Faultline.expressHandler())
```

Zero dependencies. Under 3KB. Works in Node, Bun, Deno, and Edge runtimes.

### SDK Features

| Feature | Description |
|---------|-------------|
| `Faultline.init()` | Global singleton — reads env vars, call once at startup |
| `Faultline.capture()` | Fire-and-forget error capture with optional context (route, userId, metadata) |
| `Faultline.withCapture()` | Wrap any async function — captures and rethrows errors |
| `Faultline.expressHandler()` | Express error-handling middleware |
| `new Faultline()` | Isolated instances for multi-project use |
| Observer hooks | `beforeCapture`, `afterCapture`, `captureError` — filter, enrich, log |
| CLI | `npx faultline upload-sourcemaps --dir <path> --release <version>` |

### SDK Quick Links

- [Full SDK documentation](packages/sdk/README.md) — complete API reference and framework guides
- [Changelog](packages/sdk/CHANGELOG.md) — version history
- [Example project](examples/node-faultline/) — runnable demo
- [Release guide](packages/sdk/RELEASING.md) — how to publish new versions

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

- **Drop-in Sentry replacement** — use any Sentry SDK by changing the DSN. Works with 20+ language SDKs.
- **Error inbox** — fingerprint-based deduplication. Same error, same location? Merged, not duplicated.
- **Real-time updates** — WebSocket push notifications when new errors arrive. Live error counter in the dashboard.
- **Error trend charts** — 30-day volume charts on the project dashboard. See error spikes at a glance.
- **Full-text search** — search errors by title and message. Combine with status and environment filters.
- **Pagination** — page through large error sets with total count, page navigation.
- **Stats API** — programmatic access to daily error counts, totals by status, and top errors.
- **Multi-project** — one DSN per project. Track errors across all your services.
- **Alerts** — Slack, Discord, and Email. Threshold-based, per project, per channel.
- **Rate limiting** — built-in Redis-backed rate limiting on public ingest endpoints (100 req/15s).
- **Source map support** — upload source maps via CLI. Resolve minified stacks back to original source.
- **Self-hosted** — your data never leaves your infrastructure. GDPR-friendly by default.
- **Zero-dep SDK** — safe to add to any project. No dependency conflicts. Under 3KB.

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
                    ↔ api (WebSocket) — real-time error notifications
```

| Service | Runtime | Purpose |
|---------|---------|---------|
| `api` | Bun + Hono 4 | Ingest errors, serve dashboard APIs, enqueue alerts, WebSocket server |
| `web` | Next.js 16 | Dashboard UI (no API routes, no DB access) |
| `worker` | Bun + BullMQ | Consume `alert.deliver` queue, send Slack/Discord/Email notifications |
| `sdk` | TypeScript | Zero-dep client library (`@xyph3r/faultline` npm package) |

---

## Production Deployment

### Docker Compose (single server)

```bash
git clone https://github.com/faisalahmedsifat/faultline.git
cd faultline

# Optional: configure alert channels
cp .env.example .env
# Edit .env with your Slack/Discord/Resend credentials

docker compose up -d
```

This starts five containers: `web` (dashboard on :3000), `api` (ingest + API on :4000), `worker` (alert delivery), `db` (Postgres 16), `redis` (Redis 7). Data is persisted in Docker volumes.

### With a Reverse Proxy

For production, place a reverse proxy in front. See `infra/Caddyfile.example`:

```
faultline.yourdomain.com {
    reverse_proxy /ingest/* api:4000
    reverse_proxy /api/*    api:4000
    reverse_proxy /*        web:3000
}
```

Works with Caddy, Nginx, Traefik, or any reverse proxy. Route `/ingest/*` and `/api/*` to the API service, everything else to the dashboard.

### Environment Variables

| Variable | Service | Required | Purpose |
|----------|---------|----------|---------|
| `DATABASE_URL` | api | Yes | Postgres connection string |
| `REDIS_URL` | api, worker | Yes | Redis connection string |
| `API_URL` | web | Yes | API endpoint for the dashboard |
| `AUTH_TOKEN` | api, web | No | Shared bearer token for dashboard ↔ API auth |
| `INGEST_BASE_URL` | api | No | Public URL for ingest (default: `APP_BASE_URL` or `http://localhost:4000`) |
| `CORS_ORIGIN` | api | No | CORS origin (default: `*`) |
| `APP_BASE_URL` | api, worker | No | Base URL for link generation |
| `SLACK_WEBHOOK_URL` | worker | No | Slack webhook for alerts |
| `DISCORD_WEBHOOK_URL` | worker | No | Discord webhook for alerts |
| `RESEND_API_KEY` | worker | No | Resend API key for email alerts |
| `RESEND_FROM` | worker | No | From address for email alerts |

### Using External Databases

Point `DATABASE_URL` and `REDIS_URL` to managed services (Supabase, Neon, Upstash, etc.) for zero-ops deployments. The API auto-runs migrations on startup.

### Securing the API

For production deployments, set an `AUTH_TOKEN` shared secret on both the API and web services. All dashboard-to-API requests will be authenticated with a Bearer token:

```yaml
# compose.yml overrides
services:
  api:
    environment:
      AUTH_TOKEN: ${AUTH_TOKEN}
  web:
    environment:
      AUTH_TOKEN: ${AUTH_TOKEN}
```

```env
# .env
AUTH_TOKEN=your-secure-random-token
```

Without `AUTH_TOKEN`, the API endpoints are open. Always set this in production.

---

## Open Source

faultline is MIT-licensed. You can use it, modify it, and host it yourself—forever.

**Why self-host?**
- **No per-event pricing** — error volume doesn't affect your bill
- **No per-seat pricing** — unlimited team members
- **Data ownership** — error data never leaves your infrastructure
- **GDPR-friendly** — no third-party data processing
- **No vendor lock-in** — MIT license means you always own your setup

**What you need:**
- A server (or VPS) with Docker installed
- Optionally, a domain name and reverse proxy (Caddy, Nginx, Traefik)

**Community:**
- Report issues on [GitHub Issues](https://github.com/faisalahmedsifat/faultline/issues)
- Submit PRs on [GitHub](https://github.com/faisalahmedsifat/faultline)
- Follow existing code conventions (see [Contributing](#contributing))

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

## Contributing

faultline is MIT-licensed open source. Contributions are welcome.

### Project Structure

```
apps/
  api/        Bun + Hono — ingest API, dashboard API, WebSocket server
  web/        Next.js 16 — dashboard UI (Tailwind CSS, shadcn/ui)
  worker/     Bun + BullMQ — background alert delivery
packages/
  sdk/        TypeScript — zero-dep client library (@xyph3r/faultline)
docs/         Architecture docs and API reference
examples/     Runnable demo projects (Node, Python)
infra/        Reverse proxy configs
```

### Workflow

1. Start infrastructure: `docker compose up -d db redis`
2. Run migrations: `bun run --cwd apps/api db:migrate`
3. Start all services: `bun run dev`
4. Run tests: `bun run test`
5. Typecheck: `bun run typecheck`

### Before Submitting a PR

- `bun run typecheck` must pass for all services
- `bun run test` must pass — add tests for new functionality
- Keep the SDK zero-dependency — never add npm dependencies to `packages/sdk`

### Code Conventions

- TypeScript throughout, strict mode
- Follow existing patterns — look at similar routes/components for reference
- No new dependencies without strong justification

Issues and PRs are tracked on [GitHub](https://github.com/faisalahmedsifat/faultline).

---

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — system design, data model, API reference, SDK design
- [SDK API Reference](packages/sdk/README.md) — full API docs, configuration, framework guides
- [SDK Changelog](packages/sdk/CHANGELOG.md) — version history and release notes
- [Release Guide](packages/sdk/RELEASING.md) — how to publish new SDK versions
- [Examples](examples/) — runnable demo projects (Node + faultline SDK, Node + Sentry SDK, Python + Sentry SDK)

---

## License

MIT © faultline
