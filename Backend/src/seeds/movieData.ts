import { todayIn } from "../utils/dates.js";

export interface SeedMovie {
  title: string;
  duration_minutes: number;
  age_rating: string;
  director: string;
  actors: string[];
  imdb_rating: number;
  description: string;
  trailer_url: string | null;
  poster_url: string;
  landscape_image_url: string;
  release_date: string;
  genres: string[];
}

export function seedDateOffset(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

const originalMovies: SeedMovie[] = [
    {
      title: "Dune: Part Two",
      duration_minutes: 166,
      age_rating: "15",
      director: "Denis Villeneuve",
      actors: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"],
      imdb_rating: 8.5,
      description:
        "Paul Atreides förenar sig med Chani och fremenerna samtidigt som han söker hämnd mot konspiratörerna som förstörde hans familj. Ställd inför ett val mellan sitt livs kärlek och universums öde måste han förhindra en fruktansvärd framtid.",
      trailer_url: "https://www.youtube.com/watch?v=Way9Dexny3w",
      poster_url:
        "https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
      landscape_image_url:
        "https://i.ytimg.com/vi/Way9Dexny3w/maxresdefault.jpg",
      release_date: "2026-09-15",
      genres: ["Sci-Fi", "Äventyr", "Action"],
    },
    {
      title: "Interstellar",
      duration_minutes: 169,
      age_rating: "11",
      director: "Christopher Nolan",
      actors: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain"],
      imdb_rating: 8.7,
      description:
        "När jorden går mot sin undergång skickas ett team av upptäcktsresande och forskare genom ett nyupptäckt maskhål i rymden i ett desperat försök att hitta ett nytt hem åt mänskligheten.",
      trailer_url: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
      poster_url:
        "https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      landscape_image_url:
        "https://image.tmdb.org/t/p/w1280/pbrkL804c8yAv3zBZR4QPEafpAR.jpg",
      release_date: "2026-09-22",
      genres: ["Sci-Fi", "Drama", "Äventyr"],
    },
    {
      title: "Inception",
      duration_minutes: 148,
      age_rating: "15",
      director: "Christopher Nolan",
      actors: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"],
      imdb_rating: 8.8,
      description:
        "En tjuv som stjäl företagshemligheter genom att ta sig in i människors undermedvetna under drömstadiet får det omvända uppdraget: att plantera en idé i en företagsledares sinne.",
      trailer_url: "https://www.youtube.com/watch?v=YoHD9XEInc0",
      poster_url:
        "https://image.tmdb.org/t/p/w780/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
      landscape_image_url:
        "https://image.tmdb.org/t/p/w1280/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
      release_date: "2026-09-29",
      genres: ["Action", "Sci-Fi", "Thriller"],
    },
    {
      title: "The Batman",
      duration_minutes: 176,
      age_rating: "15",
      director: "Matt Reeves",
      actors: ["Robert Pattinson", "Zoë Kravitz", "Paul Dano"],
      imdb_rating: 7.8,
      description:
        "När en sadistisk seriemördare börjar mörda nyckelpersoner i Gotham tvingas Batman utreda stadens dolda korruption och ifrågasätta sin egen familjs inblandning.",
      trailer_url: "https://www.youtube.com/watch?v=mqqft2x_Aa4",
      poster_url:
        "https://image.tmdb.org/t/p/w780/74xTEgt7R36Fpooo50r9T25onhq.jpg",
      landscape_image_url:
        "https://image.tmdb.org/t/p/w1280/rvtdN5XkWAfGX6xDuPL6yYS2seK.jpg",
      release_date: "2026-10-01",
      genres: ["Krim", "Thriller", "Action"],
    },
    {
      title: "Avatar: The Way of Water",
      duration_minutes: 192,
      age_rating: "11",
      director: "James Cameron",
      actors: ["Sam Worthington", "Zoe Saldaña", "Sigourney Weaver"],
      imdb_rating: 7.5,
      description:
        "Jake Sully lever med sin nybildade familj på planeten Pandora. När ett välbekant hot återvänder för att avsluta det som en gång påbörjades måste Jake samarbeta med Metkayina-klanen för att skydda sitt hem.",
      trailer_url: "https://www.youtube.com/watch?v=d9MyW72ELq0",
      poster_url:
        "https://image.tmdb.org/t/p/w780/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
      landscape_image_url:
        "https://image.tmdb.org/t/p/w1280/ovM06PdF3M8wvKb06i4sjW3xoww.jpg",
      release_date: "2026-10-01",
      genres: ["Sci-Fi", "Äventyr", "Fantasy"],
    },
    {
      title: "Spider-Man: Across the Spider-Verse",
      duration_minutes: 140,
      age_rating: "11",
      director: "Joaquim Dos Santos",
      actors: ["Shameik Moore", "Hailee Steinfeld", "Oscar Isaac"],
      imdb_rating: 8.5,
      description:
        "Miles Morales slungas genom multiversumet där han möter ett team av Spider-hjältar med uppdraget att skydda dess existens. Men när hjältarna är oense om hur ett nytt hot ska hanteras måste Miles gå sin egen väg.",
      trailer_url: "https://www.youtube.com/watch?v=cqGjhVJWtEg",
      poster_url:
        "https://image.tmdb.org/t/p/w780/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
      landscape_image_url:
        "https://image.tmdb.org/t/p/w1280/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg",
      release_date: "2026-10-02",
      genres: ["Animation", "Action", "Äventyr"],
    },
    {
      title: "Blade Runner 2049",
      duration_minutes: 164,
      age_rating: "15",
      director: "Denis Villeneuve",
      actors: ["Ryan Gosling", "Harrison Ford", "Ana de Armas"],
      imdb_rating: 8.0,
      description:
        "Den unge Blade Runner-polisen K avslöjar en länge begravd hemlighet som har potential att kasta det som återstår av samhället in i kaos. Hans upptäckt leder honom på jakt efter Rick Deckard, som varit försvunnen i trettio år.",
      trailer_url: "https://www.youtube.com/watch?v=gCcx85zbxz4",
      poster_url:
        "https://image.tmdb.org/t/p/w780/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
      landscape_image_url:
        "https://i.ytimg.com/vi/gCcx85zbxz4/maxresdefault.jpg",
      release_date: "2026-10-03",
      genres: ["Sci-Fi", "Drama", "Thriller"],
    },
    {
      title: "La La Land",
      duration_minutes: 128,
      age_rating: "Alla",
      director: "Damien Chazelle",
      actors: ["Ryan Gosling", "Emma Stone", "John Legend"],
      imdb_rating: 8.0,
      description:
        "Medan jazzpianisten Sebastian och den kämpande skådespelerskan Mia navigerar sina karriärer i Los Angeles slits deras kärlekshistoria mellan drömmarna de jagar och de kompromisser som framgången kräver.",
      trailer_url: "https://www.youtube.com/watch?v=0pdqf4P9MB8",
      poster_url:
        "https://image.tmdb.org/t/p/w780/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg",
      landscape_image_url:
        "https://i.ytimg.com/vi/0pdqf4P9MB8/maxresdefault.jpg",
      release_date: "2026-10-04",
      genres: ["Drama", "Romance", "Familj"],
    },
  ];

// These are retrospective demo premieres, with dates relative to the seed run.
const extraMovies = [
  { title: 'Oppenheimer', trailer: 'uYPbbksJxIg', duration: 180, age: '15', director: 'Christopher Nolan', actors: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon'], genres: ['Drama', 'Thriller'], poster: 'ptpr0kGAckfQkJeJIt8st5dglvd.jpg', description: 'Fysikern J. Robert Oppenheimer leder utvecklingen av atombomben och ställs inför följderna av sitt arbete.' },
  { title: 'Barbie', trailer: 'pBk4NYhWNMM', duration: 114, age: '7', director: 'Greta Gerwig', actors: ['Margot Robbie', 'Ryan Gosling', 'America Ferrera'], genres: ['Fantasy', 'Äventyr'], poster: 'iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg', description: 'Barbie och Ken lämnar Barbieland för ett äventyr i den verkliga världen.' },
  { title: 'Whiplash', trailer: '7d_jQycdQGo', duration: 106, age: '15', director: 'Damien Chazelle', actors: ['Miles Teller', 'J.K. Simmons', 'Paul Reiser'], genres: ['Drama'], poster: '7fn624j5lj3xTme2SgiLCeuedmO.jpg', description: 'En ung jazztrummis möter en lärare vars hårda metoder sätter både ambitionen och tillvaron på prov.' },
  { title: 'Coco', trailer: 'Ga6RYejo6Hk', duration: 105, age: '7', director: 'Lee Unkrich', actors: ['Anthony Gonzalez', 'Gael García Bernal', 'Benjamin Bratt'], genres: ['Animation', 'Familj', 'Äventyr'], poster: 'gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg', description: 'Musikälskande Miguel reser till de dödas värld och upptäcker sin familjs historia.' },
  { title: 'Arrival', trailer: 'tFMo3UJ4B4g', duration: 116, age: '11', director: 'Denis Villeneuve', actors: ['Amy Adams', 'Jeremy Renner', 'Forest Whitaker'], genres: ['Sci-Fi', 'Drama'], poster: 'x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg', description: 'En språkforskare försöker förstå besökare från en annan värld innan rädsla leder till en global konflikt.' },
  { title: 'Soul', trailer: 'xOsLIiBStEs', duration: 100, age: '0', director: 'Pete Docter', actors: ['Jamie Foxx', 'Tina Fey', 'Graham Norton'], genres: ['Animation', 'Familj', 'Fantasy'], poster: 'hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg', description: 'Jazzmusikern Joe upptäcker vad som gör livet värdefullt under en oväntad resa bortom New York.' },
  { title: 'Den vilda roboten', trailer: '67vbA5ZJdKQ', duration: 102, age: '7', director: 'Chris Sanders', actors: ['Lupita Nyong’o', 'Pedro Pascal', 'Kit Connor'], genres: ['Animation', 'Familj', 'Äventyr'], poster: 'wTnV3PCVW5O92JMrFvvrRcV39RU.jpg', description: 'Roboten Roz blir strandsatt på en ö och lär sig leva tillsammans med djuren som bor där.' },
  { title: 'Insidan ut 2', trailer: 'LEjhY15eCx0', duration: 96, age: '7', director: 'Kelsey Mann', actors: ['Amy Poehler', 'Maya Hawke', 'Kensington Tallman'], genres: ['Animation', 'Familj', 'Äventyr'], poster: 'vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg', description: 'När Riley blir tonåring får hennes välbekanta känslor sällskap av nya och oväntade besökare.' },
];

export function getSeedMovies(today = todayIn('Europe/Stockholm')): SeedMovie[] {
  const originals = originalMovies.map((movie, index) => ({
    ...movie,
    release_date: seedDateOffset(today, -60 + index),
  }));
  return [...originals, ...extraMovies.map((movie, index) => ({
    title: movie.title,
    duration_minutes: movie.duration,
    age_rating: movie.age,
    director: movie.director,
    actors: movie.actors,
    imdb_rating: 8.0,
    description: movie.description,
    trailer_url: `https://www.youtube.com/watch?v=${movie.trailer}`,
    poster_url: `https://image.tmdb.org/t/p/w780/${movie.poster}`,
    landscape_image_url: `https://i.ytimg.com/vi/${movie.trailer}/maxresdefault.jpg`,
    release_date: seedDateOffset(today, index < 4 ? -20 + index : 14 + (index - 4) * 7),
    genres: movie.genres,
  }))];
}
