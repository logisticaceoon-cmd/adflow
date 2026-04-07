// src/components/ui/DashboardSkeleton.tsx
import Skeleton from './Skeleton'

export default function DashboardSkeleton() {
  return (
    <div>
      {/* Sync button placeholder */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Skeleton variant="badge" width={120} height={36} />
      </div>

      {/* Hero */}
      <Skeleton variant="card" height={220} className="mb-6" />

      {/* Growth profile */}
      <Skeleton variant="card" height={160} className="mb-6" />

      {/* Next best action */}
      <Skeleton variant="card" height={120} className="mb-6" />

      {/* Month summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="metric" height={88} />
        ))}
      </div>

      {/* Phase summary */}
      <Skeleton variant="card" height={200} className="mb-6" />

      {/* Achievements */}
      <Skeleton variant="card" height={140} className="mb-6" />
    </div>
  )
}
