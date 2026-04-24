const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM supplies ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM supplies WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Supply not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, category, quantity, unit, min_quantity, cost_per_unit, supplier, expiry_date, storage_location, status, department, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO supplies (name, category, quantity, unit, min_quantity, cost_per_unit, supplier, expiry_date, storage_location, status, department, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [name, category, quantity, unit, min_quantity, cost_per_unit, supplier, expiry_date, storage_location, status || 'in-stock', department, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, category, quantity, unit, min_quantity, cost_per_unit, supplier, expiry_date, storage_location, status, department, notes } = req.body;
    const result = await pool.query(
      `UPDATE supplies SET name=$1, category=$2, quantity=$3, unit=$4, min_quantity=$5, cost_per_unit=$6,
       supplier=$7, expiry_date=$8, storage_location=$9, status=$10, department=$11, notes=$12, updated_at=NOW() WHERE id=$13 RETURNING *`,
      [name, category, quantity, unit, min_quantity, cost_per_unit, supplier, expiry_date, storage_location, status, department, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Supply not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM supplies WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Supply not found' });
    res.json({ message: 'Supply deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
