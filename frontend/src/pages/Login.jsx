import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
// Ensure this CSS file exists or remove the import if using inline styles
import '../styles/Auth.css'; 
import InstallButton from '../components/InstallButton';

const Login = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ globalId: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.login(credentials);

      if (result.success) {
        localStorage.setItem('user', JSON.stringify(result.data.user));
        navigate('/dashboard');
      } else {
        // Handle specific "Not Activated" case
        if (result.message === "Account Not Activated") {
             setError(
                <span>
                    Account not activated. <Link to="/register" style={{color: '#fff', textDecoration: 'underline'}}>Activate here</Link>
                </span>
             );
        } else {
             setError(result.message);
        }
      }
    } catch (err) {
      setError("Server connection failed. Please check network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      
      {/* --- NEW: Loading Overlay (Blur Effect) --- */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}

      <div className="auth-card">
        {/* Branding Header */}
        <h1 className="auth-title">WIKA<span>Maint</span></h1>
        <p className="auth-subtitle">Sign in to your account</p>

        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Global ID</label>
            <input 
              type="text" 
              placeholder="e.g. G001234" 
              required
              value={credentials.globalId}
              onChange={(e) => setCredentials({...credentials, globalId: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              required
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            />
          </div>

          {/* Note: We don't strictly need 'disabled={loading}' here because the 
             overlay sits on top and blocks clicks, but it's good practice. 
          */}
          <button type="submit" className="action-btn-primary auth-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          First time here? <Link to="/register" className="auth-link">Activate Account</Link>
        </div>
      </div>
      <InstallButton />
    </div>
  );
};

export default Login;