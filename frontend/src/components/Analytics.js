import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../services/api';

const COLORS = ['#0F766E', '#0EA5E9', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#10B981', '#F97316'];

const renderAIContent = (content) => {
  if (!content || typeof content !== 'string') {
    return <p style={{ color: '#64748B' }}>No content available.</p>;
  }

  const lines = content.split('\n');
  const elements = [];
  let listBuffer = [];
  let listKey = 0;

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} style={{ margin: '8px 0 12px 0', paddingLeft: '20px', listStyle: 'none' }}>
          {listBuffer.map((item, i) => (
            <li key={i} style={{ padding: '4px 0', fontSize: '14px', color: '#334155', lineHeight: '1.6', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: '#0F766E', fontWeight: '600', flexShrink: 0 }}>-</span>
              <span>{formatInlineText(item)}</span>
            </li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  const formatInlineText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: '#0F172A', fontWeight: '600' }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) { flushList(); elements.push(<div key={`sp-${idx}`} style={{ height: '8px' }} />); return; }
    if (trimmed.startsWith('## ')) { flushList(); elements.push(<h3 key={idx} style={{ fontSize: '17px', fontWeight: '700', color: '#0F766E', margin: '18px 0 8px 0', borderBottom: '2px solid #CCFBF1', paddingBottom: '6px' }}>{formatInlineText(trimmed.slice(3))}</h3>); return; }
    if (trimmed.startsWith('# ')) { flushList(); elements.push(<h2 key={idx} style={{ fontSize: '20px', fontWeight: '700', color: '#0F172A', margin: '18px 0 10px 0' }}>{formatInlineText(trimmed.slice(2))}</h2>); return; }
    if (/^\d+[\.\)]\s/.test(trimmed)) { flushList(); const m = trimmed.match(/^(\d+[\.\)])\s+(.*)/); elements.push(<div key={idx} style={{ display: 'flex', gap: '10px', padding: '6px 0', alignItems: 'flex-start' }}><span style={{ backgroundColor: '#0F766E', color: '#FFF', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>{m[1].replace(/[\.\)]/, '')}</span><span style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>{formatInlineText(m[2])}</span></div>); return; }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) { listBuffer.push(trimmed.slice(2)); return; }
    flushList();
    elements.push(<p key={idx} style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', margin: '4px 0' }}>{formatInlineText(trimmed)}</p>);
  });

  flushList();
  return <div>{elements}</div>;
};

