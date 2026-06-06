# faultline — System Design Document

> "Production errors in one clean inbox."
> Version: 0.1 (MVP)
> Status: Pre-build. All decisions final unless explicitly revised.

---

## 1. Purpose & Scope

faultline is a self-hostable, dead-simple production error tracking service for bootstrapped SaaS teams. It is not an observability platform. It is not a Sentry clone. It is an error inbox — scoped, opinionated, and fast to deploy.

This document is the authoritative technical reference for the MVP build. It covers system architecture, service responsibilities, data flow, storage design, API surface, SDK contract, and infrastructure. All subsequent documents (PRD, API Contract, Schema, SDK Spec) derive from this one.

**In scope for MVP:**
- Error ingestion via DSN URL
- Fingerprint-based deduplication
- Multi-project support with per-project DSN keys
- Dashboard: error inbox, stack trace, context, affected users, resolve/ignore/reopen
- Alert delivery: Slack, email, Discord via threshold-based BullMQ jobs
- Self-hosted Docker Compose deployment
- TypeScript/JS SDK (`faultline` npm package)

**Explicitly out of scope for MVP:**
- Source map upload / stack trace unminification
- Performance monitoring, tracing, spans
- Session replay
- Python SDK (v2)
- User accounts / team auth (dashboard is open, trust reverse proxy)
- Cloud-hosted SaaS tier (v2)
- Mobile SDKs

---

## 2. Architecture Overview

faultline runs as three application services plus two infrastructure services, all orchestrated via Docker Compose.

