import React, { useEffect, useState } from 'react';

// NON-VIZ: CRUD editor for admission routing rules (acuity -> unit)
export default function AdmissionRoutingRules() {
  const [rules, setRules] = useState([]);
  const [meta, setMeta] = useState({ acuity_levels: [], units: [] });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ acuity: 'medium', unit: 'Medical-Surgical', min_age: 0, max_age: 150, priority: 5, notes: '' });
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/custom-views/routing-rules');
      const d = await r.json();
      setRules(d.rules || []);
      setMeta({ acuity_levels: d.acuity_levels || [], units: d.units || [] });
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const url = editingId
        ? `/api/custom-views/routing-rules/${editingId}`
        : '/api/custom-views/routing-rules';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      setForm({ acuity: 'medium', unit: 'Medical-Surgical', min_age: 0, max_age: 150, priority: 5, notes: '' });
      setEditingId(null);
      await load();
    } catch (e) { setErr(e.message); }
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setForm({
      acuity: r.acuity, unit: r.unit,
      min_age: r.min_age, max_age: r.max_age,
      priority: r.priority, notes: r.notes || ''
    });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this routing rule?')) return;
    try {
      const res = await fetch(`/api/custom-views/routing-rules/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await load();
    } catch (e) { setErr(e.message); }
  };

  return (
    <div data-testid="admission-routing-rules" style={{
      background: '#fff', borderRadius: 12, padding: 18,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 24
    }}>
      <h3 style={{ margin: '0 0 4px', color: '#0F172A' }}>Admission Routing Rules</h3>
      <div style={{ color: '#64748B', fontSize: 13, marginBottom: 12 }}>
        Map patient acuity (and age range) to target unit. Lower priority number = higher precedence.
      </div>
      {err && <div style={{ color: '#b00', marginBottom: 8 }}>Error: {err}</div>}

      <form onSubmit={submit} style={{
        display: 'grid', gridTemplateColumns: 'repeat(6, 1fr) auto', gap: 8,
        alignItems: 'end', padding: 10, background: '#F8FAFC',
        borderRadius: 8, marginBottom: 14
      }}>
        <Field label="Acuity">
          <select value={form.acuity} onChange={(e) => setForm({ ...form, acuity: e.target.value })} style={inp}>
            {meta.acuity_levels.map((a) => <option key={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="Unit">
          <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} style={inp}>
            {meta.units.map((u) => <option key={u}>{u}</option>)}
          </select>
        </Field>
        <Field label="Min Age">
          <input type="number" value={form.min_age} onChange={(e) => setForm({ ...form, min_age: parseInt(e.target.value, 10) || 0 })} style={inp} />
        </Field>
        <Field label="Max Age">
          <input type="number" value={form.max_age} onChange={(e) => setForm({ ...form, max_age: parseInt(e.target.value, 10) || 0 })} style={inp} />
        </Field>
        <Field label="Priority">
          <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value, 10) || 5 })} style={inp} />
        </Field>
        <Field label="Notes">
          <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={inp} />
        </Field>
        <button type="submit" data-testid="rule-submit-btn" style={{
          background: editingId ? '#F97316' : '#0F766E', color: '#fff', border: 'none',
          padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontWeight: 600
        }}>
          {editingId ? 'Update' : 'Add Rule'}
        </button>
      </form>

      {loading ? <div>Loading…</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F1F5F9' }}>
              <th style={th}>Pri</th>
              <th style={th}>Acuity</th>
              <th style={th}>Unit</th>
              <th style={th}>Age Range</th>
              <th style={th}>Notes</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={td}>{r.priority}</td>
                <td style={td}><Badge text={r.acuity} /></td>
                <td style={td}>{r.unit}</td>
                <td style={td}>{r.min_age}–{r.max_age}</td>
                <td style={td}>{r.notes}</td>
                <td style={td}>
                  <button onClick={() => startEdit(r)} style={btnSmall('#2563EB')}>Edit</button>{' '}
                  <button onClick={() => remove(r.id)} style={btnSmall('#DC2626')}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const inp = { width: '100%', padding: '6px 8px', border: '1px solid #CBD5E1', borderRadius: 4, fontSize: 13, boxSizing: 'border-box' };
const th = { textAlign: 'left', padding: '8px 10px', color: '#334155', fontWeight: 600 };
const td = { padding: '8px 10px', color: '#0F172A' };

function Field({ label, children }) {
  return (
    <label style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
      {label}
      <div style={{ marginTop: 2 }}>{children}</div>
    </label>
  );
}

function Badge({ text }) {
  const colors = { critical: '#DC2626', high: '#F97316', medium: '#2563EB', low: '#16A34A' };
  return (
    <span style={{
      background: colors[text] || '#64748B', color: '#fff',
      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, textTransform: 'uppercase'
    }}>{text}</span>
  );
}

function btnSmall(color) {
  return {
    background: color, color: '#fff', border: 'none',
    padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12
  };
}
