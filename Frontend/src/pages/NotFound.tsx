import { Link } from 'react-router'
import { useTranslation } from '../context/LocaleContext'

export default function NotFound() {
  const { t } = useTranslation()

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-body text-body p-4">
      <div className="text-center p-5 bg-card border rounded-3 shadow mw-520">
        <div className="text-danger display-1 fw-bold mb-3">404</div>
        <h1 className="h2 fw-bold mb-3">{t('notFound.title')}</h1>
        <p className="text-secondary mb-4">
          {t('notFound.description')}
        </p>
        <Link to="/" className="btn btn-danger px-4 py-2 fw-semibold">
          <i className="bi bi-house-door me-2" aria-hidden="true"></i> {t('notFound.backHome')}
        </Link>
      </div>
    </div>
  )
}
