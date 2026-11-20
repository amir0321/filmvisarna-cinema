import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { AuditoriumBadge } from '../../components/Badge'
import { EmptyState } from '../../components/EmptyState'
import { useTranslation } from '../../context/LocaleContext'
import { useScreenings } from '../../hooks/useScreenings'
import { useMovies } from '../../hooks/useMovies'
import { useCinemas } from '../../hooks/useCinemas'
import { getDashboardProgramme, getProjectionFormat, getScreeningOccupancy } from '../../utils/adminDashboard'
import { capitalize, formatDateLong, formatDateShort, formatTime, toCinemaIsoDate } from '../../utils/date'

function DashboardSkeleton() {
  const { t } = useTranslation()
  return (
    <div role="status" aria-busy="true">
      <span className="visually-hidden">{t('admin.dashboard.loading')}</span>
      <div className="admin-kpi-grid" aria-hidden="true">
        {[0, 1, 2, 3].map(index => (
          <div className="admin-kpi admin-dashboard__skeleton" key={index}>
            <div className="fv-skeleton admin-dashboard__skeleton-label" />
            <div className="fv-skeleton admin-dashboard__skeleton-value" />
            <div className="fv-skeleton admin-dashboard__skeleton-label" />
          </div>
        ))}
      </div>
      <div className="admin-dashboard__panels admin-dashboard__skeleton-panels" aria-hidden="true">
        {[0, 1].map(index => (
          <div className="admin-dashboard__panel" key={index}>
            {[0, 1, 2].map(row => <div className="fv-skeleton admin-dashboard__skeleton-row" key={row} />)}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { t, locale } = useTranslation()
  const screenings = useScreenings(undefined, 'dashboard')
  const movies = useMovies()
  const cinemas = useCinemas()
  const [now, setNow] = useState(() => Date.now())
  const { refetch: refreshScreenings } = screenings
  const { refetch: refreshMovies } = movies
  const { refetch: refreshCinemas } = cinemas

  useEffect(() => {
    const refresh = () => {
      if (document.hidden) return
      setNow(Date.now())
      void Promise.all([refreshScreenings(), refreshMovies(), refreshCinemas()])
    }
    const timer = window.setInterval(refresh, 60_000)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [refreshScreenings, refreshMovies, refreshCinemas])

  const programme = getDashboardProgramme(screenings.data ?? [], now)
  const cinemaList = cinemas.data ?? []
  const movieList = movies.data ?? []
  const capacity = cinemaList.reduce((sum, cinema) => sum + cinema.total_seats, 0)
  const loading = [screenings, movies, cinemas].some(source => source.loading && source.data === null)
  const error = Boolean(screenings.error || movies.error || cinemas.error)
  const ready = !loading && !error
  const updating = [screenings, movies, cinemas].some(source => source.loading)
  const number = new Intl.NumberFormat(locale === 'sv' ? 'sv-SE' : 'en-GB')
  const count = (value: number) => number.format(value)
  const seats = (value: number) => t('admin.dashboard.seats', { count: count(value) })
  const shows = (value: number) => t('admin.dashboard.shows', { count: count(value) })
  const unavailable = t('admin.dashboard.unavailable')
  const cinemaName = (name: string) => name === 'Stora Salongen' ? t('admin.dashboard.largeHall')
    : name === 'Lilla Salongen' ? t('admin.dashboard.smallHall') : name

  function retry() {
    setNow(Date.now())
    void Promise.all([refreshScreenings(), refreshMovies(), refreshCinemas()])
  }

  const kpis = [
    { label: t('admin.dashboard.today'), value: programme.todayScreenings.length, detail: t('admin.dashboard.bookedToday', { count: count(programme.bookedToday) }), icon: 'bi-calendar-event', accent: 'info' },
    { label: t('admin.dashboard.upcoming'), value: programme.upcomingCount, detail: t('admin.dashboard.programmeDays', { count: count(programme.programmeDays) }), icon: 'bi-collection-play', accent: 'primary' },
    { label: t('nav.movieArchive'), value: movieList.length, detail: t('admin.dashboard.activeMovies', { count: count(movieList.filter(movie => programme.activeMovieIds.has(movie.id)).length) }), icon: 'bi-film', accent: 'success' },
    { label: t('admin.dashboard.capacity'), value: cinemaList.length, detail: seats(capacity), icon: 'bi-display', accent: 'warning' },
  ]
  const modules = [
    { title: t('nav.bookingsCashier'), description: t('admin.dashboard.bookings'), path: '/admin/bokningar', icon: 'bi-ticket-perforated', accent: 'info', status: t('admin.dashboard.bookedToday', { count: count(programme.bookedToday) }) },
    { title: t('movieDetails.scheduleHeading'), description: t('admin.dashboard.screenings'), path: '/admin/visningar', icon: 'bi-calendar3', accent: 'primary', status: shows(programme.upcomingCount) },
    { title: t('nav.movieArchive'), description: t('admin.dashboard.movies'), path: '/admin/filmer', icon: 'bi-film', accent: 'success', status: t('admin.dashboard.filmCount', { count: count(movieList.length) }) },
    { title: t('nav.cinemas'), description: t('admin.dashboard.cinemas'), path: '/admin/salonger', icon: 'bi-display', accent: 'warning', status: seats(capacity) },
  ]

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__hero">
        <div>
          <span className="admin-dashboard__eyebrow"><i className="bi bi-camera-reels" aria-hidden="true" />{t('admin.dashboard.eyebrow')}</span>
          <h1>{t('admin.dashboard.title')}</h1>
          <p>{t('admin.dashboard.intro')}</p>
          <time dateTime={programme.today} className="admin-dashboard__date"><i className="bi bi-calendar-event" aria-hidden="true" />{capitalize(formatDateLong(programme.today, locale))}</time>
        </div>
        <nav className="admin-dashboard__quick-links" aria-label={t('admin.dashboard.shortcuts')}>
          <Link to="/admin/visningar" className="btn btn-danger"><i className="bi bi-calendar3" aria-hidden="true" />{t('movieDetails.scheduleHeading')}</Link>
          <Link to="/admin/filmer" className="btn admin-dashboard__secondary-link"><i className="bi bi-film" aria-hidden="true" />{t('nav.movieArchive')}</Link>
        </nav>
      </header>

      <section aria-label={t('admin.dashboard.overview')}>
        {error ? (
          <EmptyState variant="error" title={t('admin.dashboard.errorTitle')} description={t('admin.dashboard.errorDescription')}>
            <button type="button" className="btn btn-outline-danger" disabled={updating} onClick={retry}>{updating ? t('admin.dashboard.loading') : t('common.retry')}</button>
          </EmptyState>
        ) : loading ? <DashboardSkeleton /> : (
          <dl className="admin-kpi-grid">
            {kpis.map(kpi => (
              <div className={`admin-kpi admin-accent--${kpi.accent}`} key={kpi.label}>
                <dt><span>{kpi.label}</span><i className={`bi ${kpi.icon} admin-kpi__icon`} aria-hidden="true" /></dt>
                <dd><strong>{count(kpi.value)}</strong><span>{kpi.detail}</span></dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="admin-dashboard__modules" aria-labelledby="admin-modules-title">
        <div className="admin-dashboard__section-heading"><h2 id="admin-modules-title">{t('admin.dashboard.modules')}</h2><span>{t('admin.dashboard.workspace')}</span></div>
        <div className="admin-module-grid">
          {modules.map(module => (
            <article className={`admin-module admin-accent--${module.accent}`} key={module.path}>
              <div className="admin-module__top"><span className="admin-module__icon"><i className={`bi ${module.icon}`} aria-hidden="true" /></span><span className="admin-module__status">{ready ? module.status : unavailable}</span></div>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              <Link to={module.path} aria-label={t('admin.dashboard.openModuleAria', { module: module.title })}>{t('admin.dashboard.openModule')}</Link>
            </article>
          ))}
        </div>
      </section>

      {ready ? (
        <div className="admin-dashboard__panels">
          <section className="admin-dashboard__panel" aria-labelledby="admin-running-order-title">
            <header className="admin-dashboard__panel-heading"><div><span className="admin-dashboard__kicker">{t('admin.dashboard.runningOrder')}</span><h2 id="admin-running-order-title">{t('admin.dashboard.nextScreenings')}</h2></div><Link to="/admin/visningar">{t('admin.dashboard.fullSchedule')}<i className="bi bi-arrow-up-right" aria-hidden="true" /></Link></header>
            {programme.next.length === 0 ? <EmptyState icon="bi-calendar2-check" title={t('admin.dashboard.emptyScreenings')} description={t('admin.dashboard.emptyScreeningsDescription')} actionLabel={t('movieDetails.scheduleHeading')} actionTo="/admin/visningar" /> : (
              <ol className="admin-running-order">
                {programme.next.map(screening => {
                  const cinema = cinemaList.find(item => item.id === screening.cinemaId)
                  const occupancy = getScreeningOccupancy(screening, cinema)
                  const date = toCinemaIsoDate(screening.startsAt)
                  return (
                    <li key={screening.id}>
                      <div className="admin-running-order__time">
                        <span className="admin-running-order__day">{date === programme.today ? t('date.today') : formatDateShort(date, locale)}</span>
                        <time dateTime={screening.startsAt}>{formatTime(screening.startsAt, locale)}</time>
                        <span className="admin-running-order__end"><span className="visually-hidden">{t('admin.screenings.end')} </span><time dateTime={screening.endsAt}>{formatTime(screening.endsAt, locale)}</time></span>
                      </div>
                      <div className="admin-running-order__film">
                        <h3>{screening.movieTitle}</h3>
                        <div className="admin-running-order__badges"><AuditoriumBadge auditorium={String(screening.cinemaId)} /><span className="admin-table__format">{t(getProjectionFormat(cinema) === '3D' ? 'admin.dashboard.format3d' : 'admin.dashboard.format2d')}</span>{Date.parse(screening.startsAt) <= now ? <span className="admin-running-order__now">{t('admin.dashboard.inProgress')}</span> : null}</div>
                      </div>
                      <div className="admin-running-order__occupancy">
                        <span>{t('admin.dashboard.occupancy', { booked: count(occupancy.booked), total: count(occupancy.total) })}</span>
                        <progress className={`admin-table__bar${occupancy.isBusy ? ' is-almost-full' : ''}`} max={100} value={occupancy.percent} aria-label={t('admin.dashboard.occupancyAria', { title: screening.movieTitle, percent: count(occupancy.percent) })} />
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
            <p className="admin-dashboard__panel-note"><i className="bi bi-arrow-repeat" aria-hidden="true" />{t('admin.dashboard.refreshNote')}</p>
          </section>

          <aside className="admin-dashboard__panel" aria-labelledby="admin-operations-title">
            <header className="admin-dashboard__panel-heading"><div><span className="admin-dashboard__kicker">{t('admin.dashboard.operations')}</span><h2 id="admin-operations-title">{t('admin.dashboard.hallStatus')}</h2></div><i className="bi bi-display" aria-hidden="true" /></header>
            {cinemaList.length === 0 ? <EmptyState icon="bi-display" title={t('admin.dashboard.emptyCinemas')} description={t('admin.dashboard.emptyCinemasDescription')} /> : (
              <ul className="admin-hall-status">
                {cinemaList.map(cinema => (
                  <li key={cinema.id}>
                    <AuditoriumBadge auditorium={String(cinema.id)} />
                    <h3>{cinemaName(cinema.name)}</h3>
                    <div><span>{seats(cinema.total_seats)}</span><span>{t('admin.dashboard.showsToday', { count: count(programme.todayScreenings.filter(screening => screening.cinemaId === cinema.id).length) })}</span></div>
                  </li>
                ))}
              </ul>
            )}
            <section className="admin-dashboard__routines" aria-labelledby="admin-routines-title">
              <h3 id="admin-routines-title">{t('admin.dashboard.routines')}</h3>
              <ul>
                <li><i className="bi bi-clock-history" aria-hidden="true" /><div><strong>{t('admin.dashboard.cleaningTitle')}</strong><p>{t('admin.dashboard.cleaningRule')}</p></div></li>
                <li><i className="bi bi-ticket-perforated" aria-hidden="true" /><div><strong>{t('admin.dashboard.releaseTitle')}</strong><p>{t('admin.dashboard.releaseRule')}</p></div></li>
                <li><i className="bi bi-people" aria-hidden="true" /><div><strong>{t('admin.dashboard.ticketLimitTitle')}</strong><p>{t('admin.dashboard.ticketLimitRule')}</p></div></li>
              </ul>
            </section>
          </aside>
        </div>
      ) : null}
    </div>
  )
}
