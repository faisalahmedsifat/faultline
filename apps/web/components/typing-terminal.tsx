"use client"

import { useEffect, useState } from "react"

const lines = [
  { text: "// 1. Install", type: "comment" as const, delay: 400 },
  { text: "npm install @faultline/sdk", type: "command" as const, delay: 800 },
  { text: "", type: "blank" as const, delay: 200 },
  { text: "// 2. Initialize (2 lines)", type: "comment" as const, delay: 400 },
  { text: 'import { Faultline } from "@faultline/sdk"', type: "import" as const, delay: 600 },
  { text: "Faultline.init({ dsn: process.env.FAULTLINE_DSN })", type: "code" as const, delay: 600 }
]

function renderLine(line: (typeof lines)[number]) {
  switch (line.type) {
    case "comment":
      return <span className="text-muted-foreground/50">{line.text}</span>
    case "command":
      return (
        <>
          <span className="text-success">npm</span>
          <span className="text-code-fg"> install @faultline/sdk</span>
        </>
      )
    case "blank":
      return <br />
    case "import":
      return (
        <>
          <span className="text-purple-400">import</span>
          <span className="text-code-fg">{" { Faultline } "}</span>
          <span className="text-purple-400">from</span>
          <span className="text-amber-300"> &quot;@faultline/sdk&quot;</span>
        </>
      )
    case "code":
      return (
        <>
          <span className="text-primary">Faultline</span>
          <span className="text-code-fg">.</span>
          <span className="text-blue-400">init</span>
          <span className="text-code-fg">{"({ dsn: process.env.FAULTLINE_DSN })"}</span>
        </>
      )
  }
}

export function TypingTerminal() {
  const [visibleLines, setVisibleLines] = useState(0)

  useEffect(() => {
    let totalDelay = 600
    const timeouts: ReturnType<typeof setTimeout>[] = []

    lines.forEach((line, i) => {
      totalDelay += line.delay
      timeouts.push(
        setTimeout(() => setVisibleLines(i + 1), totalDelay)
      )
    })

    return () => timeouts.forEach(clearTimeout)
  }, [])

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-code-bg shadow-2xl shadow-black/10">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-code-bg border-b border-white/5">
        <span className="size-2.5 rounded-full bg-red-500/80" />
        <span className="size-2.5 rounded-full bg-yellow-500/80" />
        <span className="size-2.5 rounded-full bg-green-500/80" />
        <span className="text-[10px] text-white/20 ml-2 font-mono">terminal</span>
      </div>
      <div className="p-5 sm:p-6 text-left min-h-[160px]">
        <pre className="text-xs sm:text-sm font-mono leading-relaxed">
          {lines.slice(0, visibleLines).map((line, i) => (
            <div
              key={i}
              className="animate-fade-up"
              style={{ animationDuration: "0.25s" }}
            >
              {renderLine(line)}
            </div>
          ))}
          {visibleLines < lines.length && (
            <span className="inline-block w-2 h-4 bg-primary/70 animate-pulse ml-0.5" />
          )}
        </pre>
      </div>
    </div>
  )
}
