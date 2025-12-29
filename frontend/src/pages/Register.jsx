import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../styles/Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const [globalId, setGlobalId] = useState('');
  const [userData, setUserData] = useState(null); // Stores fetched name/email
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Verify ID and Fetch User Details
  const handleVerify = async () => {
    if(!globalId) return setError("Please enter your ID");
    
    setLoading(true);
    setError('');

    try {
      // Backend now supports this via /api/auth/verify
      const data = await api.verifyID(globalId);
      
      if (data && data.Name) {
        setUserData(data); // Show the user who they are activating
      } else {
        setError("Global ID not found or server error.");
      }
    } catch (err) {
      // api.js might throw an error or return undefined if 404
      setError("ID not found or account already active.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Set Password
  const handleActivate = async () => {
    if(!password) return setError("Please set a password");
    if(password.length < 5) return setError("Password must be at least 5 chars");
    
    try {
      await api.activate({ globalId, password });
      alert("✅ Account Activated Successfully! Redirecting to Login...");
      navigate('/login');
    } catch (err) {
      setError("Activation failed. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Activate<span>Account</span></h1>
        <p className="auth-subtitle">Verify your identity to proceed</p>

        {error && <div className="error-msg">{error}</div>}

        {!userData ? (
          // STEP 1: VERIFY ID
          <div>
            <div className="form-group">
              <label>Enter Global ID</label>
              <input 
                type="text" 
                placeholder="e.g. G001234" 
                value={globalId}
                onChange={(e) => setGlobalId(e.target.value)}
              />
            </div>
            <button 
              className="action-btn-primary auth-btn" 
              onClick={handleVerify}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify ID"}
            </button>
          </div>
        ) : (
          // STEP 2: SET PASSWORD
          <div className="fade-in">
            <div className="user-preview" style={{background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem'}}>
              <p style={{margin: '5px 0'}}><strong>Name:</strong> {userData.Name}</p>
              <p style={{margin: '5px 0'}}><strong>Email:</strong> {userData.Email}</p>
              <p style={{margin: '5px 0'}}><strong>Location:</strong> {userData.Location}</p>
            </div>

            <div className="form-group">
              <label>Create New Password</label>
              <input 
                type="password" 
                placeholder="Set a strong password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className="action-btn-primary auth-btn" onClick={handleActivate}>
              Activate Account
            </button>
          </div>
        )}
        
        <div className="auth-footer">
          <Link to="/login" className="auth-link">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;