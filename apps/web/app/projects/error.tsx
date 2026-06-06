"use client"

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-white/50 mb-6 text-sm">
        {error.message || "Failed to load this page. The API may be unreachable."}
      </p>
      <button className="btn btn-primary" onClick={reset}>
        Try again
      </button>
    </div>
  )
}
