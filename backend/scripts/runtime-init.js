require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const bcrypt = require('bcryptjs');
const pool = require('../db');

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL, role VARCHAR(50) DEFAULT 'admin', created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS beds (
      id SERIAL PRIMARY KEY, bed_number VARCHAR(100), status VARCHAR(50) DEFAULT 'available', department VARCHAR(100), created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS patients (
      id SERIAL PRIMARY KEY, name VARCHAR(255), age INTEGER, status VARCHAR(50) DEFAULT 'admitted', priority VARCHAR(50), department VARCHAR(100), expected_discharge TIMESTAMP, updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ai_predictions (
      id SERIAL PRIMARY KEY, user_id INTEGER, endpoint TEXT, result TEXT, model TEXT, created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS phi_audit (
      id SERIAL PRIMARY KEY, user_id INTEGER, endpoint TEXT, ip_address TEXT, accessed_at TIMESTAMP DEFAULT NOW()
    );
  `);
  const email=(process.env.ADMIN_EMAIL||'runtime-admin@example.com').trim().toLowerCase();
  const hash=await bcrypt.hash(process.env.ADMIN_PASSWORD||'RuntimeAcceptance123!',12);
  await pool.query(`INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,'admin') ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name,password_hash=EXCLUDED.password_hash,role=EXCLUDED.role`,['Runtime Administrator',email,hash]);
}
main().then(()=>pool.end()).catch(async e=>{console.error(`Runtime initialization failed: ${e.message}`);await pool.end().catch(()=>{});process.exit(1)});
