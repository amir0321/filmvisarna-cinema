import { useState } from 'react'
import { createCinema, updateCinema, deleteCinema } from '../../api/cinemas'
import CinemaFormModal, { type CinemaFormValues } from '../../components/admin/CinemaFormModal'
import type { CinemaDetail } from '../../types/cinema'
import { useTranslation } from '../../context/LocaleContext'
import { useCinemas } from '../../hooks/useCinemas'
import { translateApiError } from '../../i18n/mappers'
import { EmptyState } from '../../components/EmptyState'
import { Skeleton } from '../../components/Skeleton'
import SeatPreviewGrid from '../../components/admin/SeatPreviewGrid'
import type { Seat } from '../../types/seat'
import { ApiError } from '../../api/client'
import AdminPageHeader from '../../components/admin/AdminPageHeader'

function isWheelchair(seat: Seat) {
  return seat.isWheelchair === true || seat.seatType === 'wheelchair'}

// Rows, seats per row and wheelchair seats are worked out from the seat list
function describeSeats(seats: Seat[]) {
  const rows = new Set(seats.map((s) => s.row)).size
  const seatsPerRow = Math.max(0, ...seats.map((s) => s.number))
  const wheelchair = seats.filter(isWheelchair)
  const keys = new Set(wheelchair.map((s) => `${s.row}-${s.number}`))
  const byRow = new Map<string, number[]>()
  for (const s of wheelchair) {
    byRow.set(s.row, [...(byRow.get(s.row) ?? []), s.number])}
  return { rows, seatsPerRow, keys, byRow }}

