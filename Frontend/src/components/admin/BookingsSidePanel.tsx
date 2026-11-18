import { useTranslation } from '../../context/LocaleContext'
import { getIntlLocale } from '../../utils/locale'
import type { AdminStats } from '../../api/adminBookings'

export default function BookingsSidePanel({ stats }: { stats: AdminStats | null }) {
  const { t, locale } = useTranslation()
  const nf = new Intl.NumberFormat(getIntlLocale(locale))
  if (!stats) return null

  const percent = Math.min(100, Math.max(0, stats.occupancyRatePercent))
  const tone = percent > 80 ? 'danger' : percent > 50 ? 'warning' : 'success'
  const free = stats.totalSeatsToday - stats.bookedSeatsToday
  const remaining = stats.expectedRevenue - stats.paidRevenue

  return (
    <aside className="fv-side">
      <section className="fv-side__card" aria-labelledby="fv-side-occupancy">
        <div className="fv-side__row">
          <h2 id="fv-side-occupancy" className="fv-side__heading">{t('admin.bookings.side.occupancy')}</h2>
          <strong>{percent}%</strong>
        </div>
        <div
          className="fv-progress"
          role="progressbar"
          aria-labelledby="fv-side-occupancy"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div className={`fv-progress__bar fv-progress__bar--${tone}`} style={{ width: `${percent}%` }} />
        </div>
        <p className="fv-side__muted">
          {t('admin.bookings.side.occupancyDetail', { sold: stats.bookedSeatsToday, free })}
        </p>
      </section>

      <section className="fv-side__card" aria-labelledby="fv-side-cash">
        <h2 id="fv-side-cash" className="fv-side__heading">{t('admin.bookings.side.cashTitle')}</h2>
        <dl className="fv-side__list">
          <div className="fv-side__row">
            <dt>{t('admin.bookings.side.remaining')}</dt>
            <dd className="fv-side__value fv-side__value--warning">{nf.format(remaining)} kr</dd>
          </div>
          <div className="fv-side__row">
            <dt>{t('admin.bookings.side.paid')}</dt>
            <dd className="fv-side__value fv-side__value--success">{nf.format(stats.paidRevenue)} kr</dd>
          </div>
          <div className="fv-side__row">
            <dt>{t('admin.bookings.side.total')}</dt>
            <dd className="fv-side__value">{nf.format(stats.expectedRevenue)} kr</dd>
          </div>
        </dl>
      </section>
    </aside>
  )
}