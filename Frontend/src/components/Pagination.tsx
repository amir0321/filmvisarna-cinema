import { useTranslation } from '../context/LocaleContext'

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  ariaLabel?: string
  className?: string
}

function getVisiblePages(page: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (page <= 4) return [1, 2, 3, 4, 5, 'end', totalPages]
  if (page >= totalPages - 3) {
    return [1, 'start', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, 'start', page - 1, page, page + 1, 'end', totalPages]
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  ariaLabel,
  className = '',
}: PaginationProps) {
  const { t } = useTranslation()
  if (totalPages <= 1) return null

  return (
    <nav className={['fv-pagination', className].filter(Boolean).join(' ')} aria-label={ariaLabel ?? t('pagination.label')}>
      <button
        type="button"
        className="fv-pagination__btn"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <i className="bi bi-chevron-left" aria-hidden="true"></i>
        {t('pagination.previous')}
      </button>

      <div className="fv-pagination__pages">
        {getVisiblePages(page, totalPages).map((item) =>
          typeof item === 'number' ? (
            <button
              key={item}
              type="button"
              className={`fv-pagination__btn${item === page ? ' is-active' : ''}`}
              aria-label={t('pagination.page', { page: item })}
              aria-current={item === page ? 'page' : undefined}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          ) : (
            <span key={item} className="fv-pagination__ellipsis" aria-hidden="true">…</span>
          ),
        )}
      </div>

      <span className="fv-pagination__mobile-status" aria-hidden="true">
        {t('pagination.status', { page, total: totalPages })}
      </span>
      <span className="visually-hidden" role="status" aria-atomic="true">
        {t('pagination.status', { page, total: totalPages })}
      </span>

      <button
        type="button"
        className="fv-pagination__btn"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        {t('pagination.next')}
        <i className="bi bi-chevron-right" aria-hidden="true"></i>
      </button>
    </nav>
  )
}
