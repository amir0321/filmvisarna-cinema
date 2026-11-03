export function getMovieUrl(movieId: number): string {
  return `/filmer/${movieId}`
}

export function getBookingUrl(screeningId: number): string {
  return `/boka/${screeningId}`
}
