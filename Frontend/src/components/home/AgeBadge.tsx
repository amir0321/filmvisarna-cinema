import { useTranslation } from '../../context/LocaleContext'
import { formatAgeRating, getAgeRatingVariant } from '../../utils/movie'

interface AgeBadgeProps {
  ageRating: string | null
  className?: string
}

export default function AgeBadge({ ageRating, className = '' }: AgeBadgeProps) {
  const { t, locale } = useTranslation()
  return (
    <span className={`age-badge age-badge--${getAgeRatingVariant(ageRating)} ${className}`.trim()}>
      <span className="visually-hidden">{t('movie.ageLimitPrefix')} </span>
      {formatAgeRating(ageRating, locale)}
    </span>
  )
}
