---
trigger: always_on
---

# Filmvisarna – Backend and booking security rules

- Read `Backend/README.md` and `design/booking-security.md` before changing booking, guest-verification, payment or admin behavior. Follow the current user-authorized scope. Future admin abuse-management is documented separately; do not implement it without a request.
- Validate all public payloads on the server. Resolve member identity and verification from the database. Client role, email, verification flags and pricing are not authorization or pricing sources.
- Only verified members may use direct booking creation. Guests must use a purpose-bound, expiring email-confirmation flow. Guest tokens never grant account/admin access.
- Keep `guest_booking_intent` separate from `booking` and `ticket`. Pending intents reserve no seats and must not appear in occupancy, normal booking lists, payment/revenue reports or ticket statistics.
- Apply independent global/IP limits and verified-identity limits before expensive mutation or email dispatch. Use shared database-backed sliding windows, not process-local counters. Trust forwarded IP headers only for explicitly configured trusted proxies.
- Normalize email consistently across guest/member flows. Check combined per-screening seats and active unpaid booking/seat quotas within the same transaction as booking creation, serializing on the identity. Retain database seat uniqueness. IP/VPN changes must not reset identity quotas.
- Require idempotency keys for creation requests. Repeated identical successful requests return the same booking. Changed payloads cannot reuse a consumed key, and retries must not create new tickets or repeat confirmation mail.
- Email links expire in at most ten minutes for guest bookings. Store hashes only; no raw tokens, links or recipient details in application logs. Previewing a link never consumes it or creates bookings. Mail-scanner GET requests must have no booking side effects.
- SMTP failure must not leave guest bookings, held seats or abandoned verification intents. Expiry is checked on every request and does not depend on cleanup scheduling. Cleanup must never remove confirmed bookings.
- Schema changes are additive, repeatable migrations. Keep fresh schema, RLS, migration scripts and deployment documentation aligned. Never reset or seed an existing database to apply a security migration. Preserve older bookings and passwords.
- Future admin APIs require `requireAdmin` on the server and must expose limited DTOs without tokens/token hashes. Abuse flags must use explainable booking behavior, not VPN presence alone. Staff cancellation must be explicit, confirmed, atomic and audited with administrator, time, reference, action and reason. Paid-booking handling requires an explicit policy. No client-supplied admin override may bypass public quotas.
- Test important security paths using isolated PostgreSQL schemas and captured mail. Never use `DATABASE_URL` as the fallback test database. Cover concurrent requests, shared guest/member limits, IP rotation, replay, expiry, mail failure and quota boundaries. Run backend build/tests and affected frontend test/lint/build checks before reporting done.
