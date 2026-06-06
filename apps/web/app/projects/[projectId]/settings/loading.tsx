export default function Loading() {
  return (
    <div className="max-w-xl mx-auto animate-pulse">
      <div className="h-4 w-24 bg-white/10 rounded mb-2" />
      <div className="h-8 w-40 bg-white/10 rounded mb-6" />
      <div className="card">
        <div className="h-32 bg-white/5 rounded-lg mb-4" />
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-white/10 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
