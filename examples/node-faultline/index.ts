import { Faultline } from "@xyph3r/faultline"

// ── Init ──
// In production, reads FAULTLINE_DSN and FAULTLINE_BASE_URL from env.
// Pass explicit options below for local development.

Faultline.init({
  dsn: "LV0l2yhx7QtWCkoumWCw660e",
  baseUrl: "http://localhost:4000",
  env: "development",
  debug: true
})

// ── Observer hooks ──

// Strip PII before sending
Faultline.on("beforeCapture", (payload) => {
  // Redact sensitive fields
  delete payload.metadata?.password
  delete payload.metadata?.creditCard

  // Redact patterns from messages
  if (payload.message) {
    payload.message = payload.message.replace(/secret-\w+/g, "[REDACTED]")
  }
})

Faultline.on("afterCapture", (payload) => {
  console.log(`  ✓ Captured: ${payload.title} at ${payload.route}`)
})

Faultline.on("captureError", ({ error, ...data }) => {
  console.error(`  ✗ Failed to send: ${error}`)
})

// ── 1. Manual capture with full context ──

try {
  JSON.parse("{invalid")
} catch (err) {
  await Faultline.capture(err, {
    route: "/api/parse",
    userId: "usr_demo",
    metadata: {
      operation: "jsonParse",
      password: "should-not-leak",  // stripped by beforeCapture hook
      creditCard: "4111-1111-1111-1111" // stripped by beforeCapture hook
    }
  })
}

// ── 2. withCapture wraps any handler ──

const processPayment = Faultline.withCapture(
  async (amount: number) => {
    if (amount <= 0) throw new Error("Invalid payment amount")
    return { status: "charged", amount }
  },
  (_error, args) => ({
    route: "/api/payments",
    userId: "usr_demo",
    metadata: { amount: args[0] }
  })
)

await processPayment(49.99)
await processPayment(-10).catch(() => {}) // captured + rethrown

// ── 3. Warning-level capture ──

Faultline.capture(new Error("Background job timed out"), {
  level: "warning",
  route: "/workers/cleanup",
  metadata: { jobId: "job_abc" }
})

// ── 4. Capture from string (non-Error throw) ──

Faultline.capture("something went wrong", {
  route: "/api/legacy",
  level: "error"
})

// ── 5. Multi-project instance (for reporting to different projects) ──

const secondaryFaultline = new Faultline({
  dsn: "dsk_secondary_xxxxxxxx",
  baseUrl: "http://localhost:4000",
  debug: false
})

secondaryFaultline.capture(new Error("Analytics pipeline error"), {
  route: "/analytics/export"
})

// ── Done ──

// Allow time for fire-and-forget requests to complete
await new Promise((r) => setTimeout(r, 500))

console.log("\nDone! Check http://localhost:3000/projects")
console.log("Run: docker compose up -d")
