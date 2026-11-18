import { useTranslation } from '../../context/LocaleContext'
import { getIntlLocale } from '../../utils/locale'
import { getAdminStats, type AdminStats } from '../../api/adminBookings'
import { useFetch } from '../../hooks/useFetch'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { EmptyState } from '../../components/EmptyState'
import QuickCheckIn from '../../components/admin/QuickCheckIn'

export default function AdminBookings() {
  const { t, locale } = useTranslation()
  const { data: stats, error } = useFetch<AdminStats>((signal) => getAdminStats(signal))
  const nf = new Intl.NumberFormat(getIntlLocale(locale))

  const cards = stats
    ? [
        {
          key: 'today',
          tone: 'info',
          icon: 'bi-ticket-perforated',
          label: t('admin.bookings.stats.today'),
          value: nf.format(stats.bookingsToday),
          detail: t('admin.bookings.stats.todayDetail', { pending: stats.bookingsWaiting, paid: stats.bookingsPaid }),
        },
        {
          key: 'revenue',
          tone: 'success',
          icon: 'bi-cash-coin',
          label: t('admin.bookings.stats.revenue'),
          value: `${nf.format(stats.expectedRevenue)} kr`,
          detail: t('admin.bookings.stats.revenueDetail', { paid: nf.format(stats.paidRevenue) }),
        },
        {
          key: 'occupancy',
          tone: 'warning',
          icon: 'bi-people',
          label: t('admin.bookings.stats.occupancy'),
          value: `${stats.occupancyRatePercent}%`,
          detail: t('admin.bookings.stats.occupancyDetail', { sold: stats.bookedSeatsToday, total: stats.totalSeatsToday }),
        },
      ]
    : []

  return (
    <div>
      <AdminPageHeader title={t('nav.bookingsCashier')} subtitle={t('admin.bookings.subtitle')} />

      {error && <EmptyState variant="error" title={t('admin.bookings.stats.error')} />}
      <QuickCheckIn />
      <div className="fv-kpi-grid">
        {cards.map((card) => (
          <div key={card.key} className={`fv-kpi fv-kpi--${card.tone}`}>
            <span className="fv-kpi__icon" aria-hidden="true">
              <i className={`bi ${card.icon}`} />
            </span>
            <div>
              <div className="fv-kpi__label">{card.label}</div>
              <div className="fv-kpi__value">{card.value}</div>
              <div className="fv-kpi__detail">{card.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}