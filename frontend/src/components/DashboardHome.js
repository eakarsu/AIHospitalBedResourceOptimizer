import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const DashboardHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ beds: 0, patients: 0, staff: 0, departments: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const userName = localStorage.getItem('userName') || localStorage.getItem('username') || 'Admin';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [bedsRes, patientsRes, staffRes, deptsRes] = await Promise.allSettled([
        api.get('/api/beds'),
        api.get('/api/patients'),
        api.get('/api/staff'),
        api.get('/api/departments'),
      ]);

      const beds = bedsRes.status === 'fulfilled' ? bedsRes.value.data : [];
      const patients = patientsRes.status === 'fulfilled' ? patientsRes.value.data : [];
      const staff = staffRes.status === 'fulfilled' ? staffRes.value.data : [];
      const depts = deptsRes.status === 'fulfilled' ? deptsRes.value.data : [];

      const bedsArr = Array.isArray(beds) ? beds : beds.data || [];
      const patientsArr = Array.isArray(patients) ? patients : patients.data || [];
      const staffArr = Array.isArray(staff) ? staff : staff.data || [];
      const deptsArr = Array.isArray(depts) ? depts : depts.data || [];

      setStats({
        beds: bedsArr.length,
        patients: patientsArr.length,
        staff: staffArr.length,
        departments: deptsArr.length,
      });

      const activities = [];
      if (patientsArr.length > 0) {
        patientsArr.slice(-3).reverse().forEach((p) => {
          activities.push({ text: `Patient ${p.name || p.patient_name || 'Unknown'} admitted`, time: p.admission_date || 'Recently', type: 'patient' });
        });
      }
      if (staffArr.length > 0) {
        staffArr.slice(-2).reverse().forEach((s) => {
          activities.push({ text: `${s.name || s.staff_name || 'Staff'} scheduled on duty`, time: 'Today', type: 'staff' });
        });
      }
      if (activities.length === 0) {
        activities.push(
          { text: 'System initialized successfully', time: 'Just now', type: 'system' },
          { text: 'Dashboard loaded', time: 'Just now', type: 'system' }
        );
      }
      setRecentActivity(activities);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Beds', value: stats.beds, icon: '🛏️', color: '#0F766E', bg: '#F0FDFA' },
    { label: 'Active Patients', value: stats.patients, icon: '👤', color: '#0EA5E9', bg: '#F0F9FF' },
    { label: 'Staff On Duty', value: stats.staff, icon: '👥', color: '#8B5CF6', bg: '#F5F3FF' },
    { label: 'Departments', value: stats.departments, icon: '🏥', color: '#F59E0B', bg: '#FFFBEB' },
  ];

  const quickActions = [
    { title: 'Bed Management', icon: '🛏️', desc: 'Monitor and manage hospital bed allocation and availability', route: '/beds' },
    { title: 'Patient Tracking', icon: '👤', desc: 'Track patient admissions, transfers, and discharges in real-time', route: '/patients' },
    { title: 'Staff Scheduling', icon: '👥', desc: 'Manage staff shifts, assignments, and availability', route: '/staff' },
    { title: 'Departments', icon: '🏥', desc: 'View and manage hospital departments and their resources', route: '/departments' },
    { title: 'Equipment', icon: '🔧', desc: 'Track medical equipment status and maintenance schedules', route: '/equipment' },
    { title: 'Resources', icon: '📦', desc: 'Manage hospital resources, supplies, and inventory levels', route: '/resources' },
    { title: 'Operating Rooms', icon: '🏥', desc: 'Schedule and optimize operating room utilization', route: '/operating-rooms' },
    { title: 'Supply Chain', icon: '💊', desc: 'Monitor supply chain and pharmaceutical inventory', route: '/supply-chain' },
    { title: 'Emergency Capacity', icon: '⚠️', desc: 'Plan and monitor emergency surge capacity', route: '/emergency' },
    { title: 'AI Insights', icon: '🧠', desc: 'AI-powered predictions and optimization recommendations', route: '/ai-insights' },
    { title: 'Analytics', icon: '📊', desc: 'View charts, reports, and data-driven analytics', route: '/analytics' },
  ];

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
    welcome: {
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
    statsRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '20px',
      marginBottom: '36px',
    },
    statCard: (bg, color) => ({
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      padding: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      border: `1px solid ${bg}`,
      transition: 'transform 0.2s, box-shadow 0.2s',
    }),
    statIcon: (bg) => ({
      width: '52px',
      height: '52px',
      borderRadius: '12px',
      backgroundColor: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      flexShrink: 0,
    }),
    statValue: (color) => ({
      fontSize: '28px',
      fontWeight: '700',
      color: color,
      margin: 0,
      lineHeight: 1,
    }),
    statLabel: {
      fontSize: '13px',
      color: '#64748B',
      margin: '4px 0 0 0',
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#0F172A',
      margin: '0 0 20px 0',
    },
    actionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      gap: '16px',
      marginBottom: '36px',
    },
    actionCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: '14px',
      padding: '22px',
      cursor: 'pointer',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      border: '1px solid #E2E8F0',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    },
    actionCardHover: {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 25px rgba(15,118,110,0.12)',
      borderColor: '#0F766E',
    },
    actionIcon: {
      fontSize: '28px',
      marginBottom: '10px',
      display: 'block',
    },
    actionTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#0F172A',
      margin: '0 0 6px 0',
    },
    actionDesc: {
      fontSize: '13px',
      color: '#64748B',
      margin: 0,
      lineHeight: '1.5',
    },
    activityCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: '14px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      border: '1px solid #E2E8F0',
    },
    activityItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: '1px solid #F1F5F9',
    },
    activityDot: (type) => ({
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: type === 'patient' ? '#0F766E' : type === 'staff' ? '#0EA5E9' : '#94A3B8',
      flexShrink: 0,
      marginRight: '12px',
    }),
    activityText: {
      fontSize: '14px',
      color: '#334155',
      flex: 1,
    },
    activityTime: {
      fontSize: '12px',
      color: '#94A3B8',
      marginLeft: '12px',
      flexShrink: 0,
    },
    loadingText: {
      textAlign: 'center',
      color: '#64748B',
      padding: '40px',
      fontSize: '15px',
    },
  };

  const [hoveredCard, setHoveredCard] = useState(null);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.welcome}>Welcome back, {userName}</h1>
        <p style={styles.subtitle}>Here's an overview of your hospital's current status</p>
      </div>

      <div style={styles.statsRow}>
        {statCards.map((card, idx) => (
          <div key={idx} style={styles.statCard(card.bg, card.color)}>
            <div style={styles.statIcon(card.bg)}>
              <span>{card.icon}</span>
            </div>
            <div>
              <p style={styles.statValue(card.color)}>{card.value}</p>
              <p style={styles.statLabel}>{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 style={styles.sectionTitle}>Quick Actions</h2>
      <div style={styles.actionsGrid}>
        {quickActions.map((action, idx) => (
          <div
            key={idx}
            style={{
              ...styles.actionCard,
              ...(hoveredCard === idx ? styles.actionCardHover : {}),
            }}
            onClick={() => navigate(action.route)}
            onMouseEnter={() => setHoveredCard(idx)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <span style={styles.actionIcon}>{action.icon}</span>
            <h3 style={styles.actionTitle}>{action.title}</h3>
            <p style={styles.actionDesc}>{action.desc}</p>
          </div>
        ))}
      </div>

      <h2 style={styles.sectionTitle}>Recent Activity</h2>
      <div style={styles.activityCard}>
        {recentActivity.length === 0 ? (
          <p style={{ color: '#94A3B8', textAlign: 'center', padding: '20px' }}>No recent activity</p>
        ) : (
          recentActivity.map((activity, idx) => (
            <div key={idx} style={{ ...styles.activityItem, ...(idx === recentActivity.length - 1 ? { borderBottom: 'none' } : {}) }}>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={styles.activityDot(activity.type)} />
                <span style={styles.activityText}>{activity.text}</span>
              </div>
              <span style={styles.activityTime}>{activity.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DashboardHome;
