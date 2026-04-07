// src/components/ui/CampaignDetailSkeleton.tsx
import Skeleton from './Skeleton'

export default function CampaignDetailSkeleton() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <Skeleton variant="text" width={220} height={14} className="mb-5" />

      {/* Hero */}
      <Skeleton variant="card" height={260} className="mb-6" />

      {/* Executive summary */}
      <Skeleton variant="card" height={90} className="mb-6" />

      {/* Performance grid */}
      <div className="card p-6 mb-6">
        <Skeleton variant="text" width={200} height={18} style={{ marginBottom: 16 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <Skeleton key={i} variant="metric" height={70} />
          ))}
        </div>
        <Skeleton variant="chart" />
      </div>

      {/* Structure */}
      <Skeleton variant="card" height={200} className="mb-6" />

      {/* Creatives */}
      <Skeleton variant="card" height={280} className="mb-6" />

      {/* History */}
      <Skeleton variant="card" height={200} className="mb-6" />

      {/* Recommendations */}
      <Skeleton variant="card" height={140} className="mb-6" />
    </div>
  )
}