```
┌─────────────────────────────────────────────────────────────────┐
│                        docker-compose                           │
│                                                                 │
│  ┌──────────────────┐      ┌──────────────────────────────────┐ │
│  │   web            │      │   api                            │ │
│  │   Next.js 14     │      │   Bun + Hono                     │ │
│  │                  │      │                                  │ │
│  │  Dashboard UI    │ ───▶ │  POST /ingest/:dsn_key           │ │
│  │  (no API routes) │      │  GET  /api/projects              │ │
│  │                  │      │  GET  /api/errors                │ │
│  │  port 3000       │      │  GET  /api/errors/:id            │ │
│  └──────────────────┘      │  PATCH /api/errors/:id           │ │
│                             │  POST /api/projects              │ │
│                             │  DELETE /api/projects/:id        │ │
│                             │  PUT /api/projects/:id/rotate-dsn│ │
│                             │  GET  /api/alerts                │ │
│                             │  PUT  /api/alerts                │ │
│                             │                                  │ │
│                             │  port 4000                       │ │
│                             └──────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │   worker                                                 │   │
│  │   Bun + BullMQ                                           │   │
│  │                                                          │   │
│  │   Consumes: alert.deliver queue                          │   │
│  │   Sends:    Slack webhook / Resend API / Discord webhook │   │
│  │   No HTTP server                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────┐   ┌──────────────────────────────────┐  │
│  │   postgres:16      │   │   redis:7                        │  │
│  │   Primary store    │   │   Real-time counters + job queue  │  │
│  └────────────────────┘   └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Public surface (single port via reverse proxy)

Users run a reverse proxy (Caddy, Nginx, Cloudflare Tunnel) in front. Recommended Caddy config ships in the repo as `infra/Caddyfile.example`:

```
faultline.yourdomain.com {
    reverse_proxy /ingest/* api:4000
    reverse_proxy /api/*    api:4000
    reverse_proxy /*        web:3000
}
```

The `api` service handles both ingest and all data API routes. The `web` service is purely a UI shell that calls `api` over the internal Docker network.

---

## 3. Service Specifications

### 3.1 `api` — Bun + Hono

**Responsibilities:**
- Receive and process ingest payloads (`POST /ingest/:dsn_key`)
- Serve all data API routes for the dashboard
- Fingerprint computation and error deduplication
- Write to Postgres via Drizzle ORM
- Increment Redis counters
- Enqueue alert jobs into BullMQ when threshold is crossed

**Runtime:** Bun 1.x
**Framework:** Hono (handles routing, middleware, request parsing)
**ORM:** Drizzle ORM (postgres-js driver)
**Queue producer:** BullMQ (ioredis)

**Environment variables:**
```
DATABASE_URL=postgres://faultline:faultline@db:5432/faultline
REDIS_URL=redis://redis:6379
PORT=4000
```

**Key constraints:**
- Ingest endpoint always returns `202 Accepted`. Never block the caller.
- All ingest processing is synchronous within the request (no background jobs for the ingest path itself — it's fast enough). Only alert threshold checks enqueue async work.
- DSN key lookup must be O(1) — indexed column on `projects.dsn_key`.

---

### 3.2 `web` — Next.js 14

**Responsibilities:**
- Render the dashboard UI (App Router, client components)
- Call `api` service over internal Docker network
- No database access. No business logic. No API routes.

**Runtime:** Node.js (Next.js requirement)
**Internal API base URL:** `http://api:4000` (set via `NEXT_PUBLIC_API_URL` or server-side env)

**Environment variables:**
```
API_URL=http://api:4000
PORT=3000
```

**Notes:**
- All data fetching goes through `api`. `web` is a pure consumer.
- Dashboard is unauthenticated. Users protect it via reverse proxy (Cloudflare Access, Nginx basic auth, Tailscale, etc.).

---

### 3.3 `worker` — Bun + BullMQ

**Responsibilities:**
- Process jobs from the `alert.deliver` BullMQ queue
- Send Slack webhook, Discord webhook, managed email API requests
- Retry failed deliveries (BullMQ handles backoff)
- No HTTP server. No inbound traffic.

**Runtime:** Bun 1.x
**Queue consumer:** BullMQ (ioredis)

**Environment variables:**
```
REDIS_URL=redis://redis:6379
SLACK_WEBHOOK_URL=
DISCORD_WEBHOOK_URL=
RESEND_API_KEY=
RESEND_FROM=errors@yourdomain.com
```

**Failure model:** If the worker crashes, alert jobs persist in Redis. On restart, BullMQ resumes processing. Error ingestion is unaffected — `api` and `worker` are fully decoupled.

---

## 4. Data Model

### 4.1 Postgres Schema (Drizzle)

#### `projects`

| Column | Type | Notes |
|---|---|---|
| `id` | `text` PK | `prj_` + 12 random chars (nanoid) |
| `name` | `text NOT NULL` | Display name |
| `dsn_key` | `text UNIQUE NOT NULL` | Random 24-char token. This is the ingest URL suffix. |
| `created_at` | `timestamptz` | Default `now()` |

Index: `dsn_key` (unique, used on every ingest request)

#### `errors`

| Column | Type | Notes |
|---|---|---|
| `id` | `text` PK | `err_` + 12 random chars |
| `project_id` | `text` FK → `projects.id` | Cascade delete |
| `fingerprint` | `text NOT NULL` | `sha256(title + file + line)` |
| `title` | `text NOT NULL` | Error class name e.g. `TypeError` |
| `message` | `text` | Full error message |
| `stack` | `text` | Raw stack trace string |
| `route` | `text` | e.g. `/api/workflows/deploy` |
| `file` | `text` | e.g. `src/executor/GhostEngine.ts` |
| `line` | `integer` | |
| `col` | `integer` | |
| `env` | `text` | `production` \| `staging` \| any string |
| `level` | `text` | `error` \| `warning` \| `info` |
| `status` | `text` | `open` \| `ignored` \| `resolved`. Default `open` |
| `count` | `integer` | Incremented on duplicate fingerprint. Default `1` |
| `user_count` | `integer` | Distinct affected users. Default `0` |
| `first_seen` | `timestamptz` | Set on first occurrence only |
| `last_seen` | `timestamptz` | Updated on every occurrence |
| `metadata` | `jsonb` | Arbitrary key-value from SDK caller |
| `users` | `text[]` | Appended on each occurrence (deduplicated in app layer) |

Indexes:
- `(project_id, status)` — inbox list query
- `(project_id, fingerprint)` — dedup upsert
- `(project_id, last_seen DESC)` — default sort
- `(project_id, env)` — environment filter

#### `alerts`

| Column | Type | Notes |
|---|---|---|
| `id` | `text` PK | `alr_` + 12 random chars |
| `project_id` | `text` FK → `projects.id` | Cascade delete |
| `channel` | `text` | `slack` \| `email` \| `discord` |
| `destination` | `text` | Webhook URL or recipient email address |
| `threshold` | `integer` | Errors per 15-min window before alert fires. Default `10` |
| `enabled` | `boolean` | Default `true` |

One row per channel per project. Max 3 rows per project (one per channel type).

---

### 4.2 Redis Key Schema

Only two key patterns. Redis stays thin.

| Key | Type | TTL | Purpose |
|---|---|---|---|
| `fl:counts:{project_id}:{YYYY-MM-DD}` | `INCR` (string) | 90 days | Daily error volume for sparklines |
| `fl:rate:{project_id}` | `INCR` (string) | 900s (15 min) | Rolling alert threshold counter |

**Alert threshold logic (in `api` ingest handler):**
```
count = INCR fl:rate:{project_id}
if count == 1: EXPIRE fl:rate:{project_id} 900
if count == threshold:
    enqueue alert.deliver job for all enabled alerts on this project
```

The `==` check (not `>=`) ensures exactly one alert fires per 15-min window, not one per error after threshold.

---

## 5. Ingest Flow

This is the hot path. It must be fast and non-blocking.

```
POST /ingest/:dsn_key
{
  "title":    "TypeError",
  "message":  "Cannot read properties of undefined (reading 'workflowId')",
  "stack":    "TypeError: ...\n    at GhostEngine.deploy ...",
  "route":    "/api/workflows/deploy",
  "file":     "src/executor/GhostEngine.ts",
  "line":     142,
  "col":      18,
  "env":      "production",
  "level":    "error",
  "userId":   "usr_8fK2mNp",
  "metadata": { "workflowId": "wf_abc123" }
}
```

**Steps:**

1. Look up project by `dsn_key`. If not found → `404`. If found → continue.
2. Compute `fingerprint = sha256(title + ":" + file + ":" + line)`.
3. **UPSERT** on `(project_id, fingerprint)`:
   - **New error:** `INSERT` full row. `count = 1`, `first_seen = now()`, `last_seen = now()`.
   - **Existing error:** `UPDATE count = count + 1`, `last_seen = now()`. If `userId` provided and not already in `users[]`, append it and increment `user_count`.
4. `INCR fl:counts:{project_id}:{today}` in Redis.
5. `INCR fl:rate:{project_id}` in Redis (set TTL of 900s on first increment).
6. If rate count equals project alert threshold → enqueue `alert.deliver` job.
7. Return `202 Accepted`.

**Payload validation:** All fields except `title` are optional. If `file` or `line` are missing, fingerprint falls back to `sha256(title + ":" + message.slice(0, 100))`.

---

## 6. Alert Delivery Flow

**Job payload (enqueued by `api`):**
```json
{
  "projectId": "prj_abc123",
  "errorId":   "err_xyz789",
  "errorTitle": "TypeError: Cannot read properties of undefined",
  "count":     847,
  "env":       "production",
  "route":     "/api/workflows/deploy"
}
```

**Worker processing:**
1. Fetch all enabled `alerts` rows for `projectId`.
2. For each alert, dispatch to the appropriate sender:
   - `slack` → POST to `destination` (webhook URL) with formatted payload
   - `discord` → POST to `destination` (webhook URL) with embed payload
   - `email` → POST to Resend API using `destination` as the recipient
3. BullMQ retry config: 3 attempts, exponential backoff starting at 5s.

**Email provider model:**
- Email stays a first-class alert channel in `alerts`
- `alerts.destination` stores the recipient email address per project
- The worker uses a single managed provider account for outbound delivery
- MVP target provider: Resend over HTTPS API
- Keep the sender abstraction narrow so another provider can replace Resend later without changing alert routing

**Slack payload shape:**
```json
{
  "text": "🔴 *TypeError* — 847 occurrences on production",
  "blocks": [
    { "type": "section", "text": { "type": "mrkdwn", "text": "*TypeError: Cannot read properties of undefined*\nRoute: `/api/workflows/deploy`" }},
    { "type": "actions", "elements": [{ "type": "button", "text": { "type": "plain_text", "text": "View in faultline" }, "url": "http://your-instance/errors/err_xyz789" }]}
  ]
}
```

---

## 7. DSN Key Design

The DSN key is the only authentication mechanism for error ingestion.

**Format:** `http(s)://your-domain/ingest/{dsn_key}`

**DSN key properties:**
- 24 random URL-safe characters (nanoid alphabet)
- Stored in plain text in `projects.dsn_key` (it is a capability token, not a password)
- Indexed for O(1) lookup on every ingest request

**DSN rotation:**
- `PUT /api/projects/:id/rotate-dsn` generates a new `dsn_key` atomically
- Old key is invalidated immediately
- Dashboard shows the new DSN and warns the user to update their SDK config
- No grace period — old key is dead on rotation

**Security model:**
- The DSN URL is the secret. Treat it like an API key.
- Dashboard has no auth — users are responsible for protecting it via reverse proxy.
- Ingest endpoint is public (by design) but keyed — unknown DSN keys return `404`, not `401`, to avoid confirming the existence of a project.

---

## 8. SDK Design (`faultline` npm package)

### Installation
```bash
npm install faultline
# or
bun add faultline
```

### Initialisation
```typescript
import { Faultline } from 'faultline'

export const fl = new Faultline({
  dsn: process.env.FAULTLINE_DSN,  // required
  env: process.env.NODE_ENV,       // optional, default 'production'
  enabled: true,                   // optional, set false to disable (e.g. in test)
})
```

### Manual capture
```typescript
try {
  await riskyThing()
} catch (err) {
  await fl.capture(err, {
    userId:   currentUser.id,
    route:    '/api/workflows/deploy',
    metadata: { workflowId }
  })
}
```

### Next.js / Express middleware wrapper
```typescript
// Next.js App Router
export const POST = fl.withCapture(async (req: Request) => {
  // any thrown error is automatically captured + rethrown
})

// Express
app.use(fl.expressHandler())  // catches unhandled errors
```

### SDK internals
- Zero runtime dependencies
- Uses native `fetch` — works in Node 18+, Bun, Edge Runtime, Deno
- Fire-and-forget by default: `capture()` does not await the network call unless `await` is used explicitly
- Bundle size target: < 3KB minified + gzipped
- Fingerprint is computed server-side (not in the SDK)
- SDK never throws — all errors are caught internally and logged to `console.warn` if `debug: true`

---

## 9. Monorepo Structure

```
faultline/
├── apps/
│   ├── web/                        # Next.js 14 dashboard
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx            # redirects to /projects or default project
│   │   │   ├── projects/
│   │   │   │   └── [projectId]/
│   │   │   │       ├── page.tsx    # error inbox
│   │   │   │       └── errors/
│   │   │   │           └── [errorId]/
│   │   │   │               └── page.tsx  # error detail
│   │   │   └── settings/
│   │   │       └── page.tsx        # project management, alert config
│   │   ├── components/
│   │   ├── lib/
│   │   │   └── api.ts              # typed fetch wrappers for api service
│   │   └── package.json
│   │
│   ├── api/                        # Bun + Hono backend
│   │   ├── src/
│   │   │   ├── index.ts            # Hono app entry
│   │   │   ├── routes/
│   │   │   │   ├── ingest.ts       # POST /ingest/:dsn_key
│   │   │   │   ├── projects.ts
│   │   │   │   ├── errors.ts
│   │   │   │   └── alerts.ts
│   │   │   ├── db/
│   │   │   │   ├── schema.ts       # Drizzle schema
│   │   │   │   ├── client.ts       # postgres-js + drizzle client
│   │   │   │   └── migrations/
│   │   │   ├── lib/
│   │   │   │   ├── fingerprint.ts  # sha256 computation
│   │   │   │   ├── redis.ts        # ioredis client
│   │   │   │   └── queue.ts        # BullMQ producer
│   │   │   └── middleware/
│   │   │       └── cors.ts
│   │   └── package.json
│   │
│   └── worker/                     # Bun + BullMQ alert worker
│       ├── src/
│       │   ├── index.ts            # worker entry, BullMQ consumer
│       │   └── senders/
│       │       ├── slack.ts
│       │       ├── discord.ts
│       │       └── email.ts       # Resend-backed sender
│       └── package.json
│
├── packages/
│   └── sdk/                        # faultline npm package
│       ├── src/
│       │   ├── index.ts            # exports Faultline class
│       │   ├── client.ts           # core capture logic
│       │   ├── middleware.ts       # withCapture, expressHandler
│       │   └── types.ts
│       ├── tsconfig.json
│       └── package.json
│
├── infra/
│   └── Caddyfile.example
├── compose.yml                     # production Docker Compose
├── compose.dev.yml                 # mounts source, hot reload
├── turbo.json
├── package.json                    # root workspace
└── README.md
```

---

## 10. Docker Compose

### Production (`compose.yml`)

```yaml
services:
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "3000:3000"
    environment:
      API_URL: http://api:4000
    depends_on:
      - api

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgres://faultline:faultline@db:5432/faultline
      REDIS_URL: redis://redis:6379
      PORT: 4000
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started

  worker:
    build:
      context: .
      dockerfile: apps/worker/Dockerfile
    environment:
      REDIS_URL: redis://redis:6379
      SLACK_WEBHOOK_URL: ${SLACK_WEBHOOK_URL:-}
      DISCORD_WEBHOOK_URL: ${DISCORD_WEBHOOK_URL:-}
      RESEND_API_KEY: ${RESEND_API_KEY:-}
      RESEND_FROM: ${RESEND_FROM:-}
    depends_on:
      - redis

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: faultline
      POSTGRES_USER: faultline
      POSTGRES_PASSWORD: faultline
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U faultline"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data
    command: redis-server --appendonly yes

volumes:
  pgdata:
  redisdata:
```

### User deployment (three commands)

```bash
curl -O https://faultline.dev/compose.yml
cp .env.example .env   # fill in optional alert config
docker compose up -d
```

Dashboard at `http://localhost:3000`. Create a project, copy the DSN, install the SDK.

---

## 11. Inter-Service Communication

| From | To | Protocol | Notes |
|---|---|---|---|
| `web` | `api` | HTTP (internal Docker network) | `http://api:4000` |
| `api` | `db` | TCP (postgres-js) | `http://db:5432` |
| `api` | `redis` | TCP (ioredis) | `http://redis:6379` |
| `api` | `redis` | TCP (BullMQ producer) | Enqueue `alert.deliver` jobs |
| `worker` | `redis` | TCP (BullMQ consumer) | Consume `alert.deliver` jobs |
| `worker` | external | HTTPS | Slack/Discord webhooks, Resend API |
| SDK | `api` | HTTPS (public) | `POST /ingest/:dsn_key` |

`web` never touches `db` or `redis` directly. `worker` never touches `db` directly.

---

## 12. Error Fingerprinting

Fingerprint is the dedup key. Two occurrences of the same error in the same location produce the same fingerprint and merge into one row.

**Algorithm:**

```typescript
import { createHash } from 'crypto'

function fingerprint(payload: IngestPayload): string {
  const { title, file, line, message } = payload

  if (file && line) {
    return createHash('sha256')
      .update(`${title}:${file}:${line}`)
      .digest('hex')
      .slice(0, 32)
  }

  // Fallback: no file/line info (e.g. edge runtime, minified)
  return createHash('sha256')
    .update(`${title}:${message?.slice(0, 100) ?? ''}`)
    .digest('hex')
    .slice(0, 32)
}
```

**Upsert SQL (Drizzle):**

```typescript
await db
  .insert(errors)
  .values({ id, projectId, fingerprint, title, message, ...rest, count: 1 })
  .onConflictDoUpdate({
    target: [errors.projectId, errors.fingerprint],
    set: {
      count:     sql`${errors.count} + 1`,
      lastSeen:  sql`now()`,
      users:     userId
        ? sql`array_append(
                CASE WHEN ${sql.raw(`'${userId}'`)} = ANY(${errors.users})
                     THEN ${errors.users}
                     ELSE array_append(${errors.users}, ${userId})
                END,
                NULL
              )[1:array_length(...)]`
        : errors.users,
      userCount: userId
        ? sql`(SELECT COUNT(DISTINCT u) FROM unnest(${errors.users}) u)`
        : errors.userCount,
    }
  })
```

> Note: The agent should implement user dedup with a clean array-distinct pattern in the final implementation. The above is illustrative.

---

## 13. Build Order for Agent

Execute in strict sequence. Each step has defined inputs and outputs.

| Step | Service | Task | Output |
|---|---|---|---|
| 1 | `api` | Drizzle schema + `generate` + `migrate` | `/apps/api/src/db/schema.ts`, migration files |
| 2 | `api` | `POST /ingest/:dsn_key` route | Working ingest endpoint, tested with `curl` |
| 3 | `api` | Projects CRUD routes | `GET/POST /api/projects`, `PUT /rotate-dsn`, `DELETE` |
| 4 | `api` | Errors routes | `GET /api/errors`, `GET /api/errors/:id`, `PATCH` status |
| 5 | `api` | Alerts routes | `GET/PUT /api/alerts` |
| 6 | `api` | Redis counters | Daily counts + rate window wired in ingest handler |
| 7 | `api` | BullMQ producer | Alert threshold check + job enqueue in ingest handler |
| 8 | `worker` | Alert worker | Slack + Discord + Resend email sender, BullMQ consumer |
| 9 | `packages/sdk` | SDK core | `capture()`, `withCapture()`, zero-dep build |
| 10 | `web` | Wire dashboard to `api` | Replace mock data with real API calls |
| 11 | infra | Dockerfiles + compose | All three services build and run |
| 12 | infra | DB migrations on startup | `api` runs `drizzle-kit migrate` on boot |
| 13 | docs | README quickstart | Three-command deploy, SDK install, first error |

---

## 14. Environment Variable Reference

### `api`

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | Postgres connection string |
| `REDIS_URL` | Yes | — | Redis connection string |
| `PORT` | No | `4000` | HTTP port |

### `web`

| Variable | Required | Default | Description |
|---|---|---|---|
| `API_URL` | Yes | — | Internal URL of `api` service |
| `PORT` | No | `3000` | HTTP port |

### `worker`

| Variable | Required | Default | Description |
|---|---|---|---|
| `REDIS_URL` | Yes | — | Redis connection string |
| `SLACK_WEBHOOK_URL` | No | — | Slack incoming webhook |
| `DISCORD_WEBHOOK_URL` | No | — | Discord webhook URL |
| `RESEND_API_KEY` | No | — | API key for managed email delivery |
| `RESEND_FROM` | No | — | Sender address used for alert emails |

---

## 15. Key Design Decisions & Rationale

| Decision | Choice | Rationale |
|---|---|---|
| Backend runtime | Bun + Hono | Fast startup, native TypeScript, lightweight — fits a self-hosted tool perfectly |
| ORM | Drizzle | Type-safe, thin, migration-first, works natively with Bun |
| Queue | BullMQ | Battle-tested, retry/backoff built-in, Redis already in stack |
| Auth | None (dashboard), DSN (ingest) | Self-hosted users own their network. One fewer thing to configure. |
| Multi-project | DSN per project | Scales to teams with multiple services. Standard pattern (Sentry, Logtail). |
| Dedup | Fingerprint upsert | Keeps inbox clean. No noise from repeated errors. |
| Ingest response | Always 202 | Application code must never slow down for error tracking. |
| Dashboard auth | Trust reverse proxy | Not our problem to solve. Cloudflare Access, Tailscale, Nginx basic auth all work. |
| Storage | Postgres + Redis | Postgres for durable error data. Redis only for ephemeral counters and queue. |
| SDK deps | Zero | Must be safe to add to any project without dependency conflicts. |

---
