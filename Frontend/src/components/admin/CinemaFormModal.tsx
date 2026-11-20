import { useState } from 'react'
import { useTranslation } from '../../context/LocaleContext'
import { translateApiError } from '../../i18n/mappers'
import { Modal } from '../Modal'
import SeatPreviewGrid from './SeatPreviewGrid'
import type { WheelchairSeatInput } from '../../api/cinemas'
import type { CinemaDetail } from '../../types/cinema'

const TECH_OPTIONS = ['2D', '3D', 'Dolby Atmos', '4K Laser'] as const

export interface CinemaFormValues {
  name: string
  rows: number
  seatsPerRow: number
  tech: string[]
  wheelchairSeats: WheelchairSeatInput[]
}

interface CinemaFormModalProps {
  cinema: CinemaDetail | null // null = add new, otherwise edit
  saving: boolean
  error: Parameters<typeof translateApiError>[0] | null
  onClose: () => void
  onSubmit: (values: CinemaFormValues) => void
}

// "Rad A: Stol 1, 10" or "A: 1, 10; B: 3" -> [{row:'A',number:1}, ...]. null = invalid.
function parseWheelchair(
  text: string,
  rows: number,
  seatsPerRow: number,
): WheelchairSeatInput[] | null {
  const seats: WheelchairSeatInput[] = []
  for (const segment of text.split(/[;·\n]/)) {
    if (!segment.trim()) continue
    const match = segment.match(/^\s*(?:rad|row)?\s*([A-Za-z])\s*:\s*(?:stol|seat)?\s*(.+)$/i)
    if (!match) return null
    const [, rowRaw = '', list = ''] = match
    const row = rowRaw.toUpperCase()
    if (row.charCodeAt(0) - 65 >= rows) return null
    for (const part of list.split(/[,\s]+/).filter(Boolean)) {
      const number = Number(part)
      if (!Number.isInteger(number) || number < 1 || number > seatsPerRow) return null
      if (!seats.some((s) => s.row === row && s.number === number)) {
        seats.push({ row, number })
      }}}
  return seats
}

function wheelchairToText(cinema: CinemaDetail | null): string {
  if (!cinema) return ''
  const byRow = new Map<string, number[]>()
  for (const s of cinema.seats) {
    if (s.isWheelchair === true || s.seatType === 'wheelchair') {
      byRow.set(s.row, [...(byRow.get(s.row) ?? []), s.number])
    }}
  return [...byRow]
    .map(([row, numbers]) => `${row}: ${[...numbers].sort((a, b) => a - b).join(', ')}`)
    .join('; ')
}

interface StepperProps {
  id: string
  label: string
  value: number
  min: number
  max: number
  disabled: boolean
  onChange: (value: number) => void
}

function Stepper({ id, label, value, min, max, disabled, onChange }: StepperProps) {
  const { t } = useTranslation()
  return (
    <div className="fv-cinema-form__field">
      <span id={`${id}-label`} className="fv-cinema-form__label">{label}</span>
      <div className="fv-stepper" role="group" aria-labelledby={`${id}-label`}>
        <button
          type="button"
          className="btn btn-secondary-outline"
          onClick={() => onChange(value - 1)}
          disabled={disabled || value <= min}
          aria-label={t('admin.cinemas.modal.decrease')}
        >
          −
        </button>
        <output className="fv-stepper__value">{value}</output>
        <button
          type="button"
          className="btn btn-secondary-outline"
          onClick={() => onChange(value + 1)}
          disabled={disabled || value >= max}
          aria-label={t('admin.cinemas.modal.increase')}
        >
          +
        </button>
      </div>
    </div>
  )
}

