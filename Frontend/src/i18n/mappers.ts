import { translateStoredMessage, translate } from './index.ts'
import { readLocale, type Locale } from '../utils/locale.ts'

type LabelMap = Record<string, Record<Locale, string>>

const genres: LabelMap = {
  "Action": { sv: "Action", en: "Action" },
  "Äventyr": { sv: "Äventyr", en: "Adventure" },
  "Animerat": { sv: "Animerat", en: "Animation" },
  "Animation": { sv: "Animation", en: "Animation" },
  "Komedi": { sv: "Komedi", en: "Comedy" },
  "Krim": { sv: "Krim", en: "Crime" },
  "Dokumentär": { sv: "Dokumentär", en: "Documentary" },
  "Drama": { sv: "Drama", en: "Drama" },
  "Familj": { sv: "Familj", en: "Family" },
  "Fantasy": { sv: "Fantasy", en: "Fantasy" },
  "Historia": { sv: "Historia", en: "History" },
  "Skräck": { sv: "Skräck", en: "Horror" },
  "Musik": { sv: "Musik", en: "Music" },
  "Mysterium": { sv: "Mysterium", en: "Mystery" },
  "Romantik": { sv: "Romantik", en: "Romance" },
  "Romance": { sv: "Romance", en: "Romance" },
  "Sci-Fi": { sv: "Sci-Fi", en: "Sci-Fi" },
  "Science fiction": { sv: "Science fiction", en: "Science fiction" },
  "TV-film": { sv: "TV-film", en: "TV Movie" },
  "Thriller": { sv: "Thriller", en: "Thriller" },
  "Krig": { sv: "Krig", en: "War" },
  "Västern": { sv: "Västern", en: "Western" }
}

const ticketTypes: LabelMap = {
  "ticket": { sv: "Biljett", en: "Ticket" },
  "Biljett": { sv: "Biljett", en: "Ticket" },
  "adult": { sv: "Vuxen", en: "Adult" },
  "child": { sv: "Barn", en: "Child" },
  "senior": { sv: "Pensionär", en: "Senior" },
  "elder": { sv: "Pensionär", en: "Senior" },
  "student": { sv: "Student", en: "Student" },
  "Vuxen": { sv: "Vuxen", en: "Adult" },
  "Barn": { sv: "Barn", en: "Child" },
  "Pensionär": { sv: "Pensionär", en: "Senior" },
  "Barn (under 12)": { sv: "Barn (under 12)", en: "Child (under 12)" }
}

const kioskNames: LabelMap = {
  "Kioskvara": { sv: "Kioskvara", en: "Kiosk item" },
  "Mellanpopcorn": { sv: "Mellanpopcorn", en: "Medium popcorn" },
  "Stor Popcorn": { sv: "Stor Popcorn", en: "Large popcorn" },
  "Liten Popcorn": { sv: "Liten Popcorn", en: "Small popcorn" },
  "Cola 50cl": { sv: "Cola 50cl", en: "Cola 50cl" },
  "Fanta 50cl": { sv: "Fanta 50cl", en: "Fanta 50cl" },
  "Vatten 50cl": { sv: "Vatten 50cl", en: "Water 50cl" },
  "Godispåse": { sv: "Godispåse", en: "Bag of sweets" },
  "Kaffe / Te": { sv: "Kaffe / Te", en: "Coffee / Tea" },
  "Nybakad Kaka": { sv: "Nybakad Kaka", en: "Freshly baked cake" },
  "Klassikern": { sv: "Klassikern", en: "The classic" },
  "Stora Biomyset": { sv: "Stora Biomyset", en: "The big cinema combo" },
  "Kaffepaket": { sv: "Kaffepaket", en: "Coffee combo" }
}

