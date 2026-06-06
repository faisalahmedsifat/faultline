export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="h-4 w-24 bg-white/10 rounded mb-2" />
      <div className="h-8 w-40 bg-white/10 rounded mb-6" />

      <div className="flex gap-4 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card py-3 px-5 flex-1">
            <div className="h-6 w-12 bg-white/10 rounded mb-1" />
            <div className="h-3 w-16 bg-white/5 rounded" />
          </div>
        ))}
      </div>

      <div className="card p-0">
        <div className="p-4 border-b border-white/5">
          <div className="h-4 w-64 bg-white/10 rounded" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 border-b border-white/5 flex gap-4">
            <div className="h-4 flex-1 bg-white/5 rounded" />
            <div className="h-4 w-20 bg-white/5 rounded" />
            <div className="h-4 w-16 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
