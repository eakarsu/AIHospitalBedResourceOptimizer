/*
 * routes/integrations.js — Apply pass 5
 *
 * 503-on-no-key stubs for hospital integrations called out in batch_04 §25
 * "missing non-AI features" + "custom feature suggestions". All endpoints
 * inherit JWT auth from the existing middleware. PHI disclaimer is preserved.
 */

const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

const PHI_DISCLAIMER = 'Internal hospital operations use only. Do not transmit PHI to unconfigured integrations.';

function requireEnv(req, res, providerName, vars) {
  const missing = vars.filter((v) => !process.env[v] || String(process.env[v]).startsWith('your_'));
  if (missing.length) {
    res.status(503).json({
      error: 'integration_not_configured',
      provider: providerName,
      missing_env: missing,
      disclaimer: PHI_DISCLAIMER,
      message: `${providerName} not configured. Set ${missing.join(', ')} to enable.`,
    });
    return false;
  }
  return true;
}

// HL7 / FHIR EHR connector (Epic / Cerner / Allscripts)
router.get('/fhir/patient/:mrn', auth, async (req, res) => {
  if (!requireEnv(req, res, 'FHIR-EHR', [
    'FHIR_BASE_URL', 'FHIR_CLIENT_ID', 'FHIR_CLIENT_SECRET',
  ])) return;
  res.json({
    status: 'stub_with_creds',
    mrn: req.params.mrn,
    note: 'FHIR base reachable; wire SMART-on-FHIR auth + Patient resource fetch.',
    disclaimer: PHI_DISCLAIMER,
  });
});

// Twilio — family notifications
router.post('/twilio/family-notification', auth, async (req, res) => {
  if (!requireEnv(req, res, 'Twilio', [
    'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER',
  ])) return;
  res.json({
    status: 'stub_with_creds',
    note: 'Twilio creds present. PHI must be redacted before transmission.',
    disclaimer: PHI_DISCLAIMER,
  });
});

// Epi / regional health alerts (state DOH, CDC, custom feed)
router.get('/epi-alerts', auth, async (req, res) => {
  if (!requireEnv(req, res, 'EpiAlerts', ['EPI_FEED_URL', 'EPI_FEED_API_KEY'])) return;
  res.json({
    status: 'stub_with_creds',
    note: 'Epi feed configured; map alert categories to bed-surge thresholds.',
    disclaimer: PHI_DISCLAIMER,
  });
});

module.exports = router;
