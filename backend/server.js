const express = require('express');
const cors = require('cors');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
require('dotenv').config({ path: '../.env' });

const pool = require('./db');
// === Batch 04 Gaps & Frontend Mounts ===
const route_gap_no_readmission_risk_prediction = require('./routes/gap-no-readmission-risk-prediction');
const route_gap_no_icu_step_down_recommendation = require('./routes/gap-no-icu-step-down-recommendation');
const route_gap_no_automated_census_balancing_agent_acro = require('./routes/gap-no-automated-census-balancing-agent-acro');
const route_gap_no_providerclinician_scheduling_beyond_s = require('./routes/gap-no-providerclinician-scheduling-beyond-s');
const route_gap_no_billingcoding_integration = require('./routes/gap-no-billingcoding-integration');
const route_gap_no_patientfamily_communication_portal = require('./routes/gap-no-patientfamily-communication-portal');
const route_gap_no_clinical_decision_support_drug_intera = require('./routes/gap-no-clinical-decision-support-drug-intera');
const route_gap_no_webhook_surface = require('./routes/gap-no-webhook-surface');
const route_gap_no_real_time_websocket_bed_board = require('./routes/gap-no-real-time-websocket-bed-board');
const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Security
app.use(require('helmet')());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

// PHI Audit middleware — applied to /api/ai/* routes
async function phiAuditLog(req, res, next) {
  // Initialize tables fire-and-forget on first use
  pool.query(`
    CREATE TABLE IF NOT EXISTS phi_audit (
      id SERIAL PRIMARY KEY, user_id INTEGER, endpoint TEXT, ip_address TEXT, accessed_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  pool.query(`
    CREATE TABLE IF NOT EXISTS ai_predictions (
      id SERIAL PRIMARY KEY, user_id INTEGER, endpoint TEXT, result TEXT, model TEXT, created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  pool.query(`
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS discharge_readiness INTEGER
  `).catch(() => {});

  res.on('finish', async () => {
    if (res.statusCode < 400) {
      try {
        await pool.query(
          `INSERT INTO phi_audit (user_id, endpoint, ip_address, accessed_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT DO NOTHING`,
          [req.user?.id, req.path, req.ip]
        );
      } catch (e) {}
    }
  });
  next();
}

// AI rate limiter: 20 requests per hour per user or IP
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => (req.user?.id ? `user_${req.user.id}` : ipKeyGenerator(req.ip)),
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many AI requests. Limit is 20 per hour.' });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/beds', require('./routes/beds'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/operating-rooms', require('./routes/operatingRooms'));
app.use('/api/supplies', require('./routes/supplies'));
app.use('/api/emergency-capacity', require('./routes/emergencyCapacity'));
app.use('/api/ai', aiRateLimiter, phiAuditLog, require('./routes/ai'));
// Apply pass 5 — additive integration stubs + mechanical operations helpers
app.use('/api/integrations', require('./routes/integrations'));
app.use('/api/operations', require('./routes/operations'));
app.use('/api/readmission-prevention', require('./routes/readmissionPrevention'));
app.use('/api/agentic-command-center', require('./routes/agenticCommandCenter'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


app.use('/api/gap-no-readmission-risk-prediction', route_gap_no_readmission_risk_prediction);
app.use('/api/gap-no-icu-step-down-recommendation', route_gap_no_icu_step_down_recommendation);
app.use('/api/gap-no-automated-census-balancing-agent-acro', route_gap_no_automated_census_balancing_agent_acro);
app.use('/api/gap-no-providerclinician-scheduling-beyond-s', route_gap_no_providerclinician_scheduling_beyond_s);
app.use('/api/gap-no-billingcoding-integration', route_gap_no_billingcoding_integration);
app.use('/api/gap-no-patientfamily-communication-portal', route_gap_no_patientfamily_communication_portal);
app.use('/api/gap-no-clinical-decision-support-drug-intera', route_gap_no_clinical_decision_support_drug_intera);
app.use('/api/gap-no-webhook-surface', route_gap_no_webhook_surface);
app.use('/api/gap-no-real-time-websocket-bed-board', route_gap_no_real_time_websocket_bed_board);

// === Custom Views (Bed/Resource Optimization) — mounted BEFORE any 404 ===
app.use('/api/custom-views', require('./routes/customViews'));

// 404 fallback for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
