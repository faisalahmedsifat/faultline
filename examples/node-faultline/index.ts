import { Faultline } from "@xyph3r/faultline"

Faultline.init({
  dsn: "LV0l2yhx7QtWCkoumWCw660e",
  baseUrl: "http://localhost:4000",
  debug: true
})

// ── Observer hooks ──

Faultline.on("afterCapture", () => {
  console.log("  ✓ Sent to faultline")
})

// ── 1. Manual capture with full context ──

try {
  JSON.parse("{invalid")
} catch (err) {
  await Faultline.capture(err, {
    route: "/api/parse",
    userId: "usr_demo",
    metadata: { operation: "jsonParse", password: "should-not-leak" }
  })
}

// ── 2. withCapture wraps any handler ──

const processPayment = Faultline.withCapture(
  async (amount: number) => {
    if (amount <= 0) throw new Error("Invalid payment amount")
    return { status: "charged", amount }
  },
  (_error, args) => ({ route: "/api/payments", metadata: { amount: args[0] } })
)

await processPayment(49.99)
await processPayment(-10).catch(() => {}) // captured + rethrown

// ── 3. Fire-and-forget ──

Faultline.capture(new Error("Background job timed out"), {
  level: "warning",
  route: "/workers/cleanup",
  metadata: { jobId: "job_abc" }
})

console.log("Done! Check http://localhost:3000/projects")
