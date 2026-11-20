import type { SeedMovie } from './movieData.js';

// Film information: official A24 / NEON film pages (see Backend/README.md).
// These are original example reviews for the demo, never attributed to real critics.
const films = [
  { title: 'Past Lives', director: 'Celine Song', year: 2023, minutes: 105,
    countries: ['US', 'KR'], language: 'ko, en', distributor: 'A24 (USA)', trailer: 'kA244xewjcI',
    description: '<p>Barndomsvännerna Nora och Hae Sung återförenas i New York efter många år på olika kontinenter.</p><p>Ett stillsamt relationsdrama om livsval, tid och kärlekens möjligheter.</p>',
    quote: 'Ett finstämt möte mellan minnen och de liv vi faktiskt väljer att leva.' },
  { title: 'Aftersun', director: 'Charlotte Wells', year: 2022, minutes: 102,
    countries: ['GB', 'US'], language: 'en', distributor: 'A24 (USA)', trailer: 'G9jOaggGPKQ',
    description: '<p>Sophie minns en semester med sin pappa och försöker förstå människan bakom barndomens bilder.</p><p>Ett intimt drama där små vardagsögonblick får en ny betydelse i efterhand.</p>',
    quote: 'Semesterbilderna blir till ett varsamt och dröjande porträtt av en relation.' },
  { title: 'Perfect Days', director: 'Wim Wenders', year: 2023, minutes: 124,
    countries: ['JP', 'DE'], language: 'ja', distributor: 'NEON (USA)', trailer: 'QzZBbX5A1FA',
    description: '<p>Hirayama sköter offentliga toaletter i Tokyo och fyller sina dagar med musik, böcker och fotografier av träd.</p><p>Oväntade möten öppnar små fönster mot hans liv och stadens skönhet.</p>',
    quote: 'En varm inbjudan att upptäcka hur mycket en alldeles vanlig dag kan rymma.' },
  { title: 'Världens värsta människa', director: 'Joachim Trier', year: 2021, minutes: 128,
    countries: ['NO', 'FR', 'SE', 'DK'], language: 'no', distributor: 'NEON (USA)', trailer: '55M5ZgAqbWo',
    description: '<p>Julie söker en riktning i kärleken och arbetslivet i Oslo.</p><p>Under fyra år växer en berättelse fram om identitet, förväntningar och att lära känna sig själv.</p>',
    quote: 'Ett livfullt och eftertänksamt porträtt av att leta efter sin egen väg.' },
];

export function getRepertoireMovies(releaseDate: string): SeedMovie[] {
  return films.map(film => ({
    title: film.title, director: film.director, duration_minutes: film.minutes,
    production_year: film.year, production_countries: film.countries,
    distributor: film.distributor, language: film.language, subtitles: ['sv'],
    age_rating: null, imdb_rating: null, actors: [], cast_members: [], genres: ['Drama'],
    description: film.description,
    poster_url: `https://i.ytimg.com/vi/${film.trailer}/hqdefault.jpg`,
    landscape_image_url: `https://i.ytimg.com/vi/${film.trailer}/maxresdefault.jpg`,
    images: [`https://i.ytimg.com/vi/${film.trailer}/maxresdefault.jpg`],
    trailer_url: `https://www.youtube.com/watch?v=${film.trailer}`,
    youtube_trailers: [`https://www.youtube.com/watch?v=${film.trailer}`],
    reviews: [{ source: 'Filmvisarna (demo)', quote: film.quote, stars: 4, max: 5 }],
    release_date: releaseDate,
  }));
}
