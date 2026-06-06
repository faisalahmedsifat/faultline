"use client"

import { useState } from "react"

export function MetadataViewer({ metadata }: { metadata: Record<string, unknown> | null }) {
  const [expanded, setExpanded] = useState(false)

  if (!metadata || Object.keys(metadata).length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">
          Metadata
        </h3>
        <button className="btn btn-sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>
      {expanded && (
        <pre className="code-block max-h-80">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      )}
    </div>
  )
}
