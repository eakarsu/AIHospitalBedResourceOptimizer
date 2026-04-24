const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM operating_rooms ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM operating_rooms WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Operating room not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { room_number, name, floor, status, surgery_type, surgeon, patient_name, scheduled_start, scheduled_end, equipment_ready, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO operating_rooms (room_number, name, floor, status, surgery_type, surgeon, patient_name, scheduled_start, scheduled_end, equipment_ready, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [room_number, name, floor, status || 'available', surgery_type, surgeon, patient_name, scheduled_start, scheduled_end, equipment_ready, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { room_number, name, floor, status, surgery_type, surgeon, patient_name, scheduled_start, scheduled_end, equipment_ready, notes } = req.body;
    const result = await pool.query(
      `UPDATE operating_rooms SET room_number=$1, name=$2, floor=$3, status=$4, surgery_type=$5, surgeon=$6,
       patient_name=$7, scheduled_start=$8, scheduled_end=$9, equipment_ready=$10, notes=$11, updated_at=NOW() WHERE id=$12 RETURNING *`,
      [room_number, name, floor, status, surgery_type, surgeon, patient_name, scheduled_start, scheduled_end, equipment_ready, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Operating room not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM operating_rooms WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Operating room not found' });
    res.json({ message: 'Operating room deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
