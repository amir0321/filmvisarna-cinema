export interface PriceLine {
  price: number
  quantity: number
}

export function sumLines(lines: PriceLine[]): number {
  return lines.reduce((sum, l) => sum + l.price * l.quantity, 0)
}

// "1 vuxen, 2 barn" -> one priceGroupId per seat, in seat order
export function assignTickets(
  seatIds: number[],
  counts: { priceGroupId: number; quantity: number }[],
): { seatId: number; priceGroupId: number }[] {
  const groupIds = counts.flatMap(c => Array(c.quantity).fill(c.priceGroupId) as number[])
  if (groupIds.length !== seatIds.length) return []
  return seatIds.map((seatId, i) => ({ seatId, priceGroupId: groupIds[i] }))
}

export const formatSek = (n: number) =>
  new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(n)