import { useTranslation } from '../context/LocaleContext'
import type { SimpleTranslationKey } from '../i18n'
import { useId, useRef, useState, type KeyboardEvent } from 'react'
import type { ScreeningSeatStatus } from '../types'

interface Props {
  seats: ScreeningSeatStatus[]
  selectedIds: number[]
  onToggle: (seatId: number) => void
}

type SeatState = 'free' | 'selected' | 'booked' | 'wheelchair'

const LABELS: Record<SeatState, SimpleTranslationKey> = {
  free: 'seatMap.free',
  selected: 'seatMap.selected',
  booked: 'seatMap.booked',
  wheelchair: 'seatMap.wheelchair',
}

function seatState(seat: ScreeningSeatStatus, selected: boolean): SeatState {
  if (seat.status !== 'available') return 'booked'
  if (selected) return 'selected'
  return seat.is_wheelchair || seat.seat_type === 'wheelchair' ? 'wheelchair' : 'free'
}

export default function SeatMap({ seats, selectedIds, onToggle }: Props) {
  const { t } = useTranslation()
  const rows = [...new Set(seats.map(s => s.row_label))].sort()
  const columns = Math.max(1, ...rows.map(row => seats.filter(seat => seat.row_label === row).length))
  const orderedSeats = [...seats].sort((a, b) =>
    a.row_label.localeCompare(b.row_label) || a.seat_number - b.seat_number,
  )
  const available = orderedSeats.filter(seat => seat.status === 'available')
  const [focusedId, setFocusedId] = useState<number | null>(null)
  const activeId = available.find(seat => seat.id === focusedId)?.id ?? available[0]?.id
  const buttons = useRef(new Map<number, HTMLButtonElement>())
  const instructionsId = useId()

  function navigate(event: KeyboardEvent<HTMLButtonElement>, seat: ScreeningSeatStatus) {
    const inRow = available.filter(s => s.row_label === seat.row_label)
    const index = inRow.findIndex(s => s.id === seat.id)
    let next: ScreeningSeatStatus | undefined

    switch (event.key) {
      case 'ArrowRight': next = inRow[index + 1]; break
      case 'ArrowLeft': next = inRow[index - 1]; break
      case 'Home': next = inRow[0]; break
      case 'End': next = inRow.at(-1); break
      case 'ArrowDown':
      case 'ArrowUp': {
        const freeRows = rows.filter(row => available.some(s => s.row_label === row))
        const direction = event.key === 'ArrowDown' ? 1 : -1
        const nextRow = freeRows[freeRows.indexOf(seat.row_label) + direction]
        // Keep the column where possible; ties go to the lower seat number.
        next = available.filter(s => s.row_label === nextRow).reduce<ScreeningSeatStatus | undefined>(
          (nearest, candidate) => !nearest ||
            Math.abs(candidate.seat_number - seat.seat_number) < Math.abs(nearest.seat_number - seat.seat_number)
            ? candidate : nearest,
          undefined,
        )
        break
      }
      default: return
    }

    event.preventDefault()
    if (!next) return
    setFocusedId(next.id)
    const button = buttons.current.get(next.id)
    button?.focus({ preventScroll: true })
    button?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  return (
    <div className={`fv-seatmap fv-seatmap--columns-${columns}`} role="region" aria-label={t('seatMap.title')} aria-describedby={instructionsId}>
      <p id={instructionsId} className="visually-hidden">
        {t('seatMap.instructions')}
      </p>
      <div className="fv-seatmap__screen" aria-hidden="true">{t('seatMap.screen')}</div>

      <div className="fv-seatmap__scroll">
        <div className="fv-seatmap__rows">
          {rows.map(row => (
            <div key={row} className="fv-seatmap__row" role="group" aria-label={t('seatMap.row', { row })}>
              <span className="fv-seatmap__label" aria-hidden="true">{row}</span>
              <div className={`fv-seatmap__seats fv-seatmap__seats--count-${orderedSeats.filter(s => s.row_label === row).length}`}>
                {orderedSeats
                  .filter(s => s.row_label === row)
                  .map(s => {
                    const state = seatState(s, selectedIds.includes(s.id))
                    const wheelchair = s.is_wheelchair || s.seat_type === 'wheelchair'
                    return (
                      <button
                        key={s.id}
                        ref={button => {
                          if (button) buttons.current.set(s.id, button)
                          else buttons.current.delete(s.id)
                        }}
                        type="button"
                        className={`fv-seat fv-seat--${state}`}
                        disabled={state === 'booked'}
                        tabIndex={s.id === activeId ? 0 : -1}
                        aria-pressed={state === 'selected'}
                        aria-label={t(wheelchair ? 'seatMap.wheelchairAria' : 'seatMap.seatAria', { row, seat: s.seat_number, status: t(state === 'wheelchair' ? LABELS.free : LABELS[state]) })}
                        onFocus={() => setFocusedId(s.id)}
                        onKeyDown={event => navigate(event, s)}
                        onClick={() => onToggle(s.id)}
                      >
                        {wheelchair ? '♿' : s.seat_number}
                      </button>
                    )
                  })}
              </div>
              <span className="fv-seatmap__label" aria-hidden="true">{row}</span>
            </div>
          ))}
        </div>
      </div>

      <ul className="fv-seatmap__legend">
        {(Object.keys(LABELS) as SeatState[]).map(state => (
          <li key={state}>
            <span className={`fv-seat fv-seatmap__dot fv-seat--${state}`} aria-hidden="true" />
            {t(LABELS[state])}
          </li>
        ))}
      </ul>
    </div>
  )
}
