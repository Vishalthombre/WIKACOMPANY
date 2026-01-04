import React from 'react'; // Removed useEffect import since we don't need it
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';

// 1. Auth & Main Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SystemAdmin from './pages/SystemAdmin';
import MobileFooter from './components/MobileFooter';

// 2. Module Imports
import FacilityDashboard from './pages/modules/FacilityDashboard';
import BreakdownDashboard from './pages/modules/BreakdownDashboard';
import SafetyDashboard from './pages/modules/SafetyDashboard';
import KaizenDashboard from './pages/modules/KaizenDashboard';
import FiveSDashboard from './pages/modules/FiveSDashboard';

// --- REMOVED THE usePreventZoom HOOK --- 
// This allows Desktop Chrome users to zoom if they want to.

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
          <Route path="/facility-dashboard" element={<FacilityDashboard />} />
          <Route path="/safety" element={<SafetyDashboard />} />
          <Route path="/breakdown" element={<BreakdownDashboard />} />
          <Route path="/kaizen" element={<KaizenDashboard />} />
          <Route path="/5s" element={<FiveSDashboard />} />
          
        </Routes>
        <MobileFooter />
      </Router>
    </NotificationProvider>
  );
}

export default App;