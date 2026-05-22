# Audit Apply Notes — AIHospitalBedResourceOptimizer

## Source
`/Users/erolakarsu/projects/_AUDIT/reports/batch_04.md` section 25.

## Original Recommendations (AI Counterparts)
- `/readmission-risk-prediction`
- `/icu-step-down-recommendation`

## Implemented (this pass)
Two endpoints appended to `backend/routes/ai.js` using the existing `queryAI`, `persistResult`, and `auth` patterns:

- `POST /api/ai/readmission-risk-prediction` — pulls subject patient (optional) and recent discharge cohort; returns JSON risk score, tier, drivers, follow-up plan, monitoring signals.
- `POST /api/ai/icu-step-down-recommendation` — pulls patient + telemetry/step-down/med-surg bed candidates; returns JSON stability criteria, eligibility, candidate bed ids, monitoring requirements, with conservative rationale and physician-final-judgment caveat.

Syntax: `node --check` passes.

## Backlog (Custom Feature Suggestions)
- Agentic hospital command center (real-time visualization + recommendations).
- Predictive surge management (seasonal + local health alert ingestion).
- Length-of-stay prediction & barrier identification.
- Staff allocation optimizer with predicted acuity.
- Equipment utilization optimizer.
- Non-AI: clinician scheduling, billing/coding, patient/family communication, clinical decision support.

## Categorization
- MECHANICAL: 2 endpoints (done — exhausts the audit's missing list).
- TOO-RISKY mechanically: any endpoint that would issue clinical orders or change patient status without physician sign-off.
- NEEDS-PRODUCT-DECISION: surge model inputs (data sources), staff allocation policy.
- NEEDS-CREDS: external data feeds (epi alerts, regional census).

## Apply pass 3 (frontend)

**Action:** LEFT-AS-IS (FE already wired).

**Stack:** Express backend + CRA frontend with `react-router-dom` and `localStorage.getItem('token')` auth in `frontend/src/App.js`.

**Backend AI endpoints surfaced:** All 12 in `backend/routes/ai.js`, including the 2 added in pass 2: `/readmission-risk-prediction`, `/icu-step-down-recommendation`.

**Files:** `_AUDIT_NOTE.md` only (this section).

**Syntax check:** N/A (no code edits).

**Notes:** `frontend/src/components/AdvancedAITools.js` already lists both pass-2 endpoints with `endpoint: '/api/ai/readmission-risk-prediction'` and `'/api/ai/icu-step-down-recommendation'`. Sidebar entry "Advanced AI" → `/dashboard/advanced-ai` registered in `Dashboard.js`. `AIInsights.js` covers the other 8 analytic endpoints. Idempotence rule applied.

## Apply pass 6 (close-out)

**Items implemented (LLM-only, safe advisory variants):**
- `POST /api/ai/length-of-stay-prediction` — predicted LOS, confidence, barriers, discharge-date window, escalation indicators, disclaimer.
- `POST /api/ai/staff-allocation-optimizer` — per-unit RN/LPN/NA/charge recommendations, imbalances, mutual-aid suggestions, overtime risk; advisory only.
- `POST /api/ai/equipment-utilization-optimizer` — reallocations, maintenance windows, procurement signals; biomed/unit confirm physical moves.

**Files:** `backend/routes/ai.js` (append-only, ~125 lines added at end). No FE, no schema, no deps, no `.env` edits.

**Syntax check:** `node --check backend/routes/ai.js` → PASS.

**Remaining backlog:**
- TOO-RISKY: agentic hospital command center (real-time control surface that could issue clinical/operational orders without sign-off).
- NEEDS-CREDS + NEEDS-SCHEMA: predictive surge management with external health-alert ingestion (epi feeds, regional census).
- NEEDS-SCHEMA (non-AI): clinician scheduling beyond simple shifts, billing/coding integration, patient/family communication portal, clinical decision support (drug interactions).
