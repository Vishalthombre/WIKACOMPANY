import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// FIX: Correct Import Paths (../../)
import Navbar from '../../components/Navbar'; 
import { api } from '../../services/api';
import { hasRole } from '../../utils/roleHelper';

// Styles
import '../../styles/Facility.css';

// Sub-Components
import RaiserPanel from '../../components/facility/RaiserPanel';
import PlannerPanel from '../../components/facility/PlannerPanel';
import TechnicianPanel from '../../components/facility/TechnicianPanel';
import AdminPanel from '../../components/facility/AdminPanel';

const FacilityDashboard = () => {
    const navigate = useNavigate();
    
    // CHANGE 1: Load user immediately so UI renders behind the spinner
    const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
    
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true); // Start loading true
    
    // UI State
    const [activeTab, setActiveTab] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        const fetchPerms = async () => {
            try {
                // FIXED: API returns the array directly
                const data = await api.getPermissions(user.id);
                setRoles(data);
                
                // Auto-select first available role tab logic
                if (hasRole(data, 'FAC', 'ADM')) setActiveTab('admin');
                else if (hasRole(data, 'FAC', 'PLN')) setActiveTab('planner');
                else if (hasRole(data, 'FAC', 'TEC')) setActiveTab('technician');
                else if (hasRole(data, 'FAC', 'USR')) setActiveTab('raiser');
                else setActiveTab('no-access');
                
            } catch (err) {
                console.error("Error loading permissions");
            } finally {
                setLoading(false); // Stop spinner once data is ready
            }
        };
        fetchPerms();
    }, [navigate, user]);

    // Check roles for the 'FAC' (Facility) Department
    const isRaiser = hasRole(roles, 'FAC', 'USR');
    const isPlanner = hasRole(roles, 'FAC', 'PLN');
    const isTechnician = hasRole(roles, 'FAC', 'TEC');
    const isAdmin = hasRole(roles, 'FAC', 'ADM');

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
        setIsMenuOpen(false); // Close mobile menu on selection
    };

    if (activeTab === 'no-access' && !loading) {
        return <div className="no-access-msg">You do not have access to the Facility Module.</div>;
    }

    return (
        <div className="facility-wrapper">
            
            {/* CHANGE 2: Loading Overlay (Blur Effect) */}
            {loading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                </div>
            )}

            {/* --- DESKTOP NAV --- */}
            <div className="desktop-only-nav">
                <Navbar user={user} />
            </div>

            {/* --- MOBILE APP BAR --- */}
            <div className="mobile-app-bar">
                <button className="hamburger-btn" onClick={() => setIsMenuOpen(true)}>
                    ☰
                </button>
                <div className="mobile-title">Facility Dept.</div>
                <button className="mobile-back-btn" onClick={() => navigate('/dashboard')}>
                    Main Menu
                </button>
            </div>

            {/* --- MOBILE SIDE MENU (DRAWER) --- */}
            <div className={`mobile-menu-overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}></div>
            <div className={`mobile-menu-drawer ${isMenuOpen ? 'open' : ''}`}>
                <div className="drawer-header">
                    <h2>Facility Dept.</h2>
                    <p>WIKA {user?.location}</p>
                </div>
                <div className="drawer-items">
                    {isAdmin && (
                        <button className={`drawer-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => handleTabClick('admin')}>
                            📊 Admin Dashboard
                        </button>
                    )}
                    {isPlanner && (
                        <button className={`drawer-item ${activeTab === 'planner' ? 'active' : ''}`} onClick={() => handleTabClick('planner')}>
                            📅 Planner Board
                        </button>
                    )}
                    {isTechnician && (
                        <button className={`drawer-item ${activeTab === 'technician' ? 'active' : ''}`} onClick={() => handleTabClick('technician')}>
                            🛠️ Technician Tasks
                        </button>
                    )}
                    {isRaiser && (
                        <button className={`drawer-item ${activeTab === 'raiser' ? 'active' : ''}`} onClick={() => handleTabClick('raiser')}>
                            ➕ Raise Ticket
                        </button>
                    )}
                </div>
            </div>

            <div className="facility-content">
                
                {/* --- DESKTOP HERO HEADER --- */}
                <div className="facility-hero-header">
                    <div className="header-title-group">
                        <div className="header-icon">🏢</div>
                        <div className="header-text">
                            <h1>Facility Dept.</h1>
                            <p>Maintenance & Utility Management | {user?.location}</p>
                        </div>
                    </div>
                    <button className="btn-back" onClick={() => navigate('/dashboard')}>
                        &larr; Main Menu
                    </button>
                </div>

                {/* --- DESKTOP TABS --- */}
                <div className="desktop-tabs">
                    {isAdmin && (
                        <button 
                            className={`facility-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                            onClick={() => handleTabClick('admin')}
                        >
                            📊 Admin
                        </button>
                    )}
                    {isPlanner && (
                        <button 
                            className={`facility-tab-btn ${activeTab === 'planner' ? 'active' : ''}`}
                            onClick={() => handleTabClick('planner')}
                        >
                            📅 Planner
                        </button>
                    )}
                    {isTechnician && (
                        <button 
                            className={`facility-tab-btn ${activeTab === 'technician' ? 'active' : ''}`}
                            onClick={() => handleTabClick('technician')}
                        >
                            🛠️ Technician
                        </button>
                    )}
                    {isRaiser && (
                        <button 
                            className={`facility-tab-btn ${activeTab === 'raiser' ? 'active' : ''}`}
                            onClick={() => handleTabClick('raiser')}
                        >
                            ➕ Raise Ticket
                        </button>
                    )}
                </div>

                {/* --- DYNAMIC CONTENT --- */}
                <div className="tab-content-area">
                    {/* Only render content if we are not loading, to prevent data flicker */}
                    {!loading && (
                        <>
                            {activeTab === 'admin' && <AdminPanel />}
                            {activeTab === 'planner' && <PlannerPanel />}
                            {activeTab === 'technician' && <TechnicianPanel user={user} />}
                            {activeTab === 'raiser' && <RaiserPanel user={user} />}
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default FacilityDashboard;