const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM emergency_capacity ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM emergency_capacity WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Emergency plan not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { plan_name, scenario_type, severity_level, total_beds_needed, current_available, surge_capacity, staff_required, equipment_needed, estimated_duration, activation_status, coordinator, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO emergency_capacity (plan_name, scenario_type, severity_level, total_beds_needed, current_available, surge_capacity, staff_required, equipment_needed, estimated_duration, activation_status, coordinator, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [plan_name, scenario_type, severity_level, total_beds_needed, current_available, surge_capacity, staff_required, equipment_needed, estimated_duration, activation_status || 'standby', coordinator, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { plan_name, scenario_type, severity_level, total_beds_needed, current_available, surge_capacity, staff_required, equipment_needed, estimated_duration, activation_status, coordinator, notes } = req.body;
    const result = await pool.query(
      `UPDATE emergency_capacity SET plan_name=$1, scenario_type=$2, severity_level=$3, total_beds_needed=$4,
       current_available=$5, surge_capacity=$6, staff_required=$7, equipment_needed=$8, estimated_duration=$9,
       activation_status=$10, coordinator=$11, notes=$12, updated_at=NOW() WHERE id=$13 RETURNING *`,
      [plan_name, scenario_type, severity_level, total_beds_needed, current_available, surge_capacity, staff_required, equipment_needed, estimated_duration, activation_status, coordinator, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Emergency plan not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM emergency_capacity WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Emergency plan not found' });
    res.json({ message: 'Emergency plan deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
