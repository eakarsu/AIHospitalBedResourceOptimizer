import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import DashboardHome from './DashboardHome';
import FeaturePage from './FeaturePage';
import AIInsights from './AIInsights';
import AdvancedAITools from './AdvancedAITools';
import Analytics from './Analytics';

const bedsFields = [
  { key: 'bed_number', label: 'Bed Number', type: 'text' },
  { key: 'ward', label: 'Ward', type: 'text' },
  { key: 'floor', label: 'Floor', type: 'number' },
  { key: 'bed_type', label: 'Bed Type', type: 'select', options: ['standard', 'ICU', 'pediatric', 'post-op', 'delivery'] },
  { key: 'status', label: 'Status', type: 'select', options: ['available', 'occupied', 'maintenance', 'reserved'] },
  { key: 'department', label: 'Department', type: 'text' },
  { key: 'has_monitoring', label: 'Has Monitoring', type: 'boolean' },
  { key: 'has_oxygen', label: 'Has Oxygen', type: 'boolean' },
  { key: 'has_suction', label: 'Has Suction', type: 'boolean' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const patientsFields = [
  { key: 'name', label: 'Patient Name', type: 'text' },
  { key: 'age', label: 'Age', type: 'number' },
  { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
  { key: 'diagnosis', label: 'Diagnosis', type: 'text' },
  { key: 'admission_date', label: 'Admission Date', type: 'date' },
  { key: 'expected_discharge', label: 'Expected Discharge', type: 'date' },
  { key: 'bed_id', label: 'Bed ID', type: 'number' },
  { key: 'department', label: 'Department', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ['admitted', 'discharged', 'transferred', 'deceased'] },
  { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
  { key: 'insurance', label: 'Insurance', type: 'text' },
  { key: 'attending_physician', label: 'Attending Physician', type: 'text' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const staffFields = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'role', label: 'Role', type: 'select', options: ['Doctor', 'Nurse', 'Technician', 'Specialist', 'Admin'] },
  { key: 'department', label: 'Department', type: 'text' },
  { key: 'shift', label: 'Shift', type: 'select', options: ['day', 'night', 'rotating'] },
  { key: 'specialization', label: 'Specialization', type: 'text' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'on-leave', 'inactive'] },
  { key: 'hire_date', label: 'Hire Date', type: 'date' },
  { key: 'certification', label: 'Certification', type: 'text' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const departmentsFields = [
  { key: 'name', label: 'Department Name', type: 'text' },
  { key: 'head_doctor', label: 'Head Doctor', type: 'text' },
  { key: 'floor', label: 'Floor', type: 'number' },
  { key: 'total_beds', label: 'Total Beds', type: 'number' },
  { key: 'occupied_beds', label: 'Occupied Beds', type: 'number' },
  { key: 'staff_count', label: 'Staff Count', type: 'number' },
  { key: 'budget', label: 'Budget ($)', type: 'number' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'under-renovation'] },
  { key: 'specialization', label: 'Specialization', type: 'text' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const equipmentFields = [
  { key: 'name', label: 'Equipment Name', type: 'text' },
  { key: 'type', label: 'Type', type: 'text' },
  { key: 'department', label: 'Department', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ['operational', 'maintenance', 'out-of-service', 'retired'] },
  { key: 'serial_number', label: 'Serial Number', type: 'text' },
  { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
  { key: 'last_maintenance', label: 'Last Maintenance', type: 'date' },
  { key: 'next_maintenance', label: 'Next Maintenance', type: 'date' },
  { key: 'cost', label: 'Cost ($)', type: 'number' },
  { key: 'manufacturer', label: 'Manufacturer', type: 'text' },
  { key: 'warranty_until', label: 'Warranty Until', type: 'date' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const resourcesFields = [
  { key: 'name', label: 'Resource Name', type: 'text' },
  { key: 'category', label: 'Category', type: 'text' },
  { key: 'department', label: 'Department', type: 'text' },
  { key: 'quantity', label: 'Quantity', type: 'number' },
  { key: 'unit', label: 'Unit', type: 'text' },
  { key: 'min_quantity', label: 'Min Quantity', type: 'number' },
  { key: 'cost_per_unit', label: 'Cost Per Unit ($)', type: 'number' },
  { key: 'supplier', label: 'Supplier', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ['in-stock', 'low-stock', 'out-of-stock', 'on-order'] },
  { key: 'reorder_point', label: 'Reorder Point', type: 'number' },
  { key: 'storage_location', label: 'Storage Location', type: 'text' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const operatingRoomsFields = [
  { key: 'room_number', label: 'Room Number', type: 'text' },
  { key: 'name', label: 'Room Name', type: 'text' },
  { key: 'floor', label: 'Floor', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['available', 'in-use', 'maintenance', 'cleaning'] },
  { key: 'surgery_type', label: 'Surgery Type', type: 'text' },
  { key: 'surgeon', label: 'Surgeon', type: 'text' },
  { key: 'patient_name', label: 'Patient Name', type: 'text' },
  { key: 'scheduled_start', label: 'Scheduled Start', type: 'date' },
  { key: 'scheduled_end', label: 'Scheduled End', type: 'date' },
  { key: 'equipment_ready', label: 'Equipment Ready', type: 'boolean' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const suppliesFields = [
  { key: 'name', label: 'Supply Name', type: 'text' },
  { key: 'category', label: 'Category', type: 'text' },
  { key: 'quantity', label: 'Quantity', type: 'number' },
  { key: 'unit', label: 'Unit', type: 'text' },
  { key: 'min_quantity', label: 'Min Quantity', type: 'number' },
  { key: 'cost_per_unit', label: 'Cost Per Unit ($)', type: 'number' },
  { key: 'supplier', label: 'Supplier', type: 'text' },
  { key: 'expiry_date', label: 'Expiry Date', type: 'date' },
  { key: 'storage_location', label: 'Storage Location', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ['in-stock', 'low-stock', 'out-of-stock', 'expired'] },
  { key: 'department', label: 'Department', type: 'text' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const emergencyFields = [
  { key: 'plan_name', label: 'Plan Name', type: 'text' },
  { key: 'scenario_type', label: 'Scenario Type', type: 'text' },
  { key: 'severity_level', label: 'Severity Level', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
  { key: 'total_beds_needed', label: 'Beds Needed', type: 'number' },
  { key: 'current_available', label: 'Current Available', type: 'number' },
  { key: 'surge_capacity', label: 'Surge Capacity', type: 'number' },
  { key: 'staff_required', label: 'Staff Required', type: 'number' },
  { key: 'equipment_needed', label: 'Equipment Needed', type: 'text' },
  { key: 'estimated_duration', label: 'Estimated Duration', type: 'text' },
  { key: 'activation_status', label: 'Activation Status', type: 'select', options: ['standby', 'active', 'deactivated'] },
  { key: 'coordinator', label: 'Coordinator', type: 'text' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const Dashboard = () => {
  const layoutStyle = {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#F1F5F9',
  };

  const contentStyle = {
    marginLeft: '260px',
    flex: 1,
    padding: '24px',
    minHeight: '100vh',
    transition: 'margin-left 0.3s ease',
  };

  return (
    <div style={layoutStyle}>
      <Sidebar />
      <div style={contentStyle}>
        <Routes>
          <Route index element={<DashboardHome />} />
          <Route path="beds" element={<FeaturePage endpoint="/api/beds" title="Bed Management" fields={bedsFields} />} />
          <Route path="patients" element={<FeaturePage endpoint="/api/patients" title="Patient Tracking" fields={patientsFields} />} />
          <Route path="staff" element={<FeaturePage endpoint="/api/staff" title="Staff Scheduling" fields={staffFields} />} />
          <Route path="departments" element={<FeaturePage endpoint="/api/departments" title="Departments" fields={departmentsFields} />} />
          <Route path="equipment" element={<FeaturePage endpoint="/api/equipment" title="Equipment Tracking" fields={equipmentFields} />} />
          <Route path="resources" element={<FeaturePage endpoint="/api/resources" title="Resource Allocation" fields={resourcesFields} />} />
          <Route path="operating-rooms" element={<FeaturePage endpoint="/api/operating-rooms" title="Operating Rooms" fields={operatingRoomsFields} />} />
          <Route path="supplies" element={<FeaturePage endpoint="/api/supplies" title="Supply Chain" fields={suppliesFields} />} />
          <Route path="emergency" element={<FeaturePage endpoint="/api/emergency-capacity" title="Emergency Capacity" fields={emergencyFields} />} />
          <Route path="ai-insights" element={<AIInsights />} />
          <Route path="advanced-ai" element={<AdvancedAITools />} />
          <Route path="analytics" element={<Analytics />} />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
