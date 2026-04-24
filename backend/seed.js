const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'hospital_optimizer',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  const client = await pool.connect();
  try {
    // Drop tables
    await client.query(`
      DROP TABLE IF EXISTS emergency_capacity CASCADE;
      DROP TABLE IF EXISTS supplies CASCADE;
      DROP TABLE IF EXISTS operating_rooms CASCADE;
      DROP TABLE IF EXISTS resources CASCADE;
      DROP TABLE IF EXISTS equipment CASCADE;
      DROP TABLE IF EXISTS patients CASCADE;
      DROP TABLE IF EXISTS beds CASCADE;
      DROP TABLE IF EXISTS departments CASCADE;
      DROP TABLE IF EXISTS staff CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Create tables
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        head_doctor VARCHAR(255),
        floor INTEGER,
        total_beds INTEGER DEFAULT 0,
        occupied_beds INTEGER DEFAULT 0,
        staff_count INTEGER DEFAULT 0,
        budget DECIMAL(12,2),
        phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'active',
        specialization VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE beds (
        id SERIAL PRIMARY KEY,
        bed_number VARCHAR(50) NOT NULL,
        ward VARCHAR(100),
        floor INTEGER,
        bed_type VARCHAR(50),
        status VARCHAR(50) DEFAULT 'available',
        department VARCHAR(100),
        has_monitoring BOOLEAN DEFAULT false,
        has_oxygen BOOLEAN DEFAULT false,
        has_suction BOOLEAN DEFAULT false,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE patients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        age INTEGER,
        gender VARCHAR(20),
        diagnosis TEXT,
        admission_date DATE DEFAULT CURRENT_DATE,
        expected_discharge DATE,
        bed_id INTEGER,
        department VARCHAR(100),
        status VARCHAR(50) DEFAULT 'admitted',
        priority VARCHAR(20) DEFAULT 'medium',
        insurance VARCHAR(255),
        attending_physician VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE staff (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100),
        department VARCHAR(100),
        shift VARCHAR(50),
        specialization VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        hire_date DATE,
        certification VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE equipment (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        department VARCHAR(100),
        status VARCHAR(50) DEFAULT 'operational',
        serial_number VARCHAR(100),
        purchase_date DATE,
        last_maintenance DATE,
        next_maintenance DATE,
        cost DECIMAL(12,2),
        manufacturer VARCHAR(255),
        warranty_until DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE resources (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        department VARCHAR(100),
        quantity INTEGER DEFAULT 0,
        unit VARCHAR(50),
        min_quantity INTEGER DEFAULT 0,
        cost_per_unit DECIMAL(10,2),
        supplier VARCHAR(255),
        status VARCHAR(50) DEFAULT 'in-stock',
        reorder_point INTEGER,
        storage_location VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE operating_rooms (
        id SERIAL PRIMARY KEY,
        room_number VARCHAR(50) NOT NULL,
        name VARCHAR(255),
        floor INTEGER,
        status VARCHAR(50) DEFAULT 'available',
        surgery_type VARCHAR(255),
        surgeon VARCHAR(255),
        patient_name VARCHAR(255),
        scheduled_start TIMESTAMP,
        scheduled_end TIMESTAMP,
        equipment_ready BOOLEAN DEFAULT true,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE supplies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        quantity INTEGER DEFAULT 0,
        unit VARCHAR(50),
        min_quantity INTEGER DEFAULT 0,
        cost_per_unit DECIMAL(10,2),
        supplier VARCHAR(255),
        expiry_date DATE,
        storage_location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'in-stock',
        department VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE emergency_capacity (
        id SERIAL PRIMARY KEY,
        plan_name VARCHAR(255) NOT NULL,
        scenario_type VARCHAR(100),
        severity_level VARCHAR(50),
        total_beds_needed INTEGER,
        current_available INTEGER,
        surge_capacity INTEGER,
        staff_required INTEGER,
        equipment_needed TEXT,
        estimated_duration VARCHAR(100),
        activation_status VARCHAR(50) DEFAULT 'standby',
        coordinator VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Seed Users
    const passwordHash = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO users (name, email, password_hash, role) VALUES
      ('Dr. Admin', 'admin@hospital.com', '${passwordHash}', 'admin'),
      ('Dr. Sarah Johnson', 'sarah@hospital.com', '${passwordHash}', 'doctor'),
      ('Nurse Manager', 'nurse@hospital.com', '${passwordHash}', 'nurse_manager');
    `);

    // Seed Departments (15)
    await client.query(`
      INSERT INTO departments (name, head_doctor, floor, total_beds, occupied_beds, staff_count, budget, phone, status, specialization, notes) VALUES
      ('Emergency', 'Dr. James Wilson', 1, 30, 22, 45, 2500000, '555-0101', 'active', 'Emergency Medicine', 'Level 1 Trauma Center'),
      ('ICU', 'Dr. Maria Garcia', 2, 20, 18, 35, 3500000, '555-0102', 'active', 'Critical Care', '24/7 intensive monitoring'),
      ('Cardiology', 'Dr. Robert Chen', 3, 25, 19, 28, 2800000, '555-0103', 'active', 'Cardiovascular', 'Cath lab equipped'),
      ('Orthopedics', 'Dr. Emily Taylor', 4, 22, 15, 22, 1800000, '555-0104', 'active', 'Musculoskeletal', 'Joint replacement center'),
      ('Neurology', 'Dr. David Kim', 3, 18, 14, 20, 2200000, '555-0105', 'active', 'Neurological', 'Stroke center certified'),
      ('Pediatrics', 'Dr. Lisa Anderson', 5, 24, 16, 30, 2000000, '555-0106', 'active', 'Child Health', 'NICU available'),
      ('Oncology', 'Dr. Michael Brown', 4, 20, 17, 25, 3000000, '555-0107', 'active', 'Cancer Treatment', 'Chemo & radiation therapy'),
      ('Surgery', 'Dr. Jennifer White', 2, 28, 20, 40, 4000000, '555-0108', 'active', 'General Surgery', '8 operating rooms'),
      ('OB/GYN', 'Dr. Patricia Lee', 5, 22, 14, 26, 1900000, '555-0109', 'active', 'Obstetrics & Gynecology', 'Labor and delivery suite'),
      ('Pulmonology', 'Dr. Thomas Martinez', 3, 16, 12, 18, 1600000, '555-0110', 'active', 'Respiratory', 'Pulmonary function lab'),
      ('Gastroenterology', 'Dr. Susan Clark', 4, 15, 10, 16, 1500000, '555-0111', 'active', 'Digestive Health', 'Endoscopy suite'),
      ('Nephrology', 'Dr. Richard Hall', 3, 14, 11, 15, 1700000, '555-0112', 'active', 'Kidney Care', 'Dialysis center'),
      ('Radiology', 'Dr. Karen Young', 1, 0, 0, 20, 2100000, '555-0113', 'active', 'Diagnostic Imaging', 'MRI, CT, X-ray, Ultrasound'),
      ('Psychiatry', 'Dr. Steven Wright', 6, 18, 13, 22, 1400000, '555-0114', 'active', 'Mental Health', 'Inpatient and outpatient'),
      ('Rehabilitation', 'Dr. Nancy Adams', 6, 16, 10, 18, 1200000, '555-0115', 'active', 'Physical Therapy', 'PT/OT/Speech therapy');
    `);

    // Seed Beds (15)
    await client.query(`
      INSERT INTO beds (bed_number, ward, floor, bed_type, status, department, has_monitoring, has_oxygen, has_suction, notes) VALUES
      ('ER-101', 'Emergency Ward A', 1, 'standard', 'occupied', 'Emergency', true, true, true, 'Near nursing station'),
      ('ER-102', 'Emergency Ward A', 1, 'standard', 'available', 'Emergency', true, true, false, 'Window bed'),
      ('ICU-201', 'Intensive Care', 2, 'ICU', 'occupied', 'ICU', true, true, true, 'Full monitoring suite'),
      ('ICU-202', 'Intensive Care', 2, 'ICU', 'occupied', 'ICU', true, true, true, 'Isolation capable'),
      ('ICU-203', 'Intensive Care', 2, 'ICU', 'available', 'ICU', true, true, true, 'Recently upgraded'),
      ('CARD-301', 'Cardiology Wing', 3, 'standard', 'occupied', 'Cardiology', true, true, false, 'Telemetry equipped'),
      ('CARD-302', 'Cardiology Wing', 3, 'standard', 'available', 'Cardiology', true, true, false, 'Private room'),
      ('ORTH-401', 'Orthopedics Ward', 4, 'standard', 'occupied', 'Orthopedics', false, true, false, 'Traction capable'),
      ('NEUR-301', 'Neurology Unit', 3, 'standard', 'occupied', 'Neurology', true, true, false, 'EEG monitoring'),
      ('PED-501', 'Pediatrics Ward', 5, 'pediatric', 'occupied', 'Pediatrics', true, true, true, 'Child-friendly decor'),
      ('PED-502', 'Pediatrics Ward', 5, 'pediatric', 'available', 'Pediatrics', true, true, false, 'Parent sleeper'),
      ('ONC-401', 'Oncology Unit', 4, 'standard', 'occupied', 'Oncology', true, true, true, 'Chemo infusion ready'),
      ('SURG-201', 'Surgery Recovery', 2, 'post-op', 'occupied', 'Surgery', true, true, true, 'Post-op monitoring'),
      ('OB-501', 'Labor & Delivery', 5, 'delivery', 'available', 'OB/GYN', true, true, true, 'Birthing suite'),
      ('PSYCH-601', 'Psychiatry Ward', 6, 'standard', 'occupied', 'Psychiatry', false, false, false, 'Secure unit');
    `);

    // Seed Patients (15)
    await client.query(`
      INSERT INTO patients (name, age, gender, diagnosis, admission_date, expected_discharge, bed_id, department, status, priority, insurance, attending_physician, notes) VALUES
      ('John Smith', 67, 'Male', 'Acute Myocardial Infarction', '2024-01-10', '2024-01-17', 6, 'Cardiology', 'admitted', 'critical', 'Blue Cross PPO', 'Dr. Robert Chen', 'History of hypertension'),
      ('Mary Johnson', 45, 'Female', 'Appendicitis - Post Surgery', '2024-01-12', '2024-01-15', 13, 'Surgery', 'admitted', 'medium', 'Aetna HMO', 'Dr. Jennifer White', 'Recovering well'),
      ('Robert Williams', 72, 'Male', 'Stroke - Ischemic', '2024-01-09', '2024-01-20', 9, 'Neurology', 'admitted', 'critical', 'Medicare', 'Dr. David Kim', 'Right-sided weakness'),
      ('Patricia Brown', 34, 'Female', 'Pneumonia', '2024-01-11', '2024-01-16', 1, 'Emergency', 'admitted', 'high', 'UnitedHealth', 'Dr. James Wilson', 'Bilateral infiltrates'),
      ('Michael Davis', 58, 'Male', 'Hip Replacement Recovery', '2024-01-08', '2024-01-14', 8, 'Orthopedics', 'admitted', 'medium', 'Cigna', 'Dr. Emily Taylor', 'Physical therapy started'),
      ('Jennifer Garcia', 28, 'Female', 'Traumatic Brain Injury', '2024-01-07', '2024-01-25', 3, 'ICU', 'admitted', 'critical', 'Blue Shield', 'Dr. Maria Garcia', 'GCS improving'),
      ('David Martinez', 55, 'Male', 'Colon Cancer - Chemo', '2024-01-10', '2024-01-13', 12, 'Oncology', 'admitted', 'high', 'Kaiser', 'Dr. Michael Brown', 'Cycle 3 of 6'),
      ('Sarah Anderson', 8, 'Female', 'Asthma Exacerbation', '2024-01-12', '2024-01-14', 10, 'Pediatrics', 'admitted', 'medium', 'Medicaid', 'Dr. Lisa Anderson', 'Nebulizer treatment'),
      ('James Thomas', 62, 'Male', 'COPD Exacerbation', '2024-01-11', '2024-01-18', 4, 'ICU', 'admitted', 'high', 'Medicare', 'Dr. Thomas Martinez', 'On BiPAP'),
      ('Linda Jackson', 41, 'Female', 'Depression - Acute Episode', '2024-01-09', '2024-01-23', 15, 'Psychiatry', 'admitted', 'medium', 'Aetna PPO', 'Dr. Steven Wright', 'Medication adjustment'),
      ('William White', 70, 'Male', 'Chronic Kidney Disease', '2024-01-10', '2024-01-17', NULL, 'Nephrology', 'admitted', 'high', 'Medicare', 'Dr. Richard Hall', 'Dialysis 3x/week'),
      ('Elizabeth Harris', 38, 'Female', 'Gallbladder Removal', '2024-01-13', '2024-01-15', NULL, 'Surgery', 'admitted', 'low', 'UnitedHealth PPO', 'Dr. Jennifer White', 'Laparoscopic procedure'),
      ('Charles Clark', 75, 'Male', 'Heart Failure Exacerbation', '2024-01-08', '2024-01-19', NULL, 'Cardiology', 'admitted', 'critical', 'Medicare', 'Dr. Robert Chen', 'Diuretic therapy'),
      ('Margaret Lewis', 52, 'Female', 'Breast Cancer - Radiation', '2024-01-11', '2024-01-12', NULL, 'Oncology', 'admitted', 'medium', 'Blue Cross', 'Dr. Michael Brown', 'Session 15 of 20'),
      ('Christopher Lee', 43, 'Male', 'Fractured Femur', '2024-01-12', '2024-01-22', NULL, 'Orthopedics', 'admitted', 'high', 'Cigna PPO', 'Dr. Emily Taylor', 'Surgical repair scheduled');
    `);

    // Seed Staff (15)
    await client.query(`
      INSERT INTO staff (name, role, department, shift, specialization, phone, email, status, hire_date, certification, notes) VALUES
      ('Dr. James Wilson', 'Doctor', 'Emergency', 'rotating', 'Emergency Medicine', '555-1001', 'j.wilson@hospital.com', 'active', '2015-03-15', 'Board Certified EM', 'Department Head'),
      ('Dr. Maria Garcia', 'Doctor', 'ICU', 'day', 'Critical Care', '555-1002', 'm.garcia@hospital.com', 'active', '2012-06-01', 'Board Certified CC', 'ICU Director'),
      ('Dr. Robert Chen', 'Doctor', 'Cardiology', 'day', 'Interventional Cardiology', '555-1003', 'r.chen@hospital.com', 'active', '2010-01-10', 'Board Certified Card', 'Cath Lab Director'),
      ('Nurse Sarah Miller', 'Nurse', 'Emergency', 'day', 'Trauma Nursing', '555-1004', 's.miller@hospital.com', 'active', '2018-08-20', 'CEN, TNCC', 'Charge Nurse'),
      ('Nurse Tom Baker', 'Nurse', 'ICU', 'night', 'Critical Care Nursing', '555-1005', 't.baker@hospital.com', 'active', '2016-11-15', 'CCRN', 'Night shift lead'),
      ('Dr. Emily Taylor', 'Doctor', 'Orthopedics', 'day', 'Joint Replacement', '555-1006', 'e.taylor@hospital.com', 'active', '2014-04-01', 'Board Certified Ortho', 'Sports medicine fellow'),
      ('Nurse Rachel Green', 'Nurse', 'Cardiology', 'day', 'Cardiac Nursing', '555-1007', 'r.green@hospital.com', 'active', '2019-02-14', 'PCCN', 'Telemetry specialist'),
      ('Tech Mike Johnson', 'Technician', 'Radiology', 'day', 'MRI/CT', '555-1008', 'm.johnson@hospital.com', 'active', '2017-07-01', 'ARRT', 'Senior technologist'),
      ('Dr. David Kim', 'Doctor', 'Neurology', 'day', 'Stroke Neurology', '555-1009', 'd.kim@hospital.com', 'active', '2013-09-15', 'Board Certified Neuro', 'Stroke team lead'),
      ('Nurse Amy Wong', 'Nurse', 'Pediatrics', 'day', 'Pediatric Nursing', '555-1010', 'a.wong@hospital.com', 'active', '2020-01-06', 'CPN', 'NICU trained'),
      ('Dr. Lisa Anderson', 'Doctor', 'Pediatrics', 'day', 'General Pediatrics', '555-1011', 'l.anderson@hospital.com', 'active', '2011-03-20', 'Board Certified Peds', 'Department Chair'),
      ('Nurse Carlos Rivera', 'Nurse', 'Surgery', 'rotating', 'Perioperative Nursing', '555-1012', 'c.rivera@hospital.com', 'active', '2015-10-01', 'CNOR', 'OR circulator'),
      ('Dr. Jennifer White', 'Doctor', 'Surgery', 'day', 'General Surgery', '555-1013', 'j.white@hospital.com', 'active', '2009-06-15', 'FACS', 'Chief of Surgery'),
      ('Specialist John Park', 'Specialist', 'Rehabilitation', 'day', 'Physical Therapy', '555-1014', 'j.park@hospital.com', 'active', '2018-04-10', 'DPT, OCS', 'Sports rehab expert'),
      ('Nurse Diana Cruz', 'Nurse', 'Oncology', 'day', 'Oncology Nursing', '555-1015', 'd.cruz@hospital.com', 'active', '2017-12-01', 'OCN', 'Chemo certified');
    `);

    // Seed Equipment (15)
    await client.query(`
      INSERT INTO equipment (name, type, department, status, serial_number, purchase_date, last_maintenance, next_maintenance, cost, manufacturer, warranty_until, notes) VALUES
      ('Ventilator V500', 'Ventilator', 'ICU', 'operational', 'VNT-2024-001', '2023-01-15', '2024-01-01', '2024-04-01', 35000, 'Dräger', '2026-01-15', 'Primary ICU ventilator'),
      ('CT Scanner GE Revolution', 'Imaging', 'Radiology', 'operational', 'CT-2022-001', '2022-06-01', '2023-12-15', '2024-06-15', 2500000, 'GE Healthcare', '2027-06-01', '256-slice capability'),
      ('MRI 3T Siemens', 'Imaging', 'Radiology', 'operational', 'MRI-2023-001', '2023-03-20', '2024-01-10', '2024-07-10', 3000000, 'Siemens', '2028-03-20', '3 Tesla high-res'),
      ('Defibrillator Zoll X', 'Emergency', 'Emergency', 'operational', 'DEF-2023-005', '2023-07-01', '2024-01-05', '2024-07-05', 15000, 'Zoll Medical', '2026-07-01', 'AED capable'),
      ('Patient Monitor Philips', 'Monitoring', 'ICU', 'operational', 'MON-2023-010', '2023-02-10', '2024-01-08', '2024-04-08', 12000, 'Philips', '2026-02-10', 'Multi-parameter'),
      ('Infusion Pump Alaris', 'Infusion', 'Oncology', 'operational', 'INF-2023-020', '2023-04-15', '2024-01-03', '2024-04-03', 5000, 'BD Alaris', '2026-04-15', 'Smart pump technology'),
      ('Surgical Robot da Vinci', 'Surgical', 'Surgery', 'operational', 'ROB-2022-001', '2022-01-10', '2023-12-20', '2024-06-20', 2000000, 'Intuitive Surgical', '2027-01-10', 'Xi system'),
      ('X-Ray Machine', 'Imaging', 'Radiology', 'operational', 'XR-2023-003', '2023-05-01', '2024-01-12', '2024-05-12', 150000, 'Canon Medical', '2026-05-01', 'Digital radiography'),
      ('Ultrasound GE Logiq', 'Imaging', 'OB/GYN', 'operational', 'US-2023-002', '2023-08-15', '2024-01-07', '2024-04-07', 75000, 'GE Healthcare', '2026-08-15', '4D capability'),
      ('Anesthesia Machine', 'Anesthesia', 'Surgery', 'maintenance', 'ANE-2021-001', '2021-09-01', '2024-01-10', '2024-01-20', 45000, 'Dräger', '2024-09-01', 'Scheduled calibration'),
      ('EKG Machine', 'Diagnostic', 'Cardiology', 'operational', 'EKG-2023-008', '2023-06-01', '2024-01-02', '2024-04-02', 8000, 'GE Healthcare', '2026-06-01', '12-lead wireless'),
      ('Dialysis Machine Fresenius', 'Dialysis', 'Nephrology', 'operational', 'DIA-2023-004', '2023-03-01', '2024-01-06', '2024-04-06', 25000, 'Fresenius', '2026-03-01', 'Single-use system'),
      ('Endoscope Olympus', 'Endoscopy', 'Gastroenterology', 'operational', 'END-2023-002', '2023-07-15', '2024-01-09', '2024-04-09', 40000, 'Olympus', '2026-07-15', 'HD imaging'),
      ('Blood Gas Analyzer', 'Laboratory', 'ICU', 'operational', 'BGA-2023-001', '2023-09-01', '2024-01-04', '2024-03-04', 18000, 'Radiometer', '2026-09-01', 'Point-of-care testing'),
      ('Portable X-Ray', 'Imaging', 'Emergency', 'operational', 'PXR-2023-001', '2023-10-01', '2024-01-11', '2024-04-11', 95000, 'Samsung', '2026-10-01', 'Battery powered, wireless');
    `);

    // Seed Resources (15)
    await client.query(`
      INSERT INTO resources (name, category, department, quantity, unit, min_quantity, cost_per_unit, supplier, status, reorder_point, storage_location, notes) VALUES
      ('Surgical Masks N95', 'PPE', 'General', 5000, 'pieces', 1000, 1.50, 'MedSupply Co', 'in-stock', 2000, 'Warehouse A-1', 'NIOSH approved'),
      ('Surgical Gloves (L)', 'PPE', 'Surgery', 8000, 'pairs', 2000, 0.35, 'MedSupply Co', 'in-stock', 3000, 'Warehouse A-2', 'Latex-free available'),
      ('IV Solution Normal Saline', 'Fluids', 'General', 3000, 'bags', 500, 2.50, 'Baxter', 'in-stock', 1000, 'Pharmacy Store', '0.9% NaCl 1000mL'),
      ('Syringes 10mL', 'Disposables', 'General', 10000, 'pieces', 2000, 0.25, 'BD Medical', 'in-stock', 4000, 'Warehouse B-1', 'Luer-lock'),
      ('Blood Collection Tubes', 'Laboratory', 'Pathology', 6000, 'pieces', 1500, 0.40, 'BD Vacutainer', 'in-stock', 2500, 'Lab Storage', 'Multiple types'),
      ('Oxygen Cylinders', 'Respiratory', 'General', 150, 'cylinders', 30, 25.00, 'AirGas Medical', 'in-stock', 50, 'Oxygen Bay', 'E-size portable'),
      ('Bandages Sterile', 'Wound Care', 'Emergency', 4000, 'pieces', 800, 0.75, 'Johnson & Johnson', 'in-stock', 1500, 'Warehouse A-3', 'Assorted sizes'),
      ('Catheter Foley', 'Disposables', 'General', 2000, 'pieces', 400, 3.50, 'Bard Medical', 'in-stock', 800, 'Warehouse B-2', 'Silicone, multiple FR'),
      ('Suture Kit', 'Surgical', 'Surgery', 1500, 'kits', 300, 12.00, 'Ethicon', 'in-stock', 500, 'Surgical Store', 'Absorbable & non-abs'),
      ('Medication Morphine 10mg', 'Pharmacy', 'Pharmacy', 500, 'vials', 100, 8.00, 'Pfizer', 'in-stock', 200, 'Controlled Substance', 'Schedule II controlled'),
      ('Blood Bags', 'Blood Bank', 'Pathology', 800, 'bags', 200, 5.00, 'Haemonetics', 'in-stock', 300, 'Blood Bank', 'CPDA-1 anticoagulant'),
      ('Ventilator Circuits', 'Respiratory', 'ICU', 200, 'sets', 50, 35.00, 'Fisher & Paykel', 'in-stock', 80, 'ICU Storage', 'Heated humidified'),
      ('Surgical Drapes', 'Surgical', 'Surgery', 3000, 'pieces', 600, 4.50, 'Medline', 'in-stock', 1000, 'Surgical Store', 'Sterile, disposable'),
      ('ECG Electrodes', 'Diagnostic', 'Cardiology', 5000, 'pieces', 1000, 0.20, 'ConMed', 'in-stock', 2000, 'Warehouse C-1', 'Adhesive, adult'),
      ('Hand Sanitizer', 'Hygiene', 'General', 800, 'bottles', 200, 3.00, 'Purell', 'low-stock', 300, 'Warehouse A-4', '500mL pump bottles');
    `);

    // Seed Operating Rooms (15)
    await client.query(`
      INSERT INTO operating_rooms (room_number, name, floor, status, surgery_type, surgeon, patient_name, scheduled_start, scheduled_end, equipment_ready, notes) VALUES
      ('OR-1', 'Main Operating Suite 1', 2, 'in-use', 'Cardiac Bypass', 'Dr. Robert Chen', 'Thomas Reed', '2024-01-13 07:00', '2024-01-13 13:00', true, 'Heart-lung machine active'),
      ('OR-2', 'Main Operating Suite 2', 2, 'in-use', 'Hip Replacement', 'Dr. Emily Taylor', 'Barbara Moore', '2024-01-13 08:00', '2024-01-13 12:00', true, 'Robotic assistance'),
      ('OR-3', 'Main Operating Suite 3', 2, 'available', NULL, NULL, NULL, NULL, NULL, true, 'Cleaned and ready'),
      ('OR-4', 'Neuro Operating Suite', 2, 'in-use', 'Craniotomy', 'Dr. David Kim', 'George Hill', '2024-01-13 06:00', '2024-01-13 14:00', true, 'Neuro navigation active'),
      ('OR-5', 'Pediatric OR', 5, 'available', NULL, NULL, NULL, NULL, NULL, true, 'Pediatric equipment set'),
      ('OR-6', 'Robotic Surgery Suite', 2, 'in-use', 'Prostatectomy', 'Dr. Jennifer White', 'Frank Torres', '2024-01-13 09:00', '2024-01-13 13:00', true, 'da Vinci Xi system'),
      ('OR-7', 'Minor Procedure Room 1', 2, 'available', NULL, NULL, NULL, NULL, NULL, true, 'Local anesthesia only'),
      ('OR-8', 'Minor Procedure Room 2', 2, 'maintenance', NULL, NULL, NULL, NULL, NULL, false, 'HVAC repair scheduled'),
      ('OR-9', 'Trauma OR', 1, 'available', NULL, NULL, NULL, NULL, NULL, true, '24/7 trauma ready'),
      ('OR-10', 'Cardiac Cath Lab 1', 3, 'in-use', 'Angioplasty', 'Dr. Robert Chen', 'Helen King', '2024-01-13 10:00', '2024-01-13 12:00', true, 'Fluoroscopy active'),
      ('OR-11', 'Cardiac Cath Lab 2', 3, 'available', NULL, NULL, NULL, NULL, NULL, true, 'Standby mode'),
      ('OR-12', 'Endoscopy Suite 1', 4, 'in-use', 'Colonoscopy', 'Dr. Susan Clark', 'Paul Wright', '2024-01-13 11:00', '2024-01-13 12:30', true, 'HD scope ready'),
      ('OR-13', 'Endoscopy Suite 2', 4, 'available', NULL, NULL, NULL, NULL, NULL, true, 'Quick turnaround available'),
      ('OR-14', 'OB Operating Room', 5, 'available', NULL, NULL, NULL, NULL, NULL, true, 'C-section ready 24/7'),
      ('OR-15', 'Ophthalmology Suite', 3, 'in-use', 'Cataract Surgery', 'Dr. Amy Foster', 'Ruth Young', '2024-01-13 08:30', '2024-01-13 09:30', true, 'Microscope calibrated');
    `);

    // Seed Supplies (15)
    await client.query(`
      INSERT INTO supplies (name, category, quantity, unit, min_quantity, cost_per_unit, supplier, expiry_date, storage_location, status, department, notes) VALUES
      ('Amoxicillin 500mg', 'Antibiotics', 2000, 'capsules', 500, 0.50, 'Pfizer', '2025-06-15', 'Pharmacy A', 'in-stock', 'Pharmacy', 'Generic available'),
      ('Insulin Glargine', 'Endocrine', 300, 'vials', 50, 45.00, 'Sanofi', '2024-12-01', 'Pharmacy Fridge', 'in-stock', 'Pharmacy', 'Refrigerate 2-8°C'),
      ('Propofol 200mg/20mL', 'Anesthetics', 500, 'vials', 100, 12.00, 'Fresenius Kabi', '2024-09-30', 'Pharmacy B', 'in-stock', 'Surgery', 'For OR use only'),
      ('Heparin 5000U/mL', 'Anticoagulants', 800, 'vials', 200, 6.00, 'Pfizer', '2025-03-15', 'Pharmacy A', 'in-stock', 'Pharmacy', 'DVT prophylaxis'),
      ('Epinephrine 1mg/mL', 'Emergency', 400, 'ampules', 100, 4.50, 'Par Pharma', '2024-08-20', 'Emergency Cart', 'in-stock', 'Emergency', 'Crash cart supply'),
      ('Gauze Pads 4x4', 'Wound Care', 10000, 'pieces', 2000, 0.15, 'Medline', '2026-01-01', 'Warehouse C', 'in-stock', 'General', 'Sterile, individually wrapped'),
      ('Nitrile Gloves (M)', 'PPE', 15000, 'pairs', 3000, 0.30, 'Halyard', '2026-06-01', 'Warehouse A', 'in-stock', 'General', 'Powder-free'),
      ('Chest Tube Kit', 'Surgical', 100, 'kits', 20, 85.00, 'Teleflex', '2025-04-15', 'Surgical Store', 'in-stock', 'Emergency', 'Includes drainage system'),
      ('Contrast Media Iohexol', 'Radiology', 200, 'bottles', 40, 120.00, 'GE Healthcare', '2024-11-30', 'Radiology Store', 'in-stock', 'Radiology', 'For CT/angio studies'),
      ('Blood Glucose Strips', 'Diagnostic', 5000, 'strips', 1000, 0.45, 'Abbott', '2025-02-28', 'Nursing Station', 'in-stock', 'General', 'FreeStyle compatible'),
      ('Wound Closure Strips', 'Wound Care', 3000, 'strips', 600, 0.35, '3M', '2025-12-01', 'Warehouse C', 'in-stock', 'Emergency', 'Steri-Strip brand'),
      ('Nasogastric Tubes', 'Disposables', 500, 'pieces', 100, 3.75, 'Covidien', '2025-08-15', 'Warehouse B', 'in-stock', 'General', 'Sizes 14-18 Fr'),
      ('Spinal Needles 22G', 'Anesthesia', 300, 'pieces', 60, 8.50, 'BD Medical', '2025-05-01', 'Surgical Store', 'in-stock', 'Surgery', 'Quincke point'),
      ('Saline Flush Syringes', 'IV Therapy', 8000, 'pieces', 1500, 0.60, 'BD Medical', '2025-09-30', 'Nursing Supply', 'in-stock', 'General', '10mL prefilled'),
      ('Oxygen Nasal Cannula', 'Respiratory', 2000, 'pieces', 400, 1.25, 'Teleflex', '2026-03-01', 'Warehouse D', 'in-stock', 'General', 'Adult standard flow');
    `);

    // Seed Emergency Capacity (15)
    await client.query(`
      INSERT INTO emergency_capacity (plan_name, scenario_type, severity_level, total_beds_needed, current_available, surge_capacity, staff_required, equipment_needed, estimated_duration, activation_status, coordinator, notes) VALUES
      ('Mass Casualty Incident Level 1', 'Mass Casualty', 'critical', 100, 15, 50, 120, 'Ventilators, Trauma Kits, Blood Products', '24-72 hours', 'standby', 'Dr. James Wilson', 'Full hospital activation required'),
      ('Pandemic Surge Plan', 'Pandemic', 'high', 200, 15, 80, 200, 'Ventilators, PPE, Isolation Equipment', '30-90 days', 'standby', 'Dr. Maria Garcia', 'Based on COVID-19 lessons learned'),
      ('Natural Disaster Response', 'Natural Disaster', 'high', 150, 15, 60, 150, 'Emergency Supplies, Generators, Water', '48-168 hours', 'standby', 'Dr. James Wilson', 'Earthquake/hurricane preparedness'),
      ('Chemical Exposure Protocol', 'HAZMAT', 'critical', 50, 15, 30, 80, 'Decontamination Units, Antidotes', '12-48 hours', 'standby', 'Dr. Thomas Martinez', 'Includes decon procedures'),
      ('Active Shooter Response', 'Security', 'critical', 30, 15, 20, 60, 'Trauma Kits, Blood Products', '2-8 hours', 'standby', 'Dr. Jennifer White', 'Coordination with law enforcement'),
      ('Pediatric Mass Casualty', 'Pediatric Emergency', 'critical', 40, 8, 25, 70, 'Pediatric Equipment, Broselow Tapes', '24-72 hours', 'standby', 'Dr. Lisa Anderson', 'Age-specific protocols'),
      ('Radiation Emergency', 'Nuclear/Radiological', 'critical', 60, 15, 35, 90, 'Radiation Detectors, KI Tablets', '48-168 hours', 'standby', 'Dr. Thomas Martinez', 'Decontamination facility needed'),
      ('Infectious Disease Outbreak', 'Biological', 'high', 80, 15, 45, 100, 'Isolation Equipment, PPE, Antivirals', '14-60 days', 'standby', 'Dr. Maria Garcia', 'Negative pressure rooms available'),
      ('Severe Weather Emergency', 'Weather', 'medium', 40, 15, 25, 50, 'Generators, Emergency Supplies', '24-72 hours', 'standby', 'Facility Manager', 'Generator backup for 72 hours'),
      ('IT System Failure Protocol', 'Technology', 'medium', 0, 15, 0, 30, 'Paper Forms, Backup Drives', '4-24 hours', 'standby', 'IT Director', 'Manual operation procedures'),
      ('Blood Supply Shortage', 'Supply Chain', 'high', 0, 15, 0, 20, 'Blood Conservation Equipment', '7-30 days', 'standby', 'Blood Bank Director', 'Regional coordination needed'),
      ('Staff Shortage Emergency', 'Staffing', 'medium', 0, 15, 0, 50, 'Agency Staff Contacts, Cross-training', '7-30 days', 'standby', 'HR Director', 'Mutual aid agreements active'),
      ('Fire Evacuation Plan', 'Fire', 'critical', 0, 0, 100, 80, 'Fire Suppression, Evacuation Chairs', '2-8 hours', 'standby', 'Safety Officer', 'Zone evacuation protocol'),
      ('Utility Failure Response', 'Infrastructure', 'high', 0, 15, 0, 25, 'Generators, Water Tanks, HVAC Backup', '4-48 hours', 'standby', 'Facility Manager', 'Critical systems on backup power'),
      ('Surge Capacity Expansion', 'Capacity', 'medium', 50, 15, 50, 60, 'Portable Beds, Tents, Field Equipment', '24-168 hours', 'active', 'COO', 'Conference rooms converted');
    `);

    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
