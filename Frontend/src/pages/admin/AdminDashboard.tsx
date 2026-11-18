import { useTranslation } from '../../context/LocaleContext'
import { Link } from 'react-router'
import { Badge } from '../../components/Badge'

export default function AdminDashboard() {
  const { t } = useTranslation()
  const cards = [
    {
      title: t('nav.bookingsCashier'),
      description: t('admin.dashboard.bookings'),
      path: '/admin/bokningar',
      icon: 'bi-ticket-perforated',
      badge: t('admin.dashboard.current'),
    },
    {
      title: t('movieDetails.scheduleHeading'),
      description: t('admin.dashboard.screenings'),
      path: '/admin/visningar',
      icon: 'bi-calendar3',
      badge: t('nav.schedule'),
    },
    {
      title: t('nav.movieArchive'),
      description: t('admin.dashboard.movies'),
      path: '/admin/filmer',
      icon: 'bi-film',
      badge: t('admin.dashboard.archive'),
    },
    {
      title: t('nav.cinemas'),
      description: t('admin.dashboard.cinemas'),
      path: '/admin/salonger',
      icon: 'bi-display',
      badge: t('nav.cinemas'),
    },
  ]

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">{t('admin.dashboard.title')}</h1>
          <p className="text-secondary mb-0">{t('admin.dashboard.intro')}</p>
        </div>
      </div>

      <div className="row g-4">
        {cards.map((c) => (
          <div key={c.path} className="col-12 col-md-6 col-lg-3">
            <div className="card h-100 bg-card shadow-sm">
              <div className="card-body d-flex flex-column p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <i className={`bi ${c.icon} text-danger fs-2`} aria-hidden="true"></i>
                  <Badge variant="muted">{c.badge}</Badge>
                </div>
                <h2 className="h5 card-title fw-semibold mb-0">{c.title}</h2>
                <p className="card-text text-secondary small flex-grow-1">{c.description}</p>
                <Link to={c.path} className="btn btn-outline-danger btn-sm mt-3 w-100">
                  {t('admin.dashboard.openModule')}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
