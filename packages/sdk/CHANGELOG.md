# Changelog

All notable changes to the `@xyph3r/faultline` SDK.

---

## [0.1.2] — 2026-06-07

### Documentation
- Comprehensive SDK README with full API reference, configuration table, framework integration guides (Next.js, Express, Hono, plain Node.js), and source map upload workflow with CI/CD examples.
- Added CHANGELOG.md tracking all versions.
- Added RELEASING.md with step-by-step publish checklist.
- Fixed package name references in web dashboard (`@faultline/sdk` → `@xyph3r/faultline`).

### Tooling
- Added `prepublishOnly`, `release`, and `release:dry` scripts to package.json.
- Improved SDK example in `examples/node-faultline/` with PII stripping, multi-project instances, and warning-level captures.

---

## [0.1.1] — 2026-06-06

### Added
- **Release tracking** — `release` option in `Faultline.init()` and `CaptureContext`. Auto-reads `FAULTLINE_RELEASE` env var. Enables source map resolution per release.
- **CLI: `faultline upload-sourcemaps`** — upload `.map` files for a release. Usage: `npx faultline upload-sourcemaps --dir <path> --release <version>`.
- Custom `fetch` option — pass a custom `fetch` implementation (for polyfills or instrumented fetch).

### Changed
- `baseUrl` now defaults to `https://faultline.dev` instead of throwing when not set.
- `env` auto-detects `NODE_ENV` when not passed explicitly.

---

## [0.1.0] — 2026-06-06

### Initial Release

- **`Faultline.init(options?)`** — singleton initialization with DSN, base URL, env, debug, enabled.
- **`Faultline.capture(error, context?)`** — fire-and-forget error capture. Normalizes `Error` objects, strings, and arbitrary values.
- **`Faultline.withCapture(handler, getContext?)`** — wraps async functions, captures and rethrows errors. Auto-infers route from `Request.url`.
- **`Faultline.expressHandler()`** — Express error-handling middleware.
- **Observer hooks** — `beforeCapture`, `afterCapture`, `captureError` events via `Faultline.on()`/`Faultline.off()`.
- **Non-singleton mode** — `new Faultline(options)` for multi-project use from the same process.
- **TypeScript** — full type definitions: `FaultlineOptions`, `CaptureContext`, `IngestPayload`, `FaultlineEvents`.
- **Zero dependencies** — under 3KB.
- **Runtimes** — Node 18+, Bun, Deno, Edge Runtime, browsers (anywhere with `fetch` and `crypto`).
- **Environment variables** — reads `FAULTLINE_DSN` and `FAULTLINE_BASE_URL` from process environment.
- **Stack trace parsing** — extracts file, line, and column from error stacks for fingerprinting.

---

## Upcoming

- Browser CDN bundle
- Source map resolution via CLI without needing direct API access
- Rate limiting and batching
- Breadcrumbs support
