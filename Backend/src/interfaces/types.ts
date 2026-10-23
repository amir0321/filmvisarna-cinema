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
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  isVerified?: boolean;
  points?: number;
  role: "user" | "admin";
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

// 3. Filmer (Movies)
export interface Movie {
  id: number;
  title: string;
  description: string | null;
  duration_minutes: number;
  age_rating: string | null;
  poster_url: string | null;
  landscape_image_url: string | null;
  trailer_url: string | null;
  director: string | null;
  imdb_rating: number | null;
  release_date: string | null;
  genres: string[];
}

export interface CreateMovieInput {
  title: string;
  description?: string | null;
  duration_minutes: number;
  age_rating?: string | null;
  poster_url?: string | null;
  landscape_image_url?: string | null;
  trailer_url?: string | null;
  director?: string | null;
  imdb_rating?: number | null;
  release_date?: string | null;
  genres?: string[];
}

export interface UpdateMovieInput {
  title?: string;
  description?: string | null;
  duration_minutes?: number;
  age_rating?: string | null;
  poster_url?: string | null;
  landscape_image_url?: string | null;
  trailer_url?: string | null;
  director?: string | null;
  imdb_rating?: number | null;
  release_date?: string | null;
  genres?: string[];
}

// 4. Salonger & Platser (Cinemas & Seats)
export interface SeatInfo {
  id: number;
  row: string;
  number: number;
  seatType?: "regular" | "wheelchair";
  isWheelchair?: boolean;
}

export interface CinemaOverview {
  id: number;
  name: string;
  format?: string | null;
  tech?: string | null;
  screen_size?: string | null;
  opened_year?: number | null;
  total_seats: number;
}

export interface CinemaDetail extends CinemaOverview {
  seats: SeatInfo[];
}

export interface CreateCinemaInput {
  name: string;
  format?: string | null;
  tech?: string | null;
  screen_size?: string | null;
  opened_year?: number | null;
  rows: number;
  seatsPerRow: number;
}

export interface UpdateCinemaInput {
  name?: string;
  format?: string | null;
  tech?: string | null;
  screen_size?: string | null;
  opened_year?: number | null;
  rows?: number;
  seatsPerRow?: number;
  wheelchairSeats?: Array<{ row: string; number: number }>;
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
  totalSeats?: number;
  bookedSeats?: number;
  availableSeats?: number;
}

export interface ScreeningSeatStatus {
  id: number;
  row_label: string;
  seat_number: number;
  seat_type: "regular" | "wheelchair";
  is_wheelchair: boolean;
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
export interface BookingFilters {
  screeningId?: number;
  status?: "confirmed" | "cancelled";
  isPaid?: boolean;
  search?: string;
  from?: string;
  to?: string;
}

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

export interface UpdateBookingInput {
  isPaid?: boolean;
  isCheckedIn?: boolean;
}

export interface CreateBookingResult {
  bookingRef: string;
  totalPrice: number;
  booking?: any;
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

// 9. Biljettyper (Price Groups)
export interface PriceGroup {
  id: number;
  name: "child" | "adult" | "elder";
  price: number;
}

// 10. Kontaktformulär
export interface ContactMessageInput {
  name: string;
  email: string;
  message: string;
}

// 11. Admin Statistik
export interface AdminStatsResult {
  bookingsToday: number;
  bookingsWaiting: number;
  bookingsPaid: number;
  expectedRevenue: number;
  paidRevenue: number;
  totalSeatsToday: number;
  bookedSeatsToday: number;
  occupancyRatePercent: number;
}

