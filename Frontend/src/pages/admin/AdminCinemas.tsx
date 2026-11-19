import { useTranslation } from '../../context/LocaleContext'
import { EmptyState } from '../../components/EmptyState'

export default function AdminCinemas() {
  const { t } = useTranslation()
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">{t('nav.cinemas')}</h1>
          <p className="text-secondary mb-0">{t('admin.cinemas.intro')}</p>
        </div>
      </div>

      <EmptyState
        icon="bi-display"
        title={t('admin.cinemas.title')}
        description={t('admin.cinemas.unfinished')}
      />
    </div>
  )
}
