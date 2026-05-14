# Apply Pass 5 — AIHospitalBedResourceOptimizer

**Date:** 2026-05-08
**Project:** AIHospitalBedResourceOptimizer
**Stack:** Node-Express + React (CRA), Postgres `pg` pool, JWT bearer auth,
PHI audit logging via `phi_audit` table.
**Audit source:** `/Users/erolakarsu/projects/_AUDIT/reports/batch_04.md` §25

## Verified-present (no changes)

Pass 1-4 already implemented all 12 hospital AI endpoints:
- `/bed-forecast`, `/patient-flow`, `/staff-optimization`,
  `/resource-optimization`, `/discharge-prediction`, `/emergency-planning`,
  `/or-optimization`, `/analytics`, `/discharge-readiness`,
  `/suggest-bed-assignment`, `/readmission-risk-prediction` (pass 2),
  `/icu-step-down-recommendation` (pass 2).
- AI rate limiter + PHI audit middleware mounted in `backend/server.js`.

## Implemented this pass (5 items — at cap)

1. `GET  /api/integrations/fhir/patient/:mrn` — 503-on-no-key (FHIR EHR).
2. `POST /api/integrations/twilio/family-notification` — 503-on-no-key.
3. `GET  /api/integrations/epi-alerts` — 503-on-no-key (epi feed).
4. `GET  /api/operations/los-stats` — mechanical descriptive LOS stats from
   `patients` table (n / mean / p50 / p90 / max per department over
   configurable window).
5. `GET  /api/operations/equipment-utilization` — mechanical aggregation of
   `equipment` table by status/type with derived utilization %.

Files written:
- `backend/routes/integrations.js` (new)
- `backend/routes/operations.js` (new)
- `backend/server.js` (added 2 `app.use(...)` lines — additive only)
- `_BACKLOG_NEEDS_CREDS.md` (new)

## Categorization of remaining backlog

- **NEEDS-CREDS (stubbed):** FHIR, Twilio, epi feed.
- **MECHANICAL (implemented):** LOS stats, equipment utilization.
- **NEEDS-CREDS (still deferred):** drug interaction DB licensing, DRG
  grouper.
- **NEEDS-PRODUCT-DECISION:** clinician scheduling rules, command-center
  autonomy bounds.

## Smoke test outcome

`node --check` passes for all 3 modified/new files. Boot smoke not run (no
running Postgres in this session); endpoints inherit existing auth + rate
limiting and use the same `pool` already used by every other route.

## Cap

5 / 5.
