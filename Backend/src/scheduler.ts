import { refillScreenings } from './scripts/add-screenings.js';

export function startScreeningScheduler(refill = refillScreenings, intervalMs = 10 * 60 * 1000) {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const added = await refill();
      if (added > 0) console.log(`[Screenings] Lade till ${added} visningar`);
    } catch {
      console.error('[Screenings] Påfyllning misslyckades. Försöker igen vid nästa intervall.');
    } finally {
      running = false;
    }
  };
  void tick();
  const timer = setInterval(() => { void tick(); }, intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}
