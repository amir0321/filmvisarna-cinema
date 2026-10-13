import { sendBookingConfirmation } from '../services/emailService.js';
import { generateBookingRefCode } from '../utils/bookingRef.js';
import dotenv from 'dotenv';

dotenv.config();

const sampleBookingData = {
  email: "kund@example.com",
  bookingRef: generateBookingRefCode(),
  movieTitle: "Interstellar",
  posterUrl: "https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg",
  screeningDate: "2026-10-15",
  screeningTime: "18:00",
  cinemaName: "Salong 1",
  seats: ["Rad 3, Stol 5", "Rad 3, Stol 6"],
  tickets: [
    { type: "Vuxen", quantity: 2, price: 280 }
  ],
  kioskItems: [
    { name: "Biomyset", quantity: 1, price: 129 }
  ]
};

console.log("Starting email test...");

sendBookingConfirmation(sampleBookingData).then(info => {
  console.log("Email test completed successfully!");
}).catch(err => {
  console.error("Failed to send email:");
  console.error(err);
});
