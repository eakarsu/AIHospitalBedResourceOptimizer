const express = require('express');
const cors = require('cors');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
require('dotenv').config({ path: '../.env' });

const pool = require('./db');
const { validateRuntime } = require('./governance/runtime');
const governanceRouter = require('./governance/router');

validateRuntime();
// === Batch 04 Gaps & Frontend Mounts ===
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
  // Legacy schema creation is explicitly opt-in; migrations own normal schema lifecycle.
  if (process.env.ENABLE_LEGACY_SCHEMA_BOOTSTRAP === 'true') pool.query(`
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
app.use('/api/isolation-bed-match', require('./routes/isolationBedMatch'));
app.use('/api/governed-bed-allocation', governanceRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});



// === Custom Views (Bed/Resource Optimization) — mounted BEFORE any 404 ===
app.use('/api/custom-views', require('./routes/customViews'));

// 404 fallback for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
