const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM departments ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM departments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Department not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, head_doctor, floor, total_beds, occupied_beds, staff_count, budget, phone, status, specialization, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO departments (name, head_doctor, floor, total_beds, occupied_beds, staff_count, budget, phone, status, specialization, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, head_doctor, floor, total_beds, occupied_beds || 0, staff_count, budget, phone, status || 'active', specialization, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, head_doctor, floor, total_beds, occupied_beds, staff_count, budget, phone, status, specialization, notes } = req.body;
    const result = await pool.query(
      `UPDATE departments SET name=$1, head_doctor=$2, floor=$3, total_beds=$4, occupied_beds=$5, staff_count=$6,
       budget=$7, phone=$8, status=$9, specialization=$10, notes=$11, updated_at=NOW() WHERE id=$12 RETURNING *`,
      [name, head_doctor, floor, total_beds, occupied_beds, staff_count, budget, phone, status, specialization, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Department not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM departments WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Department not found' });
    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
