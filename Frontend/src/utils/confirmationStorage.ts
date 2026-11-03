import type { ConfirmationData } from '../types/confirmation'

const keyFor = (ref: string) => `fv-booking-${ref}`

export function saveConfirmation(data: ConfirmationData) {
  try {
    sessionStorage.setItem(keyFor(data.bookingRef), JSON.stringify(data))
  } catch {
    // storage can be blocked, the ticket page then shows a fallback
  }
}

export function loadConfirmation(ref: string): ConfirmationData | null {
  try {
    const raw = sessionStorage.getItem(keyFor(ref))
    return raw ? (JSON.parse(raw) as ConfirmationData) : null
  } catch {
    return null
  }
}