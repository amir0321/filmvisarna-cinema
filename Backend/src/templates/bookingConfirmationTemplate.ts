// Types & Interfaces

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
}

// Template & Calculation Helpers

export function calculateBookingTotal(bookingData: EmailPayload): number {
  const ticketTotal = bookingData.tickets.reduce(
    (sum, t) => sum + (t.price * t.quantity),
    0
  );
  const kioskTotal = bookingData.kioskItems.reduce(
    (sum, k) => sum + (k.price * k.quantity),
    0
  );
  return ticketTotal + kioskTotal;
}

function renderTicketsHtml(tickets: TicketInfo[]): string {
  return tickets.map(t => `
    <div style="margin-bottom: 6px;">
      <span style="color: #CBD5E1;">${t.quantity}x ${t.type}</span>
      <span style="float: right; color: #FFFFFF;">${t.price * t.quantity} kr</span>
    </div>
    <div style="clear: both;"></div>
  `).join('');
}

function renderKioskHtml(kioskItems: KioskItemInfo[]): string {
  return kioskItems.map(k => `
    <div style="margin-bottom: 6px;">
      <span style="color: #F59E0B;">${k.quantity}x ${k.name}</span>
      <span style="float: right; color: #F59E0B;">${k.price * k.quantity} kr</span>
    </div>
    <div style="clear: both;"></div>
  `).join('');
}

export function generateBookingConfirmationText(bookingData: EmailPayload): string {
  const total = calculateBookingTotal(bookingData);
  const ticketsText = bookingData.tickets
    .map(t => `- ${t.quantity}x ${t.type} (${t.price} SEK)`)
    .join('\n');
  const kioskText = bookingData.kioskItems
    .map(k => `- ${k.quantity}x ${k.name} (${k.price} SEK)`)
    .join('\n');

  return (
    `Thank you for your booking!\n\n` +
    `Booking Reference: ${bookingData.bookingRef}\n` +
    `Movie: ${bookingData.movieTitle}\n` +
    `Date: ${bookingData.screeningDate}\n` +
    `Time: ${bookingData.screeningTime}\n` +
    `Cinema: ${bookingData.cinemaName}\n` +
    `Seats: ${bookingData.seats.join(', ')}\n\n` +
    `Tickets:\n${ticketsText}\n\n` +
    (bookingData.kioskItems.length > 0 ? `Kiosk Items:\n${kioskText}\n\n` : '') +
    `Total Amount: ${total} SEK\n\n` +
    `Please show this booking reference at the counter upon arrival!`
  );
}