const kioskDescriptions: LabelMap = {
  "Varma nypoppade mellanpopcorn": { sv: "Varma nypoppade mellanpopcorn", en: "Warm, freshly popped medium popcorn" },
  "Nypoppade popcorn": { sv: "Nypoppade popcorn", en: "Freshly popped popcorn" },
  "Nypoppade stora popcorn": { sv: "Nypoppade stora popcorn", en: "Freshly popped large popcorn" },
  "Perfekt portion för barn": { sv: "Perfekt portion för barn", en: "Perfect portion for children" },
  "Iskall Coca-Cola 50cl": { sv: "Iskall Coca-Cola 50cl", en: "Ice-cold Coca-Cola 50cl" },
  "Iskall Fanta Orange 50cl": { sv: "Iskall Fanta Orange 50cl", en: "Ice-cold Fanta Orange 50cl" },
  "Stilla källvatten 50cl": { sv: "Stilla källvatten 50cl", en: "Still spring water 50cl" },
  "Blandat biogodis 150g": { sv: "Blandat biogodis 150g", en: "Mixed cinema sweets 150g" },
  "Nybbryggt kaffe eller ekologiskt te": { sv: "Nybbryggt kaffe eller ekologiskt te", en: "Freshly brewed coffee or organic tea" },
  "Chokladkaka eller kanelbulle": { sv: "Chokladkaka eller kanelbulle", en: "Chocolate cake or cinnamon bun" },
  "Mellanpopcorn & 50cl Läsk": { sv: "Mellanpopcorn & 50cl Läsk", en: "Medium popcorn & 50cl soft drink" },
  "Stor Popcorn & 2× Läsk + Godispåse": { sv: "Stor Popcorn & 2× Läsk + Godispåse", en: "Large popcorn & 2× soft drinks + bag of sweets" },
  "Kaffe/Te & Nybakad Kaka": { sv: "Kaffe/Te & Nybakad Kaka", en: "Coffee/Tea & freshly baked cake" }
}

const kioskCategories: LabelMap = {
  "food": { sv: "Snacks", en: "Snacks" },
  "drink": { sv: "Dryck", en: "Drinks" }
}

