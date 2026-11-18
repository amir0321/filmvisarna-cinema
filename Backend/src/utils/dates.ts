export type When = "today" | "tomorrow" | "weekend";

/** Today's calendar date in the given time zone, as YYYY-MM-DD. */
export function todayIn(timeZone: string, now = new Date()): string {
  // The en-CA locale formats dates as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * First and last calendar day (inclusive, YYYY-MM-DD) for a filter.
 *   today     the current day
 *   tomorrow  the next day
 *   weekend   the coming Saturday and Sunday. On a Saturday or Sunday it is the
 *             current weekend (screenings that already started are filtered out elsewhere).
 */
export function dateRange(
  when: When,
  timeZone: string,
  now = new Date(),
): { from: string; to: string } {
  const today = todayIn(timeZone, now);
  if (when === "today") return { from: today, to: today };
  if (when === "tomorrow") {
    const tomorrow = addDays(today, 1);
    return { from: tomorrow, to: tomorrow };
  }
  const dayOfWeek = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0 = Sunday ... 6 = Saturday
  const saturday =
    dayOfWeek === 0 ? addDays(today, -1) : addDays(today, 6 - dayOfWeek);
  return { from: saturday, to: addDays(saturday, 1) };
}
