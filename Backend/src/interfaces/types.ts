// 1. Allmänna API-typer
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// 2. Användare & Autentisering
export interface AuthUser {
  id: number;
  email: string;
  role: "user" | "admin";
}

// 3. Filmer (Movies)
export interface Movie {
  id: number;
  title: string;
  description: string | null;
  duration_minutes: number;
  age_rating: string | null;
  poster_url: string | null;
  release_date: string | null;
  genres: string[];
}

export interface CreateMovieInput {
  title: string;
  description?: string;
  duration_minutes: number;
  age_rating?: string;
  poster_url?: string;
  release_date?: string;
  genres?: string[];
}

export interface UpdateMovieInput {
  title?: string;
  description?: string | null;
  duration_minutes?: number;
  age_rating?: string | null;
  poster_url?: string | null;
  release_date?: string | null;
  genres?: string[];
}

// 4. Salonger & Platser (Cinemas & Seats)
export interface SeatInfo {
  id: number;
  row: string;
  number: number;
}

export interface CinemaOverview {
  id: number;
  name: string;
  total_seats: number;
}

export interface CinemaDetail extends CinemaOverview {
  seats: SeatInfo[];
}

export interface CreateCinemaInput {
  name: string;
  rows: number;
  seatsPerRow: number;
}

export interface UpdateCinemaInput {
  name: string;
}

// 5. Visningar (Screenings)
export interface ScreeningFilters {
  from?: string;
  to?: string;
  movieId?: number;
  cinemaId?: number;
  age?: number;
}

export interface ScreeningOverview {
  id: number;
  startsAt: string;
  endsAt: string;
  movieId?: number;
  movieTitle: string;
  posterUrl?: string | null;
  ageRating?: string | null;
  ageLimit?: number;
  cinemaId?: number;
  cinema: string;
}

export interface ScreeningSeatStatus {
  id: number;
  row_label: string;
  seat_number: number;
  status: "booked" | "available";
}

export interface ScreeningSeatsResult {
  screeningId: number;
  seats: ScreeningSeatStatus[];
}

export interface CreateScreeningInput {
  movieId: number;
  cinemaId: number;
  startsAt: string;
}

export interface UpdateScreeningInput {
  movieId?: number;
  cinemaId?: number;
  startsAt?: string;
}

// 6. Kiosk & Concessions
export type MenuItemCategory = "food" | "drink";

export interface ComboItemPart {
  id: number;
  name: string;
  quantity: number;
}

export interface KioskItem {
  id: number;
  name: string;
  description: string | null;
  category: MenuItemCategory;
  price: number;
  is_combo: boolean;
  image_url: string | null;
  is_available: boolean;
  combo_items?: ComboItemPart[] | null;
}

export interface KioskItemFilters {
  category?: MenuItemCategory;
  isCombo?: boolean;
}

// 7. Bokningar (Bookings)
export interface TicketInput {
  seatId: number;
  priceGroupId: number;
}

export interface ItemInput {
  itemId: number;
  quantity: number;
}

export interface CreateBookingInput {
  screeningId: number;
  email: string;
  guestName?: string | null;
  tickets: TicketInput[];
  items?: ItemInput[];
}

export interface CreateBookingResult {
  bookingRef: string;
  totalPrice: number;
  cancelToken?: string;
}

export interface CancelBookingResult {
  id: number;
  reference: string;
  status: string;
}

export interface CancellationJwtPayload {
  bookingRef: string;
  email: string;
  action: "cancel_booking";
}

export interface CancelPreviewResult {
  bookingRef: string;
  movieTitle: string;
  posterUrl: string | null;
  cinemaName: string;
  screeningStartsAt: string;
  seats: string[];
  status: string;
  canCancel: boolean;
}

// 8. E-post & Bekräftelsemallar (Email Templates)
export interface TicketInfo {
  type: string;
  quantity: number;
  price: number;
}

export interface KioskItemInfo {
  name: string;
  quantity: number;
  price: number;
}

export interface EmailPayload {
  email: string;
  bookingRef: string;
  movieTitle: string;
  screeningDate: string;
  screeningTime: string;
  cinemaName: string;
  seats: string[];
  tickets: TicketInfo[];
  kioskItems: KioskItemInfo[];
  posterUrl?: string;
  cancelUrl?: string;
}
