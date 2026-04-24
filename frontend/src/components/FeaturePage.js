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

function resolveEndpoint(endpoint) {
  return endpoint;
}

// ---------- Styles ----------
const styles = {
  container: {
    padding: '24px 32px',
    maxWidth: '1400px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
  // Modal overlay
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

// ---------- Main Component ----------

export default function FeaturePage({ endpoint, title, fields }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Modal state
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);

  const path = resolveEndpoint(endpoint);
  const displayFields = fields.slice(0, 5);

  // Fetch items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(path);
      setItems(Array.isArray(res.data) ? res.data : (res.data.data || res.data.items || []));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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

  // Filter items
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
      await api.post(path, addForm);
      setShowAddModal(false);
      setAddForm({});
      await fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create');
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
      await api.put(`${path}/${id}`, editForm);
      setIsEditing(false);
      setSelectedItem(null);
      await fetchItems();
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
      await api.delete(`${path}/${id}`);
      setShowConfirm(false);
      setSelectedItem(null);
      setIsEditing(false);
      await fetchItems();
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

  // ---------- Render ----------

  const renderCellValue = (item, field) => {
    const val = item[field.key];
    const statusStyle = getStatusStyle(val);
    if (statusStyle) {
      return <span style={styles.badge(statusStyle)}>{String(val)}</span>;
    }
    return formatValue(val, field.type);
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
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const id = getItemId(item);
                  const isHovered = hoveredRow === id;
                  const rowBg = isHovered ? '#EFF6FF' : idx % 2 === 0 ? '#fff' : '#F8FAFC';
                  return (
                    <tr
                      key={id || idx}
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail / Edit Panel */}
      {selectedItem && (
        <div style={styles.overlay} onClick={closePanel}>
          <div style={styles.slidePanel} onClick={(e) => e.stopPropagation()}>
            {/* Panel header */}
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>{isEditing ? 'Edit Item' : 'Item Details'}</h2>
              <button style={styles.closeBtn} onClick={closePanel}>&times;</button>
            </div>

            {/* Panel body */}
            <div style={styles.panelBody}>
              {isEditing ? (
                /* Edit form */
                fields.map((f) => (
                  <FormField
                    key={f.key}
                    field={f}
                    value={editForm[f.key]}
                    onChange={handleEditFormChange}
                  />
                ))
              ) : (
                /* Detail view */
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

            {/* Panel actions */}
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
