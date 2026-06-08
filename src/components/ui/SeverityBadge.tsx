import './SeverityBadge.css'

interface SeverityBadgeProps {
  severity: string
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const level = severity.toLowerCase()
  return <span className={`severity-badge severity-${level}`}>{severity}</span>
}