export default function CinemaFormModal({
  cinema,
  saving,
  error,
  onClose,
  onSubmit,
}: CinemaFormModalProps) {
  const { t, locale } = useTranslation()
  const isEdit = cinema !== null

  const [name, setName] = useState(cinema?.name ?? '')
  const [rows, setRows] = useState(
    cinema ? new Set(cinema.seats.map((s) => s.row)).size : 8,
  )
  const [seatsPerRow, setSeatsPerRow] = useState(
    cinema ? Math.max(0, ...cinema.seats.map((s) => s.number)) : 10,
  )
  const [tech, setTech] = useState<string[]>(
    (cinema?.tech ?? '').split(',').map((s) => s.trim()).filter(Boolean),
  )
    // A new auditorium gets A1 and A2 as wheelchair seats from the backend, so the preview starts the same way
  const [wheelchairText, setWheelchairText] = useState(cinema ? wheelchairToText(cinema) : 'A: 1, 2')

   const wheelchairSeats = parseWheelchair(wheelchairText, rows, seatsPerRow)
  // The backend can only replace wheelchair seats, never clear them, so at least one is required
  const wheelchairError =
    wheelchairSeats === null ? 'invalid' : wheelchairSeats.length === 0 ? 'required' : null
  const canSave = name.trim().length > 0 && wheelchairError === null && !saving

  const toggleTech = (option: string) =>
    setTech((prev) =>
      prev.includes(option) ? prev.filter((x) => x !== option) : [...prev, option],
    )

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSave || wheelchairSeats === null) return
    onSubmit({ name: name.trim(), rows, seatsPerRow, tech, wheelchairSeats })
  }

  return (
    <Modal
      isOpen
      onClose={saving ? () => {} : onClose}
      size="md"
      title={t(isEdit ? 'admin.cinemas.modal.editTitle' : 'admin.cinemas.modal.addTitle')}
      id="cinema-form-modal">
      <form onSubmit={handleSubmit} noValidate>
        <Modal.Body className="fv-cinema-form">
          <div className="fv-cinema-form__field">
            <label htmlFor="cinema-name" className="fv-cinema-form__label">
              {t('admin.cinemas.modal.name')}
            </label>
            <input
              id="cinema-name"
              className="form-control"
              value={name}
              maxLength={100}
              placeholder={t('admin.cinemas.modal.namePlaceholder')}
              onChange={(e) => setName(e.target.value)}/>
          </div>

          <div className="fv-cinema-form__steppers">
            <Stepper
              id="cinema-rows"
              label={t('admin.cinemas.modal.rows')}
              value={rows}
              min={1}
              max={26}
              disabled={isEdit}
              onChange={setRows}/>
            <Stepper
              id="cinema-seats"
              label={t('admin.cinemas.modal.seatsPerRow')}
              value={seatsPerRow}
              min={1}
              max={50}
              disabled={isEdit}
              onChange={setSeatsPerRow}/>
          </div>
          {isEdit && <p className="fv-cinema-form__hint">{t('admin.cinemas.modal.lockedHint')}</p>}

          <div className="fv-cinema-form__field">
            <span className="fv-cinema-form__label">{t('admin.cinemas.modal.tech')}</span>
            <div className="fv-cinema-form__techs">
              {TECH_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="fv-cinema-form__tech"
                  aria-pressed={tech.includes(option)}
                  onClick={() => toggleTech(option)}>
                  {option}
                </button>))}
            </div>
          </div>

          <div className="fv-cinema-form__field">
            <label htmlFor="cinema-wheelchair" className="fv-cinema-form__label">
              {t('admin.cinemas.modal.wheelchair')}
            </label>
               <input
              id="cinema-wheelchair"
              className="form-control"
              value={wheelchairText}
              placeholder={t('admin.cinemas.modal.wheelchairPlaceholder')}
              aria-invalid={wheelchairError !== null}
              aria-describedby={wheelchairError ? 'cinema-wheelchair-error' : undefined}
              onChange={(e) => setWheelchairText(e.target.value)}/>
            {wheelchairError && (
              <p id="cinema-wheelchair-error" className="fv-cinema-form__error" role="alert">
                {t(
                  wheelchairError === 'invalid'
                    ? 'admin.cinemas.modal.wheelchairInvalid'
                    : 'admin.cinemas.modal.wheelchairRequired',
                )} </p>)}
          </div>

          <section className="fv-cinema-form__preview" aria-label={t('admin.cinemas.modal.preview')}>
            <div className="fv-cinema-form__preview-head">
              <h3 className="fv-cinema-form__label mb-0">{t('admin.cinemas.modal.preview')}</h3>
              <span className="fv-admin-cinema__badge">
                {t('admin.cinemas.modal.previewSeats', { seats: rows * seatsPerRow })}
              </span>
            </div>
            <SeatPreviewGrid
              rows={rows}
              seatsPerRow={seatsPerRow}
              wheelchairSeats={
                new Set((wheelchairSeats ?? []).map((s) => `${s.row}-${s.number}`))}/>
          </section>

          {error ? (
            <div className="alert alert-danger py-2 px-3 small mb-0" role="alert">
              {translateApiError(error, locale)}
            </div>
          ) : null}
        </Modal.Body>

        <Modal.Footer>
          <button type="button" className="btn btn-secondary-outline" onClick={onClose} disabled={saving}>
            {t('admin.cinemas.modal.cancel')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={!canSave}>
            {t(saving ? 'admin.cinemas.modal.saving' : 'admin.cinemas.modal.save')}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  )}