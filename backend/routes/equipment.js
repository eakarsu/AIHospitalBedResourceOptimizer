const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM equipment ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM equipment WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Equipment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, type, department, status, serial_number, purchase_date, last_maintenance, next_maintenance, cost, manufacturer, warranty_until, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO equipment (name, type, department, status, serial_number, purchase_date, last_maintenance, next_maintenance, cost, manufacturer, warranty_until, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [name, type, department, status || 'operational', serial_number, purchase_date, last_maintenance, next_maintenance, cost, manufacturer, warranty_until, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, type, department, status, serial_number, purchase_date, last_maintenance, next_maintenance, cost, manufacturer, warranty_until, notes } = req.body;
    const result = await pool.query(
      `UPDATE equipment SET name=$1, type=$2, department=$3, status=$4, serial_number=$5, purchase_date=$6,
       last_maintenance=$7, next_maintenance=$8, cost=$9, manufacturer=$10, warranty_until=$11, notes=$12, updated_at=NOW() WHERE id=$13 RETURNING *`,
      [name, type, department, status, serial_number, purchase_date, last_maintenance, next_maintenance, cost, manufacturer, warranty_until, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Equipment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM equipment WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Equipment not found' });
    res.json({ message: 'Equipment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