const apiErrors: LabelMap = {
  "Du kan inte göra nya obetalda reservationer just nu. Du kan fortfarande betala befintliga bokningar eller köpa lediga platser i kassan.": { sv: "Du kan inte göra nya obetalda reservationer just nu. Du kan fortfarande betala befintliga bokningar eller köpa lediga platser i kassan.", en: "You cannot make new unpaid reservations right now. You can still pay existing bookings or buy available seats at the box office." },
  "Failed to fetch": { sv: "Kunde inte nå servern. Försök igen.", en: "Could not reach the server. Try again." },
  "Kunde inte nå servern. Försök igen.": { sv: "Kunde inte nå servern. Försök igen.", en: "Could not reach the server. Try again." },
  "Kunde inte logga ut. Kontrollera anslutningen och försök igen.": { sv: "Kunde inte logga ut. Kontrollera anslutningen och försök igen.", en: "Could not log out. Check your connection and try again." },
  "Felaktig e-postadress eller lösenord.": { sv: "Felaktig e-postadress eller lösenord.", en: "Incorrect email address or password." },
  "Den angivna e-postadressen är redan registrerad.": { sv: "Den angivna e-postadressen är redan registrerad.", en: "This email address is already registered." },
  "Din session har gått ut. Logga in igen.": { sv: "Din session har gått ut. Logga in igen.", en: "Your session has expired. Log in again." },
  "Du måste logga in för att fortsätta.": { sv: "Du måste logga in för att fortsätta.", en: "You must log in to continue." },
  "Administratörsbehörighet krävs.": { sv: "Administratörsbehörighet krävs.", en: "Administrator access is required." },
  "Ogiltig eller utgången token.": { sv: "Ogiltig eller utgången token.", en: "Invalid or expired token." },
  "Ogiltig token.": { sv: "Ogiltig token.", en: "Invalid token." },
  "För många försök. Vänta en stund och försök igen.": { sv: "För många försök. Vänta en stund och försök igen.", en: "Too many attempts. Wait a moment and try again." },
  "För många försök. Vänta 15 minuter och försök igen.": { sv: "För många försök. Vänta 15 minuter och försök igen.", en: "Too many attempts. Wait 15 minutes and try again." },
  "För många inloggningsförsök. Vänta 15 minuter och försök igen.": { sv: "För många inloggningsförsök. Vänta 15 minuter och försök igen.", en: "Too many login attempts. Wait 15 minutes and try again." },
  "E-posttjänsten är tillfälligt otillgänglig. Försök igen senare.": { sv: "E-posttjänsten är tillfälligt otillgänglig. Försök igen senare.", en: "The email service is temporarily unavailable. Try again later." },
  "Mejlet kunde inte skickas just nu. Försök igen senare.": { sv: "Mejlet kunde inte skickas just nu. Försök igen senare.", en: "The email could not be sent right now. Try again later." },
  "Vänta minst en minut mellan verifieringsmejl. Efter tre utskick behöver du vänta 15 minuter.": { sv: "Vänta minst en minut mellan verifieringsmejl. Efter tre utskick behöver du vänta 15 minuter.", en: "Wait at least one minute between verification emails. After three emails, wait 15 minutes." },
  "Användaren hittades inte.": { sv: "Användaren hittades inte.", en: "User not found." },
  "Det nuvarande lösenordet är felaktigt.": { sv: "Det nuvarande lösenordet är felaktigt.", en: "The current password is incorrect." },
  "Filmen hittades inte.": { sv: "Filmen hittades inte.", en: "Film not found." },
  "Salongen hittades inte.": { sv: "Salongen hittades inte.", en: "Auditorium not found." },
  "Visningen hittades inte.": { sv: "Visningen hittades inte.", en: "Screening not found." },
  "Visningen finns inte.": { sv: "Visningen finns inte.", en: "The screening does not exist." },
  "Visningen har redan startat.": { sv: "Visningen har redan startat.", en: "The screening has already started." },
  "Visningen finns inte längre eller har redan startat.": { sv: "Visningen finns inte längre eller har redan startat.", en: "The screening is no longer available or has already started." },
  "Bokningen hittades inte.": { sv: "Bokningen hittades inte.", en: "Booking not found." },
  "Bokningen har gått ut eftersom den inte betalades före filmens sluttid.": { sv: "Bokningen har gått ut eftersom den inte betalades före filmens sluttid.", en: "The booking has expired because it was not paid before the film ended." },
  "Bokningen måste vara betald före incheckning.": { sv: "Bokningen måste vara betald före incheckning.", en: "The booking must be paid before check-in." },
  "Nätreservationen har stängt. Köp lediga platser i biografens kassa.": { sv: "Nätreservationen har stängt. Köp lediga platser i biografens kassa.", en: "Online reservations are closed. Buy available seats at the cinema box office." },
  "Platserna är inte längre lediga. Välj andra platser i kassan.": { sv: "Platserna är inte längre lediga. Välj andra platser i kassan.", en: "The seats are no longer available. Choose other seats at the box office." },
  "Ta bort incheckningen innan betalningen återställs.": { sv: "Ta bort incheckningen innan betalningen återställs.", en: "Remove check-in before reversing payment." },
  "Ingen bokning hittades med den referensen.": { sv: "Ingen bokning hittades med den referensen.", en: "No booking found with that reference." },
  "Vi hittade ingen bokning som matchar angivet bokningsnummer och e-postadress.": { sv: "Vi hittade ingen bokning som matchar angivet bokningsnummer och e-postadress.", en: "No booking matches the booking reference and email address provided." },
  "Bokningen är redan avbokad.": { sv: "Bokningen är redan avbokad.", en: "The booking has already been cancelled." },
  "Denna bokning är redan avbokad.": { sv: "Denna bokning är redan avbokad.", en: "This booking has already been cancelled." },
  "Ogiltig avbokningslänk.": { sv: "Ogiltig avbokningslänk.", en: "Invalid cancellation link." },
  "Ogiltig eller utgången avbokningslänk.": { sv: "Ogiltig eller utgången avbokningslänk.", en: "Invalid or expired cancellation link." },
  "Ogiltig biljettyp.": { sv: "Ogiltig biljettyp.", en: "Invalid ticket type." },
  "Ogiltiga stolar för visningen.": { sv: "Ogiltiga stolar för visningen.", en: "Invalid seats for this screening." },
  "Ogiltiga eller slutsålda kioskprodukter.": { sv: "Ogiltiga eller slutsålda kioskprodukter.", en: "Invalid or sold-out kiosk products." },
  "Kioskartikeln hittades inte.": { sv: "Kioskartikeln hittades inte.", en: "Kiosk item not found." },
  "En kioskprodukt är inte längre tillgänglig. Gör ett nytt val.": { sv: "En kioskprodukt är inte längre tillgänglig. Gör ett nytt val.", en: "A kiosk product is no longer available. Make a new selection." },
  "Platserna eller biljettyperna är ogiltiga. Gör ett nytt val.": { sv: "Platserna eller biljettyperna är ogiltiga. Gör ett nytt val.", en: "The seats or ticket types are invalid. Make a new selection." },
  "Välj lika många olika platser som biljetter.": { sv: "Välj lika många olika platser som biljetter.", en: "Select as many different seats as tickets." },
  "Kunde inte skapa bokningen.": { sv: "Kunde inte skapa bokningen.", en: "Could not create the booking." },
  "Verifiera din e-postadress innan du bokar biljetter.": { sv: "Verifiera din e-postadress innan du bokar biljetter.", en: "Verify your email address before booking tickets." },
  "Bekräfta gästbokningen via länken i ditt e-postmeddelande.": { sv: "Bekräfta gästbokningen via länken i ditt e-postmeddelande.", en: "Confirm the guest booking using the link in your email." },
  "Bekräftelselänken är ogiltig eller har gått ut. Begär en ny länk.": { sv: "Bekräftelselänken är ogiltig eller har gått ut. Begär en ny länk.", en: "The confirmation link is invalid or has expired. Request a new link." },
  "Bekräftelselänken är ogiltig.": { sv: "Bekräftelselänken är ogiltig.", en: "The confirmation link is invalid." },
  "Bokningsförsöket saknar en giltig nyckel. Försök igen.": { sv: "Bokningsförsöket saknar en giltig nyckel. Försök igen.", en: "The booking request is missing a valid key. Try again." },
  "Gästbokningar måste bekräftas via e-post.": { sv: "Gästbokningar måste bekräftas via e-post.", en: "Guest bookings must be confirmed by email." },
  "Kan inte avboka en visning som redan har startat.": { sv: "Kan inte avboka en visning som redan har startat.", en: "Cannot cancel a screening that has already started." },
  "Kan inte uppdatera en avbokad bokning.": { sv: "Kan inte uppdatera en avbokad bokning.", en: "Cannot update a cancelled booking." },
  "Minst ett fält (isPaid eller isCheckedIn) måste anges.": { sv: "Minst ett fält (isPaid eller isCheckedIn) måste anges.", en: "At least one field (isPaid or isCheckedIn) must be specified." },
  "Platsbyte kräver betalning.": { sv: "Platsbyte kräver betalning.", en: "Changing seats requires payment." },
  "Platsbyte kräver en obetald bokning och betalning.": { sv: "Platsbyte kräver en obetald bokning och betalning.", en: "Changing seats requires an unpaid booking and payment." },
  "Välj olika platser.": { sv: "Välj olika platser.", en: "Select different seats." },
  "En salong med det namnet finns redan.": { sv: "En salong med det namnet finns redan.", en: "An auditorium with that name already exists." },
  "Kan inte ändra rader/stolar eftersom det finns aktiva bokningar i salongen.": { sv: "Kan inte ändra rader/stolar eftersom det finns aktiva bokningar i salongen.", en: "Cannot change rows/seats because the auditorium has active bookings." },
  "Kan inte ta bort salongen eftersom den har schemalagda visningar.": { sv: "Kan inte ta bort salongen eftersom den har schemalagda visningar.", en: "Cannot delete the auditorium because it has scheduled screenings." },
  "Ogiltig bilduppladdning. Skicka en bild i fältet 'image'.": { sv: "Ogiltig bilduppladdning. Skicka en bild i fältet 'image'.", en: "Invalid image upload. Send an image in the 'image' field." },
  "Sidan hittades inte": { sv: "Sidan hittades inte", en: "Page not found" },
  "Länken är ogiltig. Begär en ny länk.": { sv: "Länken är ogiltig. Begär en ny länk.", en: "The link is invalid. Request a new link." }
}

