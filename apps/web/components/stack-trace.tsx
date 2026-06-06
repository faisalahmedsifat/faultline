export function StackTrace({ stack }: { stack: string | null }) {
  if (!stack) return null

  return (
    <div>
      <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-2">
        Stack Trace
      </h3>
      <pre className="code-block">{stack}</pre>
    </div>
  )
}
