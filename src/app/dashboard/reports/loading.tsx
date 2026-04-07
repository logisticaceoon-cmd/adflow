import Skeleton from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <Skeleton variant="card" height={140} className="mb-6" />
      <Skeleton variant="card" height={200} className="mb-6" />
      <Skeleton variant="card" height={260} />
    </div>
  )
}
