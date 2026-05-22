import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// VIZ: Admission / discharge trend chart
export default function AdmissionDischargeTrend() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(14);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/custom-views/admission-discharge-trend?days=${days}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setErr(e.message); setLoading(false); });
  }, [days]);

  return (
    <div data-testid="admission-discharge-trend" style={{
      background: '#fff', borderRadius: 12, padding: 18,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 24
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <h3 style={{ margin: 0, color: '#0F172A' }}>Admission / Discharge Trend</h3>
        <select value={days} onChange={(e) => setDays(parseInt(e.target.value, 10))}
          style={{ padding: '4px 8px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12 }}>
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>
      {loading && <div>Loading…</div>}
      {err && <div style={{ color: '#b00' }}>Error: {err}</div>}
      {data && data.series && (
        <>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#475569', marginBottom: 8 }}>
            <span>Total Admissions: <b style={{ color: '#2563EB' }}>{data.totals.admissions}</b></span>
            <span>Total Discharges: <b style={{ color: '#16A34A' }}>{data.totals.discharges}</b></span>
            <span>Net Change: <b style={{ color: data.net_change >= 0 ? '#DC2626' : '#16A34A' }}>{data.net_change >= 0 ? '+' : ''}{data.net_change}</b></span>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={data.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="admissions" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="discharges" stroke="#16A34A" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="net" stroke="#F97316" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
