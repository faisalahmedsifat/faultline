# faultline MVP Backlog

This backlog turns `SYSTEM.md` into implementation work for a single developer. It is ordered by dependency, not by convenience.

## Milestone 0: Repo Bootstrap

### BL-001 Workspace scaffold
- Create the monorepo structure described in `SYSTEM.md`
- Add root `package.json`, workspace config, `turbo.json`, shared `tsconfig` baseline
- Create `apps/api`, `apps/web`, `apps/worker`, and `packages/sdk`
- Add placeholder entrypoints so each package can typecheck independently

Acceptance criteria:
- Workspace install succeeds
- Each package has a runnable placeholder entrypoint
- Basic `lint`, `typecheck`, and `build` scripts exist at root and package level

### BL-002 Local developer environment
- Add `.env.example`
- Add `compose.yml`, `compose.dev.yml`, `apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/worker/Dockerfile`
- Add `infra/Caddyfile.example`
- Decide how local development runs: direct processes, compose, or both

Acceptance criteria:
- Postgres and Redis boot locally
- `api`, `web`, and `worker` can start against local infra
- Required environment variables are documented once, not repeated ad hoc

## Milestone 1: API Foundation

### BL-003 API app bootstrap
- Create Bun + Hono app entry
- Add request logging, health endpoint, and CORS middleware
- Add environment parsing and startup validation
- Add shared error response format for dashboard APIs

Acceptance criteria:
- `api` starts on `PORT`
- CORS behavior is explicit and testable
- Invalid startup configuration fails fast

### BL-004 Database layer and schema
- Add Drizzle config and migration workflow
- Implement schema for `projects`, `errors`, and `alerts`
- Add indexes and constraints from `SYSTEM.md`
- Add db client and migration command

Acceptance criteria:
- Migrations create the expected schema
- Unique and foreign-key constraints match the spec
- Schema names and columns are stable enough for the rest of the build

### BL-005 Redis and queue foundation
- Add Redis client module
- Add BullMQ queue producer module
- Define the `alert.deliver` job payload type
- Add connection lifecycle handling

Acceptance criteria:
- `api` can connect to Redis
- A typed alert job can be enqueued successfully
- Queue naming and payload structure are fixed for downstream work

## Milestone 2: Ingest Path

### BL-006 Ingest payload contract
- Define request validation for `POST /ingest/:dsn_key`
- Normalize optional fields and defaults
- Document max payload expectations if needed

Acceptance criteria:
- Invalid payloads fail predictably
- Minimal valid payload requires only `title`
- Request contract is captured in code, not just docs

### BL-007 Fingerprinting utility
- Implement sha256 fingerprint helper
- Support file/line primary path and message fallback path
- Add unit tests around collision-resistant behavior for the intended inputs

Acceptance criteria:
- Same error location yields same fingerprint
- Missing file/line uses fallback path
- Function is isolated and reusable in ingest tests

### BL-008 Ingest persistence and dedup
- Implement project lookup by `dsn_key`
- Implement insert/update flow on `(project_id, fingerprint)`
- Handle `count`, `first_seen`, `last_seen`, `users`, and `user_count`
- Return `202 Accepted` on success

Acceptance criteria:
- Unknown DSN returns `404`
- Duplicate errors merge into one row with incremented `count`
- Distinct users are deduplicated correctly
- Endpoint never waits on worker delivery

### BL-009 Redis counters and threshold trigger
- Increment daily volume counter
- Increment rolling 15-minute counter with first-write TTL
- Load enabled alerts for the project threshold decision
- Enqueue one alert job exactly when threshold is crossed

Acceptance criteria:
- Daily and rolling keys are written as specified
- Exactly one alert job fires per 15-minute window at threshold
- Ingest remains successful even if alert enqueue fails after persistence

## Milestone 3: Project and Error Management APIs

### BL-010 Projects CRUD
- Implement `GET /api/projects`
- Implement `POST /api/projects`
- Implement `DELETE /api/projects/:id`
- Implement `PUT /api/projects/:id/rotate-dsn`

Acceptance criteria:
- Project creation returns DSN details needed by the dashboard
- DSN rotation is atomic
- Delete cascades cleanly through related data

### BL-011 Errors listing and detail
- Implement `GET /api/errors`
- Implement `GET /api/errors/:id`
- Support filtering by project, status, and env
- Support default sort by `last_seen DESC`

Acceptance criteria:
- Inbox query is index-friendly
- Error detail returns full stack, metadata, and user info
- List endpoints return stable shapes for the web app

### BL-012 Error status mutation
- Implement `PATCH /api/errors/:id`
- Support `open`, `ignored`, and `resolved`
- Validate transitions and payloads

Acceptance criteria:
- Status updates persist correctly
- Invalid statuses are rejected
- Endpoint shape is simple enough for optimistic UI

### BL-013 Alerts configuration API
- Implement `GET /api/alerts`
- Implement `PUT /api/alerts`
- Enforce one row per `(project_id, channel)`
- Validate channel-specific destination format at a basic level

Acceptance criteria:
- Slack and Discord accept webhook URLs
- Email accepts recipient address
- Threshold and enabled flags round-trip correctly

## Milestone 4: Worker and Alert Delivery

