import type { Screening } from '../types/screening.ts'
import type { CinemaOverview } from '../types/cinema.ts'
import { todayIsoDate, toCinemaIsoDate } from './date.ts'

export function getDashboardProgramme(screenings: readonly Screening[], now: number) {
  const today = todayIsoDate(now)
  const todayScreenings = screenings.filter(screening => toCinemaIsoDate(screening.startsAt) === today)
  const upcoming = screenings.filter(screening => Date.parse(screening.startsAt) > now)
  // Keep in-progress shows in the running order until their end, then show the next arrivals.
  const next = screenings.filter(screening => Date.parse(screening.endsAt) > now)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)).slice(0, 5)

  return {
    today,
    todayScreenings,
    bookedToday: todayScreenings.reduce((sum, screening) => sum + (screening.bookedSeats ?? 0), 0),
    upcomingCount: upcoming.length,
    programmeDays: new Set(upcoming.map(screening => toCinemaIsoDate(screening.startsAt))).size,
    activeMovieIds: new Set(screenings.filter(screening => Date.parse(screening.endsAt) > now).map(screening => screening.movieId)),
    next,
  }
}

export function getScreeningOccupancy(screening: Screening, cinema?: CinemaOverview) {
  const total = Math.max(0, screening.totalSeats ?? cinema?.total_seats ?? 0)
  const booked = Math.max(0, screening.bookedSeats ?? 0)
  const ratio = total > 0 ? Math.min(100, booked / total * 100) : 0
  return { total, booked, percent: Math.round(ratio), isBusy: ratio > 80 }
}

// Cinema format describes projection technology (e.g. 4K), not necessarily 3D.
export function getProjectionFormat(cinema?: CinemaOverview): '2D' | '3D' {
  return /\b3D\b/i.test(cinema?.format ?? '') ? '3D' : '2D'
}
