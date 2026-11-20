// TMDB publishes these poster widths. Let the browser match the rendered slot
// and pixel density instead of downloading w780 for every small film card.
export function tmdbPosterSrcSet(source: string | null | undefined): string | undefined {
  const match = source?.match(/^https:\/\/image\.tmdb\.org\/t\/p\/w(185|342|500|780)\/([^/?#]+\.(?:jpg|jpeg|png|webp))$/i)
  if (!match) return undefined
  const maximum = Number(match[1])
  return [185, 342, 500, 780].filter(width => width <= maximum)
    .map(width => `https://image.tmdb.org/t/p/w${width}/${match[2]} ${width}w`).join(', ')
}