export function generateBookingConfirmationHtml(bookingData: EmailPayload): string {
  const total = calculateBookingTotal(bookingData);
  const ticketsHtml = renderTicketsHtml(bookingData.tickets);
  const kioskHtml = renderKioskHtml(bookingData.kioskItems);
  const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cancel?ref=${bookingData.bookingRef}`;

  return `
    <div 
      style="background-color: #0B0F19; padding: 40px 16px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #CBD5E1;"
    >
      
      <!-- Logotyp -->
      <div 
        style="text-align: center; font-family: 'Poppins', 'Inter', sans-serif; font-size: 15px; font-weight: 700; color: #FFFFFF; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px;"
      >
        FILMVISARNA <span style="color: #E50914;">•</span>
      </div>

      <!-- Bokningskort -->
      <div 
        style="background-color: #161F30; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px; max-width: 480px; margin: 0 auto; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5); overflow: hidden; padding-bottom: 32px;"
      >
        
        <!-- Bekräftelse-ikon och rubrik -->
        <div style="text-align: center; padding: 32px 28px 16px 28px;">
          <div 
            style="margin: 0 auto 16px auto; width: 48px; height: 48px; background-color: rgba(16, 185, 129, 0.15); border: 2px solid #10B981; border-radius: 50%; color: #10B981; font-size: 24px; font-weight: bold; line-height: 48px; text-align: center;"
          >
            ✓
          </div>
          <h1 style="font-family: 'Poppins', 'Inter', sans-serif; margin: 0 0 6px 0; font-size: 22px; font-weight: 700; color: #FFFFFF;">
            Tack för din bokning!
          </h1>
          <p style="margin: 0; font-size: 13px; color: #94A3B8;">
            En bekräftelse skickas till din e-post
          </p>
        </div>

        <!-- Bokningskod-ruta -->
        <div style="padding: 12px 28px 24px 28px;">
          <div 
            style="background-color: #090D14; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 10px; padding: 14px 18px; text-align: center;"
          >
            <div style="font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">
              Bokningskod
            </div>
            <div 
              style="font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 24px; font-weight: 700; color: #FFFFFF; letter-spacing: 3px;"
            >
              ${bookingData.bookingRef}
            </div>
          </div>
        </div>

        <!-- Filminformation med affisch -->
        <div style="padding: 0 28px 20px 28px;">
          <div style="background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 14px;">
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                ${bookingData.posterUrl ? `
                  <td width="72" valign="middle" style="padding-right: 18px;">
                    <img 
                      src="${bookingData.posterUrl}" 
                      width="72" 
                      alt="Poster" 
                      style="border-radius: 8px; display: block; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" 
                    />
                  </td>
                ` : ''}
                <td valign="middle">
                  <div style="font-family: 'Poppins', 'Inter', sans-serif; font-size: 18px; font-weight: 700; color: #FFFFFF; margin-bottom: 6px; line-height: 1.2;">
                    ${bookingData.movieTitle}
                  </div>
                  <div style="font-size: 14px; color: #94A3B8; margin-bottom: 4px;">
                    ${bookingData.cinemaName}
                  </div>
                  <div style="font-size: 13px; font-weight: 600; color: #CBD5E1;">
                    ${bookingData.screeningDate} <span style="color: #64748B; margin: 0 4px;">&bull;</span> kl. ${bookingData.screeningTime}
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Platser, biljetter & sammanställning -->
        <div style="padding: 0 28px 20px 28px;">
          <div style="font-size: 13px; color: #94A3B8; margin-bottom: 16px;">
            Platser: ${bookingData.seats.join(', ')}
          </div>

          <div style="font-size: 13px; color: #CBD5E1;">
            <div style="margin-bottom: 8px; color: #94A3B8; font-weight: 600;">Biljetter</div>
            ${ticketsHtml}

            ${bookingData.kioskItems.length > 0 ? `
              <hr style="border: 0; border-top: 1px solid rgba(148, 163, 184, 0.15); margin: 16px 0;" />
              <div style="margin-bottom: 8px; color: #F59E0B; font-weight: 600;">Bio-Kiosken</div>
              ${kioskHtml}
            ` : ''}

            <hr style="border: 0; border-top: 1px solid rgba(148, 163, 184, 0.15); margin: 16px 0;" />
            
            <div>
              <span style="font-family: 'Poppins', 'Inter', sans-serif; font-size: 15px; font-weight: 700; color: #FFFFFF;">Totalt att betala</span>
              <span style="float: right; font-family: 'Poppins', 'Inter', sans-serif; font-size: 16px; font-weight: 700; color: #10B981;">${total} kr</span>
            </div>
            <div style="clear: both;"></div>
          </div>
        </div>

        <!-- Avbokning & instruktion -->
        <div style="padding: 0 28px; text-align: center;">
          <a href="${cancelUrl}"
            style="display: block; padding: 12px 0; font-size: 13px; font-weight: 600; color: #EF4444; text-decoration: none; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; background-color: rgba(239, 68, 68, 0.05); margin-bottom: 12px;">
            Avboka biljett
          </a>
          <div style="font-size: 12px; color: #94A3B8;">
            Betalning sker på plats. Biljetter hämtas senast 15 min före start.
          </div>
        </div>

      </div>
      
      <!-- Footer -->
      <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #94A3B8;">
        Filmvisarna Biograf AB &bull; Automatisk bokningsbekräftelse
      </div>
      
    </div>
  `;
}
