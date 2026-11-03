import apiClient from "./client";
import type { Booking } from "../types/booking";

interface BookingApiResponse {
  id: number;
  reference: string;
  status: Booking["status"];
  email: string;
  guestName: string | null;
  screening: {
    id: number;
    startsAt: string;
    endsAt: string;
    movieTitle: string;
    cinema: string;
  };
  tickets: {
    seatId: number;
    row: string;
    number: number;
    priceGroup: string;
    price: number;
  }[];
  items: {
    menuItemId: number;
    name: string;
    quantity: number;
    unitPrice: number;
  }[];
  totalPrice: number | string;
  isPaid: boolean;
  isCheckedIn: boolean;
  createdAt: string;
}

function mapBooking(data: BookingApiResponse): Booking {
  return {
    id: data.id,
    bookingRef: data.reference,
    screeningId: data.screening.id,
    movieTitle: data.screening.movieTitle,
    cinemaName: data.screening.cinema,
    screeningStartsAt: data.screening.startsAt,
    screeningEndsAt: data.screening.endsAt,
    email: data.email,
    guestName: data.guestName,
    tickets: data.tickets.map((ticket) => ({
      seatId: ticket.seatId,
      priceGroupId: 0,
      type: ticket.priceGroup,
      row: ticket.row,
      seatNumber: ticket.number,
      price: Number(ticket.price),
    })),
    items: data.items.map((item) => ({
      itemId: item.menuItemId,
      name: item.name,
      quantity: item.quantity,
      price: Number(item.unitPrice),
    })),
    totalPrice: Number(data.totalPrice),
    isPaid: data.isPaid,
    isCheckedIn: data.isCheckedIn,
    status: data.status,
    createdAt: data.createdAt,
  };
}

export async function getMyBookings(signal?: AbortSignal): Promise<Booking[]> {
  const response = await apiClient.get<BookingApiResponse[]>("/bookings/me", { signal });
  return response.map(mapBooking);
}

export interface CancelMyBookingResponse {
  success: boolean;
  message: string;
  booking: {
    id: number;
    reference: string;
    status: string;
  };
}

export async function cancelMyBooking(
  bookingId: number,
): Promise<CancelMyBookingResponse> {
  return apiClient.delete<CancelMyBookingResponse>(`/bookings/${bookingId}`);
}
