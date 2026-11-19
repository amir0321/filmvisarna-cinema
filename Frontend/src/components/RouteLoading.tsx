import { useTranslation } from '../context/LocaleContext'

export default function RouteLoading() {
  const { t } = useTranslation()
  return (
    <p className="text-secondary p-4" role="status">
      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
      {t('common.loadingPage')}
    </p>
  )
}
