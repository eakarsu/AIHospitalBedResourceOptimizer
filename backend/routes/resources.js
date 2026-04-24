const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM resources ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM resources WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Resource not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, category, department, quantity, unit, min_quantity, cost_per_unit, supplier, status, reorder_point, storage_location, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO resources (name, category, department, quantity, unit, min_quantity, cost_per_unit, supplier, status, reorder_point, storage_location, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [name, category, department, quantity, unit, min_quantity, cost_per_unit, supplier, status || 'in-stock', reorder_point, storage_location, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, category, department, quantity, unit, min_quantity, cost_per_unit, supplier, status, reorder_point, storage_location, notes } = req.body;
    const result = await pool.query(
      `UPDATE resources SET name=$1, category=$2, department=$3, quantity=$4, unit=$5, min_quantity=$6,
       cost_per_unit=$7, supplier=$8, status=$9, reorder_point=$10, storage_location=$11, notes=$12, updated_at=NOW() WHERE id=$13 RETURNING *`,
      [name, category, department, quantity, unit, min_quantity, cost_per_unit, supplier, status, reorder_point, storage_location, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Resource not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM resources WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Resource not found' });
    res.json({ message: 'Resource deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
