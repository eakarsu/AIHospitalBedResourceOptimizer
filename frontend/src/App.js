import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

// === Batch 04 Gaps & Frontend Mounts ===
import CfAgenticHospitalCommandCenterVisualiz from './pages/CfAgenticHospitalCommandCenterVisualiz';
import CfPredictiveSurgeManagementForecasting from './pages/CfPredictiveSurgeManagementForecasting';
import CfLengthOfStayPredictionAtAdmission from './pages/CfLengthOfStayPredictionAtAdmission';
import CfStaffAllocationOptimizerPredictingAc from './pages/CfStaffAllocationOptimizerPredictingAc';
import CfReadmissionPreventionAiWithEnhanced from './pages/CfReadmissionPreventionAiWithEnhanced';
import CfEquipmentUtilizationOptimizerForVent from './pages/CfEquipmentUtilizationOptimizerForVent';
import GapNoReadmissionRiskPrediction from './pages/GapNoReadmissionRiskPrediction';
import GapNoIcuStepDownRecommendation from './pages/GapNoIcuStepDownRecommendation';
import GapNoAutomatedCensusBalancingAgentAcro from './pages/GapNoAutomatedCensusBalancingAgentAcro';
import GapNoProviderclinicianSchedulingBeyondS from './pages/GapNoProviderclinicianSchedulingBeyondS';
import GapNoBillingcodingIntegration from './pages/GapNoBillingcodingIntegration';
import GapNoPatientfamilyCommunicationPortal from './pages/GapNoPatientfamilyCommunicationPortal';
import GapNoClinicalDecisionSupportDrugIntera from './pages/GapNoClinicalDecisionSupportDrugIntera';
import GapNoWebhookSurface from './pages/GapNoWebhookSurface';
import GapNoRealTimeWebsocketBedBoard from './pages/GapNoRealTimeWebsocketBedBoard';
import CustomViewsPage from './pages/CustomViewsPage';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard/*"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
          {/* // === Batch 04 Gaps & Frontend Mounts === */}
          <Route path="/cf-agentic-hospital-command-center-visualiz" element={<CfAgenticHospitalCommandCenterVisualiz />} />
          <Route path="/cf-predictive-surge-management-forecasting-" element={<CfPredictiveSurgeManagementForecasting />} />
          <Route path="/cf-length-of-stay-prediction-at-admission" element={<CfLengthOfStayPredictionAtAdmission />} />
          <Route path="/cf-staff-allocation-optimizer-predicting-ac" element={<CfStaffAllocationOptimizerPredictingAc />} />
          <Route path="/cf-readmission-prevention-ai-with-enhanced-" element={<CfReadmissionPreventionAiWithEnhanced />} />
          <Route path="/cf-equipment-utilization-optimizer-for-vent" element={<CfEquipmentUtilizationOptimizerForVent />} />
          <Route path="/gap-no-readmission-risk-prediction" element={<GapNoReadmissionRiskPrediction />} />
          <Route path="/gap-no-icu-step-down-recommendation" element={<GapNoIcuStepDownRecommendation />} />
          <Route path="/gap-no-automated-census-balancing-agent-acro" element={<GapNoAutomatedCensusBalancingAgentAcro />} />
          <Route path="/gap-no-providerclinician-scheduling-beyond-s" element={<GapNoProviderclinicianSchedulingBeyondS />} />
          <Route path="/gap-no-billingcoding-integration" element={<GapNoBillingcodingIntegration />} />
          <Route path="/gap-no-patientfamily-communication-portal" element={<GapNoPatientfamilyCommunicationPortal />} />
          <Route path="/gap-no-clinical-decision-support-drug-intera" element={<GapNoClinicalDecisionSupportDrugIntera />} />
          <Route path="/gap-no-webhook-surface" element={<GapNoWebhookSurface />} />
          <Route path="/gap-no-real-time-websocket-bed-board" element={<GapNoRealTimeWebsocketBedBoard />} />
          <Route path="/custom-views" element={<PrivateRoute><CustomViewsPage /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
