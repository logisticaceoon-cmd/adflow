// src/components/ui/PixelPageSkeleton.tsx
import Skeleton from './Skeleton'

export default function PixelPageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero */}
      <Skeleton variant="card" height={240} className="mb-6" />

      {/* Score + level row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
        <Skeleton variant="card" height={180} />
        <Skeleton variant="card" height={180} />
      </div>

      {/* Funnel */}
      <Skeleton variant="card" height={260} className="mb-6" />

      {/* Events grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="metric" height={100} />
        ))}
      </div>

      {/* Achievements wall */}
      <Skeleton variant="card" height={320} className="mb-6" />
    </div>
  )
}