### BL-014 Worker bootstrap
- Create BullMQ consumer entrypoint
- Add queue concurrency, retry, and backoff configuration
- Define failure logging and dead-letter handling strategy if needed

Acceptance criteria:
- Worker starts without HTTP server
- Worker consumes `alert.deliver` jobs from Redis
- Retry policy matches `SYSTEM.md`

### BL-015 Slack sender
- Implement Slack webhook sender
- Format payload from job data
- Handle non-2xx responses as retryable failures

Acceptance criteria:
- Slack sender is isolated behind a sender interface
- Payload includes title, count, env, route, and dashboard link

### BL-016 Discord sender
- Implement Discord webhook sender
- Format embed payload from job data
- Handle non-2xx responses as retryable failures

Acceptance criteria:
- Discord sender is isolated behind the same sender interface shape
- Payload communicates the same core information as Slack

### BL-017 Resend email sender
- Implement email sender using `RESEND_API_KEY` and `RESEND_FROM`
- Map `alerts.destination` to the recipient address
- Create plain-text and minimal HTML alert bodies

Acceptance criteria:
- Email sends through Resend HTTPS API
- Missing Resend configuration fails clearly
- Provider integration is isolated so it can be swapped later

### BL-018 Worker alert orchestration
- On each job, load enabled alerts for the project
- Dispatch by channel
- Decide partial-failure behavior when one channel fails and others succeed

Acceptance criteria:
- All enabled channels attempt delivery for a job
- Failures are observable and retried appropriately
- No alert channel logic leaks back into the API service

## Milestone 5: SDK

### BL-019 SDK core client
- Implement `Faultline` constructor and config parsing
- Implement `capture(err, context?)`
- Use native `fetch`
- Make SDK failures non-throwing

Acceptance criteria:
- SDK can send valid ingest payloads
- `debug: true` surfaces internal failures via `console.warn`
- SDK is safe in Node and Bun at minimum

### BL-020 Framework helpers
- Implement `withCapture`
- Implement `expressHandler`
- Preserve error semantics after capture

Acceptance criteria:
- Wrapped handlers rethrow after capture
- Express middleware captures unhandled errors without swallowing them

### BL-021 SDK packaging
- Add package metadata, exports, and build
- Keep runtime dependency count at zero
- Add a minimal usage test or fixture

Acceptance criteria:
- Package can be built and packed
- Public API matches `SYSTEM.md`
- Bundle remains intentionally small

## Milestone 6: Web Dashboard

### BL-022 Web app bootstrap
- Create Next.js app shell
- Add layout, navigation, and loading/error states
- Add API client wrappers around `api`

Acceptance criteria:
- `web` starts and can talk to `api`
- No direct database or Redis access exists in `web`

### BL-023 Projects flow
- Build project list and create flow
- Show DSN and rotate action
- Add delete flow with confirmation

Acceptance criteria:
- New user can create first project from the UI
- DSN rotation result is visible immediately

### BL-024 Error inbox view
- Build project error list page
- Add status and env filters
- Show count, title, route, last seen, and status

Acceptance criteria:
- Inbox is usable with real API data
- Empty states and loading states are handled

### BL-025 Error detail view
- Build error detail page
- Show stack trace, metadata, user info, and timeline fields
- Add status mutation controls

Acceptance criteria:
- Detail page renders all core error fields
- Status updates reflect immediately in the UI

### BL-026 Alert settings UI
- Build per-project alert configuration UI
- Support Slack, Discord, and email destinations
- Expose threshold and enabled settings

Acceptance criteria:
- User can configure all three channel types from the dashboard
- Email settings align with the Resend-backed worker model

## Milestone 7: Production Readiness

### BL-027 Startup migrations and service boot flow
- Ensure migrations run on boot for `api`
- Ensure compose dependency order is adequate
- Decide failure behavior if db is unavailable

Acceptance criteria:
- Fresh deploy can initialize schema automatically
- Restart behavior is deterministic

### BL-028 Observability for the product itself
- Add structured logs for `api` and `worker`
- Log queue failures, delivery failures, and invalid ingest attempts
- Keep logs high-signal and grep-friendly

Acceptance criteria:
- Core failure modes are diagnosable from container logs
- Sensitive values such as DSNs and API keys are not logged raw

### BL-029 End-to-end verification
- Add smoke path: create project, ingest error, view dashboard, trigger alert
- Verify Slack, Discord, and email paths
- Verify DSN rotation and dedup behavior

Acceptance criteria:
- MVP critical path is exercised end to end
- Regressions in the main flow are catchable before release

### BL-030 Docs and quickstart
- Write README
- Document local dev, production deploy, SDK usage, and environment variables
- Include Resend setup instructions for email alerts

Acceptance criteria:
- A new user can run the system from docs alone
- Docs match the actual implementation rather than the intended design

## Cross-cutting decisions to settle early

### DEC-001 API response contracts
- Define stable JSON shapes before building `web`

### DEC-002 Validation library choice
- Choose one approach for request/env validation and use it consistently

### DEC-003 Test strategy
- Decide the minimum bar for unit, integration, and smoke coverage

### DEC-004 Dashboard URL source for alerts
- Decide where the worker gets the instance base URL used in Slack/Discord/email links

### DEC-005 Queue payload shape
- Decide whether alert jobs carry all display data or only identifiers plus a lookup step
