# faultline — Architecture

> Self-hosted error tracking. Production errors in one clean inbox.

---

## System Overview

```
your app → POST /ingest/:dsn → api (Bun + Hono) → Postgres
         → POST /api/{id}/store/ (Sentry)    → Redis (counters)
                                              → BullMQ queue
                                              → worker (Bun) → Slack/Discord/Email

dashboard (Next.js) → api (REST)
                    ↔ api (WebSocket) — real-time error notifications
```

| Service | Runtime | Purpose |
|---------|---------|---------|
| `api` | Bun + Hono 4 | Ingest errors, serve dashboard APIs, enqueue alerts, WebSocket server |
| `web` | Next.js 16 | Dashboard UI (no API routes, no DB access) |
| `worker` | Bun + BullMQ | Consume `alert.deliver` queue, send notifications |
| `sdk` | TypeScript | Zero-dep client library (`@xyph3r/faultline` npm package) |

### Ports

| Service | Internal (Docker) | External (host) |
|---------|-------------------|-----------------|
| web | 3000 | 3000 |
| api | 4000 | 4000 |
| worker (health) | 4001 | 4001 |
| db | 5432 | — |
| redis | 6379 | — |

### Communication

| From | To | Protocol |
|------|----|----------|
| web | api | HTTP (`http://api:4000`) |
| web | api | WebSocket (`ws://api:4000/ws/:projectId`) |
| api | db | TCP (postgres-js) |
| api | redis | TCP (ioredis, BullMQ producer) |
| worker | redis | TCP (BullMQ consumer) |
| SDK | api | HTTPS (`POST /ingest/:dsn`) |
| Sentry SDK | api | HTTPS (`POST /api/{id}/store/`) |

---

## Data Model

### Postgres

#### projects

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | `prj_` + 12 random chars |
| `name` | text NOT NULL | Display name |
| `dsn_key` | text UNIQUE NOT NULL | 24-char token, used in ingest URL |
| `created_at` | timestamptz | Default `now()` |

#### errors

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | `err_` + 12 random chars |
| `project_id` | text FK → projects.id | Cascade delete |
| `fingerprint` | text NOT NULL | `sha256(title:file:line)` |
| `title` | text NOT NULL | Error class name |
| `message` | text | Full error message |
| `stack` | text | Raw stack trace |
| `route` | text | e.g. `/api/workflows/deploy` |
| `file` | text | Source file path |
| `line` | integer | Line number |
| `col` | integer | Column number |
| `env` | text | `production`, `staging`, etc. |
| `level` | text | `error`, `warning`, `info` |
| `status` | text | `open`, `ignored`, `resolved` |
| `count` | integer | Incremented on duplicate |
| `user_count` | integer | Distinct affected users |
| `first_seen` | timestamptz | Set on first occurrence |
| `last_seen` | timestamptz | Updated on every occurrence |
| `metadata` | jsonb | Arbitrary key-value from SDK |
| `release` | text | Release version (for source map resolution) |
| `resolved_stack` | jsonb | Cached resolved stack frames |
| `users` | text[] | Affected user IDs |

Indexes: `(project_id, status)`, `(project_id, fingerprint)` UNIQUE, `(project_id, last_seen)`, `(project_id, env)`

#### alerts

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | `alr_` + 12 random chars |
| `project_id` | text FK → projects.id | Cascade delete |
| `channel` | text | `slack`, `email`, `discord` |
| `destination` | text | Webhook URL or email |
| `threshold` | integer | Errors per 15-min window |
| `enabled` | boolean | Default `true` |

Unique constraint: `(project_id, channel)` — max 3 rows per project.

### Redis

| Key | Type | TTL | Purpose |
|-----|------|-----|---------|
| `fl:counts:{project_id}:{YYYY-MM-DD}` | string (INCR) | 90 days | Daily error volume |
| `fl:rate:{project_id}` | string (INCR) | 15 min | Alert threshold counter |
| `fl:delivered:{jobId}:{targetId}` | string | 1 hour | Delivery idempotency |
| `fl:rl:{dsn_key}` | string (INCR) | 15 sec | Rate limit counter per DSN |

---

## Ingest Flow

```
POST /ingest/:dsn_key
```

