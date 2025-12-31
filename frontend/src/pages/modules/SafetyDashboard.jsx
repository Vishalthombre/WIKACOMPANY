import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api'; // General Auth API
import { hasRole } from '../../utils/roleHelper';

// Sub-Components
import SafetyRaiser from '../../components/safety/SafetyRaiser';
import SafetyPlanner from '../../components/safety/SafetyPlanner';
import SafetyTechnician from '../../components/safety/SafetyTechnician';
import SafetyAdmin from '../../components/safety/SafetyAdmin';

// Reusing Facility Layout CSS for consistency
import '../../styles/Facility.css'; 

const SafetyDashboard = () => {
    const navigate = useNavigate();
    const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
    const [roles, setRoles] = useState([]);
    const [activeTab, setActiveTab] = useState('');
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false); 

    useEffect(() => {
        if (!user) { navigate('/login'); return; }

        const fetchPerms = async () => {
            try {
                const data = await api.getPermissions(user.id);
                setRoles(data);
                
                // Priority Logic for default tab
                if (hasRole(data, 'SAF', 'ADM')) setActiveTab('admin');
                else if (hasRole(data, 'SAF', 'PLN')) setActiveTab('planner');
                else if (hasRole(data, 'SAF', 'TEC')) setActiveTab('technician');
                else if (hasRole(data, 'SAF', 'USR')) setActiveTab('raiser');
                else setActiveTab('no-access');

            } catch (err) {
                console.error("Error loading safety permissions", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPerms();
    }, [user, navigate]);

    const isAdmin = hasRole(roles, 'SAF', 'ADM');
    const isPlanner = hasRole(roles, 'SAF', 'PLN');
    const isTechnician = hasRole(roles, 'SAF', 'TEC');
    const isRaiser = hasRole(roles, 'SAF', 'USR');

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        setIsMenuOpen(false);
    };

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;
    if (activeTab === 'no-access') return (
        <div className="no-access-msg">
            <h2>⛔ Access Denied</h2>
            <p>You do not have permission to view the Safety Module.</p>
            <button onClick={() => navigate('/dashboard')} className="back-btn">Go Back</button>
        </div>
    );

    return (
        // Changed background to a clean, neutral light grey
        <div className="facility-wrapper" style={{background: '#f8fafc', minHeight: '100vh'}}>
            
            {/* --- SAFETY NAVBAR (Professional Deep Slate) --- */}
            <div className="responsive-navbar" style={styles.navbar}>
                <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                    
                    {/* Mobile Hamburger */}
                    <button className="hamburger-trigger" onClick={() => setIsMenuOpen(true)} style={styles.hamburger}>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>

                    <div style={{display:'flex', flexDirection:'column'}}>
                        <div style={styles.brandTitle}>SAFETY</div>
                        <div style={styles.brandSub}>WIKA {user?.location}</div>
                    </div>
                </div>
                
                <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
                    Main Menu
                </button>
            </div>

            {/* --- MOBILE DRAWER --- */}
            <div className={`mobile-menu-overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}></div>
            <div className={`mobile-menu-drawer ${isMenuOpen ? 'open' : ''}`}>
                
                {/* Drawer Header matching new theme */}
                <div className="drawer-header" style={{background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px'}}>
                    {/* Changed Text to just "SAFETY" to save space */}
                    <h2 style={{margin:0, color:'white', fontSize:'1.2rem'}}>SAFETY</h2>
                    <button onClick={() => setIsMenuOpen(false)} style={styles.closeBtn}>&times;</button>
                </div>

                <div className="drawer-items">
                    {isAdmin && <button className={`drawer-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => handleTabClick('admin')}>🛡️ Admin Dashboard</button>}
                    {isPlanner && <button className={`drawer-item ${activeTab === 'planner' ? 'active' : ''}`} onClick={() => handleTabClick('planner')}>📅 Planner Board</button>}
                    {isTechnician && <button className={`drawer-item ${activeTab === 'technician' ? 'active' : ''}`} onClick={() => handleTabClick('technician')}>⛑️ My Tasks</button>}
                    {isRaiser && <button className={`drawer-item ${activeTab === 'raiser' ? 'active' : ''}`} onClick={() => handleTabClick('raiser')}>📸 Raise Ticket</button>}
                </div>
            </div>

            <div className="facility-content">
                {/* --- DESKTOP TABS --- */}
                <div className="desktop-tabs">
                    {isAdmin && (
                        <button 
                            className={`facility-tab-btn ${activeTab === 'admin' ? 'active-safety' : ''}`} 
                            onClick={() => setActiveTab('admin')}
                        >
                            🛡️ Admin
                        </button>
                    )}
                    {isPlanner && (
                        <button 
                            className={`facility-tab-btn ${activeTab === 'planner' ? 'active-safety' : ''}`} 
                            onClick={() => setActiveTab('planner')}
                        >
                            📅 Planner
                        </button>
                    )}
                    {isTechnician && (
                        <button 
                            className={`facility-tab-btn ${activeTab === 'technician' ? 'active-safety' : ''}`} 
                            onClick={() => setActiveTab('technician')}
                        >
                            ⛑️ Technician
                        </button>
                    )}
                    {isRaiser && (
                        <button 
                            className={`facility-tab-btn ${activeTab === 'raiser' ? 'active-safety' : ''}`} 
                            onClick={() => setActiveTab('raiser')}
                        >
                            📸 Raise Ticket
                        </button>
                    )}
                </div>

                {/* --- DYNAMIC CSS FOR NEW THEME --- */}
                <style>{`
                    /* Active Tab Style - Softer Brick/Rose Color */
                    .facility-tab-btn.active-safety {
                        border-bottom: 3px solid #e11d48 !important;
                        color: #e11d48 !important;
                        background: rgba(225, 29, 72, 0.04);
                    }
                    .facility-tab-btn:hover {
                        color: #e11d48;
                    }
                    
                    /* Drawer Active Item */
                    .drawer-item.active {
                        background: #f1f5f9 !important;
                        color: #0f172a !important; /* Dark Text */
                        border-left: 4px solid #e11d48 !important;
                        font-weight: 600;
                    }
                `}</style>

                {/* --- CONTENT AREA --- */}
                <div className="tab-content-area" style={{animation: 'fadeIn 0.3s ease-in'}}>
                    {activeTab === 'raiser' && <SafetyRaiser user={user} />}
                    {activeTab === 'planner' && <SafetyPlanner user={user} />}
                    {activeTab === 'technician' && <SafetyTechnician user={user} />}
                    {activeTab === 'admin' && <SafetyAdmin user={user} />}
                </div>
            </div>
        </div>
    );
};

const styles = {
    navbar: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 20px', height: '65px', color: 'white',
        // New Professional Gradient: Deep Slate Blue (Calming & Professional)
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)', 
        position: 'sticky', top: 0, zIndex: 100
    },
    hamburger: {
        background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 0, display: 'flex'
    },
    brandTitle: { 
        fontWeight: '700', fontSize: '1.2rem', letterSpacing: '0.8px', textShadow: '0 1px 2px rgba(0,0,0,0.2)' 
    },
    brandSub: { 
        fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '400', marginTop: '-2px'
    },
    backBtn: { 
        background: 'rgba(255,255,255,0.1)', 
        border: '1px solid rgba(255,255,255,0.2)', 
        color: 'white', 
        padding: '8px 16px', 
        borderRadius: '6px', 
        cursor: 'pointer', 
        fontWeight:'500',
        fontSize: '0.85rem',
        transition: 'all 0.2s ease',
    },
    closeBtn: {
        background: 'transparent', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer', lineHeight: '0.8', padding: '0'
    }
};

export default SafetyDashboard;