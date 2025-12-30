import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    
    // 1. Initialize user immediately to avoid layout shifts
    const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
    
    const [permissions, setPermissions] = useState([]); 
    const [loading, setLoading] = useState(true); // START AS TRUE

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        const fetchPerms = async () => {
            try {
                // Returns array: [{ RoleCode: 'ADM', DepartmentCode: 'FAC' }, ...]
                const data = await api.getPermissions(user.id);
                setPermissions(data);
            } catch (err) {
                console.error("Failed to load permissions");
            } finally {
                // 2. Only stop loading AFTER the API call finishes (success or fail)
                setLoading(false);
            }
        };
        fetchPerms();
    }, [navigate, user]);

    // Helper to check if user has ANY role in a specific department
    const hasAccess = (deptCode) => {
        if (!permissions || permissions.length === 0) return false;
        return permissions.some(p => p.DepartmentCode === deptCode);
    };

    const handleModuleClick = (mod) => {
        // 1. Check Access
        if (!hasAccess(mod.id)) {
            alert(`🔒 No Access to ${mod.name}. Contact your Admin.`);
            return;
        }

        // 2. Navigate based on Module ID
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
            
            {/* 3. Show Spinner Overlay while checking permissions */}
            {loading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                </div>
            )}

            <Navbar user={user} />
            <div className="dashboard-content">
                
                {/* Header Section */}
                <div className="dashboard-header">
                    <div className="header-title">
                        <h1>Hi, {user?.name?.split(' ')[0]}</h1>
                        <p>Welcome to <strong>WIKA {user?.location} Plant</strong></p>
                    </div>

                    {/* Admin Button */}
                    {user?.IsSystemAdmin && (
                        <button 
                            className="admin-btn"
                            onClick={() => navigate('/admin')}
                            title="System Admin"
                        >
                            ⚙️ <span>System Admin</span>
                        </button>
                    )}
                </div>
                
                {/* Modules Grid - Only render logic when NOT loading */}
                <div className="modules-grid">
                    {modules.map((mod) => {
                        // While loading, we assume "false" to prevent errors, but the overlay hides it anyway
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
                
                {/* 4. No Access Fallback: ONLY show if loading is false AND permissions are actually empty */}
                {!loading && permissions.length === 0 && (
                    <div className="no-access-msg">
                        <p>No modules assigned. Please contact your Plant Admin.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;