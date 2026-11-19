import { useTranslation } from '../context/LocaleContext'
import type { ReservationWarningStatus } from '../types/booking'
import { getIntlLocale } from '../utils/locale'

interface ReservationWarningNoticeProps {
  status: ReservationWarningStatus | null
  error?: boolean
  currentTime: number
}

export default function ReservationWarningNotice({ status, error = false, currentTime }: ReservationWarningNoticeProps) {
  const { t, locale } = useTranslation()
  if (error) return <p className="text-secondary small" role="status">{t('reservationWarnings.loadError')}</p>
  if (!status || (!status.warningCount && !status.warnings.length && !status.blockedUntil)) return null
  const blocked = Boolean(status.blockedUntil && Date.parse(status.blockedUntil) > currentTime)
  const format = (value: string) => new Intl.DateTimeFormat(getIntlLocale(locale), {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Stockholm',
  }).format(new Date(value))
  return <aside className={`alert ${blocked ? 'alert-danger' : 'alert-warning'} mb-3`} aria-label={t('reservationWarnings.title')}>
    <h2 className="h6">{t('reservationWarnings.title')}</h2>
    <p className="mb-2" role="status">{blocked
      ? t('reservationWarnings.blocked', { until: format(status.blockedUntil!) })
      : t('reservationWarnings.count', { count: status.warningCount, limit: status.warningLimit })}</p>
    <p className="small mb-2">{t('reservationWarnings.policy', { count: status.warningLimit, days: status.windowDays, blockDays: status.blockDays })}</p>
    <p className="small mb-2">{t('reservationWarnings.cashierAllowed')}</p>
    {status.warnings.length > 0 && <details className="small mb-2">
      <summary>{t('reservationWarnings.history')}</summary>
      <ul className="mt-2 mb-0">{status.warnings.map(warning => <li key={warning.id}>
        {t('reservationWarnings.event', { reference: warning.bookingRef, time: format(warning.screeningEndedAt) })}
        {warning.usedForBlock && <> · {t('reservationWarnings.usedForBlock')}</>}
      </li>)}</ul>
    </details>}
    <p className="small mb-0">{t('reservationWarnings.contact')}</p>
  </aside>
}
