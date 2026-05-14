const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM staff');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM staff ORDER BY id LIMIT $1 OFFSET $2', [limit, offset]);
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
    const result = await pool.query('SELECT * FROM staff WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Staff not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, role, department, shift, specialization, phone, email, status, hire_date, certification, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO staff (name, role, department, shift, specialization, phone, email, status, hire_date, certification, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, role, department, shift, specialization, phone, email, status || 'active', hire_date, certification, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, role, department, shift, specialization, phone, email, status, hire_date, certification, notes } = req.body;
    const result = await pool.query(
      `UPDATE staff SET name=$1, role=$2, department=$3, shift=$4, specialization=$5, phone=$6,
       email=$7, status=$8, hire_date=$9, certification=$10, notes=$11, updated_at=NOW() WHERE id=$12 RETURNING *`,
      [name, role, department, shift, specialization, phone, email, status, hire_date, certification, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Staff not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM staff WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Staff not found' });
    res.json({ message: 'Staff deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
