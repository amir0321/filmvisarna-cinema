import { useRef, useState } from 'react'
import { Link } from 'react-router'
import apiClient from '../../api/client'
import { useCinemas, useMovies, usePagination, useScreenings } from '../../hooks'
import { useScreeningProgramme } from '../../hooks/useScreeningProgramme'
import type { Screening } from '../../types'
import DatePickerPopover from '../../components/DatePickerPopover'
import { EmptyState } from '../../components/EmptyState'
import Pagination from '../../components/Pagination'
import { FilterPillGroup } from '../../components/Pills'
import { CardListSkeleton } from '../../components/Skeleton'
import { InlineFeedback, type InlineFeedbackVariant } from '../../components/Toast'
import ScreeningFormModal from '../../components/admin/ScreeningFormModal'
import ScreeningsTable from '../../components/admin/ScreeningsTable'
import { addDaysToIsoDate, formatDateShort, toCinemaIsoDate, todayIsoDate } from '../../utils/date'

type Period = 'upcoming' | 'today' | 'tomorrow' | 'week'

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'upcoming', label: 'Alla kommande' },
  { value: 'today', label: 'Idag' },
  { value: 'tomorrow', label: 'Imorgon' },
  { value: 'week', label: 'Hela veckan' },
]

const PAGE_SIZE = 15

function isInPeriod(screening: Screening, period: Period, today: string): boolean {
  const date = toCinemaIsoDate(screening.startsAt)
  switch (period) {
    case 'upcoming':
      return true
    case 'today':
      return date === today
    case 'tomorrow':
      return date === addDaysToIsoDate(today, 1)
    case 'week':
      return date <= addDaysToIsoDate(today, 6)
  }
}

export default function AdminScreenings() {
  const today = todayIsoDate()
  const [period, setPeriod] = useState<Period>('upcoming')
  // Overrides the period chips
  const [pickedDate, setPickedDate] = useState<string | null>(null)
  const [cinemaId, setCinemaId] = useState('all')
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingScreening, setEditingScreening] = useState<Screening | null>(null)
  const [feedback, setFeedback] = useState<{ variant: InlineFeedbackVariant; message: string } | null>(null)
  const datePickerButtonRef = useRef<HTMLButtonElement>(null)
  const closeDatePicker = () => setIsDatePickerOpen(false)

  const { data: screenings, loading, error, refetch } = useScreenings()
  const { data: movies } = useMovies()
  const { data: cinemas } = useCinemas()
  const programme = useScreeningProgramme()

  const filteredScreenings = (screenings ?? [])
    .filter((screening) =>
      pickedDate ? toCinemaIsoDate(screening.startsAt) === pickedDate : isInPeriod(screening, period, today),
    )
    .filter((screening) => cinemaId === 'all' || String(screening.cinemaId) === cinemaId)

  const { page, totalPages, pageItems, setPage } = usePagination(filteredScreenings, PAGE_SIZE)

  function choosePeriod(nextPeriod: Period) {
    setPeriod(nextPeriod)
    setPickedDate(null)
    setPage(1)
  }

  function chooseDate(date: string) {
    setPickedDate(date)
    setPage(1)
  }

  function openForm(screening: Screening | null) {
    setEditingScreening(screening)
    setIsFormOpen(true)
  }

  async function handleSaved(message: string) {
    setIsFormOpen(false)
    setFeedback({ variant: 'success', message })
    await refetch()
  }

  async function handleCancel(screening: Screening) {
    try {
      await apiClient.delete(`/screenings/${screening.id}`)
      setFeedback({ variant: 'success', message: `${screening.movieTitle} har ställts in.` })
      await refetch()
    } catch (err) {
      setFeedback({
        variant: 'danger',
        message: err instanceof Error ? err.message : 'Det gick inte att ställa in visningen.',
      })
    }
  }

  return (
    <div className="admin-screenings">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-header__title">Visningsschema</h1>
          <p className="admin-page-header__subtitle">Schemalägg och hantera filmvisningar</p>
        </div>
        <nav aria-label="Brödsmulor">
          <ol className="admin-breadcrumb">
            <li>
              <Link to="/admin">Backoffice</Link>
            </li>
            <li aria-current="page">Visningsschema</li>
          </ol>
        </nav>
      </header>

      <div className="admin-toolbar">
        <div className="admin-toolbar__filters">
          <FilterPillGroup<string>
            ariaLabel="Period"
            options={PERIOD_OPTIONS}
            value={pickedDate ? '' : period}
            onChange={(value) => choosePeriod(value as Period)}
          />

          <button
            ref={datePickerButtonRef}
            type="button"
            className={`chip ${pickedDate ? 'chip-active' : 'chip-inactive'}`}
            aria-pressed={pickedDate !== null}
            aria-haspopup="dialog"
            aria-expanded={isDatePickerOpen}
            onClick={() => setIsDatePickerOpen((isOpen) => !isOpen)}
          >
            <i className="bi bi-calendar3 me-2" aria-hidden="true"></i>
            {pickedDate ? formatDateShort(pickedDate) : 'Välj datum'}
          </button>
          {isDatePickerOpen && (
            <DatePickerPopover
              id="admin-date-picker"
              anchorRef={datePickerButtonRef}
              selectedDate={pickedDate}
              programme={programme}
              minDate={programme.today}
              maxDate={programme.maxDate}
              onSelect={chooseDate}
              onClose={closeDatePicker}
            />
          )}

          <label htmlFor="admin-cinema-filter" className="visually-hidden">
            Salong
          </label>
          <select
            id="admin-cinema-filter"
            className="form-select admin-toolbar__select"
            value={cinemaId}
            onChange={(event) => {
              setCinemaId(event.target.value)
              setPage(1)
            }}
          >
            <option value="all">Alla salonger</option>
            {(cinemas ?? []).map((cinema) => (
              <option key={cinema.id} value={cinema.id}>
                {cinema.name}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="btn btn-danger admin-toolbar__create" onClick={() => openForm(null)}>
          <i className="bi bi-plus-lg me-2" aria-hidden="true"></i>
          Schemalägg ny visning
        </button>
      </div>

      {feedback && <InlineFeedback variant={feedback.variant} message={feedback.message} className="mb-3" />}

      {loading && <CardListSkeleton count={4} />}

      {error && (
        <EmptyState
          variant="error"
          title="Kunde inte ladda visningar"
          description={error}
          actionLabel="Försök igen"
          onAction={refetch}
        />
      )}

      {!loading && !error && filteredScreenings.length === 0 && (
        <EmptyState
          icon="bi-calendar-x"
          title="Inga visningar"
          description="Det finns inga visningar för vald period och salong."
          actionLabel="Schemalägg ny visning"
          onAction={() => openForm(null)}
        />
      )}

      {!loading && !error && filteredScreenings.length > 0 && (
        <>
          <p className="admin-screenings__count" role="status">
            {filteredScreenings.length} {filteredScreenings.length === 1 ? 'visning' : 'visningar'}
          </p>
          <ScreeningsTable
            screenings={pageItems}
            cinemas={cinemas ?? []}
            onEdit={openForm}
            onCancel={handleCancel}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-3" />
        </>
      )}

      {isFormOpen && (
        <ScreeningFormModal
          screening={editingScreening}
          movies={movies ?? []}
          cinemas={cinemas ?? []}
          onClose={() => setIsFormOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
