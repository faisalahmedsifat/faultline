import * as Sentry from "@sentry/node"

// Standard Sentry SDK pointing at faultline
Sentry.init({
  dsn: "https://LV0l2yhx7QtWCkoumWCw660e@localhost:4000/1",
  environment: "production"
})

// ── 1. Capture an exception ──

try {
  // @ts-expect-error intentional error
  const result = undefined.property
  console.log(result)
} catch (err) {
  Sentry.captureException(err, {
    tags: { feature: "checkout" },
    extra: { cartId: "cart_xyz" },
    user: { id: "usr_sentry", email: "demo@example.com" }
  })
  console.log("  ✓ Exception captured via Sentry SDK")
}

// ── 2. Capture a message ──

Sentry.captureMessage("Rate limit approaching", { level: "warning" })

// ── 3. Set context and throw ──

Sentry.setUser({ id: "usr_admin", email: "admin@example.com" })
Sentry.setTag("deploy", "v2.3.1")

try {
  throw new Error("Database connection pool exhausted")
} catch (err) {
  Sentry.captureException(err)
}

await Sentry.close(2000)
console.log("Done! Check http://localhost:3000/projects")
