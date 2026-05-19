import React from 'react';
import BedUtilizationHeatmap from '../components/BedUtilizationHeatmap';
import AdmissionDischargeTrend from '../components/AdmissionDischargeTrend';
import CensusCapacityReport from '../components/CensusCapacityReport';
import AdmissionRoutingRules from '../components/AdmissionRoutingRules';

export default function CustomViewsPage() {
  return (
    <div data-testid="custom-views-page" style={{
      minHeight: '100vh', background: '#F1F5F9', padding: '24px',
      marginLeft: 260
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 18 }}>
          <h1 style={{ margin: 0, color: '#0F172A', fontSize: 26 }}>Bed Views</h1>
          <p style={{ color: '#64748B', margin: '4px 0 0' }}>
            Custom hospital bed &amp; resource optimization views — heatmap, trends, census PDF, and routing rules.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
          <BedUtilizationHeatmap />
          <AdmissionDischargeTrend />
          <CensusCapacityReport />
          <AdmissionRoutingRules />
        </div>
      </div>
    </div>
  );
}
