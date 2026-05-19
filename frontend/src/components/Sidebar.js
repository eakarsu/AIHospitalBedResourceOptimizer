import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FaBed, FaUserInjured, FaUsers, FaHospital, FaTools, FaBoxes,
  FaProcedures, FaPills, FaExclamationTriangle, FaBrain, FaChartLine,
  FaSignOutAlt, FaTachometerAlt, FaBars
} from 'react-icons/fa';

const navItems = [
  { label: 'Dashboard Home', icon: FaTachometerAlt, path: '/dashboard' },
  { label: 'Bed Management', icon: FaBed, path: '/dashboard/beds' },
  { label: 'Patient Tracking', icon: FaUserInjured, path: '/dashboard/patients' },
  { label: 'Staff Scheduling', icon: FaUsers, path: '/dashboard/staff' },
  { label: 'Departments', icon: FaHospital, path: '/dashboard/departments' },
  { label: 'Equipment', icon: FaTools, path: '/dashboard/equipment' },
  { label: 'Resources', icon: FaBoxes, path: '/dashboard/resources' },
  { label: 'Operating Rooms', icon: FaProcedures, path: '/dashboard/operating-rooms' },
  { label: 'Supply Chain', icon: FaPills, path: '/dashboard/supplies' },
  { label: 'Emergency Capacity', icon: FaExclamationTriangle, path: '/dashboard/emergency' },
  { label: 'AI Insights', icon: FaBrain, path: '/dashboard/ai-insights' },
  { label: 'Advanced AI', icon: FaBrain, path: '/dashboard/advanced-ai' },
  { label: 'Analytics', icon: FaChartLine, path: '/dashboard/analytics' },
  { label: 'Bed Views', icon: FaBed, path: '/custom-views' },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'User';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const sidebarStyle = {
    width: collapsed ? '70px' : '260px',
    minHeight: '100vh',
    backgroundColor: '#0F172A',
    color: '#CBD5E1',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s ease',
    overflow: 'hidden',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 1000,
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'space-between',
    padding: '18px 16px',
    borderBottom: '1px solid #1E293B',
  };

  const logoStyle = {
    color: '#38BDF8',
    fontSize: '18px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    display: collapsed ? 'none' : 'block',
  };

  const toggleBtnStyle = {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  };

  const userSectionStyle = {
    padding: collapsed ? '12px 0' : '12px 16px',
    borderBottom: '1px solid #1E293B',
    textAlign: collapsed ? 'center' : 'left',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  };

  const userNameStyle = {
    color: '#E2E8F0',
    fontSize: '14px',
    fontWeight: '600',
    display: collapsed ? 'none' : 'block',
  };

  const userRoleStyle = {
    color: '#64748B',
    fontSize: '12px',
    display: collapsed ? 'none' : 'block',
  };

  const navStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0',
  };

  const linkBaseStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: collapsed ? '12px 0' : '10px 16px',
    justifyContent: collapsed ? 'center' : 'flex-start',
    color: '#94A3B8',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    borderLeft: '3px solid transparent',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  };

  const linkActiveStyle = {
    ...linkBaseStyle,
    color: '#38BDF8',
    backgroundColor: '#1E293B',
    borderLeftColor: '#38BDF8',
  };

  const iconStyle = {
    fontSize: '18px',
    minWidth: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const labelStyle = {
    marginLeft: '12px',
    display: collapsed ? 'none' : 'inline',
  };

  const logoutBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    padding: collapsed ? '14px 0' : '14px 16px',
    color: '#EF4444',
    background: 'none',
    border: 'none',
    borderTop: '1px solid #1E293B',
    cursor: 'pointer',
    fontSize: '14px',
    width: '100%',
    transition: 'background 0.2s ease',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={sidebarStyle}>
      <div style={headerStyle}>
        <span style={logoStyle}>Hospital Optimizer</span>
        <button style={toggleBtnStyle} onClick={() => setCollapsed(!collapsed)} title="Toggle sidebar">
          <FaBars />
        </button>
      </div>

      <div style={userSectionStyle}>
        <div style={userNameStyle}>{userName}</div>
        <div style={userRoleStyle}>Administrator</div>
      </div>

      <nav style={navStyle}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            style={({ isActive }) => isActive ? linkActiveStyle : linkBaseStyle}
            onMouseEnter={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = '#1E293B';
                e.currentTarget.style.color = '#E2E8F0';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#94A3B8';
              }
            }}
          >
            <span style={iconStyle}><item.icon /></span>
            <span style={labelStyle}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        style={logoutBtnStyle}
        onClick={handleLogout}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1E293B'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        <span style={iconStyle}><FaSignOutAlt /></span>
        <span style={labelStyle}>Logout</span>
      </button>
    </div>
  );
};

export default Sidebar;
