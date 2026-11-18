import { translate } from '../../i18n'
import type { Locale } from '../../utils/locale'
import { useTranslation } from '../../context/LocaleContext'
import type { CinemaSummary } from '../../types/cinema'
import type { Screening } from '../../types/screening'
import { AuditoriumBadge, Badge, StatusBadge } from '../Badge'
import { InlineConfirmAction } from '../Toast'
import { addDaysToIsoDate, capitalize, formatDateShort, formatTime, toCinemaIsoDate, todayIsoDate } from '../../utils/date'

interface ScreeningsTableProps {
  screenings: Screening[]
  cinemas: CinemaSummary[]
  onEdit: (screening: Screening) => void
  onCancel: (screening: Screening) => Promise<void>
}

function formatDayLabel(isoDateTime: string, locale: Locale): string {
  const date = toCinemaIsoDate(isoDateTime)
  const today = todayIsoDate()
  if (date === today) return translate(locale, 'date.today')
  if (date === addDaysToIsoDate(today, 1)) return translate(locale, 'date.tomorrow')
  return capitalize(formatDateShort(date, locale))
}

// "4K Dolby Atmos" -> "4K"
function getFormat(cinema: CinemaSummary | undefined): string {
  return cinema?.format?.split(' ')[0] ?? '2D'
}

function ScreeningActions({ screening, onEdit, onCancel }: {
  screening: Screening
  onEdit: ScreeningsTableProps['onEdit']
  onCancel: ScreeningsTableProps['onCancel']
}) {
  const { t, locale } = useTranslation()
  const hasBookings = (screening.bookedSeats ?? 0) > 0
  return (
    <div className="admin-screening-actions">
      <div className="admin-screening-actions__buttons">
        <button type="button" className="btn btn-sm admin-table__edit" onClick={() => onEdit(screening)}
          aria-label={t('admin.screenings.editAria', { title: screening.movieTitle, time: formatTime(screening.startsAt, locale) })}>
          <i className="bi bi-pencil-fill me-1" aria-hidden="true" />{t('admin.edit')}
        </button>
        {hasBookings ? (
          <button type="button" className="btn btn-outline-danger btn-sm" disabled>
            {t('admin.screenings.cancel')}<span className="visually-hidden">  {t('admin.screenings.hasBookings')}</span>
          </button>
        ) : <InlineConfirmAction label={t('admin.screenings.cancel')} confirmLabel={t('admin.screenings.confirmCancel')} cancelLabel={t('admin.abort')} onConfirm={() => onCancel(screening)} />}
      </div>
      {hasBookings ? <p className="admin-screening-actions__reason">{t('admin.screenings.cannotCancel')}</p> : null}
    </div>
  )
}

function SoldSeats({ sold, total }: { sold: number; total: number }) {
  const percent = total > 0 ? Math.max(0, Math.min(100, Math.round((sold / total) * 100))) : 0
  return (
    <div className="admin-table__sold">
      <span>{sold} / {total}</span>
      <div className={`admin-table__bar${percent >= 90 ? ' is-almost-full' : ''}`} aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function ScreeningStatus({ sold, total }: { sold: number; total: number }) {
  const { t } = useTranslation()
  return total > 0 && sold >= total ? <Badge variant="warning">{t('screening.soldOut')}</Badge> : <StatusBadge status="active" />
}

export default function ScreeningsTable({ screenings, cinemas, onEdit, onCancel }: ScreeningsTableProps) {
  const { t, locale } = useTranslation()
  return (
    <>
    <div className="admin-table-card admin-screenings-table d-none d-xl-block">
      <div className="table-responsive">
        <table className="admin-table">
          <caption className="visually-hidden">{t('admin.screenings.caption')}</caption>
          <colgroup>
            <col className="admin-screenings-table__date" /><col className="admin-screenings-table__time" />
            <col className="admin-screenings-table__cinema" /><col />
            <col className="admin-screenings-table__format" /><col className="admin-screenings-table__seats" />
            <col className="admin-screenings-table__time" /><col className="admin-screenings-table__status" />
            <col className="admin-screenings-table__actions" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">{t('filter.date')}</th>
              <th scope="col">{t('admin.screenings.start')}</th>
              <th scope="col">{t('admin.auditorium')}</th>
              <th scope="col">{t('member.film')}</th>
              <th scope="col">{t('admin.screenings.format')}</th>
              <th scope="col">{t('admin.screenings.sold')}</th>
              <th scope="col">{t('admin.screenings.end')}</th>
              <th scope="col">{t('admin.screenings.status')}</th>
              <th scope="col" className="text-end">
                {t('admin.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {screenings.map((screening) => {
              const cinema = cinemas.find((item) => item.id === screening.cinemaId)
              const sold = screening.bookedSeats ?? 0
              const total = screening.totalSeats ?? cinema?.total_seats ?? 0

              return (
                <tr key={screening.id}>
                  <td>{formatDayLabel(screening.startsAt, locale)}</td>
                  <td className="admin-table__time">{formatTime(screening.startsAt, locale)}</td>
                  <td>
                    <AuditoriumBadge auditorium={String(screening.cinemaId)} />
                  </td>
                  <th scope="row" className="admin-table__title admin-screenings-table__title">
                    {screening.movieTitle}
                  </th>
                  <td>
                    <span className="admin-table__format">{getFormat(cinema)}</span>
                  </td>
                  <td>
                    <SoldSeats sold={sold} total={total} />
                  </td>
                  <td className="admin-table__time">{formatTime(screening.endsAt, locale)}</td>
                  <td>
                    <ScreeningStatus sold={sold} total={total} />
                  </td>
                  <td>
                    <ScreeningActions screening={screening} onEdit={onEdit} onCancel={onCancel} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
    <ul className="admin-screening-cards d-xl-none" aria-label={t('admin.screenings.list')}>
      {screenings.map(screening => {
        const cinema = cinemas.find(item => item.id === screening.cinemaId)
        const sold = screening.bookedSeats ?? 0
        const total = screening.totalSeats ?? cinema?.total_seats ?? 0
        return (
          <li key={screening.id}>
            <article className="admin-screening-card" aria-label={`${screening.movieTitle}, ${formatDayLabel(screening.startsAt, locale)} ${formatTime(screening.startsAt, locale)}`}>
              <header>
                <span className="admin-screening-card__date">{formatDayLabel(screening.startsAt, locale)}</span>
                <ScreeningStatus sold={sold} total={total} />
              </header>
              <h2>{screening.movieTitle}</h2>
              <dl className="admin-screening-card__details">
                <div><dt>{t('admin.screenings.time')}</dt><dd className="admin-table__time">{formatTime(screening.startsAt, locale)}–{formatTime(screening.endsAt, locale)}</dd></div>
                <div><dt>{t('admin.auditorium')}</dt><dd>{screening.cinema || cinema?.name || t('movies.auditoriumNumber', { id: screening.cinemaId })}</dd></div>
                <div><dt>{t('admin.screenings.format')}</dt><dd><span className="admin-table__format">{getFormat(cinema)}</span></dd></div>
                <div><dt>{t('admin.screenings.sold')}</dt><dd><SoldSeats sold={sold} total={total} /></dd></div>
              </dl>
              <ScreeningActions screening={screening} onEdit={onEdit} onCancel={onCancel} />
            </article>
          </li>
        )
      })}
    </ul>
    </>
  )
}
