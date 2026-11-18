export const BOOKINGS_CHANGED_EVENT = 'fv:bookings-changed'
const CHANNEL_NAME = 'fv:bookings'
const source = crypto.randomUUID()

function openChannel(): BroadcastChannel | null {
  try {
    return typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null
  } catch {
    return null // Local updates still work when cross-tab messaging is unavailable.
  }
}

// Only announce that data changed; never broadcast references or email addresses.
export function notifyBookingsChanged(): void {
  window.dispatchEvent(new Event(BOOKINGS_CHANGED_EVENT))
  const channel = openChannel()
  try { channel?.postMessage({ type: 'changed', source }) }
  catch { /* A cache notification must not turn a successful cancellation into an error. */ }
  finally { channel?.close() }
}

export function subscribeToBookingChanges(refresh: () => void): () => void {
  const refreshVisible = () => {
    if (document.visibilityState !== 'hidden') refresh()
  }
  const channel = openChannel()
  if (channel) channel.onmessage = event => {
    if (event.data?.type === 'changed' && event.data.source !== source) refresh()
  }
  window.addEventListener(BOOKINGS_CHANGED_EVENT, refresh)
  window.addEventListener('focus', refreshVisible)
  document.addEventListener('visibilitychange', refreshVisible)
  return () => {
    window.removeEventListener(BOOKINGS_CHANGED_EVENT, refresh)
    window.removeEventListener('focus', refreshVisible)
    document.removeEventListener('visibilitychange', refreshVisible)
    channel?.close()
  }
}
