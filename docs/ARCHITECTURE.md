# faultline — Architecture

> Self-hosted error tracking. Production errors in one clean inbox.

---

## System Overview

```
your app → POST /ingest/:dsn → api (Bun + Hono) → Postgres
                                api → Redis (counters) → BullMQ queue
                                                        → worker (Bun) → Slack/Discord/Email

dashboard (Next.js) → api (REST)
```

| Service | Runtime | Purpose |
|---------|---------|---------|
| `api` | Bun + Hono | Ingest errors, serve dashboard APIs, enqueue alerts |
| `web` | Next.js 14 | Dashboard UI (no API routes, no DB access) |
| `worker` | Bun + BullMQ | Consume `alert.deliver` queue, send notifications |
| `sdk` | TypeScript | Zero-dep client library (`faultline` npm package) |

### Ports

| Service | Internal (Docker) | External (host) |
|---------|-------------------|-----------------|
| web | 3000 | 3000 |
| api | 4000 | 4000 |
| db | 5432 | — |
| redis | 6379 | — |

### Communication

| From | To | Protocol |
|------|----|----------|
| web | api | HTTP (`http://api:4000`) |
| api | db | TCP (postgres-js) |
| api | redis | TCP (ioredis, BullMQ producer) |
| worker | redis | TCP (BullMQ consumer) |
| SDK | api | HTTPS (`POST /ingest/:dsn`) |

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
4. `INCR fl:counts:{project_id}:{today}` in Redis.
5. `INCR fl:rate:{project_id}` in Redis. Set TTL to 900s on first increment.
6. If `rate_count == threshold` for any enabled alert → enqueue `alert.deliver` job.
7. Return `202 Accepted`.

The ingest always returns `202`. Redis side effects and alert enqueuing are fire-and-forget — they never block the response. Only `title` is required; all other fields are optional.

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

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Health check |
| `POST` | `/ingest/:dsnKey` | Ingest error event |
| `GET` | `/api/projects` | List projects |
| `POST` | `/api/projects` | Create project |
| `PUT` | `/api/projects/:id/rotate-dsn` | Rotate DSN key |
| `DELETE` | `/api/projects/:id` | Delete project + cascade |
| `GET` | `/api/errors?projectId=&status=&env=&page=&pageSize=` | List errors (paginated) |
| `GET` | `/api/errors/:id` | Error detail |
| `PATCH` | `/api/errors/:id` | Update error status |
| `GET` | `/api/alerts?projectId=` | List alert configs |
| `PUT` | `/api/alerts` | Replace all alert configs |

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

Production:
```bash
docker compose up -d
```

With alert config:
```bash
cp .env.example .env
# Edit .env with your Slack/Discord/Resend credentials
docker compose up -d
```

A reverse proxy (Caddy, Nginx, Cloudflare Tunnel) is recommended in production. See `infra/Caddyfile.example` for a Caddy config that routes `/ingest/*` and `/api/*` to the API service and everything else to the web dashboard.