export default function AdminCinemas() {
  const { t, locale } = useTranslation()
  const { data, loading, error, refetch } = useCinemas()
  const cinemas = data ?? []
  const totalSeats = cinemas.reduce((sum, c) => sum + c.total_seats, 0)
  type ApiErrorInput = Parameters<typeof translateApiError>[0]

  // modal: null = closed, { cinema: null } = add new, { cinema } = edit
  const [modal, setModal] = useState<{ cinema: CinemaDetail | null } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<ApiErrorInput | null>(null)
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const closeModal = () => {
    setModal(null)
    setSaveError(null)
  }

  const handleSubmit = async (values: CinemaFormValues) => {
    if (!modal) return
    setSaving(true)
    setSaveError(null)
    setFeedback(null)
    let createdId: number | null = null
    try {
      const tech = values.tech.join(', ') || null
      if (modal.cinema) {
        await updateCinema(modal.cinema.id, {
          name: values.name,
          tech,
          wheelchairSeats: values.wheelchairSeats,
        })
      } else {
        const created = await createCinema({
          name: values.name,
          format: values.tech.join(' ') || null,
          tech,
          rows: values.rows,
          seatsPerRow: values.seatsPerRow,
        })
        createdId = created.id
        if (values.wheelchairSeats.length > 0) {
          await updateCinema(created.id, { wheelchairSeats: values.wheelchairSeats })
        }
      }
      closeModal()
      setFeedback({ kind: 'success', text: t('admin.cinemas.saved') })
      refetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (createdId !== null) {
        closeModal()
        setFeedback({ kind: 'error', text: translateApiError(message, locale) })
        refetch()
      } else {
        setSaveError(message)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    setFeedback(null)
    try {
      await deleteCinema(id)
      setFeedback({ kind: 'success', text: t('admin.cinemas.deleted') })
      refetch()
    } catch (err) {
      // 409 = the auditorium has screenings (backend rule): explain it clearly
      const text =
        err instanceof ApiError && err.status === 409
          ? t('admin.cinemas.deleteBlocked')
          : translateApiError(err instanceof Error ? err.message : String(err), locale)
      setFeedback({ kind: 'error', text })
    } finally {
      setDeletingId(null)
      setConfirmId(null)}}

  return (
    <div className="fv-admin-cinemas">
      <AdminPageHeader title={t('nav.cinemas')} subtitle={t('admin.cinemas.intro')} />
      <div className="fv-admin-cinemas__head">
        <div>
          <h2 className="fv-admin-cinemas__title">{t('admin.cinemas.sectionTitle')}</h2>
          {!loading && !error && (
            <p className="fv-admin-cinemas__summary">
              {t('admin.cinemas.sectionSummary', { count: cinemas.length, totalSeats })}
            </p> )}</div>
        <button type="button" className="btn btn-primary" onClick={() => setModal({ cinema: null })}>
          <i className="bi bi-plus-lg" aria-hidden="true" /> {t('admin.cinemas.add')}
        </button>
      </div>
      {feedback && (
        <p className={`fv-feedback fv-feedback--${feedback.kind}`} role="status">
          {feedback.text}</p>)}
      {loading && (
        <div className="fv-admin-cinemas__grid" role="status" aria-busy="true">
          <Skeleton variant="rect" height="420px" />
          <Skeleton variant="rect" height="420px" />
        </div>)}
      {!loading && error && (
        <EmptyState
          variant="error"
          title={t('salonger.errorTitle')}
          description={translateApiError(error, locale)}
          actionLabel={t('common.retry')}
          onAction={refetch}/>)}
      {!loading && !error && cinemas.length === 0 && (
        <EmptyState
          icon="bi-display"
          title={t('salonger.emptyTitle')}
          description={t('salonger.emptyDescription')} />)}
      {!loading && !error && cinemas.length > 0 && (
        <>
          <div className="fv-admin-cinemas__grid">
            {cinemas.map((cinema, index) => {
              const info = describeSeats(cinema.seats)
              const chips = (cinema.tech ?? '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
              const wheelchairText =
                info.byRow.size === 0
                  ? t('admin.cinemas.wheelchairNone')
                  : t('admin.cinemas.wheelchair', {
                      wheelchair: [...info.byRow]
                        .map(([row, numbers]) =>
                          t('admin.cinemas.wheelchairRow', {
                            row,
                            seats: [...numbers].sort((a, b) => a - b).join(', '),}),)
                        .join(' · '),})
      return (
        <article key={cinema.id} className="fv-admin-cinema">
            <header className="fv-admin-cinema__head">
              <div>
                <h3 className="fv-admin-cinema__name">{t('admin.cinemas.hallName', { n: index + 1 })}</h3>
                <p className="fv-admin-cinema__sub">{cinema.name}</p>
                </div>
                <span className="fv-admin-cinema__badge">
                      {t('admin.cinemas.seats', { seats: cinema.total_seats })}
                </span>
            </header>
            <dl className="fv-admin-cinema__stats">
                    <div><dt>{t('admin.cinemas.stat.rows')}</dt><dd>{info.rows}</dd></div>
                    <div><dt>{t('admin.cinemas.stat.seatsPerRow')}</dt><dd>{info.seatsPerRow}</dd></div>
                    <div><dt>{t('admin.cinemas.stat.format')}</dt><dd>{cinema.format ?? '–'}</dd></div>
                    <div><dt>{t('admin.cinemas.stat.tech')}</dt><dd>{chips[0] ?? '–'}</dd></div>
            </dl>
            <div className="fv-admin-cinema__map">
                <h4 className="fv-admin-cinema__map-title">{t('admin.cinemas.mapTitle')}</h4>
                    <SeatPreviewGrid
                      rows={info.rows}
                      seatsPerRow={info.seatsPerRow}
                      wheelchairSeats={info.keys}
                    />
            </div>
            <div className="fv-admin-cinema__info">
                    {chips.length > 0 && (
                      <ul className="fv-admin-cinema__chips">
                        {chips.map((chip) => (
                          <li key={chip}>{chip}</li>))}
                      </ul>)}
                <p className="fv-admin-cinema__wheelchair">
                <i className="bi bi-person-wheelchair" aria-hidden="true" /> {wheelchairText}</p>
              </div>
              <div className="fv-admin-cinema__actions">
                    <button
                      type="button"
                      className="btn btn-secondary-outline"
                      onClick={() => setModal({ cinema })}
                      disabled={deletingId === cinema.id}>
                      <i className="bi bi-pencil" aria-hidden="true" /> {t('admin.cinemas.modal.editTitle')}
                    </button>
                    {confirmId === cinema.id ? (
                    <div className="fv-admin-cinema__confirm" role="group" aria-label={t('admin.cinemas.deleteQuestion', { name: cinema.name })}>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => handleDelete(cinema.id)}
                          disabled={deletingId === cinema.id}>
                          {t('admin.cinemas.confirm')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary-outline"
                          onClick={() => setConfirmId(null)}
                          disabled={deletingId === cinema.id}>
                          {t('admin.cinemas.cancel')}
                        </button>
                    </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={() => setConfirmId(cinema.id)}>
                        <i className="bi bi-trash" aria-hidden="true" /> {t('admin.cinemas.delete')}
                      </button>)}
                  </div>
                </article>
              )})}
          </div>
        </>)}
       {modal && (
        <CinemaFormModal
          key={modal.cinema?.id ?? 'new'}
          cinema={modal.cinema}
          saving={saving}
          error={saveError}
          onClose={closeModal}
          onSubmit={handleSubmit}/>)}
    </div>)}
    