import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    
    // 1. Initialize user
    const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
    
    const [permissions, setPermissions] = useState([]); 
    const [loading, setLoading] = useState(true);

    // --- ADMIN CHECK ---
    const checkIsAdmin = (u) => {
        if (!u) return false;
        const val = u.IsSystemAdmin ?? u.isSystemAdmin ?? u.IsAdmin ?? u.isAdmin;
        if (val === 1 || val === '1' || val === true || val === 'true') return true;
        if (u.name && u.name.toLowerCase().includes('admin')) return true;
        return false;
    };
    const isSystemAdmin = checkIsAdmin(user);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        const fetchPerms = async () => {
            try {
                const data = await api.getPermissions(user.id);
                setPermissions(data);
            } catch (err) {
                console.error("Failed to load permissions");
            } finally {
                setLoading(false);
            }
        };
        fetchPerms();
    }, [navigate, user]);

    const hasAccess = (deptCode) => {
        if (!permissions || permissions.length === 0) return false;
        return permissions.some(p => p.DepartmentCode === deptCode);
    };

    const handleModuleClick = (mod) => {
        if (!hasAccess(mod.id)) {
            alert(`🔒 No Access to ${mod.name}. Contact your Admin.`);
            return;
        }
        if (mod.id === 'FAC') navigate('/facility-dashboard');
        else if (mod.id === 'SAF') navigate('/safety');
        else if (mod.id === 'BRK') navigate('/breakdown');
        else if (mod.id === 'KZN') navigate('/kaizen');
        else if (mod.id === '5S')  navigate('/5s');
    };

    const modules = [
        { id: 'FAC', name: 'Facility', icon: '🏢', color: '#003399' },
        { id: 'SAF', name: 'Safety', icon: '🦺', color: '#d32f2f' },
        { id: 'BRK', name: 'Breakdown', icon: '⚙️', color: '#f57c00' },
        { id: 'KZN', name: 'Kaizen', icon: '💡', color: '#388e3c' },
        { id: '5S',  name: '5S Audit', icon: '🧹', color: '#7b1fa2' },
    ];

    return (
        <div className="dashboard-wrapper"> 
            
            {/* CSS for Header Alignment */}
            <style>{`
                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                }

                .admin-btn-responsive {
                    background: #333;
                    color: white;
                    padding: 10px 15px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    transition: background 0.2s;
                    white-space: nowrap; /* Prevent text wrapping */
                }
                
                .admin-btn-responsive:hover {
                    background: #555;
                }

                /* Mobile Adjustment */
                @media (max-width: 768px) {
                    .dashboard-header {
                        flex-direction: column; /* Stack items vertically */
                        align-items: flex-start; /* Align left */
                        gap: 15px; /* Space between title and button */
                    }
                    
                    .admin-btn-responsive {
                        width: 100%; /* Full width button on mobile */
                        justify-content: center; /* Center text inside button */
                        padding: 12px;
                    }

                    .header-title h1 {
                        font-size: 1.5rem; /* Slightly smaller font */
                    }
                }
            `}</style>

            {loading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                </div>
            )}

            <Navbar user={user} />
            
            <div className="dashboard-content">
                
                {/* --- HEADER --- */}
                <div className="dashboard-header">
                    <div className="header-title">
                        <h1 style={{margin:0, color:'#003399'}}>Hi, {user?.name?.split(' ')[0]}</h1>
                        <p style={{margin:'5px 0 0 0', color:'#666'}}>Welcome to <strong>WIKA {user?.location} Plant</strong></p>
                    </div>

                    {/* System Admin Button */}
                    {isSystemAdmin && (
                        <button 
                            className="admin-btn-responsive"
                            onClick={() => navigate('/admin')}
                        >
                            ⚙️ System Admin
                        </button>
                    )}
                </div>
                
                {/* --- MODULES GRID --- */}
                <div className="modules-grid">
                    {modules.map((mod) => {
                        const accessible = loading ? false : hasAccess(mod.id);
                        return (
                            <div 
                                key={mod.id} 
                                className={`module-card ${accessible ? '' : 'locked'}`} 
                                onClick={() => handleModuleClick(mod)}
                                style={{
                                    borderTop: accessible ? `4px solid ${mod.color}` : '4px solid #ccc',
                                    opacity: accessible ? 1 : 0.6
                                }}
                            >
                                <div className="card-icon">{mod.icon}</div>
                                <h3>{mod.name}</h3>
                                {accessible ? (
                                    <div className="enter-text" style={{color: mod.color}}>
                                        Open →
                                    </div>
                                ) : (
                                    <div className="enter-text" style={{color: '#999'}}>🔒 Locked</div>
                                )}
                            </div>
                        );
                    })}
                </div>
                
                {!loading && permissions.length === 0 && !isSystemAdmin && (
                    <div className="no-access-msg">
                        <p>No modules assigned. Please contact your Plant Admin.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;