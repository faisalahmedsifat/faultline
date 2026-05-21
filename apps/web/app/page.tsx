const packages = [
  { name: "web", detail: "Next.js dashboard shell" },
  { name: "api", detail: "Bun service for ingest and dashboard APIs" },
  { name: "worker", detail: "BullMQ consumer for alert delivery" }
]

export default function HomePage() {
  return (
    <main>
      <div className="shell">
        <p className="eyebrow">PR-001 Scaffold</p>
        <h1 className="title">faultline starts as a clean split between web, api, and worker.</h1>
        <p className="copy">
          This placeholder app proves the monorepo layout and local runtime wiring before the
          actual product logic lands.
        </p>
        <div className="grid">
          {packages.map((item) => (
            <section className="card" key={item.name}>
              <h2>{item.name}</h2>
              <p className="copy">{item.detail}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}

