import { useTranslation } from '../../context/LocaleContext'
import { EmptyState } from '../../components/EmptyState'

export default function AdminBookings() {
  const { t } = useTranslation()
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">{t('nav.bookingsCashier')}</h1>
          <p className="text-secondary mb-0">{t('admin.bookings.intro')}</p>
        </div>
      </div>

      <EmptyState
        icon="bi-ticket-perforated"
        title={t('nav.bookingsCashier')}
        description={t('admin.bookings.unfinished')}
      />
    </div>
  )
}
