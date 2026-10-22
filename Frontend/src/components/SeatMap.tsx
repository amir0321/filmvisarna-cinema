import type { Seat } from '../types'

interface Props {
  seats: Seat[]
  selectedIds: number[]
  onToggle: (seatId: number) => void
}

export default function SeatMap({ seats, selectedIds, onToggle }: Props) {
  const rows = [...new Set(seats.map(s => s.row_label))].sort()

  return (
    <div>
      <p>Select</p>
      {rows.map(row => (
        <div key={row} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
          <strong style={{ width: 20 }}>{row}</strong>
          {seats
            .filter(s => s.row_label === row)
            .sort((a, b) => b.seat_number - a.seat_number) // seat 1 is on the right
            .map(s => {
              const taken = s.status !== 'available'
              const selected = selectedIds.includes(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={taken}
                  aria-pressed={selected}
                  aria-label={`Rad ${row}, stol ${s.seat_number}${taken ? ', upptagen' : ''}`}
                  onClick={() => onToggle(s.id)}
                  style={{
                    width: 32,
                    height: 32,
                    background: taken ? '#999' : selected ? '#2a7' : '#eee',
                  }}
                >
                  {s.seat_number}
                </button>
              )
            })}
        </div>
      ))}
    </div>
  )
}