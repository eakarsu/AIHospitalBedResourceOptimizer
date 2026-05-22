import React, { useEffect, useState } from 'react';

// VIZ: Bed utilization heatmap (unit x hour)
export default function BedUtilizationHeatmap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/custom-views/bed-utilization-heatmap')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <div data-testid="heatmap-loading">Loading heatmap…</div>;
  if (err) return <div style={{ color: '#b00' }}>Error: {err}</div>;
  if (!data || !data.matrix) return <div>No data</div>;

  const colorFor = (u) => {
    if (u >= 0.90) return '#EF4444';
    if (u >= 0.75) return '#F97316';
    if (u >= 0.50) return '#FACC15';
    return '#22C55E';
  };

  return (
    <div data-testid="bed-utilization-heatmap" style={{
      background: '#fff', borderRadius: 12, padding: 18,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 24
    }}>
      <h3 style={{ margin: '0 0 4px', color: '#0F172A' }}>Bed Utilization Heatmap</h3>
      <div style={{ color: '#64748B', fontSize: 13, marginBottom: 12 }}>
        Unit × Hour-of-day utilization (live)
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 11, width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '4px 8px', position: 'sticky', left: 0, background: '#fff', color: '#334155' }}>Unit</th>
              {data.hours.map((h) => (
                <th key={h} style={{ padding: '4px 2px', color: '#64748B', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.matrix.map((row) => (
              <tr key={row.unit}>
                <td style={{ padding: '4px 8px', fontWeight: 600, color: '#0F172A', position: 'sticky', left: 0, background: '#fff' }}>
                  {row.unit} <span style={{ color: '#94A3B8', fontWeight: 400 }}>({row.capacity})</span>
                </td>
                {row.cells.map((c) => (
                  <td key={c.hour}
                    title={`${row.unit} @ ${c.hour}:00 — ${(c.utilization*100).toFixed(0)}% (${c.occupied}/${c.capacity})`}
                    style={{
                      background: colorFor(c.utilization),
                      width: 22, height: 22, textAlign: 'center', color: '#0F172A',
                      border: '1px solid #fff', fontSize: 10
                    }}>
                    {(c.utilization * 100).toFixed(0)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {data.legend.map((l) => (
          <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
            <span style={{ width: 14, height: 14, background: l.color, display: 'inline-block', borderRadius: 3 }} />
            {l.label} ({l.range})
          </span>
        ))}
      </div>
    </div>
  );
}
