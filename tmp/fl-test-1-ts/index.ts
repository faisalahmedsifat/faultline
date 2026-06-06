import { Faultline } from "faultline"

// 1. Initialize once — reads FAULTLINE_DSN and FAULTLINE_BASE_URL from env
Faultline.init({ debug: true })

// 2. Attach observers
Faultline.on("beforeCapture", (payload) => {
  // Strip PII before sending
  const meta = payload.metadata as Record<string, unknown> | undefined
  if (meta?.password) delete meta.password
})

Faultline.on("afterCapture", () => {
  console.log("  ✓ Error sent to faultline")
})

Faultline.on("captureError", (payload) => {
  console.error("  ✗ Failed to send:", payload.error)
})

// 3. Capture from anywhere — no instance needed

try {
  throw new Error("Payment processing failed")
} catch (err) {
  await Faultline.capture(err, {
    route: "/api/payments",
    userId: "usr_demo",
    metadata: { paymentId: "pay_abc123", password: "should-be-stripped" }
  })
}

// 4. withCapture wraps any handler

const handler = Faultline.withCapture(async (input: { amount: number }) => {
  if (input.amount < 0) throw new Error("Amount must be positive")
  return { status: "ok", amount: input.amount }
})

await handler({ amount: 100 })
await handler({ amount: -5 }).catch(() => {})

// 5. Fire-and-forget
Faultline.capture(new Error("Non-critical warning"), {
  level: "warning",
  route: "/api/health"
})

// 6. on() returns unsubscribe
// const unsub = Faultline.on("afterCapture", () => {})
// unsub()  // stop listening

console.log("Done! Check http://localhost:3000/projects")
