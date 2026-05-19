import React, { useState } from 'react';
import api from '../services/api';

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
      const numMatch = part.match(/(\d+\.?\d*%|\d{2,}[,.]?\d*)/g);
      if (numMatch) {
        let lastIdx = 0;
        const segs = [];
        numMatch.forEach((num) => {
          const idx = part.indexOf(num, lastIdx);
          if (idx > lastIdx) segs.push(part.slice(lastIdx, idx));
          segs.push(<span key={`n-${i}-${idx}`} style={{ color: '#0F766E', fontWeight: '600' }}>{num}</span>);
          lastIdx = idx + num.length;
        });
        if (lastIdx < part.length) segs.push(part.slice(lastIdx));
        return <span key={i}>{segs}</span>;
      }
      return part;
    });
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      elements.push(<div key={`sp-${idx}`} style={{ height: '8px' }} />);
      return;
    }

    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={idx} style={{ fontSize: '15px', fontWeight: '600', color: '#0F172A', margin: '16px 0 6px 0', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px' }}>
          {formatInlineText(trimmed.slice(4))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={idx} style={{ fontSize: '17px', fontWeight: '700', color: '#0F766E', margin: '20px 0 8px 0', borderBottom: '2px solid #CCFBF1', paddingBottom: '6px' }}>
          {formatInlineText(trimmed.slice(3))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h2 key={idx} style={{ fontSize: '20px', fontWeight: '700', color: '#0F172A', margin: '20px 0 10px 0' }}>
          {formatInlineText(trimmed.slice(2))}
        </h2>
      );
      return;
    }

    if (/^\d+[\.\)]\s/.test(trimmed)) {
      flushList();
      const match = trimmed.match(/^(\d+[\.\)])\s+(.*)/);
      elements.push(
        <div key={idx} style={{ display: 'flex', gap: '10px', padding: '8px 0', alignItems: 'flex-start' }}>
          <span style={{ backgroundColor: '#0F766E', color: '#FFFFFF', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>
            {match[1].replace(/[\.\)]/, '')}
          </span>
          <span style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', paddingTop: '2px' }}>{formatInlineText(match[2])}</span>
        </div>
      );
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listBuffer.push(trimmed.slice(2));
      return;
    }

    flushList();
    elements.push(
      <p key={idx} style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', margin: '4px 0' }}>
        {formatInlineText(trimmed)}
      </p>
    );
  });

  flushList();
  return <div>{elements}</div>;
};

