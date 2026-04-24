const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');
const router = express.Router();

// AI Bed Demand Forecast
router.post('/bed-forecast', auth, async (req, res) => {
  try {
    const beds = await pool.query('SELECT * FROM beds');
    const patients = await pool.query('SELECT * FROM patients');
    const occupiedBeds = beds.rows.filter(b => b.status === 'occupied').length;
    const totalBeds = beds.rows.length;
    const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0;

    const prompt = `Analyze this hospital bed data and provide a 7-day bed demand forecast:
- Total Beds: ${totalBeds}
- Currently Occupied: ${occupiedBeds}
- Current Occupancy Rate: ${occupancyRate}%
- Active Patients: ${patients.rows.filter(p => p.status === 'admitted').length}
- Patients expected to discharge within 3 days: ${patients.rows.filter(p => p.expected_discharge && new Date(p.expected_discharge) <= new Date(Date.now() + 3*24*60*60*1000)).length}

Departments with patients: ${[...new Set(patients.rows.map(p => p.department))].join(', ')}

Provide: 1) Daily bed demand forecast for next 7 days, 2) Peak demand prediction, 3) Departments likely to face shortage, 4) Recommended actions to optimize capacity. Format your response with clear sections and bullet points.`;

    const result = await queryAI(prompt);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Patient Flow Optimization
router.post('/patient-flow', auth, async (req, res) => {
  try {
    const patients = await pool.query('SELECT * FROM patients');
    const beds = await pool.query('SELECT * FROM beds');

    const admittedCount = patients.rows.filter(p => p.status === 'admitted').length;
    const dischargedToday = patients.rows.filter(p => p.status === 'discharged' && new Date(p.updated_at).toDateString() === new Date().toDateString()).length;

    const prompt = `Analyze hospital patient flow and provide optimization recommendations:
- Total Active Patients: ${admittedCount}
- Patients Discharged Today: ${dischargedToday}
- Average Patient Age: ${patients.rows.length > 0 ? (patients.rows.reduce((sum, p) => sum + (p.age || 0), 0) / patients.rows.length).toFixed(0) : 'N/A'}
- Priority Distribution: Critical: ${patients.rows.filter(p => p.priority === 'critical').length}, High: ${patients.rows.filter(p => p.priority === 'high').length}, Medium: ${patients.rows.filter(p => p.priority === 'medium').length}, Low: ${patients.rows.filter(p => p.priority === 'low').length}
- Departments: ${[...new Set(patients.rows.map(p => p.department))].map(d => `${d}: ${patients.rows.filter(p => p.department === d).length} patients`).join(', ')}
- Available Beds: ${beds.rows.filter(b => b.status === 'available').length}

Provide: 1) Bottleneck analysis, 2) Patient flow optimization recommendations, 3) Discharge planning suggestions, 4) Bed turnover improvement strategies. Format with clear sections.`;

    const result = await queryAI(prompt);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Staff Optimization
router.post('/staff-optimization', auth, async (req, res) => {
  try {
    const staff = await pool.query('SELECT * FROM staff');
    const patients = await pool.query('SELECT * FROM patients');

    const activeStaff = staff.rows.filter(s => s.status === 'active');
    const prompt = `Analyze hospital staffing and provide optimization recommendations:
- Total Staff: ${staff.rows.length}
- Active Staff: ${activeStaff.length}
- Staff by Role: ${['Doctor', 'Nurse', 'Technician', 'Specialist'].map(r => `${r}: ${staff.rows.filter(s => s.role === r).length}`).join(', ')}
- Staff by Shift: Day: ${staff.rows.filter(s => s.shift === 'day').length}, Night: ${staff.rows.filter(s => s.shift === 'night').length}, Rotating: ${staff.rows.filter(s => s.shift === 'rotating').length}
- Patient to Staff Ratio: ${patients.rows.filter(p => p.status === 'admitted').length}:${activeStaff.length}
- Departments: ${[...new Set(staff.rows.map(s => s.department))].map(d => `${d}: ${staff.rows.filter(s => s.department === d).length} staff`).join(', ')}

Provide: 1) Staffing level assessment, 2) Shift optimization recommendations, 3) Department-level staffing gaps, 4) Cost-efficiency suggestions, 5) Burnout risk assessment. Format with clear sections.`;

    const result = await queryAI(prompt);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Resource Optimization
router.post('/resource-optimization', auth, async (req, res) => {
  try {
    const resources = await pool.query('SELECT * FROM resources');
    const equipment = await pool.query('SELECT * FROM equipment');
    const supplies = await pool.query('SELECT * FROM supplies');

    const lowStock = resources.rows.filter(r => r.quantity <= r.min_quantity);
    const prompt = `Analyze hospital resource utilization and provide optimization recommendations:
- Total Resource Types: ${resources.rows.length}
- Low Stock Items: ${lowStock.length} (${lowStock.map(r => r.name).join(', ')})
- Equipment Count: ${equipment.rows.length}
- Equipment Needing Maintenance: ${equipment.rows.filter(e => e.status === 'maintenance').length}
- Supply Categories: ${[...new Set(supplies.rows.map(s => s.category))].join(', ')}
- Total Resource Value: $${resources.rows.reduce((sum, r) => sum + (r.quantity * (r.cost_per_unit || 0)), 0).toLocaleString()}

Provide: 1) Resource utilization analysis, 2) Cost optimization opportunities, 3) Inventory management recommendations, 4) Equipment lifecycle suggestions, 5) Procurement priorities. Format with clear sections.`;

    const result = await queryAI(prompt);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Discharge Prediction
router.post('/discharge-prediction', auth, async (req, res) => {
  try {
    const patients = await pool.query("SELECT * FROM patients WHERE status = 'admitted'");

    const prompt = `Based on these admitted patients, predict discharge timelines and provide recommendations:
${patients.rows.map(p => `- ${p.name}, Age: ${p.age}, Diagnosis: ${p.diagnosis}, Admitted: ${p.admission_date}, Expected Discharge: ${p.expected_discharge || 'Not set'}, Priority: ${p.priority}, Department: ${p.department}`).join('\n')}

Total admitted patients: ${patients.rows.length}

Provide: 1) Predicted discharge timeline for each patient, 2) Patients likely ready for early discharge, 3) Patients at risk of extended stay, 4) Bed availability forecast based on discharges, 5) Recommended discharge planning actions. Format with clear sections.`;

    const result = await queryAI(prompt);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Emergency Capacity Planning
router.post('/emergency-planning', auth, async (req, res) => {
  try {
    const beds = await pool.query('SELECT * FROM beds');
    const staff = await pool.query('SELECT * FROM staff');
    const emergency = await pool.query('SELECT * FROM emergency_capacity');
    const equipment = await pool.query('SELECT * FROM equipment');

    const availableBeds = beds.rows.filter(b => b.status === 'available').length;
    const prompt = `Analyze hospital emergency preparedness and provide capacity planning recommendations:
- Available Beds: ${availableBeds} / ${beds.rows.length} total
- Active Staff: ${staff.rows.filter(s => s.status === 'active').length}
- Existing Emergency Plans: ${emergency.rows.length}
- Active Plans: ${emergency.rows.filter(e => e.activation_status === 'active').length}
- Operational Equipment: ${equipment.rows.filter(e => e.status === 'operational').length} / ${equipment.rows.length}
- ICU Beds Available: ${beds.rows.filter(b => b.bed_type === 'ICU' && b.status === 'available').length}

Current emergency plans: ${emergency.rows.map(e => `${e.plan_name} (${e.scenario_type}, ${e.activation_status})`).join(', ')}

Provide: 1) Current emergency readiness score (1-10), 2) Surge capacity analysis, 3) Resource gaps for emergency scenarios, 4) Staff mobilization plan, 5) Recommendations for improving preparedness. Format with clear sections.`;

    const result = await queryAI(prompt);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Operating Room Optimization
router.post('/or-optimization', auth, async (req, res) => {
  try {
    const ors = await pool.query('SELECT * FROM operating_rooms');

    const prompt = `Analyze operating room utilization and provide optimization recommendations:
- Total Operating Rooms: ${ors.rows.length}
- Available: ${ors.rows.filter(o => o.status === 'available').length}
- In Use: ${ors.rows.filter(o => o.status === 'in-use').length}
- Under Maintenance: ${ors.rows.filter(o => o.status === 'maintenance').length}
- Surgery Types: ${[...new Set(ors.rows.filter(o => o.surgery_type).map(o => o.surgery_type))].join(', ')}

Current schedule:
${ors.rows.filter(o => o.status === 'in-use').map(o => `- ${o.name}: ${o.surgery_type} by ${o.surgeon}, Patient: ${o.patient_name}, ${o.scheduled_start} - ${o.scheduled_end}`).join('\n')}

Provide: 1) OR utilization analysis, 2) Scheduling optimization recommendations, 3) Turnover time improvement suggestions, 4) Equipment readiness assessment, 5) Capacity improvement strategies. Format with clear sections.`;

    const result = await queryAI(prompt);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Analytics Dashboard
router.post('/analytics', auth, async (req, res) => {
  try {
    const beds = await pool.query('SELECT * FROM beds');
    const patients = await pool.query('SELECT * FROM patients');
    const staff = await pool.query('SELECT * FROM staff');
    const departments = await pool.query('SELECT * FROM departments');
    const equipment = await pool.query('SELECT * FROM equipment');
    const resources = await pool.query('SELECT * FROM resources');

    const totalBeds = beds.rows.length;
    const occupiedBeds = beds.rows.filter(b => b.status === 'occupied').length;

    const prompt = `Provide a comprehensive hospital operations analytics summary:
BEDS: ${totalBeds} total, ${occupiedBeds} occupied (${totalBeds > 0 ? ((occupiedBeds/totalBeds)*100).toFixed(1) : 0}% occupancy)
PATIENTS: ${patients.rows.length} total, ${patients.rows.filter(p => p.status === 'admitted').length} admitted, ${patients.rows.filter(p => p.priority === 'critical').length} critical
STAFF: ${staff.rows.length} total, ${staff.rows.filter(s => s.status === 'active').length} active
DEPARTMENTS: ${departments.rows.length} departments
EQUIPMENT: ${equipment.rows.length} items, ${equipment.rows.filter(e => e.status === 'operational').length} operational
RESOURCES: ${resources.rows.length} types, ${resources.rows.filter(r => r.quantity <= r.min_quantity).length} low stock

Provide: 1) Executive summary of hospital operations, 2) Key performance indicators, 3) Areas of concern, 4) Top 5 optimization opportunities with estimated impact, 5) Trend analysis and predictions. Format as a professional executive dashboard report.`;

    const result = await queryAI(prompt);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
