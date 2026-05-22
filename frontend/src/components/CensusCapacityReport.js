import React, { useEffect, useState } from 'react';

// NON-VIZ: Census/capacity report PDF
export default function CensusCapacityReport() {
  const [summary, setSummary] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch('/api/custom-views/census-capacity-report-pdf?format=json')
      .then((r) => r.json())
      .then((d) => { setSummary(d); setLoading(false); })
      .catch((e) => { setErr(e.message); setLoading(false); });
  }, []);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/custom-views/census-capacity-report-pdf');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'census_capacity_report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div data-testid="census-capacity-report" style={{
      background: '#fff', borderRadius: 12, padding: 18,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 24
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <h3 style={{ margin: '0 0 4px', color: '#0F172A' }}>Census &amp; Capacity Report</h3>
          <div style={{ color: '#64748B', fontSize: 13 }}>Downloadable PDF with current bed census per unit.</div>
        </div>
        <button onClick={downloadPdf} disabled={downloading}
          data-testid="download-pdf-btn"
          style={{
            background: '#0F766E', color: '#fff', border: 'none',
            padding: '8px 16px', borderRadius: 8, cursor: downloading ? 'wait' : 'pointer',
            fontWeight: 600
          }}>
          {downloading ? 'Generating…' : 'Download PDF'}
        </button>
      </div>
      {loading && <div>Loading summary…</div>}
      {err && <div style={{ color: '#b00' }}>Error: {err}</div>}
      {summary && summary.totals && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
            <Stat label="Total Beds" value={summary.totals.total} color="#2563EB" />
            <Stat label="Occupied" value={summary.totals.occupied} color="#DC2626" />
            <Stat label="Available" value={summary.totals.available} color="#16A34A" />
            <Stat label="Occupancy" value={`${summary.occupancy_pct}%`} color="#F97316" />
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F1F5F9' }}>
                <th style={th}>Unit</th>
                <th style={th}>Total</th>
                <th style={th}>Occupied</th>
                <th style={th}>Available</th>
                <th style={th}>Utilization</th>
              </tr>
            </thead>
            <tbody>
              {summary.units.map((u) => {
                const pct = u.total > 0 ? ((u.occupied / u.total) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={u.unit} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={td}>{u.unit}</td>
                    <td style={td}>{u.total}</td>
                    <td style={td}>{u.occupied}</td>
                    <td style={td}>{u.available}</td>
                    <td style={td}>{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th = { textAlign: 'left', padding: '8px 10px', color: '#334155', fontWeight: 600 };
const td = { padding: '8px 10px', color: '#0F172A' };

function Stat({ label, value, color }) {
  return (
    <div style={{
      flex: '1 1 140px', minWidth: 140, padding: '10px 14px',
      background: '#F8FAFC', borderLeft: `4px solid ${color}`, borderRadius: 6
    }}>
      <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>{value}</div>
    </div>
  );
}
