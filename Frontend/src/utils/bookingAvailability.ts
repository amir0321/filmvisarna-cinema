export interface TicketCounts {
  adult: number
  senior: number
  child: number
}

export function limitTicketCounts(counts: TicketCounts, availableSeats: number): TicketCounts {
  let remaining = Math.max(0, Math.min(10, availableSeats))
  const result: TicketCounts = { adult: 0, senior: 0, child: 0 }
  for (const type of ['adult', 'senior', 'child'] as const) {
    result[type] = Math.min(Math.max(0, Math.trunc(counts[type])), remaining)
    remaining -= result[type]
  }
  return result
}
