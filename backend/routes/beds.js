const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM beds ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM beds WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bed not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { bed_number, ward, floor, bed_type, status, department, has_monitoring, has_oxygen, has_suction, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO beds (bed_number, ward, floor, bed_type, status, department, has_monitoring, has_oxygen, has_suction, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [bed_number, ward, floor, bed_type, status || 'available', department, has_monitoring, has_oxygen, has_suction, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { bed_number, ward, floor, bed_type, status, department, has_monitoring, has_oxygen, has_suction, notes } = req.body;
    const result = await pool.query(
      `UPDATE beds SET bed_number=$1, ward=$2, floor=$3, bed_type=$4, status=$5, department=$6,
       has_monitoring=$7, has_oxygen=$8, has_suction=$9, notes=$10, updated_at=NOW() WHERE id=$11 RETURNING *`,
      [bed_number, ward, floor, bed_type, status, department, has_monitoring, has_oxygen, has_suction, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bed not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM beds WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bed not found' });
    res.json({ message: 'Bed deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
