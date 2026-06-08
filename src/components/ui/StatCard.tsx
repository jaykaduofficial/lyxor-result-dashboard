import './StatCard.css'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  accent?: 'default' | 'success' | 'warning' | 'danger' | 'qodo' | 'lyxor'
}

export function StatCard({ label, value, sub, accent = 'default' }: StatCardProps) {
  return (
    <div className={`stat-card accent-${accent}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  )
}
