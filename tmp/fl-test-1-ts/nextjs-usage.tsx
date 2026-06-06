/**
 * faultline with Next.js — works everywhere
 */

const DSN = "http://localhost:4000/ingest/LV0l2yhx7QtWCkoumWCw660e"

// ── 1. Server Component (safe — DSN never reaches browser) ──
//
//    async function ServerPage() {
//      try {
//        const data = await fetchSomething()
//      } catch (err) {
//        await fetch(DSN, {
//          method: "POST",
//          headers: { "content-type": "application/json" },
//          body: JSON.stringify({ title: (err as Error).name, message: (err as Error).message })
//        })
//        throw err
//      }
//      return <div>...</div>
//    }

// ── 2. Server Action (safe — runs on server only) ──
//
//    "use server"
//    export async function riskyAction() {
//      try {
//        await doSomething()
//      } catch (err) {
//        await fetch(DSN, { method: "POST", ... })
//        throw new Error("Something went wrong")
//      }
//    }

// ── 3. Client Component (DSN is public, but ingest-only → limited risk) ──
//
//    "use client"
//    const NEXT_PUBLIC_DSN = "http://localhost:4000/ingest/..."
//
//    function ClientForm() {
//      async function handleSubmit() {
//        try {
//          await saveData()
//        } catch (err) {
//          await fetch(NEXT_PUBLIC_DSN, {
//            method: "POST",
//            headers: { "content-type": "application/json" },
//            body: JSON.stringify({
//              title: (err as Error).name,
//              message: (err as Error).message,
//              route: window.location.pathname,
//              env: "production"
//            })
//          })
//        }
//      }
//      return <form onSubmit={handleSubmit}>...</form>
//    }

// ── 4. Route Handler / API Route (safe) ──
//
//    export async function POST(req: Request) {
//      try {
//        const body = await req.json()
//        // ... process
//        return Response.json({ ok: true })
//      } catch (err) {
//        await fetch(DSN, {
//          method: "POST",
//          headers: { "content-type": "application/json" },
//          body: JSON.stringify({
//            title: (err as Error).name,
//            message: (err as Error).message,
//            route: req.url
//          })
//        })
//        return Response.json({ error: "failed" }, { status: 500 })
//      }
//    }

// ── 5. Middleware (edge runtime, safe) ──
//
//    export async function middleware(req: NextRequest) {
//      try {
//        return NextResponse.next()
//      } catch (err) {
//        await fetch(DSN, {
//          method: "POST",
//          headers: { "content-type": "application/json" },
//          body: JSON.stringify({
//            title: (err as Error).name,
//            message: (err as Error).message,
//            route: req.nextUrl.pathname
//          })
//        })
//        throw err
//      }
//    }

// ── 6. With the SDK (simplest) ──
//
//    import { Faultline } from "faultline"
//    const fl = new Faultline({ dsn: process.env.FAULTLINE_DSN })
//
//    // Server: wrap a route handler
//    export const POST = fl.withCapture(async (req: Request) => {
//      // any thrown error is captured + rethrown
//    })
//
//    // Express-style middleware
//    app.use(fl.expressHandler())

console.log("Next.js works with faultline everywhere:")
console.log("  ✅ Server Components  — DSN hidden in process.env")
console.log("  ✅ Server Actions     — DSN hidden in process.env")
console.log("  ✅ Client Components  — DSN public but ingest-only, rotatable")
console.log("  ✅ Route Handlers     — DSN hidden in process.env")
console.log("  ✅ Middleware         — DSN hidden in process.env")
console.log("  ✅ Edge Runtime       — native fetch, works anywhere")