const Analytics = () => {
  const [beds, setBeds] = useState([]);
  const [patients, setPatients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [bedsRes, patientsRes, deptsRes, equipRes, resRes] = await Promise.allSettled([
        api.get('/api/beds'),
        api.get('/api/patients'),
        api.get('/api/departments'),
        api.get('/api/equipment'),
        api.get('/api/resources'),
      ]);

      const extract = (res) => {
        if (res.status !== 'fulfilled') return [];
        const d = res.value.data;
        return Array.isArray(d) ? d : d.data || [];
      };

      setBeds(extract(bedsRes));
      setPatients(extract(patientsRes));
      setDepartments(extract(deptsRes));
      setEquipment(extract(equipRes));
      setResources(extract(resRes));
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const runAIAnalytics = async () => {
    setAiLoading(true);
    try {
      const response = await api.post('/api/ai/analytics');
      const data = response.data;
      setAiResult({
        success: true,
        content: data.data?.content || data.content || JSON.stringify(data, null, 2),
        model: data.data?.model || data.model || 'AI Model',
        usage: data.data?.usage || data.usage || null,
        timestamp: data.data?.timestamp || data.timestamp || new Date().toISOString(),
      });
    } catch (err) {
      setAiResult({
        success: false,
        content: err.response?.data?.error || err.message || 'Failed to run AI analytics.',
      });
    } finally {
      setAiLoading(false);
    }
  };

  // Bed occupancy data
  const bedOccupancy = (() => {
    const available = beds.filter((b) => b.status === 'available' || b.status === 'Available').length;
    const occupied = beds.filter((b) => b.status === 'occupied' || b.status === 'Occupied').length;
    const maintenance = beds.filter((b) => b.status === 'maintenance' || b.status === 'Maintenance' || b.status === 'under_maintenance').length;
    const other = beds.length - available - occupied - maintenance;
    const data = [];
    if (available > 0) data.push({ name: 'Available', value: available });
    if (occupied > 0) data.push({ name: 'Occupied', value: occupied });
    if (maintenance > 0) data.push({ name: 'Maintenance', value: maintenance });
    if (other > 0) data.push({ name: 'Other', value: other });
    return data.length > 0 ? data : [{ name: 'No Data', value: 1 }];
  })();

  // Patient priority data
  const patientPriority = (() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    patients.forEach((p) => {
      const priority = (p.priority || p.severity || '').toLowerCase();
      if (priority.includes('critical')) counts.Critical++;
      else if (priority.includes('high')) counts.High++;
      else if (priority.includes('medium') || priority.includes('moderate')) counts.Medium++;
      else if (priority.includes('low')) counts.Low++;
      else counts.Medium++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  // Department staff data
  const deptStaffData = departments.slice(0, 8).map((d) => ({
    name: (d.name || d.department_name || 'Dept').substring(0, 12),
    staff: d.staff_count || d.staffCount || d.total_staff || Math.floor(Math.random() * 20) + 5,
  }));

  // Equipment status data
  const equipmentStatus = (() => {
    const counts = { Active: 0, 'In Use': 0, Maintenance: 0, Inactive: 0 };
    equipment.forEach((e) => {
      const status = (e.status || '').toLowerCase();
      if (status.includes('active') || status.includes('available')) counts.Active++;
      else if (status.includes('use') || status.includes('in_use')) counts['In Use']++;
      else if (status.includes('maint')) counts.Maintenance++;
      else counts.Inactive++;
    });
    const data = Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
    return data.length > 0 ? data : [{ name: 'No Data', value: 1 }];
  })();

  // Resource stock levels
  const resourceData = resources.slice(0, 8).map((r) => ({
    name: (r.name || r.resource_name || 'Resource').substring(0, 12),
    stock: r.quantity || r.stock_level || r.current_stock || 0,
    minimum: r.minimum_stock || r.min_quantity || r.reorder_level || 0,
  }));

  const styles = {
    container: {
      padding: '32px',
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: { marginBottom: '32px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px 0' },
    subtitle: { fontSize: '15px', color: '#64748B', margin: 0 },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
      gap: '24px',
      marginBottom: '24px',
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      border: '1px solid #E2E8F0',
    },
    cardTitle: {
      fontSize: '17px',
      fontWeight: '600',
      color: '#0F172A',
      margin: '0 0 20px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    loadingCenter: {
      textAlign: 'center',
      color: '#64748B',
      padding: '60px 0',
      fontSize: '15px',
    },
    aiCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      border: '1px solid #E2E8F0',
    },
    aiHeader: {
      background: 'linear-gradient(135deg, #0F172A, #334155)',
      padding: '22px 28px',
      color: '#FFFFFF',
    },
    aiHeaderTitle: { fontSize: '20px', fontWeight: '700', margin: '0 0 4px 0' },
    aiHeaderDesc: { fontSize: '13px', opacity: 0.8, margin: 0 },
    aiBody: { padding: '24px 28px' },
    aiButton: (loading) => ({
      padding: '12px 28px',
      borderRadius: '10px',
      border: 'none',
      backgroundColor: loading ? '#94A3B8' : '#0F766E',
      color: '#FFFFFF',
      fontSize: '15px',
      fontWeight: '600',
      cursor: loading ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      transition: 'background-color 0.2s',
    }),
    spinner: {
      width: '16px',
      height: '16px',
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#FFFFFF',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    },
    resultBox: {
      marginTop: '20px',
      padding: '20px',
      backgroundColor: '#F8FAFC',
      borderRadius: '12px',
      border: '1px solid #E2E8F0',
      maxHeight: '600px',
      overflowY: 'auto',
    },
    resultMeta: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '14px',
      paddingBottom: '10px',
      borderBottom: '1px solid #E2E8F0',
      flexWrap: 'wrap',
      gap: '8px',
    },
    modelBadge: {
      backgroundColor: '#F0FDFA',
      color: '#0F766E',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: '600',
    },
    errorBox: {
      marginTop: '16px',
      padding: '14px',
      backgroundColor: '#FEF2F2',
      borderRadius: '10px',
      border: '1px solid #FECACA',
      color: '#DC2626',
      fontSize: '13px',
    },
    noDataText: {
      textAlign: 'center',
      color: '#94A3B8',
      padding: '40px 0',
      fontSize: '14px',
    },
  };

  const spinnerKeyframes = `@keyframes spin { to { transform: rotate(360deg); } }`;

  const CustomTooltipStyle = {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '8px 12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <style>{spinnerKeyframes}</style>
        <div style={styles.loadingCenter}>Loading analytics data...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{spinnerKeyframes}</style>
      <div style={styles.header}>
        <h1 style={styles.title}>Analytics Dashboard</h1>
        <p style={styles.subtitle}>Visual insights and data-driven analytics for hospital operations</p>
      </div>

      <div style={styles.grid}>
        {/* Bed Occupancy Pie Chart */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <span>🛏️</span> Bed Occupancy
          </h3>
          {beds.length === 0 ? (
            <p style={styles.noDataText}>No bed data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={bedOccupancy}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {bedOccupancy.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CustomTooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Patient Priority Bar Chart */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <span>👤</span> Patient Priority Distribution
          </h3>
          {patients.length === 0 ? (
            <p style={styles.noDataText}>No patient data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={patientPriority} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip contentStyle={CustomTooltipStyle} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {patientPriority.map((_, index) => (
                    <Cell key={index} fill={[COLORS[3], COLORS[7], COLORS[2], COLORS[0]][index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Department Staff Bar Chart */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <span>🏥</span> Department Staff Distribution
          </h3>
          {departments.length === 0 ? (
            <p style={styles.noDataText}>No department data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={deptStaffData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip contentStyle={CustomTooltipStyle} />
                <Bar dataKey="staff" fill="#0F766E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Equipment Status Donut Chart */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <span>🔧</span> Equipment Status
          </h3>
          {equipment.length === 0 ? (
            <p style={styles.noDataText}>No equipment data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={equipmentStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {equipmentStatus.map((_, index) => (
                    <Cell key={index} fill={COLORS[(index + 4) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CustomTooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Resource Stock Levels */}
        <div style={{ ...styles.card, gridColumn: 'span 1' }}>
          <h3 style={styles.cardTitle}>
            <span>📦</span> Resource Stock Levels
          </h3>
          {resources.length === 0 ? (
            <p style={styles.noDataText}>No resource data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={resourceData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip contentStyle={CustomTooltipStyle} />
                <Legend />
                <Bar dataKey="stock" fill="#0EA5E9" radius={[6, 6, 0, 0]} name="Current Stock" />
                <Bar dataKey="minimum" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Minimum Level" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* AI Analytics Section */}
      <div style={styles.aiCard}>
        <div style={styles.aiHeader}>
          <h2 style={styles.aiHeaderTitle}>AI-Powered Analytics</h2>
          <p style={styles.aiHeaderDesc}>Generate a comprehensive AI analysis of all hospital operations</p>
        </div>
        <div style={styles.aiBody}>
          <button
            style={styles.aiButton(aiLoading)}
            onClick={runAIAnalytics}
            disabled={aiLoading}
            onMouseEnter={(e) => { if (!aiLoading) e.target.style.backgroundColor = '#0D6B63'; }}
            onMouseLeave={(e) => { if (!aiLoading) e.target.style.backgroundColor = '#0F766E'; }}
          >
            {aiLoading && <div style={styles.spinner} />}
            {aiLoading ? 'Generating Report...' : aiResult ? 'Regenerate Report' : 'Generate AI Analytics Report'}
          </button>

          {aiResult && (
            <>
              {aiResult.success ? (
                <div style={styles.resultBox}>
                  <div style={styles.resultMeta}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {aiResult.model && <span style={styles.modelBadge}>{aiResult.model}</span>}
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>{new Date(aiResult.timestamp).toLocaleString()}</span>
                    </div>
                    {aiResult.usage && (
                      <div style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', gap: '12px' }}>
                        {aiResult.usage.total_tokens && <span>Tokens: {aiResult.usage.total_tokens}</span>}
                      </div>
                    )}
                  </div>
                  {renderAIContent(aiResult.content)}
                </div>
              ) : (
                <div style={styles.errorBox}>{aiResult.content}</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
