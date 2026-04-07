import Skeleton from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <Skeleton variant="card" height={160} className="mb-6" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="metric" height={120} />)}
      </div>
      <Skeleton variant="chart" className="mb-6" />
      <Skeleton variant="card" height={240} />
    </div>
  )
}
