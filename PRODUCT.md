# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Fest Participants**: College students and attendees discovering events, registering individual or multi-member teams, paying registration fees, and retrieving digital QR passes.
- **Event Volunteers**: Venue staff and student coordinators conducting gate check-ins, searching registrations by team code, and recording live attendance.
- **Fest Administrators**: Central festival committee managing event listings, rules, fees, volunteer assignments, and live exportable registration metrics.

## Product Purpose

Deliver a fast, cohesive, and premium registration experience for the **Asthra 26** festival that eliminates paper passes, prevents venue queues, automates Cashfree payment settlements, and provides real-time attendance verification.

## Positioning

An isolated-route portal pairing a distraction-free festival catalog (`/`) for participants with a dedicated gatekeeping workspace (`/volunteer`) for event staff, backed by automated Cashfree PG webhook reconciliation and unique registration codes (`ATHRA-2026-XXXXXX`).

## Operating Context

- **Participant Browsing**: Mobile and desktop browsers during promotional campaigns and on-the-spot spot registrations.
- **Venue Gatekeeping**: Fast-paced check-in desks at college auditoriums and competition labs with spotty festival Wi-Fi.
- **Payment Lifecycle**: Instant order creation, Cashfree checkout modal/redirect, server-side return verification, and webhook safety.

## Capabilities and Constraints

- **Route Isolation**: Public participants enter at `/` with no administrative chrome; volunteers and admins authenticate at `/volunteer` via username and password.
- **Role-Based Access Control**: `PARTICIPANT`, `VOLUNTEER` (scoped to assigned events), and `ADMIN` (global privileges).
- **Team Size Constraints**: Enforces dynamic `min_team_size` and `max_team_size` validation per event during registration.
- **Attendance Verification**: One-click check-in toggle per registration code with duplicate check-in prevention.
- **Payment Verification**: Automated order session creation and webhook signature validation via Cashfree.
- **Stack**: FastAPI (async SQLAlchemy + PostgreSQL/asyncpg), React 18, Vite, TailwindCSS / custom luxury velvet CSS.

## Brand Commitments

- **Official Title**: Strictly **Asthra 26**.
- **Visual Identity**: Dark velvet luxury palette (`#040404`, `#09090e`, `#12121b`) accented with rich metallic gold (`#D4AF37`, `#F5D77F`) and soft neumorphic card depth.
- **First-Impression Experience**: Cinematic gold splash sweep on initial arrival, cleanly bypassed on subsequent page refreshes via session storage.

## Evidence on Hand

- Database models and API contracts defined in `app/models/` and `app/schemas/`.
- Seed data scripts with default administrator and volunteer accounts in `scripts/seed_data.py`.
- Working frontend components in `frontend/src/` with passing production builds.

## Product Principles

1. **Surface Isolation**: Keep participant discovery celebratory and unburdened; keep volunteer check-in compact and lightning-fast.
2. **Instant Verification Truth**: Pass generation, check-in validation, and payment reconciliation must reflect real-time database state without manual refreshes.
3. **Resilience in Crowded Spaces**: Cache session flags, provide defensive error handling, and design high-contrast event details for mobile screens in dimly lit festival halls.
