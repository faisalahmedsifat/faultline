export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
      <div className="h-8 w-32 bg-white/10 rounded mb-6" />
      <div className="card mb-6">
        <div className="h-4 w-40 bg-white/10 rounded mb-3" />
        <div className="flex gap-2">
          <div className="h-10 flex-1 bg-white/5 rounded-lg" />
          <div className="h-10 w-32 bg-white/10 rounded-lg" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="card">
            <div className="h-5 w-48 bg-white/10 rounded mb-2" />
            <div className="h-4 w-72 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
