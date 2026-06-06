import Link from "next/link"

export default function LandingPage() {
  return (
    <div>
      {/* ── Hero ── */}
      <section className="max-w-3xl mx-auto pt-20 sm:pt-28 pb-16 sm:pb-20 text-center px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-xs text-white/50 mb-6">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Open source & self-hostable
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-[-0.03em] leading-[0.96] mb-4">
          Production errors,
          <br />
          <span className="text-[#ffb36b]">not production bills.</span>
        </h1>

        <p className="text-white/50 max-w-xl mx-auto text-lg mb-8 leading-relaxed">
          faultline is the error tracker built for teams who are tired of paying
          per-event, per-seat, per-gigabyte. Self-host in one command. Zero
          surprise pricing. Your data, your server, your rules.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/projects" className="btn btn-primary text-base px-6 py-3">
            Launch Dashboard →
          </Link>
          <a
            href="#quickstart"
            className="btn text-base px-6 py-3"
          >
            See how it works
          </a>
        </div>

        <p className="text-xs text-white/30 mt-4">
          Free and open source. MIT licensed.
        </p>
      </section>

      {/* ── Features ── */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="text-white/50 max-w-lg mx-auto">
            Sentry is great. It&apos;s also expensive, complex, and does 50 things
            you didn&apos;t ask for. faultline does exactly one thing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: "📥",
              title: "Error Inbox",
              desc: "Every error lands in a clean, deduplicated inbox. Same error in the same location? Merged into one row, not 500."
            },
            {
              icon: "🔔",
              title: "Smart Alerts",
              desc: "Get notified via Slack, Discord, or Email when errors spike. Configurable thresholds per project, per channel."
            },
            {
              icon: "🔌",
              title: "Self-Hosted",
              desc: "One docker compose up command. Your error data never leaves your infrastructure. GDPR-friendly by default."
            },
            {
              icon: "📦",
              title: "Zero-Dep SDK",
              desc: "Less than 3KB. Zero runtime dependencies. Works in Node, Bun, Deno, Edge — anywhere fetch exists."
            },
            {
              icon: "🔑",
              title: "DSN-Based Ingest",
              desc: "Create a project, get a DSN, start tracking. No user accounts, no OAuth, no SAML. Just works."
            },
            {
              icon: "💰",
              title: "Predictable Cost",
              desc: "No per-event pricing. No per-seat pricing. Your only cost is the server you run it on."
            }
          ].map((f) => (
            <div key={f.title} className="card">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quickstart ── */}
      <section id="quickstart" className="max-w-3xl mx-auto px-4 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Three commands to production
          </h2>
          <p className="text-white/50 max-w-lg mx-auto">
            Deploy on any server that runs Docker. From zero to tracking errors in under 5 minutes.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              step: "1",
              label: "Deploy faultline",
              cmd: "docker compose up -d"
            },
            {
              step: "2",
              label: "Create a project in the dashboard, copy the DSN",
              cmd: "FAULTLINE_DSN=prj_xxxx\nFAULTLINE_BASE_URL=https://faultline.yourdomain.com"
            },
            {
              step: "3",
              label: "Install the SDK and start tracking",
              cmd: `import { Faultline } from "@xyph3r/faultline"\n\nFaultline.init()\nFaultline.capture(err, { route: "/api/checkout" })`
            }
          ].map((s) => (
            <div key={s.step} className="card flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-[#ff6f00]/20 text-[#ffb36b] flex items-center justify-center text-sm font-bold shrink-0">
                {s.step}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium mb-2">{s.label}</p>
                <pre className="code-block text-sm">{s.cmd}</pre>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comparison ── */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Faultline vs. the alternatives
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Feature</th>
                <th className="text-center text-[#ffb36b]">Faultline</th>
                <th className="text-center">Sentry</th>
                <th className="text-center">Log Grepping</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Error deduplication", "✅", "✅", "❌"],
                ["Alert notifications", "✅", "✅", "❌"],
                ["Self-hosted", "✅", "✅ (complex)", "✅"],
                ["Setup time", "< 5 min", "30+ min (self-host)", "—"],
                ["Per-event pricing", "Never", "Yes", "—"],
                ["SDK bundle size", "< 3KB", "~30KB", "—"],
                ["Open source", "✅ MIT", "✅ BSL", "—"],
                ["GDPR by default", "✅", "❌ (SaaS)", "✅"]
              ].map(([feature, faultline, sentry, grep]) => (
                <tr key={feature}>
                  <td className="text-white/70">{feature}</td>
                  <td className="text-center">{faultline}</td>
                  <td className="text-center text-white/50">{sentry}</td>
                  <td className="text-center text-white/40">{grep}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-2xl mx-auto px-4 pb-20 text-center">
        <div className="card py-12 px-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Ready to stop paying per error?
          </h2>
          <p className="text-white/50 mb-6 max-w-md mx-auto">
            faultline is free, open source, and runs on your server. No limits.
            No surprises. Just your errors, in one clean inbox.
          </p>
          <Link href="/projects" className="btn btn-primary text-base px-8 py-3">
            Open Dashboard →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-4 text-center text-xs text-white/30">
        <p>
          faultline · Open source under MIT ·{" "}
          <a href="https://github.com/your-org/faultline" className="hover:text-white/50 transition-colors">GitHub</a>
        </p>
      </footer>
    </div>
  )
}