1. Lookup project by `dsn_key` (O(1) indexed). Not found → `404`.
2. Compute `fingerprint = sha256(title:file:line)`. Fallback to `sha256(title:message[0:100])` if file/line missing.
3. **UPSERT** on `(project_id, fingerprint)`:
   - New: INSERT with `count=1`, `first_seen=now()`, `last_seen=now()`.
   - Existing: UPDATE `count+1`, `last_seen=now()`, append `userId` to `users[]` if new, increment `user_count`.
4. Call shared `handleAlertSideEffects(projectId, errorRecord)` from `lib/ingest.ts`:
   a. `INCR fl:counts:{project_id}:{today}` in Redis. Set TTL to 90 days on first increment.
   b. `INCR fl:rate:{project_id}` in Redis. Set TTL to 900s on first increment.
   c. Query enabled alerts where `threshold <= rateCount` (fire when rate meets or exceeds threshold).
   d. Enqueue `alert.deliver` BullMQ job if alerts match.
5. Return `202 Accepted`.

The ingest always returns `202`. Redis side effects and alert enqueuing are fire-and-forget — they never block the response. Only `title` is required; all other fields are optional. Both native (`POST /ingest/:dsnKey`) and Sentry-compatible (`POST /api/:projectId/store/`) ingest paths use the same `handleAlertSideEffects` shared function.

---

## Alert Delivery

**Job payload:**
```json
{
  "projectId": "prj_xxx",
  "alertTargets": [{ "id": "alr_xxx", "channel": "slack", "destination": "https://..." }],
  "errorId": "err_xxx",
  "errorTitle": "TypeError: ...",
  "count": 847,
  "env": "production",
  "route": "/api/checkout"
}
```

**Worker processing:**
1. For each alert target, check Redis `fl:delivered:{jobId}:{targetId}` for idempotency.
2. Dispatch to sender (Slack/Discord/Email).
3. Mark delivered in Redis with 1-hour TTL.
4. If any channel fails, throw → BullMQ retries the job (3 attempts, exponential backoff). Already-succeeded channels are skipped on retry.

BullMQ config: 3 attempts, 5s exponential backoff, keep last 1000 failed jobs for inspection.

---

## API Reference

### Public Ingest (no auth)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/ingest/:dsnKey` | Ingest error event (faultline native format) |
| `POST` | `/api/:projectId/store/` | Ingest error event (Sentry envelope format) |

### Health

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Health check |

### Projects (auth required if AUTH_TOKEN set)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/projects` | List all projects |
| `POST` | `/api/projects` | Create project |
| `GET` | `/api/projects/:id` | Get project (with DSN URL) |
| `PUT` | `/api/projects/:id/rotate-dsn` | Rotate DSN key |
| `DELETE` | `/api/projects/:id` | Delete project + cascade |
| `GET` | `/api/projects/:id/stats` | Error stats (30-day volume, totals, top 5) |

### Errors (auth required if AUTH_TOKEN set)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/errors?projectId=&status=&env=&search=&page=&pageSize=` | List errors (paginated, searchable) |
| `GET` | `/api/errors/:id` | Error detail (with resolved stack) |
| `PATCH` | `/api/errors/:id` | Update error status |

### Alerts (auth required if AUTH_TOKEN set)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/alerts?projectId=` | List alert configs |
| `PUT` | `/api/alerts` | Replace all alert configs (upsert) |

### Source Maps (auth required if AUTH_TOKEN set)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/projects/:id/sourcemaps` | Upload source map bundle |

### WebSocket

| Method | Path | Purpose |
|--------|------|---------|
| `WS` | `/ws/:projectId` | Real-time error notifications |

---

## WebSocket (Real-time Notifications)

The API server provides a WebSocket endpoint for real-time error notifications:

```
GET /ws/:projectId
```

### Connection Lifecycle

1. Client connects to `ws://api:4000/ws/:projectId`
2. Server registers the connection against the project
3. When a new error is ingested, `handleAlertSideEffects()` broadcasts a lightweight notification:
   ```json
   { "type": "new_error", "errorId": "err_xxx", "title": "TypeError: ...", "count": 1 }
   ```
4. On disconnect, the connection is automatically cleaned up
5. Connection tracking is in-memory per process — a single API process handles all WebSocket clients

The WebSocket manager (`lib/ws.ts`) tracks connections in a `Map<projectId, Set<WebSocket>>` and handles graceful cleanup on disconnect or send failure.

---

## Rate Limiting

Public ingest endpoints are protected by Redis-backed rate limiting:

