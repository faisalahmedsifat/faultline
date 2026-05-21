# faultline MVP PR Plan

This plan groups the backlog into reviewable PRs. Each PR should leave the repo in a working state and avoid mixing infrastructure, product logic, and UI unless there is a direct dependency.

## PR-001 Monorepo bootstrap

Scope:
- Complete `BL-001`
- Complete `BL-002`

Why first:
- Nothing else should be built before package boundaries, scripts, and local infra exist

Files likely touched:
- Root workspace files
- `apps/api/*`
- `apps/web/*`
- `apps/worker/*`
- `packages/sdk/*`
- Docker and compose files

Review focus:
- Workspace ergonomics
- Script naming consistency
- Local startup path

Exit criteria:
- Fresh clone can install dependencies and start baseline services

## PR-002 API foundation and schema

Scope:
- Complete `BL-003`
- Complete `BL-004`
- Complete `BL-005`
- Resolve `DEC-002`

Why now:
- Ingest, dashboard APIs, and worker all depend on shared infra modules

Review focus:
- Schema correctness
- Migration safety
- Queue and Redis module boundaries

Exit criteria:
- `api` starts with validated env
- Database schema and queue producer are ready for feature work

## PR-003 Ingest endpoint and dedup core

Scope:
- Complete `BL-006`
- Complete `BL-007`
- Complete `BL-008`
- Complete `BL-009`
- Resolve `DEC-005`

Review focus:
- Hot-path correctness
- Upsert behavior
- Redis threshold logic
- Failure semantics around `202 Accepted`

Exit criteria:
- Ingest can accept errors, deduplicate them, and enqueue alert jobs at threshold

## PR-004 Projects and alerts APIs

Scope:
- Complete `BL-010`
- Complete `BL-013`
- Resolve `DEC-001`
- Resolve `DEC-004`

Why separate from errors:
- These routes define configuration and identity surfaces the UI will depend on early

Review focus:
- DSN lifecycle
- Alert config modeling
- Response contract stability

Exit criteria:
- Project management and alert settings are fully API-backed

## PR-005 Errors read/update APIs

Scope:
- Complete `BL-011`
- Complete `BL-012`

Review focus:
- Query design and indexes
- Status mutation semantics
- Response shape suitability for inbox/detail pages

Exit criteria:
- Dashboard can fetch inbox and detail data and update status

## PR-006 Worker delivery pipeline

Scope:
- Complete `BL-014`
- Complete `BL-015`
- Complete `BL-016`
- Complete `BL-017`
- Complete `BL-018`

Review focus:
- Sender abstraction quality
- Retry behavior
- Resend integration boundaries
- Partial-failure handling

Exit criteria:
- Worker can consume alert jobs and deliver Slack, Discord, and email notifications

## PR-007 SDK MVP

Scope:
- Complete `BL-019`
- Complete `BL-020`
- Complete `BL-021`

Review focus:
- Public API ergonomics
- Runtime compatibility
- Failure swallowing and debug behavior

Exit criteria:
- SDK can be consumed by an example app and send valid ingest payloads

## PR-008 Web shell and projects flow

Scope:
- Complete `BL-022`
- Complete `BL-023`

Review focus:
- Separation between `web` and `api`
- Initial dashboard UX
- DSN presentation and project lifecycle

Exit criteria:
- User can create and manage projects from the UI

## PR-009 Error inbox and detail UI

Scope:
- Complete `BL-024`
- Complete `BL-025`

Review focus:
- Usability of the inbox
- Handling of large stack traces and metadata
- Status update UX

Exit criteria:
- Core dashboard value proposition is visible and usable

## PR-010 Alert settings UI

Scope:
- Complete `BL-026`

Review focus:
- Channel-specific validation UX
- Clear explanation of email delivery via managed provider

Exit criteria:
- User can configure all alert channels without touching the database

## PR-011 Production boot and verification

Scope:
- Complete `BL-027`
- Complete `BL-028`
- Complete `BL-029`
- Complete `BL-030`
- Resolve `DEC-003`

Review focus:
- Deployability
- Operational clarity
- Critical-path verification coverage

Exit criteria:
- MVP can be deployed from docs and exercised end to end

## Recommended branch and merge policy

- Keep each PR mergeable on its own; avoid long-lived mega-branches
- Merge in order; later PRs should rebase on the latest merged branch
- Do not start the web UI before PR-004 and PR-005 land; otherwise UI work will guess API shapes
- Do not start SDK polish before PR-003 lands; the ingest contract should stop moving first

## Suggested issue labels

- `area:api`
- `area:web`
- `area:worker`
- `area:sdk`
- `area:infra`
- `type:feature`
- `type:chore`
- `type:decision`
- `priority:p0`
- `priority:p1`

## Minimum PR template

Each PR description should answer:

1. What user-visible capability or system capability does this add?
2. What contracts or schema changed?
3. What are the main risks or follow-up items?
4. How was it verified locally?
