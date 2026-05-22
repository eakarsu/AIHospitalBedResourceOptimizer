const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');
const router = express.Router();

// Helper: persist AI result fire-and-forget
function persistResult(userId, endpoint, result) {
  const model = result?.data?.model || 'unknown';
  const text = typeof result?.data?.content === 'string'
    ? result.data.content
    : JSON.stringify(result?.data || result);
  pool.query(
    `INSERT INTO ai_predictions (user_id, endpoint, result, model, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [userId || null, endpoint, text, model]
  ).catch(() => {});
}

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
    persistResult(req.user?.id, '/bed-forecast', result);
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
    persistResult(req.user?.id, '/patient-flow', result);
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
    persistResult(req.user?.id, '/staff-optimization', result);
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
    persistResult(req.user?.id, '/resource-optimization', result);
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
    persistResult(req.user?.id, '/discharge-prediction', result);
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
    persistResult(req.user?.id, '/emergency-planning', result);
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
    persistResult(req.user?.id, '/or-optimization', result);
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
    persistResult(req.user?.id, '/analytics', result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Discharge Readiness Scorer
router.post('/discharge-readiness', auth, async (req, res) => {
  try {
    const { patient_id } = req.body;
    if (!patient_id) return res.status(400).json({ error: 'patient_id is required' });

    const patientResult = await pool.query('SELECT * FROM patients WHERE id = $1', [patient_id]);
    if (patientResult.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });

    const patient = patientResult.rows[0];
    const admissionDate = new Date(patient.admission_date);
    const now = new Date();
    const daysSinceAdmission = Math.floor((now - admissionDate) / (1000 * 60 * 60 * 24));

    const prompt = `Score this patient's discharge readiness 0-100. Patient admitted ${daysSinceAdmission} days ago, priority: ${patient.priority}, diagnosis: ${patient.diagnosis || 'unknown'}, department: ${patient.department || 'unknown'}, age: ${patient.age || 'unknown'}.

Return ONLY valid JSON (no markdown, no explanation):
{
  "readiness_score": <number 0-100>,
  "ready_for_discharge": <boolean>,
  "blocking_factors": ["<factor1>", "<factor2>"],
  "recommended_actions": ["<action1>", "<action2>"],
  "estimated_discharge_date": "<YYYY-MM-DD>"
}`;

    const systemPrompt = 'You are a clinical discharge planning AI. Always return valid JSON only, no markdown.';
    const result = await queryAI(prompt, systemPrompt);

    if (result.success && result.data?.content) {
      // Parse and persist readiness score
      try {
        let parsed;
        const raw = result.data.content;
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
        else parsed = JSON.parse(raw);

        if (parsed?.readiness_score !== undefined) {
          await pool.query(
            'UPDATE patients SET discharge_readiness = $1 WHERE id = $2',
            [Math.round(parsed.readiness_score), patient_id]
          );
        }

        persistResult(req.user?.id, '/discharge-readiness', result);
        return res.json({ success: true, patient_id, data: parsed });
      } catch (parseErr) {
        persistResult(req.user?.id, '/discharge-readiness', result);
        return res.json({ success: true, patient_id, data: { raw_response: result.data.content } });
      }
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Bed Assignment Suggester
router.post('/suggest-bed-assignment', auth, async (req, res) => {
  try {
    const { patient_id } = req.body;
    if (!patient_id) return res.status(400).json({ error: 'patient_id is required' });

    const patientResult = await pool.query('SELECT * FROM patients WHERE id = $1', [patient_id]);
    if (patientResult.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });

    const patient = patientResult.rows[0];
    const availableBeds = await pool.query("SELECT * FROM beds WHERE status = 'available'");

    if (availableBeds.rows.length === 0) {
      return res.json({ success: false, error: 'No available beds found' });
    }

    const bedList = availableBeds.rows.map(b =>
      `ID:${b.id} ward:${b.ward} floor:${b.floor} type:${b.bed_type} monitoring:${b.has_monitoring} oxygen:${b.has_oxygen}`
    ).join('\n');

    const prompt = `Match this patient (priority: ${patient.priority}, diagnosis: ${patient.diagnosis || 'unknown'}) to the best available bed. Available beds:\n${bedList}\n\nReturn ONLY valid JSON (no markdown):
{
  "recommended_bed_id": <number>,
  "reasoning": "<why this bed>",
  "alternative_bed_ids": [<number>, <number>]
}`;

    const systemPrompt = 'You are a hospital bed assignment AI. Always return valid JSON only.';
    const result = await queryAI(prompt, systemPrompt);

    if (result.success && result.data?.content) {
      try {
        let parsed;
        const raw = result.data.content;
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
        else parsed = JSON.parse(raw);

        persistResult(req.user?.id, '/suggest-bed-assignment', result);

        // Enrich with bed details
        const recBed = availableBeds.rows.find(b => b.id === parsed.recommended_bed_id);
        return res.json({ success: true, patient_id, data: { ...parsed, recommended_bed: recBed || null } });
      } catch (parseErr) {
        persistResult(req.user?.id, '/suggest-bed-assignment', result);
        return res.json({ success: true, patient_id, data: { raw_response: result.data.content } });
      }
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Readmission Risk Prediction
router.post('/readmission-risk-prediction', auth, async (req, res) => {
  try {
    const { patient_id } = req.body;
    let patient = null;
    if (patient_id) {
      const p = await pool.query('SELECT * FROM patients WHERE id = $1', [patient_id]);
      if (p.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
      patient = p.rows[0];
    }

    const recentDischarges = await pool.query(
      "SELECT id, age, department, diagnosis, admission_date, discharge_date, status FROM patients WHERE status = 'discharged' ORDER BY discharge_date DESC NULLS LAST LIMIT 30"
    ).catch(() => ({ rows: [] }));

    const prompt = `Predict 30-day readmission risk and recommend prevention actions.

${patient ? `Subject patient:
- ID: ${patient.id}
- Age: ${patient.age || 'unknown'}
- Department: ${patient.department || 'unknown'}
- Diagnosis: ${patient.diagnosis || 'unknown'}
- Admission: ${patient.admission_date || 'unknown'}, Expected discharge: ${patient.expected_discharge || 'unknown'}, Status: ${patient.status}
- Notes: ${patient.notes || 'none'}` : 'No subject patient supplied — produce a cohort-level risk view from recent discharges below.'}

Recent discharges (cohort signal):
${recentDischarges.rows.map(d => `- id=${d.id} age=${d.age} dept=${d.department} dx=${d.diagnosis} discharged=${d.discharge_date}`).join('\n') || 'no data'}

Return JSON with:
{
  "patient_id": ${patient ? patient.id : null},
  "risk_score_0_100": number,
  "risk_tier": "low" | "moderate" | "high" | "very_high",
  "drivers": string[],
  "recommended_interventions": string[],
  "follow_up_plan": { "phone_call_days": number, "home_health_referral": boolean, "primary_care_appointment_days": number, "pharmacy_review": boolean },
  "monitoring_signals": string[],
  "confidence_0_100": number,
  "summary": string
}`;

    const result = await queryAI(prompt, 'You are a hospital readmission risk analyst. Use evidence-based readmission predictors (LACE-style factors, prior admissions, comorbidities, social determinants).');
    persistResult(req.user?.id, '/readmission-risk-prediction', result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: ICU Step-Down Recommendation
router.post('/icu-step-down-recommendation', auth, async (req, res) => {
  try {
    const { patient_id } = req.body;
    if (!patient_id) return res.status(400).json({ error: 'patient_id required' });
    const p = await pool.query('SELECT * FROM patients WHERE id = $1', [patient_id]);
    if (p.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    const patient = p.rows[0];

    const stepDownBeds = await pool.query(
      "SELECT id, room, status, department FROM beds WHERE LOWER(department) LIKE '%step%' OR LOWER(department) LIKE '%telemetry%' OR LOWER(department) LIKE '%medsurg%' OR LOWER(department) LIKE '%med-surg%' ORDER BY status"
    ).catch(() => ({ rows: [] }));

    const prompt = `Assess ICU patient stability for step-down transfer and recommend a target unit.

Patient:
- ID: ${patient.id}, Age: ${patient.age || 'unknown'}
- Department: ${patient.department || 'ICU'}
- Diagnosis: ${patient.diagnosis || 'unknown'}
- Admission: ${patient.admission_date || 'unknown'}
- Status: ${patient.status}
- Notes: ${patient.notes || 'none'}

Available step-down / telemetry / med-surg beds:
${stepDownBeds.rows.slice(0, 30).map(b => `- bed_id=${b.id} room=${b.room} dept=${b.department} status=${b.status}`).join('\n') || 'no candidate beds available'}

Return JSON:
{
  "patient_id": ${patient.id},
  "step_down_eligibility": "ready" | "watchful_waiting" | "not_ready",
  "stability_criteria": { "hemodynamic": string, "respiratory": string, "neurologic": string, "renal": string, "metabolic": string },
  "outstanding_concerns": string[],
  "recommended_target_unit": string,
  "candidate_bed_ids": number[],
  "monitoring_requirements": string[],
  "rationale": string,
  "confidence_0_100": number
}`;

    const result = await queryAI(prompt, 'You are an ICU intensivist advisor. Recommend step-down transfers conservatively, citing standard stability criteria. Always note that final clinical judgment rests with the attending physician.');
    persistResult(req.user?.id, '/icu-step-down-recommendation', result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Length-of-Stay Prediction & Barrier Identification
router.post('/length-of-stay-prediction', auth, async (req, res) => {
  try {
    const { patient = {}, current_day_in_stay, observed_milestones } = req.body || {};
    const {
      dx_codes,
      age,
      comorbidities,
      admission_type,
      current_acuity
    } = patient;

    const prompt = `Predict expected length of stay (LOS) and surface discharge barriers for the patient below. Be conservative; flag escalation indicators rather than directing clinical actions.

Patient inputs:
- Diagnosis codes: ${Array.isArray(dx_codes) ? dx_codes.join(', ') : (dx_codes || 'unknown')}
- Age: ${age ?? 'unknown'}
- Comorbidities: ${Array.isArray(comorbidities) ? comorbidities.join(', ') : (comorbidities || 'none reported')}
- Admission type: ${admission_type || 'unknown'}
- Current acuity: ${current_acuity || 'unknown'}
- Current day in stay: ${current_day_in_stay ?? 'unknown'}
- Observed milestones: ${Array.isArray(observed_milestones) ? observed_milestones.join('; ') : (observed_milestones || 'none reported')}

Return ONLY valid JSON (no markdown) with this shape:
{
  "predicted_los_days": number,
  "confidence": number,
  "barriers": [{"type": string, "severity": "low" | "moderate" | "high", "recommended_action": string}],
  "expected_discharge_date_window": {"earliest": "YYYY-MM-DD", "latest": "YYYY-MM-DD"},
  "escalation_indicators": string[],
  "disclaimer": string
}`;

    const systemPrompt = 'You are a hospital length-of-stay analyst. Use evidence-based LOS predictors (DRG benchmarks, comorbidity burden, social determinants, functional status). Always include a disclaimer that the attending physician and case manager make the final discharge determination.';
    const result = await queryAI(prompt, systemPrompt);
    persistResult(req.user?.id, '/length-of-stay-prediction', result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Staff Allocation Optimizer with Predicted Acuity
router.post('/staff-allocation-optimizer', auth, async (req, res) => {
  try {
    const {
      shift_window,
      units = [],
      available_staff = [],
      policy_constraints
    } = req.body || {};

    const unitLines = units.map(u =>
      `- unit_id=${u.id} beds_total=${u.beds_total ?? 'unknown'} beds_occupied=${u.beds_occupied ?? 'unknown'} predicted_admissions=${u.predicted_admissions ?? 'unknown'} predicted_discharges=${u.predicted_discharges ?? 'unknown'} acuity_mix=${JSON.stringify(u.current_acuity_mix || {})}`
    ).join('\n') || 'no units supplied';

    const staffLines = available_staff.map(s =>
      `- role=${s.role || 'unknown'} count=${s.count ?? 'unknown'} skill_mix=${JSON.stringify(s.skill_mix || {})}`
    ).join('\n') || 'no staff supplied';

    const prompt = `Recommend a staff allocation across the units below for the upcoming shift, accounting for predicted acuity, admissions, and discharges. Recommendations are advisory only — charge nurse / nursing supervisor retain final authority.

Shift window: ${shift_window || 'unspecified'}
Policy constraints: ${policy_constraints ? JSON.stringify(policy_constraints) : 'none supplied (use standard nurse:patient ratios as defaults)'}

Units:
${unitLines}

Available staff pool:
${staffLines}

Return ONLY valid JSON (no markdown) with this shape:
{
  "allocations": [{"unit_id": <id>, "recommended_staff": {"RN": number, "LPN": number, "NA": number, "charge": number}, "rationale": string}],
  "imbalances": [{"unit_id": <id>, "type": string, "severity": "low" | "moderate" | "high", "note": string}],
  "mutual_aid_suggestions": [{"from_unit": <id>, "to_unit": <id>, "role": string, "count": number, "rationale": string}],
  "overtime_risk": {"level": "low" | "moderate" | "high", "drivers": string[], "mitigation": string[]}
}`;

    const systemPrompt = 'You are a hospital staffing optimization advisor. Apply standard nurse:patient ratios by acuity, respect role scope-of-practice, and prefer mutual-aid moves over overtime when feasible. Recommendations are advisory; the charge nurse and nursing supervisor make final assignments.';
    const result = await queryAI(prompt, systemPrompt);
    persistResult(req.user?.id, '/staff-allocation-optimizer', result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Equipment Utilization Optimizer
router.post('/equipment-utilization-optimizer', auth, async (req, res) => {
  try {
    const {
      equipment_inventory = [],
      demand_signals = [],
      maintenance_due
    } = req.body || {};

    const invLines = equipment_inventory.map(e =>
      `- id=${e.id} type=${e.type || 'unknown'} status=${e.status || 'unknown'} location=${e.location || 'unknown'}`
    ).join('\n') || 'no inventory supplied';

    const demandLines = demand_signals.map(d =>
      `- type=${d.type || 'unknown'} count=${d.count ?? 'unknown'} urgency=${d.urgency || 'unknown'}`
    ).join('\n') || 'no demand signals supplied';

    const prompt = `Recommend equipment reallocations across the hospital to match demand signals while preserving safety stock and maintenance windows. Suggestions are advisory; biomed and unit charge nurses confirm physical moves.

Equipment inventory:
${invLines}

Demand signals:
${demandLines}

Maintenance due: ${maintenance_due ? JSON.stringify(maintenance_due) : 'none supplied'}

Return ONLY valid JSON (no markdown) with this shape:
{
  "reallocations": [{"equipment_id": <id>, "from": string, "to": string, "urgency": "low" | "moderate" | "high" | "stat", "rationale": string}],
  "maintenance_window_recommendations": [{"equipment_id": <id>, "recommended_window": string, "rationale": string}],
  "procurement_signals": [{"type": string, "shortfall": number, "rationale": string, "priority": "low" | "moderate" | "high"}]
}`;

    const systemPrompt = 'You are a hospital equipment utilization advisor. Balance demand against safety stock, infection-control turnaround, and scheduled maintenance. Never recommend reallocating equipment that is out-of-service, contaminated, or under active maintenance. Biomed and unit leaders confirm all moves.';
    const result = await queryAI(prompt, systemPrompt);
    persistResult(req.user?.id, '/equipment-utilization-optimizer', result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