const AIInsights = () => {
  const [results, setResults] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [expandedCard, setExpandedCard] = useState(null);
  const [inputValues, setInputValues] = useState({});

  const features = [
    { id: 'bed-forecast', title: 'Bed Demand Forecast', icon: '🛏️', desc: 'Predict bed demand for the next 7 days using AI analysis', endpoint: '/api/ai/bed-forecast', gradient: 'linear-gradient(135deg, #0F766E, #14B8A6)' },
    { id: 'patient-flow', title: 'Patient Flow Optimization', icon: '🔄', desc: 'Optimize patient flow through departments and reduce bottlenecks', endpoint: '/api/ai/patient-flow', gradient: 'linear-gradient(135deg, #0EA5E9, #38BDF8)' },
    { id: 'staff-optimization', title: 'Staff Optimization', icon: '👥', desc: 'AI-driven staff scheduling and workload balancing', endpoint: '/api/ai/staff-optimization', gradient: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' },
    { id: 'resource-optimization', title: 'Resource Optimization', icon: '📦', desc: 'Optimize resource allocation and reduce waste', endpoint: '/api/ai/resource-optimization', gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)' },
    { id: 'discharge-prediction', title: 'Discharge Prediction', icon: '📋', desc: 'Predict patient discharge times to plan bed availability', endpoint: '/api/ai/discharge-prediction', gradient: 'linear-gradient(135deg, #10B981, #34D399)' },
    { id: 'emergency-planning', title: 'Emergency Planning', icon: '⚠️', desc: 'AI emergency capacity and surge planning analysis', endpoint: '/api/ai/emergency-planning', gradient: 'linear-gradient(135deg, #EF4444, #F87171)' },
    { id: 'or-optimization', title: 'OR Optimization', icon: '🏥', desc: 'Optimize operating room scheduling and utilization', endpoint: '/api/ai/or-optimization', gradient: 'linear-gradient(135deg, #EC4899, #F472B6)' },
    { id: 'analytics', title: 'Full Analytics Report', icon: '📊', desc: 'Comprehensive AI-generated analytics report', endpoint: '/api/ai/analytics', gradient: 'linear-gradient(135deg, #0F172A, #334155)' },
    { id: 'discharge-readiness', title: 'Discharge Readiness Scorer', icon: '✅', desc: 'Score a specific patient\'s discharge readiness 0-100 and auto-persist to their record', endpoint: null, gradient: 'linear-gradient(135deg, #16A34A, #4ADE80)', requiresInput: 'patient_id' },
    { id: 'suggest-bed-assignment', title: 'AI Bed Assignment', icon: '🗺️', desc: 'Recommend the optimal available bed for an incoming patient', endpoint: null, gradient: 'linear-gradient(135deg, #7C3AED, #A78BFA)', requiresInput: 'patient_id' },
  ];

  const runAnalysis = async (feature) => {
    setLoadingStates((prev) => ({ ...prev, [feature.id]: true }));
    setExpandedCard(feature.id);
    try {
      let response;
      if (feature.requiresInput) {
        const inputVal = inputValues[feature.id];
        if (!inputVal) {
          setResults((prev) => ({ ...prev, [feature.id]: { success: false, content: `Please enter a ${feature.requiresInput} first.`, timestamp: new Date().toISOString() } }));
          setLoadingStates((prev) => ({ ...prev, [feature.id]: false }));
          return;
        }
        const endpoint = feature.id === 'discharge-readiness' ? '/api/ai/discharge-readiness' : '/api/ai/suggest-bed-assignment';
        response = await api.post(endpoint, { [feature.requiresInput]: parseInt(inputVal) });
      } else {
        response = await api.post(feature.endpoint);
      }
      const data = response.data;
      // For structured endpoints (discharge-readiness, suggest-bed-assignment)
      if (data.data && typeof data.data === 'object' && !data.data.content) {
        setResults((prev) => ({
          ...prev,
          [feature.id]: {
            success: true,
            content: JSON.stringify(data.data, null, 2),
            structured: data.data,
            model: 'AI Model',
            timestamp: new Date().toISOString(),
          },
        }));
      } else {
        setResults((prev) => ({
          ...prev,
          [feature.id]: {
            success: true,
            content: data.data?.content || data.content || JSON.stringify(data, null, 2),
            model: data.data?.model || data.model || 'AI Model',
            usage: data.data?.usage || data.usage || null,
            timestamp: data.data?.timestamp || data.timestamp || new Date().toISOString(),
          },
        }));
      }
    } catch (err) {
      const is429 = err.response?.status === 429;
      setResults((prev) => ({
        ...prev,
        [feature.id]: {
          success: false,
          content: is429
            ? 'Rate limit reached (20 requests/hour). Please try again later.'
            : (err.response?.data?.error || err.message || 'Failed to run analysis. Please try again.'),
          timestamp: new Date().toISOString(),
        },
      }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, [feature.id]: false }));
    }
  };

  const styles = {
    container: {
      padding: '32px',
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
      marginBottom: '32px',
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#0F172A',
      margin: '0 0 4px 0',
    },
    subtitle: {
      fontSize: '15px',
      color: '#64748B',
      margin: 0,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
      gap: '20px',
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      border: '1px solid #E2E8F0',
      transition: 'transform 0.2s, box-shadow 0.2s',
    },
    cardHeader: (gradient) => ({
      background: gradient,
      padding: '20px 22px',
      color: '#FFFFFF',
    }),
    cardIcon: {
      fontSize: '28px',
      display: 'block',
      marginBottom: '8px',
    },
    cardTitle: {
      fontSize: '17px',
      fontWeight: '700',
      margin: '0 0 4px 0',
      color: '#FFFFFF',
    },
    cardDesc: {
      fontSize: '13px',
      margin: 0,
      opacity: 0.9,
      lineHeight: '1.4',
      color: '#FFFFFF',
    },
    cardBody: {
      padding: '18px 22px',
    },
    button: (isLoading) => ({
      width: '100%',
      padding: '10px 16px',
      borderRadius: '10px',
      border: 'none',
      backgroundColor: isLoading ? '#94A3B8' : '#0F766E',
      color: '#FFFFFF',
      fontSize: '14px',
      fontWeight: '600',
      cursor: isLoading ? 'not-allowed' : 'pointer',
      transition: 'background-color 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    }),
    spinner: {
      width: '16px',
      height: '16px',
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#FFFFFF',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    },
    resultContainer: {
      marginTop: '16px',
      padding: '18px',
      backgroundColor: '#F8FAFC',
      borderRadius: '12px',
      border: '1px solid #E2E8F0',
      maxHeight: '500px',
      overflowY: 'auto',
    },
    resultMeta: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px',
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
    timestamp: {
      fontSize: '11px',
      color: '#94A3B8',
    },
    tokenInfo: {
      fontSize: '11px',
      color: '#94A3B8',
      display: 'flex',
      gap: '12px',
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
    collapseBtn: {
      marginTop: '10px',
      background: 'none',
      border: 'none',
      color: '#0F766E',
      fontSize: '13px',
      cursor: 'pointer',
      fontWeight: '600',
      padding: 0,
    },
  };

  const spinnerKeyframes = `@keyframes spin { to { transform: rotate(360deg); } }`;

  return (
    <div style={styles.container}>
      <style>{spinnerKeyframes}</style>
      <div style={styles.header}>
        <h1 style={styles.title}>AI Insights</h1>
        <p style={styles.subtitle}>Powered by OpenRouter AI -- run intelligent analyses on your hospital data</p>
      </div>

      <div style={styles.grid}>
        {features.map((feature) => {
          const isLoading = loadingStates[feature.id];
          const result = results[feature.id];
          const isExpanded = expandedCard === feature.id;

          return (
            <div key={feature.id} style={{ ...styles.card, ...(isExpanded && result ? { gridColumn: 'span 1' } : {}) }}>
              <div style={styles.cardHeader(feature.gradient)}>
                <span style={styles.cardIcon}>{feature.icon}</span>
                <h3 style={styles.cardTitle}>{feature.title}</h3>
                <p style={styles.cardDesc}>{feature.desc}</p>
              </div>
              <div style={styles.cardBody}>
                {feature.requiresInput && (
                  <input
                    type="number"
                    placeholder={`Enter ${feature.requiresInput}`}
                    value={inputValues[feature.id] || ''}
                    onChange={(e) => setInputValues((prev) => ({ ...prev, [feature.id]: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }}
                  />
                )}
                <button
                  style={styles.button(isLoading)}
                  onClick={() => runAnalysis(feature)}
                  disabled={isLoading}
                  onMouseEnter={(e) => { if (!isLoading) e.target.style.backgroundColor = '#0D6B63'; }}
                  onMouseLeave={(e) => { if (!isLoading) e.target.style.backgroundColor = '#0F766E'; }}
                >
                  {isLoading && <div style={styles.spinner} />}
                  {isLoading ? 'Running Analysis...' : result ? 'Run Again' : 'Run Analysis'}
                </button>

                {result && isExpanded && (
                  <>
                    {result.success ? (
                      <div style={styles.resultContainer}>
                        <div style={styles.resultMeta}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {result.model && <span style={styles.modelBadge}>{result.model}</span>}
                            <span style={styles.timestamp}>{new Date(result.timestamp).toLocaleString()}</span>
                          </div>
                          {result.usage && (
                            <div style={styles.tokenInfo}>
                              {result.usage.prompt_tokens && <span>Prompt: {result.usage.prompt_tokens}</span>}
                              {result.usage.completion_tokens && <span>Completion: {result.usage.completion_tokens}</span>}
                              {result.usage.total_tokens && <span>Total: {result.usage.total_tokens}</span>}
                            </div>
                          )}
                        </div>
                        {renderAIContent(result.content)}
                      </div>
                    ) : (
                      <div style={styles.errorBox}>
                        {result.content}
                      </div>
                    )}
                    <button style={styles.collapseBtn} onClick={() => setExpandedCard(null)}>
                      Collapse
                    </button>
                  </>
                )}

                {result && !isExpanded && (
                  <button style={styles.collapseBtn} onClick={() => setExpandedCard(feature.id)}>
                    Show Result
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AIInsights;
