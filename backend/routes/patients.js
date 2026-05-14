const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM patients');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM patients ORDER BY id LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM patients WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, age, gender, diagnosis, admission_date, expected_discharge, bed_id, department, status, priority, insurance, attending_physician, notes } = req.body;
    if (!name || !priority) return res.status(400).json({ error: 'name and priority are required' });
    const result = await pool.query(
      `INSERT INTO patients (name, age, gender, diagnosis, admission_date, expected_discharge, bed_id, department, status, priority, insurance, attending_physician, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [name, age, gender, diagnosis, admission_date || new Date(), expected_discharge, bed_id, department, status || 'admitted', priority || 'medium', insurance, attending_physician, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, age, gender, diagnosis, admission_date, expected_discharge, bed_id, department, status, priority, insurance, attending_physician, notes } = req.body;
    const result = await pool.query(
      `UPDATE patients SET name=$1, age=$2, gender=$3, diagnosis=$4, admission_date=$5, expected_discharge=$6,
       bed_id=$7, department=$8, status=$9, priority=$10, insurance=$11, attending_physician=$12, notes=$13, updated_at=NOW() WHERE id=$14 RETURNING *`,
      [name, age, gender, diagnosis, admission_date, expected_discharge, bed_id, department, status, priority, insurance, attending_physician, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM patients WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json({ message: 'Patient deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
