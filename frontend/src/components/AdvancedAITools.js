import NativeAIControls from './NativeAIControls';
import useNativeAIRequest from './useNativeAIRequest';
import AIReport from './AIReport';
import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

export const TOOLS = [
  {
    id: 'readmission-risk-prediction',
    title: 'Readmission Risk Prediction',
    icon: '⚠️',
    endpoint: '/api/ai/readmission-risk-prediction',
    desc: 'Risk score, tier, drivers, follow-up plan, and monitoring signals based on the discharge cohort.',
    fields: [
      { name: 'patient_id', label: 'Patient (optional)', type: 'patient' },
      { name: 'lookback_days', label: 'Lookback Days', type: 'number', placeholder: '30' },
      { name: 'notes', label: 'Notes / Context', type: 'textarea', placeholder: 'Optional clinical notes for context' },
    ],
  },
  {
    id: 'icu-step-down-recommendation',
    title: 'ICU Step-Down Recommendation',
    icon: '🛏️',
    endpoint: '/api/ai/icu-step-down-recommendation',
    desc: 'Stability criteria, eligibility, candidate beds, and monitoring requirements (physician final judgment required).',
    fields: [
      { name: 'patient_id', label: 'Patient', type: 'patient', required: true },
      { name: 'preferred_ward', label: 'Preferred Ward (optional)', type: 'text' },
      { name: 'rationale', label: 'Clinical Rationale (optional)', type: 'textarea', placeholder: 'Recent vital trends, stability indicators, etc.' },
    ],
  },
];

const presetScenarios = [
  {
    label: 'Recent discharge review',
    lookback_days: 30,
    notes: 'Review the latest discharge for medication changes, follow-up access, prior utilization, and documented social barriers. Separate confirmed record facts from assumptions.',
    preferred_ward: 'Medical step-down',
    rationale: 'Hemodynamics and oxygen needs have been stable for 24 hours. Confirm mobility, medication, monitoring, and escalation requirements before transfer.',
  },
  {
    label: 'Complex care review',
    lookback_days: 60,
    notes: 'Assess readmission risk across recent encounters, chronic conditions, care coordination, and missed follow-up. Include protective factors and evidence gaps.',
    preferred_ward: 'Cardiac telemetry',
    rationale: 'No vasopressor support is documented and telemetry remains appropriate. Verify current observations and attending approval before any transfer.',
  },
  {
    label: 'Care transition review',
    lookback_days: 90,
    notes: 'Prepare a multidisciplinary transition review covering utilization, caregiver readiness, transport, prescriptions, appointments, and monitoring signals.',
    preferred_ward: 'Progressive care unit',
    rationale: 'The example is for planning only. Recheck respiratory support, neurologic status, nursing workload, bed capability, and physician sign-off.',
  },
];

export function advancedToolPresets(tool, patients) {
  return presetScenarios.map((scenario, index) => {
    const patient = patients.length ? patients[index % patients.length] : null;
    const values = Object.fromEntries(tool.fields.map((field) => {
      if (field.name === 'patient_id') return [field.name, patient ? String(patient.id) : ''];
      return [field.name, scenario[field.name]];
    }));
    return { label: scenario.label, values };
  });
}

