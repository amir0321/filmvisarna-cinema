export function getMovieUrl(movieId: number): string {
  return `/movies/${movieId}`
}

// Update when the booking flow is merged
export function getBookingUrl(screeningId: number): string {
  return `/booking/${screeningId}`
}
