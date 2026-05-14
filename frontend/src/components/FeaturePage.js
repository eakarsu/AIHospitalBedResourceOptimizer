import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const statusColors = {
  available: { bg: '#DCFCE7', text: '#166534' },
  active: { bg: '#DCFCE7', text: '#166534' },
  'in-stock': { bg: '#DCFCE7', text: '#166534' },
  'in stock': { bg: '#DCFCE7', text: '#166534' },
  open: { bg: '#DCFCE7', text: '#166534' },
  stable: { bg: '#DCFCE7', text: '#166534' },
  discharged: { bg: '#DCFCE7', text: '#166534' },
  completed: { bg: '#DCFCE7', text: '#166534' },
  occupied: { bg: '#FEF9C3', text: '#854D0E' },
  maintenance: { bg: '#FEF9C3', text: '#854D0E' },
  pending: { bg: '#FEF9C3', text: '#854D0E' },
  'in-use': { bg: '#FEF9C3', text: '#854D0E' },
  'on-leave': { bg: '#FEF9C3', text: '#854D0E' },
  scheduled: { bg: '#DBEAFE', text: '#1E40AF' },
  admitted: { bg: '#DBEAFE', text: '#1E40AF' },
  critical: { bg: '#FEE2E2', text: '#991B1B' },
  emergency: { bg: '#FEE2E2', text: '#991B1B' },
  'out-of-service': { bg: '#FEE2E2', text: '#991B1B' },
  closed: { bg: '#F3F4F6', text: '#374151' },
  inactive: { bg: '#F3F4F6', text: '#374151' },
  offline: { bg: '#F3F4F6', text: '#374151' },
};

function getStatusStyle(value) {
  if (!value || typeof value !== 'string') return null;
  const key = value.toLowerCase().trim();
  return statusColors[key] || null;
}

function formatValue(value, type) {
  if (value === null || value === undefined || value === '') return '—';
  if (type === 'checkbox' || typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (type === 'date' && value) {
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      }
    } catch { /* fall through */ }
    return String(value);
  }
  if (type === 'number' || typeof value === 'number') {
    if (typeof value === 'number' && !isNaN(value)) {
      return value >= 1000 ? value.toLocaleString() : String(value);
    }
  }
  return String(value);
}

