import type { Seat } from '../types/seat'

interface Props {
  seats: Seat[]
}

export function MiniAuditoriumMap({ seats }: Props) {
  // Group the flat seat list into rows: A -> [seats], B -> [seats] ...
  const grouped = new Map<string, Seat[]>()
  for (const seat of seats) {
    const list = grouped.get(seat.row) ?? []
    list.push(seat)
    grouped.set(seat.row, list)
  }

  const rows = [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, rowSeats]) => ({
      label,
      seats: [...rowSeats].sort((a, b) => a.number - b.number),
    }))

  // "Exempelval": three seats on row 4 (index 3), or middle row if fewer rows exist
  const exampleRow = rows.length > 3 ? 3 : Math.max(0, Math.ceil(rows.length / 2) - 1)

  return (
    <div className="fv-minimap" role="img" aria-label="Salongskarta">
      <p className="fv-minimap__title">Salongskarta</p>
      <div className="fv-minimap__screen">BIODUK</div>

      <div className="fv-minimap__rows">
        {rows.map((row, r) => (
          <div
            key={row.label}
            className={`fv-minimap__row${r === 0 ? ' fv-minimap__row--front' : ''}`}
          >
            <span className="fv-minimap__label">{row.label}</span>
            {row.seats.map((seat, i) => {
              const isWheelchair = seat.isWheelchair ?? seat.seatType === 'wheelchair'
              const isExample = r === exampleRow && i >= 2 && i <= 4
              const state = isWheelchair
                ? ' fv-minimap__seat--wheelchair'
                : isExample
                  ? ' fv-minimap__seat--example'
                  : ''
              return <span key={seat.id} className={`fv-minimap__seat${state}`} />
            })}
          </div>
        ))}
      </div>

      <div className="fv-minimap__legend">
        <span><i className="fv-minimap__dot" /> Ledig</span>
        <span><i className="fv-minimap__dot fv-minimap__dot--example" /> Exempelval</span>
        <span><i className="fv-minimap__dot fv-minimap__dot--wheelchair" /> Rullstol</span>
      </div>
    </div>
  )
}
