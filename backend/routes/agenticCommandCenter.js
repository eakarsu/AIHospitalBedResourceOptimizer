// Agentic hospital command center visualizing census, flow, and bottlenecks
// with bed/OR recommendations.
// Audit: batch_04.md / AIHospitalBedResourceOptimizer / Custom Feature Suggestions #1
const express = require('express');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');
const pool = require('../db');

const router = express.Router();
router.use(auth);

function parseJSON(t) { try { const m = t.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (_) {} return { notes: t }; }

// POST /api/agentic-command-center/snapshot
router.post('/snapshot', async (req, res) => {
  try {
    let beds = { rows: [] }, ors = { rows: [] }, depts = { rows: [] }, ec = { rows: [] };
    try { beds = await pool.query(`SELECT status, COUNT(*) AS count FROM beds GROUP BY status`); } catch (_) {}
    try { ors = await pool.query(`SELECT status, COUNT(*) AS count FROM operating_rooms GROUP BY status`); } catch (_) {}
    try { depts = await pool.query(`SELECT id, name, current_census, capacity FROM departments LIMIT 50`); } catch (_) {}
    try { ec = await pool.query(`SELECT * FROM emergency_capacity ORDER BY recorded_at DESC LIMIT 5`); } catch (_) {}

    const prompt = `You are a hospital command-center orchestrator. Synthesize census, OR utilization,
department load, and emergency surge data into a single situation report with prioritized recommendations.
Return STRICT JSON only.

Bed status: ${JSON.stringify(beds.rows)}
OR status: ${JSON.stringify(ors.rows)}
Department census: ${JSON.stringify(depts.rows)}
Emergency capacity (recent): ${JSON.stringify(ec.rows)}

Return JSON:
{
  "situation_summary": "...",
  "overall_capacity_status": "green|yellow|orange|red",
  "department_hotspots": [{ "department_id": 0, "current_pct": 0, "predicted_4h_pct": 0, "risk": "string" }],
  "recommended_actions": [
    { "action": "transfer|expedite_discharge|open_overflow|delay_elective|call_in_staff", "priority": "low|medium|high|critical", "target": "string", "expected_impact": "string" }
  ],
  "or_recommendations": ["..."],
  "expected_bottleneck_clearance_minutes": 0,
  "next_check_in_minutes": 0,
  "disclaimer": "Advisory only; CNO retains final authority."
}`;

    const aiResp = await queryAI(prompt);
    const raw = typeof aiResp === 'string' ? aiResp : (aiResp?.content || '');
    res.json({ snapshot: parseJSON(raw), raw_metrics: { beds: beds.rows, ors: ors.rows, departments: depts.rows } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/census', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, name, current_census, capacity FROM departments LIMIT 50`
    ).catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
