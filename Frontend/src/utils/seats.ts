import type { ScreeningSeatStatus } from '../types'

const ROW_ORDER = ['E', 'F', 'D', 'G', 'C', 'H', 'B', 'I', 'A', 'J']

export function pickBestSeats(seats: ScreeningSeatStatus[], count: number): number[] {
  if (count <= 0) return []

  const free = seats.filter(s => s.status === 'available' && !s.is_wheelchair)
  const otherRows = [...new Set(seats.map(s => s.row_label))]
    .filter(r => !ROW_ORDER.includes(r))
    .sort()
  const rows = [...ROW_ORDER, ...otherRows]

  const inRow = (row: string) =>
    free.filter(s => s.row_label === row).sort((a, b) => a.seat_number - b.seat_number)

  // 1. Seats next to each other in one row
  for (const row of rows) {
    const list = inRow(row)
    for (let i = 0; i + count <= list.length; i++) {
      const group = list.slice(i, i + count)
      if (group[count - 1].seat_number - group[0].seat_number === count - 1) {
        return group.map(s => s.id)
      }
    }
  }

  // 2. Otherwise single free seats, in the same row order
  const picked: number[] = []
  for (const row of rows) {
    for (const s of inRow(row)) {
      picked.push(s.id)
      if (picked.length === count) return picked
    }
  }
  return picked
}