import { formatAgeRating, getAgeRatingVariant } from '../../utils/movie'

interface AgeBadgeProps {
  ageRating: string | null
  className?: string
}

export default function AgeBadge({ ageRating, className = '' }: AgeBadgeProps) {
  return (
    <span className={`age-badge age-badge--${getAgeRatingVariant(ageRating)} ${className}`.trim()}>
      <span className="visually-hidden">Åldersgräns: </span>
      {formatAgeRating(ageRating)}
    </span>
  )
}
