export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse">
      <div className="h-4 w-24 bg-white/10 rounded mb-3" />
      <div className="h-8 w-64 bg-white/10 rounded mb-4" />
      <div className="h-5 w-full bg-white/5 rounded mb-6" />
      <div className="card mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i}>
              <div className="h-3 w-16 bg-white/5 rounded mb-1" />
              <div className="h-4 w-24 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
