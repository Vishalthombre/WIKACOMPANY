import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';

// 1. Auth & Main Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SystemAdmin from './pages/SystemAdmin';

// 2. Module Imports (All dashboards are now active)
import FacilityDashboard from './pages/modules/FacilityDashboard';
import BreakdownDashboard from './pages/modules/BreakdownDashboard';
import SafetyDashboard from './pages/modules/SafetyDashboard';
import KaizenDashboard from './pages/modules/KaizenDashboard';
import FiveSDashboard from './pages/modules/FiveSDashboard';

// Optional: Global Styles if you have them
// import './index.css'; 

function App() {
  return (
    <NotificationProvider>
    <Router>
      <Routes>
        {/* --- Authentication Routes --- */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* --- Main Application Routes --- */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<SystemAdmin />} />

        {/* --- Feature Modules --- */}
        {/* Note: In Dashboard.jsx, we navigate to these paths */}
        <Route path="/facility-dashboard" element={<FacilityDashboard />} />
        
        {/* Coming Soon Modules */}
        <Route path="/safety" element={<SafetyDashboard />} />
        <Route path="/breakdown" element={<BreakdownDashboard />} />
        <Route path="/kaizen" element={<KaizenDashboard />} />
        <Route path="/5s" element={<FiveSDashboard />} />
        
      </Routes>
    </Router>
    </NotificationProvider>
  );
}

export default App;