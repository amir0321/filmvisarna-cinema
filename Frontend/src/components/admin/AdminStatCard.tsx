interface AdminStatCardProps {
  label: string
  value: string
  color: 'info' | 'success' | 'warning'
}

export default function AdminStatCard({ label, value, color }: AdminStatCardProps) {
  return (
    <div className="admin-stat-card">
      <span className={`admin-stat-card__dot admin-stat-card__dot--${color}`} aria-hidden="true"></span>
      <div>
        <p className="admin-stat-card__label">{label}</p>
        <p className="admin-stat-card__value">{value}</p>
      </div>
    </div>
  )
}
