import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 40%, #14B8A6 70%, #5EEAD4 100%)',
    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
    padding: '20px',
  },
  card: {
    background: '#FFFFFF',
    borderRadius: '20px',
    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '420px',
    position: 'relative',
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #0F766E, #14B8A6, #5EEAD4)',
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '32px',
  },
  logoIcon: {
    width: '64px',
    height: '64px',
    background: 'linear-gradient(135deg, #0F766E, #14B8A6)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
    boxShadow: '0 8px 24px rgba(15, 118, 110, 0.3)',
  },
  logoSvg: {
    width: '36px',
    height: '36px',
    color: '#FFFFFF',
  },
  appName: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0F766E',
    margin: '0 0 4px 0',
    textAlign: 'center',
    letterSpacing: '-0.3px',
  },
  appSubtitle: {
    fontSize: '13px',
    color: '#6B7280',
    margin: 0,
    textAlign: 'center',
    fontWeight: '400',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 24px 0',
    textAlign: 'center',
  },
  fieldGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px',
    letterSpacing: '0.2px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #E5E7EB',
    borderRadius: '10px',
    fontSize: '15px',
    color: '#111827',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
    background: '#F9FAFB',
  },
  inputFocus: {
    borderColor: '#0F766E',
    boxShadow: '0 0 0 3px rgba(15, 118, 110, 0.1)',
    background: '#FFFFFF',
  },
  loginButton: {
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg, #0F766E, #0D9488)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 4px 14px rgba(15, 118, 110, 0.35)',
    letterSpacing: '0.3px',
    marginTop: '4px',
  },
  loginButtonHover: {
    transform: 'translateY(-1px)',
    boxShadow: '0 6px 20px rgba(15, 118, 110, 0.45)',
  },
  loginButtonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
    transform: 'none',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '20px 0',
    gap: '12px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: '#E5E7EB',
  },
  dividerText: {
    fontSize: '12px',
    color: '#9CA3AF',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  quickLoginButton: {
    width: '100%',
    padding: '12px',
    background: '#F0FDFA',
    color: '#0F766E',
    border: '2px solid #99F6E4',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s, border-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  quickLoginButtonHover: {
    background: '#CCFBF1',
    borderColor: '#5EEAD4',
  },
  errorBox: {
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  errorText: {
    fontSize: '13px',
    color: '#DC2626',
    margin: 0,
    fontWeight: '500',
  },
  footer: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '12px',
    color: '#9CA3AF',
  },
};

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);

  const handleQuickLogin = () => {
    setEmail('admin@hospital.com');
    setPassword('admin123');
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userName', data.user?.name || data.user?.email || 'Admin');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.cardAccent} />

        <div style={styles.logoContainer}>
          <div style={styles.logoIcon}>
            <svg
              style={styles.logoSvg}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 21h18M9 8h6M12 8v8M9 12h6M4 21V10a1 1 0 0 1 .553-.894l7-3.5a1 1 0 0 1 .894 0l7 3.5A1 1 0 0 1 20 10v11" />
            </svg>
          </div>
          <h1 style={styles.appName}>AI Hospital Bed &amp; Resource Optimizer</h1>
          <p style={styles.appSubtitle}>Intelligent Healthcare Resource Management</p>
        </div>

        <h2 style={styles.title}>Sign in to your account</h2>

        {error && (
          <div style={styles.errorBox}>
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="#DC2626"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              placeholder="you@hospital.com"
              required
              style={{
                ...styles.input,
                ...(focusedField === 'email' ? styles.inputFocus : {}),
              }}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              placeholder="Enter your password"
              required
              style={{
                ...styles.input,
                ...(focusedField === 'password' ? styles.inputFocus : {}),
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            onMouseEnter={() => setHoveredButton('login')}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              ...styles.loginButton,
              ...(hoveredButton === 'login' && !loading ? styles.loginButtonHover : {}),
              ...(loading ? styles.loginButtonDisabled : {}),
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        <button
          type="button"
          onClick={handleQuickLogin}
          onMouseEnter={() => setHoveredButton('quick')}
          onMouseLeave={() => setHoveredButton(null)}
          style={{
            ...styles.quickLoginButton,
            ...(hoveredButton === 'quick' ? styles.quickLoginButtonHover : {}),
          }}
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          Quick Login (Demo Credentials)
        </button>

        <p style={styles.footer}>
          Secure access for authorized hospital personnel only.
        </p>
      </div>
    </div>
  );
}

export default Login;