const AdvancedAITools = () => {
  const nativeAIRequest = useNativeAIRequest();

  const [tab, setTab] = useState(TOOLS[0].id);
  const [patients, setPatients] = useState([]);
  const [forms, setForms] = useState({});
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  const tool = TOOLS.find((t) => t.id === tab);
  const presets = useMemo(() => advancedToolPresets(tool, patients), [tool, patients]);
  const nativePresets = presets.map((preset) => ({
    name: preset.label,
    fill: () => {
      if (!patients.length) return { filled: 0, manual: ['a patient record'] };
      setForms((previous) => ({ ...previous, [tool.id]: { ...preset.values } }));
      setResults((previous) => ({ ...previous, [tool.id]: null }));
      setErrors((previous) => ({ ...previous, [tool.id]: null }));
      return { filled: tool.fields.length, manual: [] };
    },
  }));

  useEffect(() => {
    api
      .get('/api/patients')
      .then((res) => {
        const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
        setPatients(data);
      })
      .catch(() => setPatients([]));
  }, []);

  const setField = (name, value) => {
    setForms((prev) => ({ ...prev, [tab]: { ...(prev[tab] || {}), [name]: value } }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const formData = forms[tab] || {};
    for (const f of tool.fields) {
      if (f.required && (formData[f.name] === undefined || formData[f.name] === '')) {
        setErrors((prev) => ({ ...prev, [tab]: `${f.label} is required` }));
        return;
      }
    }
    setErrors((prev) => ({ ...prev, [tab]: null }));
    setResults((prev) => ({ ...prev, [tab]: null }));
    setLoading((prev) => ({ ...prev, [tab]: true }));
    try {
      const body = {};
      tool.fields.forEach((f) => {
        const v = formData[f.name];
        if (v === undefined || v === '' || v === null) return;
        if (f.type === 'number' || f.type === 'patient') body[f.name] = Number(v);
        else body[f.name] = v;
      });
      const res = await nativeAIRequest.run((signal) => api.post(tool.endpoint, body, { signal }));
      setResults((prev) => ({ ...prev, [tab]: res.data }));
    } catch (err) {
      const status = err.response?.status;
      const msg = status === 429 ? 'Rate limit reached.' : (err.response?.data?.error || err.message || 'Request failed');
      setErrors((prev) => ({ ...prev, [tab]: msg }));
    }
    setLoading((prev) => ({ ...prev, [tab]: false }));
  };

  const styles = {
    container: { padding: '32px', minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    title: { fontSize: 28, fontWeight: 700, color: '#0F172A', margin: '0 0 4px 0' },
    subtitle: { fontSize: 15, color: '#64748B', margin: 0, marginBottom: 24 },
    tabRow: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 },
    tabBtn: (active) => ({
      padding: '10px 16px', borderRadius: 10,
      background: active ? '#0F766E' : '#FFFFFF',
      color: active ? '#FFFFFF' : '#0F172A',
      border: '1px solid #E2E8F0', cursor: 'pointer',
      fontSize: 14, fontWeight: 600,
    }),
    card: { background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 24 },
    field: { marginBottom: 16 },
    label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 },
    input: { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 14, boxSizing: 'border-box' },
    submit: (loading) => ({
      padding: '10px 20px', borderRadius: 10, border: 'none',
      backgroundColor: loading ? '#94A3B8' : '#0F766E',
      color: '#FFFFFF', fontSize: 14, fontWeight: 600,
      cursor: loading ? 'not-allowed' : 'pointer',
    }),
    err: { marginTop: 12, padding: 12, background: '#FEF2F2', color: '#991B1B', borderRadius: 10, border: '1px solid #FECACA' },
    result: { marginTop: 24, padding: 18, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', maxHeight: 520, overflowY: 'auto' },
    spinner: { display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFFFFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  };

  const formData = forms[tab] || {};
  const result = results[tab];
  const error = errors[tab];
  const isLoading = loading[tab];

  return (
    <NativeAIControls busy={nativeAIRequest.busy} onCancel={nativeAIRequest.cancel} context="Hospital Bed Resource Optimizer" presets={nativePresets}><div style={styles.container}>
      <h1 style={styles.title}>🤖 Advanced AI Tools</h1>
      <p style={styles.subtitle}>Readmission risk and ICU step-down recommendations</p>

      <div style={styles.tabRow}>
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            style={styles.tabBtn(tab === t.id)}
            onClick={() => setTab(t.id)}
          >
            <span style={{ marginRight: 6 }}>{t.icon}</span>{t.title}
          </button>
        ))}
      </div>

      <div style={styles.card}>
        <h2 style={{ margin: '0 0 8px 0', color: '#0F172A' }}>{tool.icon} {tool.title}</h2>
        <p style={{ color: '#64748B', marginTop: 0, marginBottom: 20 }}>{tool.desc}</p>

        <form onSubmit={submit}>
          {tool.fields.map((f) => (
            <div key={f.name} style={styles.field}>
              <label style={styles.label}>
                {f.label} {f.required && <span style={{ color: '#DC2626' }}>*</span>}
              </label>
              {f.type === 'patient' ? (
                <select data-ai-field={f.name}
                  style={styles.input}
                  value={formData[f.name] || ''}
                  onChange={(e) => setField(f.name, e.target.value)}
                >
                  <option value="">-- Select Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name || `Patient #${p.id}`} (#{p.id})</option>
                  ))}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea data-ai-field={f.name}
                  rows={4}
                  style={styles.input}
                  placeholder={f.placeholder || ''}
                  value={formData[f.name] || ''}
                  onChange={(e) => setField(f.name, e.target.value)}
                />
              ) : (
                <input data-ai-field={f.name}
                  type={f.type || 'text'}
                  style={styles.input}
                  placeholder={f.placeholder || ''}
                  value={formData[f.name] || ''}
                  onChange={(e) => setField(f.name, e.target.value)}
                />
              )}
            </div>
          ))}
          <button type="submit" disabled={isLoading} style={styles.submit(isLoading)}>
            {isLoading ? 'Generating...' : 'Run Analysis'}
          </button>
        </form>

        {error && <div style={styles.err}>{error}</div>}

        {result && (
          <div style={styles.result}>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 10 }}>
              {result.timestamp ? `Generated: ${new Date(result.timestamp).toLocaleString()}` : ''}
            </div>
            <AIReport
              response={result.data?.structured || result.data?.content || result.data || result.content || result}
              title={tool.title}
              model={result.data?.model || result.model}
              tokens={result.data?.usage || result.usage}
            />
          </div>
        )}
      </div>
    </div></NativeAIControls>
  );
};

export default AdvancedAITools;