const apiMessages: LabelMap = {
  "Din e-postadress är redan verifierad.": { sv: "Din e-postadress är redan verifierad.", en: "Your email address is already verified." },
  "Ett nytt verifieringsmejl har skickats. Kontrollera även skräpposten.": { sv: "Ett nytt verifieringsmejl har skickats. Kontrollera även skräpposten.", en: "A new verification email has been sent. Please also check your spam folder." }
}

function mapLabel(labels: LabelMap, value: string, locale: Locale): string {
  return Object.hasOwn(labels, value) ? labels[value][locale] : value
}

// Unknown server values remain visible, including custom genres and kiosk items.
export function translateGenre(value: string, locale: Locale = readLocale()): string {
  return mapLabel(genres, value, locale)
}

export function translateTicketType(value: string, locale: Locale = readLocale()): string {
  return mapLabel(ticketTypes, value, locale)
}

export function translateKioskName(value: string, locale: Locale = readLocale()): string {
  return mapLabel(kioskNames, value, locale)
}

export function translateKioskCategory(value: string, locale: Locale = readLocale()): string {
  return mapLabel(kioskCategories, value, locale)
}

export function translateApiError(value: string, locale: Locale = readLocale()): string {
  const screeningConflict = /^Tiden krockar med en annan visning i denna salong \(inklusive (\d+) minuters ställtid\)\.$/.exec(value)
  if (screeningConflict) return translate(locale, 'api.admin.conflict', { minutes: screeningConflict[1] })
  const seatsLimit = /^Du kan boka högst (\d+) platser sammanlagt till samma visning\.$/.exec(value)
  if (seatsLimit) return translate(locale, 'api.seatsLimit', { count: seatsLimit[1] })
  const unpaidLimit = /^Du kan ha högst (\d+) aktiva obetalda bokningar och (\d+) obetalda platser\. Betala eller avboka en befintlig bokning först\.$/.exec(value)
  if (unpaidLimit) return translate(locale, 'api.unpaidLimit', { bookings: unpaidLimit[1], seats: unpaidLimit[2] })
  const cancellationHours = /^Kan inte avboka mindre än (\d+) timmar innan visningen startar\.$/.exec(value)
  if (cancellationHours) return translate(locale, 'api.cancellationHours', { hours: cancellationHours[1] })
  return translateStoredMessage(mapLabel(apiErrors, value, locale), locale)
}

export function translateApiMessage(value: string, locale: Locale = readLocale()): string {
  const guestEmail = /^Kontrollera din e-post och bekräfta bokningen via länken\. Den gäller i högst (\d+) minuter från första utskicket\. Platserna är inte reserverade ännu\.$/.exec(value)
  if (guestEmail) return translate(locale, 'booking.guestEmailSent', { minutes: guestEmail[1] })
  return translateStoredMessage(mapLabel(apiMessages, value, locale), locale)
}

export function translateKioskDescription(value: string | null, locale: Locale = readLocale()): string | null {
  return value === null ? null : mapLabel(kioskDescriptions, value, locale)
}