// ---------- Styles ----------
const styles = {
  container: {
    padding: '24px 32px',
    maxWidth: '1400px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  phiBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FFF7ED',
    border: '1px solid #FED7AA',
    borderRadius: '8px',
    padding: '10px 16px',
    marginBottom: '16px',
    fontSize: '13px',
    color: '#9A3412',
    fontWeight: 500,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
  },
  addBtn: {
    backgroundColor: '#0F766E',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background-color 0.2s',
  },
  searchWrap: {
    marginBottom: '16px',
  },
  searchInput: {
    width: '100%',
    maxWidth: '400px',
    padding: '10px 14px',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    backgroundColor: '#0F172A',
    color: '#fff',
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#334155',
    borderBottom: '1px solid #F1F5F9',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  badge: (colors) => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: colors.bg,
    color: colors.text,
  }),
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.45)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  slidePanel: {
    width: '520px',
    maxWidth: '90vw',
    height: '100%',
    backgroundColor: '#fff',
    boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideIn 0.25s ease-out',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #E2E8F0',
  },
  panelTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#64748B',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    lineHeight: 1,
  },
  panelBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
  },
  fieldRow: {
    marginBottom: '18px',
  },
  fieldLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    marginBottom: '4px',
  },
  fieldValue: {
    fontSize: '15px',
    color: '#1E293B',
    wordBreak: 'break-word',
  },
  panelActions: {
    display: 'flex',
    gap: '10px',
    padding: '16px 24px',
    borderTop: '1px solid #E2E8F0',
    flexWrap: 'wrap',
  },
  editBtn: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#0F766E',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  deleteBtn: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#DC2626',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  cancelBtn: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#F1F5F9',
    color: '#334155',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  aiBtn: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#7C3AED',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    minWidth: '140px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  formLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '6px',
  },
  formInput: {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  formSelect: {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
  },
  formTextarea: {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    minHeight: '80px',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  checkboxWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  spinner: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px 0',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#94A3B8',
    fontSize: '15px',
  },
  confirmOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.5)',
    zIndex: 1100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBox: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '28px 32px',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    color: '#991B1B',
    padding: '10px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  paginationWrap: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    borderTop: '1px solid #F1F5F9',
    fontSize: '13px',
    color: '#64748B',
  },
  pageBtn: (disabled) => ({
    padding: '6px 14px',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    backgroundColor: disabled ? '#F8FAFC' : '#fff',
    color: disabled ? '#CBD5E1' : '#334155',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '13px',
    fontWeight: 600,
  }),
  pageInfo: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  // AI result box inside panel
  aiResultBox: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#F5F3FF',
    borderRadius: '10px',
    border: '1px solid #DDD6FE',
    fontSize: '13px',
    color: '#3B0764',
  },
  scoreCircle: (score) => {
    const color = score >= 70 ? '#16A34A' : score >= 40 ? '#D97706' : '#DC2626';
    return {
      width: '72px',
      height: '72px',
      borderRadius: '50%',
      border: `5px solid ${color}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      fontWeight: 700,
      color,
      marginBottom: '12px',
    };
  },
};

// Inject keyframe animation once
if (typeof document !== 'undefined' && !document.getElementById('feature-page-keyframes')) {
  const style = document.createElement('style');
  style.id = 'feature-page-keyframes';
  style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);
}

// ---------- Sub-components ----------

function Spinner() {
  return (
    <div style={styles.spinner}>
      <div style={{
        width: '36px', height: '36px',
        border: '3px solid #E2E8F0',
        borderTopColor: '#0F766E',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={styles.confirmOverlay} onClick={onCancel}>
      <div style={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
        <p style={{ fontSize: '16px', color: '#1E293B', marginBottom: '24px', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={onCancel} style={{ ...styles.cancelBtn, flex: 'none', padding: '10px 24px' }}>Cancel</button>
          <button onClick={onConfirm} style={{ ...styles.deleteBtn, flex: 'none', padding: '10px 24px' }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function FormField({ field, value, onChange }) {
  const { key, label, type, options } = field;

  if (type === 'select' && options) {
    return (
      <div style={styles.formGroup}>
        <label style={styles.formLabel}>{label}</label>
        <select style={styles.formSelect} value={value || ''} onChange={(e) => onChange(key, e.target.value)}>
          <option value="">Select {label}</option>
          {options.map((opt) => {
            const optValue = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return <option key={optValue} value={optValue}>{optLabel}</option>;
          })}
        </select>
      </div>
    );
  }

  if (type === 'checkbox' || type === 'boolean') {
    return (
      <div style={styles.formGroup}>
        <label style={styles.formLabel}>{label}</label>
        <div style={styles.checkboxWrap}>
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(key, e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: '#0F766E' }}
          />
          <span style={{ fontSize: '14px', color: '#334155' }}>{value ? 'Yes' : 'No'}</span>
        </div>
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div style={styles.formGroup}>
        <label style={styles.formLabel}>{label}</label>
        <textarea style={styles.formTextarea} value={value || ''} onChange={(e) => onChange(key, e.target.value)} />
      </div>
    );
  }

  if (type === 'date') {
    let inputVal = value || '';
    if (inputVal && typeof inputVal === 'string') {
      try {
        const d = new Date(inputVal);
        if (!isNaN(d.getTime())) inputVal = d.toISOString().split('T')[0];
      } catch { /* use as-is */ }
    }
    return (
      <div style={styles.formGroup}>
        <label style={styles.formLabel}>{label}</label>
        <input type="date" style={styles.formInput} value={inputVal} onChange={(e) => onChange(key, e.target.value)} />
      </div>
    );
  }

  const inputType = type === 'number' ? 'number' : type === 'email' ? 'email' : 'text';

  return (
    <div style={styles.formGroup}>
      <label style={styles.formLabel}>{label}</label>
      <input
        type={inputType}
        style={styles.formInput}
        value={value ?? ''}
        onChange={(e) => onChange(key, inputType === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
      />
    </div>
  );
}

// Discharge Readiness Panel Content
function DischargeReadinessResult({ data, onClose }) {
  if (!data) return null;
  const score = data.readiness_score ?? data.readiness_score ?? null;
  return (
    <div style={styles.aiResultBox}>
      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '12px', color: '#5B21B6' }}>
        Discharge Readiness Assessment
      </div>
      {score !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <div style={styles.scoreCircle(score)}>{score}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: score >= 70 ? '#16A34A' : score >= 40 ? '#D97706' : '#DC2626' }}>
              {data.ready_for_discharge ? 'Ready for Discharge' : 'Not Ready for Discharge'}
            </div>
            {data.estimated_discharge_date && (
              <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
                Est. Discharge: {data.estimated_discharge_date}
              </div>
            )}
          </div>
        </div>
      )}
      {data.blocking_factors && data.blocking_factors.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontWeight: 600, fontSize: '13px', color: '#991B1B', marginBottom: '4px' }}>Blocking Factors</div>
          <ul style={{ margin: 0, paddingLeft: '16px' }}>
            {data.blocking_factors.map((f, i) => (
              <li key={i} style={{ fontSize: '13px', color: '#991B1B', marginBottom: '2px' }}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      {data.recommended_actions && data.recommended_actions.length > 0 && (
        <div>
          <div style={{ fontWeight: 600, fontSize: '13px', color: '#0F172A', marginBottom: '4px' }}>Recommended Actions</div>
          <ul style={{ margin: 0, paddingLeft: '16px' }}>
            {data.recommended_actions.map((a, i) => (
              <li key={i} style={{ fontSize: '13px', color: '#334155', marginBottom: '2px' }}>
                <span style={{ marginRight: '6px' }}>&#9744;</span>{a}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.raw_response && (
        <p style={{ fontSize: '13px', color: '#334155', margin: 0 }}>{data.raw_response}</p>
      )}
    </div>
  );
}

// Bed Suggestion Panel Content
function BedSuggestionResult({ data, patientId, onAssign }) {
  if (!data) return null;
  const bed = data.recommended_bed;
  return (
    <div style={styles.aiResultBox}>
      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '12px', color: '#5B21B6' }}>
        Bed Assignment Suggestion
      </div>
      {bed ? (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontWeight: 600, fontSize: '13px', color: '#0F172A' }}>
            Recommended: Bed #{bed.bed_number || data.recommended_bed_id}
          </div>
          <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
            Ward: {bed.ward} | Floor: {bed.floor} | Type: {bed.bed_type}
          </div>
          {bed.has_monitoring && <div style={{ fontSize: '12px', color: '#0F766E', marginTop: '2px' }}>Has monitoring</div>}
          {bed.has_oxygen && <div style={{ fontSize: '12px', color: '#0F766E' }}>Has oxygen</div>}
        </div>
      ) : (
        <div style={{ fontSize: '13px', color: '#475569', marginBottom: '8px' }}>
          Recommended Bed ID: {data.recommended_bed_id}
        </div>
      )}
      {data.reasoning && (
        <p style={{ fontSize: '13px', color: '#334155', margin: '8px 0' }}>
          <strong>Reasoning:</strong> {data.reasoning}
        </p>
      )}
      {data.alternative_bed_ids && data.alternative_bed_ids.length > 0 && (
        <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0' }}>
          Alternatives: Bed IDs {data.alternative_bed_ids.join(', ')}
        </p>
      )}
      {data.recommended_bed_id && (
        <button
          onClick={() => onAssign(patientId, data.recommended_bed_id)}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#0F766E',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Assign this Bed
        </button>
      )}
      {data.raw_response && (
        <p style={{ fontSize: '13px', color: '#334155', margin: 0 }}>{data.raw_response}</p>
      )}
    </div>
  );
}

// ---------- Main Component ----------

export default function FeaturePage({ endpoint, title, fields }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Modal state
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);

  // AI state for patient rows
  const [dischargeResults, setDischargeResults] = useState({});
  const [dischargeLoading, setDischargeLoading] = useState({});
  const [bedSuggestions, setBedSuggestions] = useState({});
  const [bedSuggestLoading, setBedSuggestLoading] = useState({});

  const displayFields = fields.slice(0, 5);

  const isPatients = endpoint === '/api/patients';
  const isBeds = endpoint === '/api/beds';
  const isStaff = endpoint === '/api/staff';
  const showPHI = isPatients;

  // Fetch items with pagination
  const fetchItems = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`${endpoint}?page=${page}&limit=${pagination.limit}`);
      if (res.data && res.data.data && res.data.pagination) {
        setItems(res.data.data);
        setPagination(res.data.pagination);
      } else {
        setItems(Array.isArray(res.data) ? res.data : (res.data.data || res.data.items || []));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [endpoint, pagination.limit]);

  useEffect(() => {
    fetchItems(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  // Helpers
  const getItemId = (item) => item._id || item.id;

  const buildInitialForm = () => {
    const form = {};
    fields.forEach((f) => {
      if (f.type === 'checkbox' || f.type === 'boolean') form[f.key] = false;
      else if (f.type === 'number') form[f.key] = '';
      else form[f.key] = '';
    });
    return form;
  };

  // Filter items locally (on current page)
  const filtered = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return displayFields.some((f) => {
      const v = item[f.key];
      if (v === null || v === undefined) return false;
      return String(v).toLowerCase().includes(q);
    });
  });

  // CRUD handlers
  const handleCreate = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.post(endpoint, addForm);
      setShowAddModal(false);
      setAddForm({});
      await fetchItems(pagination.page);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    setSaving(true);
    setError(null);
    try {
      const id = getItemId(selectedItem);
      await api.put(`${endpoint}/${id}`, editForm);
      setIsEditing(false);
      setSelectedItem(null);
      await fetchItems(pagination.page);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setSaving(true);
    setError(null);
    try {
      const id = getItemId(selectedItem);
      await api.delete(`${endpoint}/${id}`);
      setShowConfirm(false);
      setSelectedItem(null);
      setIsEditing(false);
      await fetchItems(pagination.page);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  // Open detail
  const openDetail = (item) => {
    setSelectedItem(item);
    setIsEditing(false);
    setEditForm({ ...item });
  };

  const closePanel = () => {
    setSelectedItem(null);
    setIsEditing(false);
    setEditForm({});
  };

  const openAdd = () => {
    setAddForm(buildInitialForm());
    setShowAddModal(true);
  };

  const closeAdd = () => {
    setShowAddModal(false);
    setAddForm({});
  };

  const handleEditFormChange = (key, value) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddFormChange = (key, value) => {
    setAddForm((prev) => ({ ...prev, [key]: value }));
  };

  // Discharge readiness check
  const checkDischargeReadiness = async (patientId) => {
    setDischargeLoading((prev) => ({ ...prev, [patientId]: true }));
    try {
      const res = await api.post('/api/ai/discharge-readiness', { patient_id: patientId });
      setDischargeResults((prev) => ({ ...prev, [patientId]: res.data?.data || res.data }));
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Rate limit reached. Try again later.');
      } else {
        setError(err.response?.data?.error || err.message || 'Discharge readiness check failed');
      }
    } finally {
      setDischargeLoading((prev) => ({ ...prev, [patientId]: false }));
    }
  };

  // Bed suggestion
  const suggestBed = async (patientId) => {
    setBedSuggestLoading((prev) => ({ ...prev, [patientId]: true }));
    try {
      const res = await api.post('/api/ai/suggest-bed-assignment', { patient_id: patientId });
      setBedSuggestions((prev) => ({ ...prev, [patientId]: res.data?.data || res.data }));
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Rate limit reached. Try again later.');
      } else {
        setError(err.response?.data?.error || err.message || 'Bed suggestion failed');
      }
    } finally {
      setBedSuggestLoading((prev) => ({ ...prev, [patientId]: false }));
    }
  };

  // Assign bed to patient
  const assignBed = async (patientId, bedId) => {
    try {
      const patient = items.find(p => p.id === patientId);
      if (!patient) return;
      await api.put(`/api/patients/${patientId}`, { ...patient, bed_id: bedId });
      await fetchItems(pagination.page);
      setBedSuggestions((prev) => ({ ...prev, [patientId]: null }));
    } catch (err) {
      setError(err.message || 'Failed to assign bed');
    }
  };

  // Pagination
  const goToPage = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, page }));
    fetchItems(page);
  };

  // ---------- Render ----------

  const renderCellValue = (item, field) => {
    const val = item[field.key];
    const statusStyle = getStatusStyle(val);
    if (statusStyle) {
      return <span style={styles.badge(statusStyle)}>{String(val)}</span>;
    }
    return formatValue(val, field.type);
  };

  const renderAIActionsCell = (item) => {
    if (!isPatients) return null;
    const id = getItemId(item);
    const isLoadingDR = dischargeLoading[id];
    const isLoadingBed = bedSuggestLoading[id];

    return (
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        <button
          onClick={(e) => { e.stopPropagation(); checkDischargeReadiness(id); }}
          disabled={isLoadingDR}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: '#7C3AED',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoadingDR ? 'not-allowed' : 'pointer',
            opacity: isLoadingDR ? 0.6 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {isLoadingDR ? '...' : 'Discharge Score'}
        </button>
        {!item.bed_id && (
          <button
            onClick={(e) => { e.stopPropagation(); suggestBed(id); }}
            disabled={isLoadingBed}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: '#0369A1',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoadingBed ? 'not-allowed' : 'pointer',
              opacity: isLoadingBed ? 0.6 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {isLoadingBed ? '...' : 'Suggest Bed'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Error banner */}
      {error && (
        <div style={styles.errorBanner}>
          {error}
          <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', fontWeight: 600 }}>
            Dismiss
          </button>
        </div>
      )}

      {/* PHI Notice */}
      {showPHI && (
        <div style={styles.phiBanner}>
          <span style={{ fontSize: '16px' }}>&#128274;</span>
          <span>Contains Protected Health Information (PHI). All access is logged and audited.</span>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>{title}</h1>
        <button
          style={styles.addBtn}
          onClick={openAdd}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0D6B63')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0F766E')}
        >
          <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Add New
        </button>
      </div>

      {/* Search */}
      <div style={styles.searchWrap}>
        <input
          style={styles.searchInput}
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = '#0F766E')}
          onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
        />
      </div>

      {/* Table */}
      <div style={styles.card}>
        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>
            {items.length === 0 ? 'No items found. Click "+ Add New" to create one.' : 'No items match your search.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {displayFields.map((f) => (
                    <th key={f.key} style={styles.th}>{f.label}</th>
                  ))}
                  <th style={{ ...styles.th, textAlign: 'center', width: '80px' }}>Actions</th>
                  {isPatients && <th style={{ ...styles.th, textAlign: 'center', width: '180px' }}>AI Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const id = getItemId(item);
                  const isHovered = hoveredRow === id;
                  const rowBg = isHovered ? '#EFF6FF' : idx % 2 === 0 ? '#fff' : '#F8FAFC';
                  const drResult = dischargeResults[id];
                  const bedResult = bedSuggestions[id];
                  return (
                    <React.Fragment key={id || idx}>
                      <tr
                        style={{ backgroundColor: rowBg, cursor: 'pointer', transition: 'background-color 0.15s' }}
                        onClick={() => openDetail(item)}
                        onMouseEnter={() => setHoveredRow(id)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        {displayFields.map((f) => (
                          <td key={f.key} style={styles.td}>{renderCellValue(item, f)}</td>
                        ))}
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); openDetail(item); }}
                            style={{
                              background: 'none', border: 'none', color: '#0F766E',
                              cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                            }}
                          >
                            View
                          </button>
                        </td>
                        {isPatients && (
                          <td style={{ ...styles.td, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            {renderAIActionsCell(item)}
                          </td>
                        )}
                      </tr>
                      {/* Discharge readiness result row */}
                      {isPatients && drResult && (
                        <tr style={{ backgroundColor: '#F5F3FF' }}>
                          <td colSpan={displayFields.length + 2} style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <DischargeReadinessResult data={drResult} />
                              <button
                                onClick={() => setDischargeResults((prev) => ({ ...prev, [id]: null }))}
                                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '18px', padding: '0 0 0 8px' }}
                              >
                                &times;
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                      {/* Bed suggestion result row */}
                      {isPatients && bedResult && (
                        <tr style={{ backgroundColor: '#EFF6FF' }}>
                          <td colSpan={displayFields.length + 2} style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <BedSuggestionResult data={bedResult} patientId={id} onAssign={assignBed} />
                              <button
                                onClick={() => setBedSuggestions((prev) => ({ ...prev, [id]: null }))}
                                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '18px', padding: '0 0 0 8px' }}
                              >
                                &times;
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={styles.paginationWrap}>
                <span>
                  Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </span>
                <div style={styles.pageInfo}>
                  <button
                    style={styles.pageBtn(pagination.page === 1)}
                    onClick={() => goToPage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    &larr; Prev
                  </button>
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    style={styles.pageBtn(pagination.page === pagination.totalPages)}
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail / Edit Panel */}
      {selectedItem && (
        <div style={styles.overlay} onClick={closePanel}>
          <div style={styles.slidePanel} onClick={(e) => e.stopPropagation()}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>{isEditing ? 'Edit Item' : 'Item Details'}</h2>
              <button style={styles.closeBtn} onClick={closePanel}>&times;</button>
            </div>

            <div style={styles.panelBody}>
              {isEditing ? (
                fields.map((f) => (
                  <FormField
                    key={f.key}
                    field={f}
                    value={editForm[f.key]}
                    onChange={handleEditFormChange}
                  />
                ))
              ) : (
                fields.map((f) => {
                  const val = selectedItem[f.key];
                  const statusStyle = getStatusStyle(val);
                  return (
                    <div key={f.key} style={styles.fieldRow}>
                      <div style={styles.fieldLabel}>{f.label}</div>
                      <div style={styles.fieldValue}>
                        {statusStyle ? (
                          <span style={styles.badge(statusStyle)}>{String(val)}</span>
                        ) : (
                          formatValue(val, f.type)
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={styles.panelActions}>
              {isEditing ? (
                <>
                  <button style={styles.cancelBtn} onClick={() => { setIsEditing(false); setEditForm({ ...selectedItem }); }}>
                    Cancel
                  </button>
                  <button
                    style={{ ...styles.editBtn, opacity: saving ? 0.6 : 1 }}
                    onClick={handleUpdate}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    style={styles.editBtn}
                    onClick={() => { setIsEditing(true); setEditForm({ ...selectedItem }); }}
                  >
                    Edit
                  </button>
                  <button style={styles.deleteBtn} onClick={() => setShowConfirm(true)}>
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add New Modal */}
      {showAddModal && (
        <div style={styles.overlay} onClick={closeAdd}>
          <div style={styles.slidePanel} onClick={(e) => e.stopPropagation()}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>Add New</h2>
              <button style={styles.closeBtn} onClick={closeAdd}>&times;</button>
            </div>
            <div style={styles.panelBody}>
              {fields.map((f) => (
                <FormField
                  key={f.key}
                  field={f}
                  value={addForm[f.key]}
                  onChange={handleAddFormChange}
                />
              ))}
            </div>
            <div style={styles.panelActions}>
              <button style={styles.cancelBtn} onClick={closeAdd}>Cancel</button>
              <button
                style={{ ...styles.editBtn, opacity: saving ? 0.6 : 1 }}
                onClick={handleCreate}
                disabled={saving}
              >
                {saving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showConfirm && (
        <ConfirmDialog
          message="Are you sure you want to delete this item? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
