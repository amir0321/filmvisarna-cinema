import { useState } from 'react'
import { updateAdminMenuItem } from '../../api/kiosk'
import { useTranslation } from '../../context/LocaleContext'
import { useAdminMenuItems, usePagination } from '../../hooks'
import { translateApiError } from '../../i18n/mappers'
import type { AdminMenuItem } from '../../types'
import { EmptyState } from '../../components/EmptyState'
import Pagination from '../../components/Pagination'
import { FilterPillGroup } from '../../components/Pills'
import { CardListSkeleton } from '../../components/Skeleton'
import { InlineFeedback, type InlineFeedbackVariant } from '../../components/Toast'
import KioskItemFormModal from '../../components/admin/KioskItemFormModal'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminStatCard from '../../components/admin/AdminStatCard'
import KioskTable from '../../components/admin/KioskTable'
import { KIOSK_CATEGORIES, getKioskCategory, type KioskCategory } from '../../utils/kiosk'

export default function AdminKiosk() {
  const { t, locale } = useTranslation()
  const { data, loading, error, refetch, setData } = useAdminMenuItems()
  const items = data ?? []
  const activeCount = items.filter((item) => item.isAvailable).length
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<KioskCategory | 'all'>('all')
  const [savingId, setSavingId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ variant: InlineFeedbackVariant; message: string } | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AdminMenuItem | null>(null)

  const categoryOptions = [
    { value: 'all', label: t('admin.kiosk.category.all') },
    ...Object.entries(KIOSK_CATEGORIES).map(([value, { labelKey }]) => ({ value, label: t(labelKey) })),
  ]

  const query = search.trim().toLowerCase()
  const filteredItems = items
    .filter((item) => category === 'all' || getKioskCategory(item) === category)
    .filter((item) => `${item.name} ${item.description ?? ''}`.toLowerCase().includes(query))

  const pagination = usePagination(filteredItems, 10)

  async function toggleAvailable(item: AdminMenuItem) {
    setSavingId(item.id)
    setFeedback(null)
    try {
      const updated = await updateAdminMenuItem(item.id, {
        isAvailable: !item.isAvailable,
      })
      // Swap in the saved row instead of reloading the whole list
      setData((current) => current?.map((row) => (row.id === updated.id ? updated : row)) ?? null)
    } catch (err) {
      setFeedback({
        variant: 'danger',
        message: err instanceof Error ? translateApiError(err.message, locale) : t('admin.kiosk.saveError'),
      })
    } finally {
      setSavingId(null)
    }
  }

  function openForm(item: AdminMenuItem | null) {
    setEditingItem(item)
    setIsFormOpen(true)
  }

  async function handleSaved(message: string) {
    setIsFormOpen(false)
    setFeedback({ variant: 'success', message })
    await refetch()
  }

  return (
    <div className="admin-kiosk">
      <AdminPageHeader title={t('nav.kioskAssortment')} subtitle={t('admin.kiosk.subtitle')} />

      <div className="admin-stats">
        <AdminStatCard
          label={t('admin.kiosk.stats.total')}
          value={t('admin.kiosk.stats.count', { count: items.length })}
          color="info"
        />
        <AdminStatCard
          label={t('admin.kiosk.stats.active')}
          value={t('admin.kiosk.stats.count', { count: activeCount })}
          color="success"
        />
        <AdminStatCard
          label={t('admin.kiosk.stats.inactive')}
          value={t('admin.kiosk.stats.count', { count: items.length - activeCount })}
          color="warning"
        />
      </div>

      <div className="admin-kiosk__search-row">
        <div className="admin-search">
          <label htmlFor="kiosk-search" className="visually-hidden">
            {t('admin.kiosk.searchLabel')}
          </label>
          <i className="bi bi-search" aria-hidden="true"></i>
          <input
            id="kiosk-search"
            type="search"
            className="form-control"
            placeholder={t('admin.kiosk.searchPlaceholder')}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              pagination.setPage(1)
            }}
          />
        </div>
        <button type="button" className="btn btn-danger admin-toolbar__create" onClick={() => openForm(null)}>
          <i className="bi bi-plus-lg me-2" aria-hidden="true"></i>
          {t('admin.kiosk.add')}
        </button>
      </div>

      <FilterPillGroup
        ariaLabel={t('admin.kiosk.categoryAria')}
        variant="genre"
        options={categoryOptions}
        value={category}
        onChange={(value) => {
          setCategory(value as KioskCategory | 'all')
          pagination.setPage(1)
        }}
        className="mb-4"
      />

      {feedback && <InlineFeedback variant={feedback.variant} message={feedback.message} className="mb-3" />}

      {loading && <CardListSkeleton count={4} />}

      {error && (
        <EmptyState
          variant="error"
          title={t('admin.kiosk.loadError')}
          description={translateApiError(error, locale)}
          actionLabel={t('common.retry')}
          onAction={refetch}
        />
      )}

      {!loading && !error && filteredItems.length === 0 && (
        <EmptyState
          icon="bi-search"
          title={t('admin.kiosk.emptyTitle')}
          description={t('admin.kiosk.emptyDescription')}
        />
      )}

      {!loading && !error && filteredItems.length > 0 && (
        <>
          <KioskTable
            items={pagination.pageItems}
            savingId={savingId}
            onEdit={openForm}
            onToggleAvailable={toggleAvailable}
          />
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
          />
        </>
      )}

      {isFormOpen && (
        <KioskItemFormModal item={editingItem} onClose={() => setIsFormOpen(false)} onSaved={handleSaved} />
      )}
    </div>
  )
}

