/*
 * routes/operations.js — Apply pass 5
 *
 * Mechanical (no-LLM) operations helpers built from existing tables. Reads
 * only — does not mutate clinical state. All clinical decisions remain with
 * the care team; output is informational.
 *
 *   - GET /api/operations/los-stats         — length-of-stay descriptive stats
 *   - GET /api/operations/equipment-utilization — equipment-by-status summary
 *
 * Audit motivation (batch_04 §25):
 *   - Custom #3: LOS prediction & optimization (mechanical baseline)
 *   - Custom #6: Equipment utilization optimizer (mechanical baseline)
 */

const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

const DISCLAIMER = 'Operational analytics only. Clinical decisions remain with the care team.';

// ---------------------------------------------------------------------------
// LOS descriptive stats — by department, last 90 days, deterministic
// ---------------------------------------------------------------------------
router.get('/los-stats', auth, async (req, res) => {
  try {
    const days = Math.min(365, Math.max(7, parseInt(req.query.days, 10) || 90));
    const result = await pool.query(
      `SELECT department,
              admission_date,
              discharge_date
       FROM patients
       WHERE discharge_date IS NOT NULL
         AND discharge_date >= NOW() - INTERVAL '${days} days'`,
    );

    const byDept = {};
    for (const r of result.rows) {
      const dept = r.department || 'unknown';
      const ad = new Date(r.admission_date);
      const dd = new Date(r.discharge_date);
      if (Number.isNaN(ad.getTime()) || Number.isNaN(dd.getTime())) continue;
      const losDays = Math.max(0, (dd - ad) / (1000 * 60 * 60 * 24));
      if (!byDept[dept]) byDept[dept] = [];
      byDept[dept].push(losDays);
    }

    function summarize(arr) {
      if (arr.length === 0) return null;
      const sorted = [...arr].sort((a, b) => a - b);
      const sum = sorted.reduce((s, x) => s + x, 0);
      const mean = sum / sorted.length;
      const p = (q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
      return {
        n: sorted.length,
        mean: Math.round(mean * 100) / 100,
        p50: Math.round(p(0.5) * 100) / 100,
        p90: Math.round(p(0.9) * 100) / 100,
        max: Math.round(sorted[sorted.length - 1] * 100) / 100,
      };
    }

    const summary = {};
    for (const [k, arr] of Object.entries(byDept)) summary[k] = summarize(arr);

    res.json({
      window_days: days,
      department_los: summary,
      disclaimer: DISCLAIMER,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Equipment utilization summary — counts by status, defensive on schema
// ---------------------------------------------------------------------------
router.get('/equipment-utilization', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM equipment');
    const totals = { total: result.rows.length, by_status: {}, by_type: {} };
    for (const e of result.rows) {
      const status = String(e.status || 'unknown').toLowerCase();
      totals.by_status[status] = (totals.by_status[status] || 0) + 1;
      const type = String(e.type || e.equipment_type || 'unknown').toLowerCase();
      totals.by_type[type] = (totals.by_type[type] || 0) + 1;
    }
    const inUse = totals.by_status['in_use'] || totals.by_status['in-use'] || totals.by_status['active'] || 0;
    const available = totals.by_status['available'] || totals.by_status['idle'] || 0;
    const maintenance = totals.by_status['maintenance'] || totals.by_status['repair'] || 0;
    const utilization_pct = totals.total > 0
      ? Math.round((inUse / totals.total) * 10000) / 100
      : 0;

    res.json({
      utilization_pct,
      counts: totals,
      derived: { in_use: inUse, available, maintenance },
      disclaimer: DISCLAIMER,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
