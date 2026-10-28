import type { ScreeningSeatStatus } from '../types'

interface Props {
  seats: ScreeningSeatStatus[]
  selectedIds: number[]
  onToggle: (seatId: number) => void
}

type SeatState = 'free' | 'selected' | 'booked' | 'wheelchair'

const LABELS: Record<SeatState, string> = {
  free: 'Ledig',
  selected: 'Vald',
  booked: 'Bokad',
  wheelchair: 'Rullstol',
}

function seatState(seat: ScreeningSeatStatus, selected: boolean): SeatState {
  if (seat.status !== 'available') return 'booked'
  if (selected) return 'selected'
  return seat.is_wheelchair ? 'wheelchair' : 'free'
}

export default function SeatMap({ seats, selectedIds, onToggle }: Props) {
  const rows = [...new Set(seats.map(s => s.row_label))].sort()

  return (
    <div className="fv-seatmap">
      <div className="fv-seatmap__screen">BIODUK</div>

      {rows.map(row => (
        <div key={row} className="fv-seatmap__row">
          <span className="fv-seatmap__label">{row}</span>
          <div className="fv-seatmap__seats">
            {seats
              .filter(s => s.row_label === row)
              .sort((a, b) => b.seat_number - a.seat_number)
              .map(s => {
                const state = seatState(s, selectedIds.includes(s.id))
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`fv-seat fv-seat--${state}`}
                    disabled={state === 'booked'}
                    aria-pressed={state === 'selected'}
                    aria-label={`Rad ${row}, stol ${s.seat_number}, ${LABELS[state]}`}
                    onClick={() => onToggle(s.id)}
                  >
                    {s.is_wheelchair ? '♿' : s.seat_number}
                  </button>
                )
              })}
          </div>
          <span className="fv-seatmap__label">{row}</span>
        </div>
      ))}

      <ul className="fv-seatmap__legend">
        {(Object.keys(LABELS) as SeatState[]).map(state => (
          <li key={state}>
            <span className={`fv-seat fv-seat--${state}`} aria-hidden="true" />
            {LABELS[state]}
          </li>
        ))}
      </ul>
    </div>
  )
}