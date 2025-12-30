import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../../services/api';
import { hasRole } from '../../utils/roleHelper';

// Styles
import '../../styles/Facility.css';

// Sub-Components
import RaiserPanel from '../../components/facility/RaiserPanel';
import PlannerPanel from '../../components/facility/PlannerPanel';
import TechnicianPanel from '../../components/facility/TechnicianPanel';
import AdminPanel from '../../components/facility/AdminPanel';

// --- ICONS ---
const BackIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);

const MenuIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
);

const FacilityDashboard = () => {
    const navigate = useNavigate();
    
    // Load user
    const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
    
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true); 
    
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
                const data = await api.getPermissions(user.id);
                setRoles(data);
                
                if (hasRole(data, 'FAC', 'ADM')) setActiveTab('admin');
                else if (hasRole(data, 'FAC', 'PLN')) setActiveTab('planner');
                else if (hasRole(data, 'FAC', 'TEC')) setActiveTab('technician');
                else if (hasRole(data, 'FAC', 'USR')) setActiveTab('raiser');
                else setActiveTab('no-access');
                
            } catch (err) {
                console.error("Error loading permissions");
            } finally {
                setLoading(false); 
            }
        };
        fetchPerms();
    }, [navigate, user]);

    const isRaiser = hasRole(roles, 'FAC', 'USR');
    const isPlanner = hasRole(roles, 'FAC', 'PLN');
    const isTechnician = hasRole(roles, 'FAC', 'TEC');
    const isAdmin = hasRole(roles, 'FAC', 'ADM');

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
        setIsMenuOpen(false); 
    };

    if (activeTab === 'no-access' && !loading) {
        return <div className="no-access-msg">You do not have access to the Facility Module.</div>;
    }

    return (
        <div className="facility-wrapper" style={{ background: '#f4f7fa', minHeight: '100vh' }}>
            
            {/* CSS FIXES */}
            <style>{`
                /* 1. RESET BODY MARGIN TO REMOVE TOP GAP */
                body, html { margin: 0; padding: 0; }

                /* Default: Hide Hamburger on Desktop */
                .hamburger-trigger { display: none; }
                .btn-text { display: inline; }

                /* Mobile Adjustments */
                @media (max-width: 768px) {
                    .hamburger-trigger { display: block !important; margin-right: 15px; background: none; border: none; color: white; cursor: pointer; }
                    .responsive-navbar { padding: 0 15px !important; height: 60px !important; }
                    .brand-title { font-size: 1.1rem !important; }
                    .brand-sub { font-size: 0.65rem !important; }
                    .btn-text { display: none; }
                    .back-btn-responsive { padding: 8px !important; }
                    
                    /* Slider Header Size */
                    .drawer-header {
                        height: 60px !important;
                        padding: 0 20px !important;
                        display: flex !important;
                        flex-direction: row !important;
                        align-items: center !important;
                        justify-content: space-between !important;
                        background: #003399 !important;
                        margin-bottom: 0 !important;
                    }
                    .drawer-header h2 { margin: 0 !important; font-size: 1.2rem !important; color: white !important; }
                    .drawer-header p { display: none !important; }
                }
            `}</style>

            {loading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                </div>
            )}

            {/* --- RESPONSIVE NAVBAR (STICKY) --- */}
            <div className="responsive-navbar" style={styles.navbar}>
                
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button className="hamburger-trigger" onClick={() => setIsMenuOpen(true)}>
                        <MenuIcon />
                    </button>

                    <div style={styles.brand}>
                        <div className="brand-title" style={styles.logoPlain}>
                            FACILITY DEPT
                        </div>
                        <div className="brand-sub" style={styles.subText}>{user?.location || 'Maintenance'}</div>
                    </div>
                </div>

                <div>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        style={styles.backBtn}
                        className="back-btn-responsive btn-hover"
                    >
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                            <BackIcon />
                            <span className="btn-text" style={{ marginLeft: '8px' }}>Main Menu</span>
                        </span>
                    </button>
                </div>
            </div>

            {/* --- SLIDER MENU (DRAWER) --- */}
            <div className={`mobile-menu-overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}></div>
            <div className={`mobile-menu-drawer ${isMenuOpen ? 'open' : ''}`}>
                
                <div className="drawer-header">
                    <h2>Facility Menu</h2>
                    <button 
                        onClick={() => setIsMenuOpen(false)} 
                        style={{ background:'none', border:'none', color:'white', fontSize:'1.5rem', cursor:'pointer' }}
                    >
                        &times;
                    </button>
                </div>

                <div className="drawer-items">
                    {isAdmin && <button className={`drawer-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => handleTabClick('admin')}>📊 Admin Dashboard</button>}
                    {isPlanner && <button className={`drawer-item ${activeTab === 'planner' ? 'active' : ''}`} onClick={() => handleTabClick('planner')}>📅 Planner Board</button>}
                    {isTechnician && <button className={`drawer-item ${activeTab === 'technician' ? 'active' : ''}`} onClick={() => handleTabClick('technician')}>🛠️ Technician Tasks</button>}
                    {isRaiser && <button className={`drawer-item ${activeTab === 'raiser' ? 'active' : ''}`} onClick={() => handleTabClick('raiser')}>➕ Raise Ticket</button>}
                </div>
            </div>

            <div className="facility-content" style={{ marginTop: '20px' }}>
                <div className="desktop-tabs">
                    {isAdmin && <button className={`facility-tab-btn ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => handleTabClick('admin')}>📊 Admin</button>}
                    {isPlanner && <button className={`facility-tab-btn ${activeTab === 'planner' ? 'active' : ''}`} onClick={() => handleTabClick('planner')}>📅 Planner</button>}
                    {isTechnician && <button className={`facility-tab-btn ${activeTab === 'technician' ? 'active' : ''}`} onClick={() => handleTabClick('technician')}>🛠️ Technician</button>}
                    {isRaiser && <button className={`facility-tab-btn ${activeTab === 'raiser' ? 'active' : ''}`} onClick={() => handleTabClick('raiser')}>➕ Raise Ticket</button>}
                </div>

                <div className="tab-content-area">
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

// --- STYLES ---
const styles = {
    navbar: {
        // ✅ STICKY & NO GAP FIX
        position: 'sticky',
        top: 0,
        margin: 0, // Force no margin
        zIndex: 1000,
        
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 30px', height: '70px',
        background: 'linear-gradient(135deg, #001a4d 0%, #003399 100%)', 
        color: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        marginBottom: '20px'
    },
    
    brand: { display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    
    logoPlain: { 
        fontFamily: 'Poppins, sans-serif', 
        fontWeight: '700', 
        fontSize: '1.5rem', 
        color: 'white', 
        letterSpacing: '1px',
        textTransform: 'uppercase',
        lineHeight: 1
    },
    
    subText: { 
        fontSize: '0.75rem', opacity: 0.8, fontWeight: '500', 
        letterSpacing: '2px', textTransform: 'uppercase', marginTop: '4px'
    },

    backBtn: {
        display: 'flex', alignItems: 'center',
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: '600',
        transition: 'all 0.2s ease',
        backdropFilter: 'blur(5px)'
    }
};

export default FacilityDashboard;