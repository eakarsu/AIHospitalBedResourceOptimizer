// Readmission prevention AI with enhanced discharge planning and follow-up
// scheduling.
// Audit: batch_04.md / AIHospitalBedResourceOptimizer / Custom Feature Suggestions #5
const express = require('express');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');
const pool = require('../db');

const router = express.Router();
router.use(auth);

function parseJSON(t) { try { const m = t.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (_) {} return { notes: t }; }

// POST /api/readmission-prevention/score { patient_id }
router.post('/score', async (req, res) => {
  try {
    const { patient_id } = req.body || {};
    if (!patient_id) return res.status(400).json({ error: 'patient_id required' });

    let patient = null;
    try {
      const r = await pool.query(`SELECT * FROM patients WHERE id = $1`, [patient_id]);
      patient = r.rows[0] || null;
    } catch (_) {}

    const prompt = `You are a 30-day readmission risk model. Score the patient on readmission probability,
identify key risk drivers, and produce a structured discharge bundle + follow-up cadence. Return STRICT JSON only.

Patient (de-identified for prompt safety): ${JSON.stringify(patient ? {
  diagnoses: patient.diagnoses, admission_date: patient.admission_date,
  discharge_date: patient.discharge_date, length_of_stay: patient.length_of_stay,
  comorbidities: patient.comorbidities, payer: patient.payer,
  prior_admissions_12m: patient.prior_admissions_12m
} : {})}

Return JSON:
{
  "summary": "...",
  "readmission_probability_pct": 0,
  "top_risk_drivers": [{ "factor": "string", "weight": 0 }],
  "discharge_bundle": [
    { "intervention": "string", "owner_role": "RN|case_manager|pharmacist|social_work", "due_before_discharge": true }
  ],
  "follow_up_schedule": [{ "day_offset": 0, "type": "phone|in_person|telehealth|home_visit", "owner": "string", "purpose": "string" }],
  "warning_signs_for_caregiver": ["..."],
  "estimated_readmission_reduction_pct": 0,
  "disclaimer": "Risk score advisory; clinician review required."
}`;

    const aiResp = await queryAI(prompt);
    const raw = typeof aiResp === 'string' ? aiResp : (aiResp?.content || '');
    res.json({ patient_id, prediction: parseJSON(raw) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/at-risk', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, mrn, diagnoses, prior_admissions_12m FROM patients
       WHERE prior_admissions_12m >= 2 LIMIT 50`
    ).catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