| Endpoint | Key | Limit |
|----------|-----|-------|
| `POST /ingest/:dsnKey` | `fl:rl:{dsnKey}` | 100 req / 15s |
| `POST /api/:projectId/store/` | `fl:rl:{sentry_key}` | 100 req / 15s |

Uses a fixed-window counter via Redis Lua script (`INCR` + `EXPIRE`). When exceeded, returns `429 Too Many Requests` with `Retry-After` header. Fails open — if Redis is unreachable, the request is allowed through.

---

## SDK Design

The `faultline` npm package is zero-dependency, under 3KB, and uses native `fetch`.

```ts
import { Faultline } from "@xyph3r/faultline"

Faultline.init({
  dsn: process.env.FAULTLINE_DSN,         // project key
  baseUrl: process.env.FAULTLINE_BASE_URL  // server URL
})

Faultline.capture(err, { route, userId, metadata })
```

Key properties:
- **Fire-and-forget** — `capture()` returns immediately; errors in the capture path are silently caught.
- **Fingerprint computed server-side** — SDK sends raw error data; the API computes the dedup key.
- **Auto-detects env vars** — `FAULTLINE_DSN` and `FAULTLINE_BASE_URL` read from environment.
- **Observer hooks** — `Faultline.on("beforeCapture" | "afterCapture" | "captureError", fn)` for filtering, enrichment, logging.
- **Framework helpers** — `Faultline.withCapture(handler)` wraps any function; `Faultline.expressHandler()` for Express.
- **Works anywhere** — Node 18+, Bun, Deno, Edge Runtime.

---

## Environment Variables

### api

| Variable | Required | Default |
|----------|----------|---------|
| `DATABASE_URL` | Yes | — |
| `REDIS_URL` | Yes | — |
| `PORT` | No | `4000` |
| `APP_BASE_URL` | No | `http://localhost:3000` |
| `INGEST_BASE_URL` | No | Falls back to `APP_BASE_URL` |
| `CORS_ORIGIN` | No | `*` |

### web

| Variable | Required | Default |
|----------|----------|---------|
| `API_URL` | Yes | — |

### worker

| Variable | Required | Default |
|----------|----------|---------|
| `REDIS_URL` | Yes | — |
| `APP_BASE_URL` | No | `http://localhost:3000` |
| `SLACK_WEBHOOK_URL` | No | — |
| `DISCORD_WEBHOOK_URL` | No | — |
| `RESEND_API_KEY` | No | — |
| `RESEND_FROM` | No | — |

---

## Deployment

See [README.md](../README.md#production-deployment) for full deployment instructions. Quick reference:

```bash
docker compose up -d                                    # all services
cp .env.example .env && docker compose up -d             # with alert config
```

Production recommendations:
- Run a reverse proxy (Caddy, Nginx, Traefik) in front — see `infra/Caddyfile.example`
- Set `AUTH_TOKEN` to secure dashboard ↔ API communication
- Point `DATABASE_URL` and `REDIS_URL` to managed services for zero-ops deployments
- Use health check endpoints (`/health`) for orchestration readiness probes

---

## Sentry SDK Compatibility

faultline accepts events from any Sentry SDK. Configure your Sentry SDK with a faultline DSN:

```
https://{dsn_key}@{host}/1
```

The `{dsn_key}` is your faultline project's DSN key. The `/1` is a dummy project ID (Sentry requires a numeric project ID — we use `1`). faultline extracts the DSN key from the `X-Sentry-Auth` header.

Examples:

```python
# Python
import sentry_sdk
sentry_sdk.init(dsn="https://LV0l2yhx7QtWCkoumWCw660e@faultline.example.com/1")
```

```ts
// Node.js
import * as Sentry from "@sentry/node"
Sentry.init({ dsn: "https://LV0l2yhx7QtWCkoumWCw660e@faultline.example.com/1" })
```

```go
// Go
import "github.com/getsentry/sentry-go"
sentry.Init(sentry.ClientOptions{
    Dsn: "https://LV0l2yhx7QtWCkoumWCw660e@faultline.example.com/1",
})
```

The endpoint `POST /api/{project_id}/store/` accepts Sentry's envelope format and maps it to faultline's internal model. This gives faultline access to Sentry's entire SDK ecosystem — Python, Go, Ruby, PHP, Java, .NET, iOS, Android, and more — with zero additional maintenance burden.
