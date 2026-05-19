# Backlog: Needs Credentials — AIHospitalBedResourceOptimizer

Apply pass 5 stubs. PHI disclaimer preserved on every payload.

## FHIR / SMART-on-FHIR EHR connector
- **Endpoint:** `GET /api/integrations/fhir/patient/:mrn`
- **Env:** `FHIR_BASE_URL`, `FHIR_CLIENT_ID`, `FHIR_CLIENT_SECRET`
- **Wire-up TODO:** SMART OAuth2 client-credentials flow; map FHIR Patient
  resource to local `patients` schema; respect `Consent` resource.

## Twilio — family notifications
- **Endpoint:** `POST /api/integrations/twilio/family-notification`
- **Env:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
- **Wire-up TODO:** Templated messages only; PHI redaction; opt-in tracking.

## Epi / regional health alerts
- **Endpoint:** `GET /api/integrations/epi-alerts`
- **Env:** `EPI_FEED_URL`, `EPI_FEED_API_KEY`
- **Wire-up TODO:** Map alert categories to bed-surge thresholds; trigger
  emergency-capacity workflow already present in `routes/emergencyCapacity.js`.

## Backlog items NOT mechanical (deferred)

- **Provider/clinician scheduling** — needs scheduling rules, credentialing
  data, and union/contract constraints (NEEDS-PRODUCT-DECISION).
- **Billing/coding integration** — DRG grouper + payer-specific edits
  (NEEDS-CREDS for grouper licensing).
- **Clinical decision support** — drug interaction database licensing
  (NEEDS-CREDS — First Databank / Lexicomp / Multum).
- **Agentic hospital command center** — TOO-RISKY without explicit autonomy
  bounds and physician sign-off rules.
