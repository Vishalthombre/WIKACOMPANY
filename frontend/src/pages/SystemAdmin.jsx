import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { adminApi } from '../services/api';
import { useNotification } from '../context/NotificationContext';

const SystemAdmin = () => {
    const navigate = useNavigate();
    const { notify } = useNotification();
    
    const user = JSON.parse(localStorage.getItem('user'));

    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isClosing, setIsClosing] = useState(false);
    
    // UI State
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [pageLoading, setPageLoading] = useState(true); 
    const [actionLoading, setActionLoading] = useState(false);

    const [newEmp, setNewEmp] = useState({ 
        GlobalID: '', Name: '', Email: '', Location: user?.location || '' 
    });

    const depts = [
        { code: 'FAC', name: 'Facility' },
        { code: 'SAF', name: 'Safety' },
        { code: 'BRK', name: 'Breakdown' },
        { code: 'KZN', name: 'Kaizen' },
        { code: '5S',  name: '5S' }
    ];

    const roles = [
        { code: 'ADM', name: 'Admin', color: '#E53935', bg: '#FFEBEE' },
        { code: 'PLN', name: 'Planner', color: '#FB8C00', bg: '#FFF3E0' },
        { code: 'TEC', name: 'Technician', color: '#43A047', bg: '#E8F5E9' },
        { code: 'USR', name: 'Raiser', color: '#1E88E5', bg: '#E3F2FD' }
    ];

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        
        loadEmployees();

        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const loadEmployees = async () => {
        setPageLoading(true); 
        try {
            const data = await adminApi.getEmployees(user.id);
            const formattedData = data.map(u => ({
                ...u,
                GlobalID: u.GlobalID || u.id,
                Name: u.Name || u.name || 'Unknown',
                Email: u.Email || u.email || 'No Email',
                Location: u.Location || u.location || '',
                roles: u.roles || []
            }));
            setEmployees(formattedData);
        } catch (error) {
            console.error("Failed to load employees");
            notify("Failed to load employee list", "error");
        } finally {
            setPageLoading(false); 
        }
    };

    const filteredEmployees = employees.filter(emp => 
        (emp.Name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (emp.GlobalID || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        setActionLoading(true); 
        try {
            const res = await adminApi.addEmployee({
                globalId: newEmp.GlobalID,
                name: newEmp.Name,
                email: newEmp.Email,
                location: user.location 
            });
            if(res.message) notify(res.message, "success");
            closeModal();
            loadEmployees();
        } catch (err) {
            notify("Failed to add employee. ID might already exist.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const toggleRole = (deptCode, roleCode) => {
        if (!editingUser) return;
        const exists = editingUser.roles.find(r => r.DepartmentCode === deptCode && r.RoleCode === roleCode);
        let updatedRoles;
        if (exists) {
            updatedRoles = editingUser.roles.filter(r => !(r.DepartmentCode === deptCode && r.RoleCode === roleCode));
        } else {
            updatedRoles = [...editingUser.roles, { GlobalID: editingUser.GlobalID, DepartmentCode: deptCode, RoleCode: roleCode }];
        }
        setEditingUser({ ...editingUser, roles: updatedRoles });
    };

    const saveAccess = async () => {
        setActionLoading(true); 
        try {
            await adminApi.updateAccess({ globalId: editingUser.GlobalID, roles: editingUser.roles });
            notify("Permissions Updated Successfully!", "success");
            closeModal();
            loadEmployees();
        } catch (err) {
            notify("Failed to save permissions", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const closeModal = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShowAddModal(false);
            setEditingUser(null);
            setIsClosing(false);
            setNewEmp({ GlobalID: '', Name: '', Email: '', Location: user?.location || '' });
        }, 300);
    };

    if (!user) return null;

    return (
        <div style={styles.dashboardWrapper}>
            <Navbar user={user} />
            
            <div style={styles.dashboardContent}>
                
                {/* --- HEADER --- */}
                <div style={styles.topBar}>
                    <div style={styles.titleGroup}>
                        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
                            &larr; <span style={{display: isMobile ? 'none' : 'inline'}}>Main Menu</span>
                        </button>
                        <div>
                            <h1 style={styles.pageTitle}>{isMobile ? 'Admin' : 'System Admin'}</h1>
                            {!isMobile && <p style={styles.subTitle}>Manage users for <strong>{user.location}</strong></p>}
                        </div>
                    </div>
                    <button className="action-btn-primary" onClick={() => setShowAddModal(true)} style={styles.addBtn}>
                        {isMobile ? '+ Add' : '+ Add Employee'}
                    </button>
                </div>

                <div style={styles.card}>
                    {/* Page Loader */}
                    {pageLoading && (
                        <div className="loading-overlay" style={styles.loaderOverlay}>
                            <div className="spinner" style={{width:'40px', height:'40px'}}></div>
                        </div>
                    )}

                    {/* Card/Table Header */}
                    <div style={styles.cardHeader}>
                        <div style={styles.searchContainer}>
                            <input 
                                style={styles.searchInput}
                                placeholder="🔍 Search Name or ID..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div style={styles.countBadge}>
                            {filteredEmployees.length} {isMobile ? 'Users' : 'Employees Found'}
                        </div>
                    </div>
                    
                    {/* --- RESPONSIVE LIST --- */}
                    <div style={styles.listContainer}>
                        {filteredEmployees.length === 0 && !pageLoading ? (
                            <div style={styles.emptyState}>No users found.</div>
                        ) : (
                            isMobile ? (
                                // --- MOBILE CARD VIEW (No Horizontal Scroll) ---
                                <div style={styles.mobileGrid}>
                                    {filteredEmployees.map(emp => (
                                        <div key={emp.GlobalID} style={styles.mobileCard}>
                                            <div style={styles.mobileCardTop}>
                                                <div style={styles.avatarSmall}>{(emp.Name || '?').charAt(0)}</div>
                                                <div style={{flex:1}}>
                                                    <div style={{fontWeight:'700', color:'#333'}}>{emp.Name}</div>
                                                    <div style={{fontSize:'0.85rem', color:'#666'}}>{emp.GlobalID}</div>
                                                </div>
                                                <button onClick={() => setEditingUser(emp)} style={styles.btnIconEdit}>
                                                    ⚙️
                                                </button>
                                            </div>
                                            
                                            <div style={styles.mobileCardRoles}>
                                                {emp.roles.length > 0 ? (
                                                    emp.roles.slice(0, 4).map((r, i) => {
                                                        const roleMeta = roles.find(rm => rm.code === r.RoleCode) || {};
                                                        return (
                                                            <span key={i} style={{...styles.roleTag, backgroundColor: roleMeta.bg, color: roleMeta.color}}>
                                                                {r.DepartmentCode}-{r.RoleCode}
                                                            </span>
                                                        );
                                                    })
                                                ) : <span style={{color:'#999', fontSize:'0.8rem', fontStyle:'italic'}}>No Roles</span>}
                                                {emp.roles.length > 4 && <span style={styles.moreTag}>+{emp.roles.length - 4}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                // --- DESKTOP TABLE VIEW ---
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Global ID</th>
                                            <th style={styles.th}>Name</th>
                                            <th style={styles.th}>Email</th>
                                            <th style={styles.th}>Assigned Roles</th>
                                            <th style={styles.th}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEmployees.map(emp => (
                                            <tr key={emp.GlobalID} style={styles.tr}>
                                                <td style={styles.td}><strong>{emp.GlobalID}</strong></td>
                                                <td style={styles.td}>
                                                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                                        <div style={styles.avatar}>{(emp.Name || '?').charAt(0)}</div>
                                                        {emp.Name}
                                                    </div>
                                                </td>
                                                <td style={styles.td} style={{color:'#666'}}>{emp.Email}</td>
                                                <td style={styles.td}>
                                                    <div style={{display:'flex', gap:'5px', flexWrap:'wrap'}}>
                                                        {emp.roles.length > 0 ? (
                                                            emp.roles.map((r, i) => {
                                                                const roleMeta = roles.find(rm => rm.code === r.RoleCode) || {};
                                                                return (
                                                                    <span key={i} style={{...styles.roleTag, backgroundColor: roleMeta.bg, color: roleMeta.color}}>
                                                                        {r.DepartmentCode}-{r.RoleCode}
                                                                    </span>
                                                                );
                                                            })
                                                        ) : <span style={{color:'#aaa', fontStyle:'italic', fontSize:'0.9rem'}}>No Access</span>}
                                                    </div>
                                                </td>
                                                <td style={styles.td}>
                                                    <button onClick={() => setEditingUser(emp)} style={styles.btnEdit}>
                                                        Manage Access
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}
                    </div>
                </div>

                {/* --- MODAL --- */}
                {(showAddModal || editingUser) && (
                    <div style={styles.overlay(isClosing)}>
                        <div style={styles.modal(isClosing, isMobile)}>
                            
                            {/* Action Loader */}
                            {actionLoading && (
                                <div className="loading-overlay" style={styles.loaderOverlay}>
                                    <div className="spinner" style={{width:'40px', height:'40px'}}></div>
                                </div>
                            )}

                            <div style={styles.modalHeader}>
                                <h3>{showAddModal ? "New Employee" : "Access Rights"}</h3>
                                <button onClick={closeModal} style={styles.btnClose}>&times;</button>
                            </div>

                            {/* ADD FORM */}
                            {showAddModal && (
                                <form onSubmit={handleAddEmployee} style={styles.modalBody}>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Global ID</label>
                                        <input style={styles.input} placeholder="e.g. G00123" value={newEmp.GlobalID} onChange={e => setNewEmp({...newEmp, GlobalID: e.target.value})} required />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Full Name</label>
                                        <input style={styles.input} placeholder="John Doe" value={newEmp.Name} onChange={e => setNewEmp({...newEmp, Name: e.target.value})} required />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Email Address</label>
                                        <input style={styles.input} type="email" placeholder="john@company.com" value={newEmp.Email} onChange={e => setNewEmp({...newEmp, Email: e.target.value})} required />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Location</label>
                                        <input 
                                            style={{...styles.input, backgroundColor: '#f0f0f0', color: '#666'}} 
                                            value={user.location} 
                                            readOnly 
                                        />
                                    </div>
                                    <div style={styles.modalFooter}>
                                        <button type="button" onClick={closeModal} style={styles.btnSecondary}>Cancel</button>
                                        <button type="submit" style={styles.btnPrimary}>Create</button>
                                    </div>
                                </form>
                            )}

                            {/* EDIT MATRIX */}
                            {editingUser && (
                                <div style={styles.modalBody}>
                                    <div style={styles.userSummary}>
                                        <strong style={{color:'#003399', fontSize:'1.1rem'}}>{editingUser.Name}</strong>
                                        <div style={{color:'#666', fontSize:'0.9rem'}}>{editingUser.GlobalID}</div>
                                    </div>

                                    <div style={styles.matrixWrapper}>
                                        <table style={{width:'100%', borderCollapse:'collapse'}}>
                                            <thead style={{position:'sticky', top:0, background:'white', zIndex:10}}>
                                                <tr>
                                                    <th style={{...styles.th, borderBottom:'2px solid #eee'}}>Dept</th>
                                                    {roles.map(r => (
                                                        <th key={r.code} style={{...styles.th, textAlign:'center', color: r.color, fontSize:'0.75rem'}}>
                                                            {r.name.substring(0,3)}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {depts.map(dept => (
                                                    <tr key={dept.code} style={{borderBottom:'1px solid #f0f0f0'}}>
                                                        <td style={{padding:'12px', fontWeight:'600', color:'#333', fontSize:'0.9rem'}}>{dept.name}</td>
                                                        {roles.map(role => {
                                                            const isChecked = editingUser.roles.some(r => r.DepartmentCode === dept.code && r.RoleCode === role.code);
                                                            return (
                                                                <td key={role.code} style={{textAlign:'center', padding:'10px'}}>
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={isChecked} 
                                                                        onChange={() => toggleRole(dept.code, role.code)}
                                                                        style={styles.checkbox}
                                                                    />
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div style={styles.modalFooter}>
                                        <button onClick={closeModal} style={styles.btnSecondary}>Close</button>
                                        <button onClick={saveAccess} style={styles.btnPrimary}>Save</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/* --- RESPONSIVE STYLES --- */
const styles = {
    dashboardWrapper: { minHeight: '100vh', background: '#f4f6f8' },
    dashboardContent: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
    
    // Header Section
    topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: '15px' },
    titleGroup: { display: 'flex', alignItems: 'center', gap: '15px' },
    pageTitle: { fontSize: '1.8rem', margin: 0, color: '#111827', fontWeight: '700' },
    subTitle: { color: '#6B7280', margin: '4px 0 0 0', fontSize: '0.9rem' },
    backBtn: { background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: '#555', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' },
    addBtn: { padding: '10px 20px', fontSize: '0.95rem', fontWeight: '600', borderRadius: '8px', border: 'none', background: '#003399', color: 'white', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,51,153,0.2)' },

    // Card Container
    card: { background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #eaeaea', overflow: 'hidden', position: 'relative', minHeight: '400px' },
    cardHeader: { padding: '15px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' },
    
    // Search & Filters
    searchContainer: { flex: 1, minWidth: '200px' },
    searchInput: { width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #ddd', background: '#f9fafb', fontSize: '0.95rem', outline: 'none' },
    countBadge: { background: '#E3F2FD', color: '#1565C0', padding: '5px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700' },

    // List Area
    listContainer: { overflowX: 'hidden' }, // Prevents horizontal scroll on container
    emptyState: { padding: '50px', textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic' },

    // Desktop Table
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '800px' },
    th: { textAlign: 'left', padding: '14px 20px', color: '#6B7280', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' },
    tr: { borderBottom: '1px solid #F3F4F6' },
    td: { padding: '14px 20px', color: '#374151', verticalAlign: 'middle', fontSize: '0.95rem' },
    avatar: { width: '35px', height: '35px', borderRadius: '50%', background: '#003399', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '1rem' },
    roleTag: { padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', marginRight: '5px', marginBottom: '5px', display: 'inline-block' },
    btnEdit: { padding: '6px 12px', background: 'white', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', color: '#374151' },

    // Mobile Card View
    mobileGrid: { padding: '15px', display: 'grid', gridTemplateColumns: '1fr', gap: '15px' },
    mobileCard: { background: 'white', border: '1px solid #eee', borderRadius: '10px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' },
    mobileCardTop: { display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' },
    avatarSmall: { width: '40px', height: '40px', borderRadius: '50%', background: '#003399', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '1.1rem' },
    mobileCardRoles: { display: 'flex', flexWrap: 'wrap', gap: '5px' },
    btnIconEdit: { background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' },
    moreTag: { fontSize: '0.75rem', color: '#666', padding: '4px' },

    // Loader
    loaderOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.8)', zIndex: 50, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(2px)', borderRadius: '12px' },

    // Modal
    overlay: (isClosing) => ({
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000,
        animation: isClosing ? 'fadeOut 0.3s forwards' : 'fadeIn 0.3s forwards'
    }),
    modal: (isClosing, isMobile) => ({
        background: 'white', width: isMobile ? '100%' : '90%', maxWidth: '600px', 
        height: isMobile ? '100%' : 'auto', maxHeight: '90vh',
        borderRadius: isMobile ? '0' : '16px', 
        boxShadow: '0 20px 50px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
        animation: isClosing ? 'slideDown 0.3s forwards' : 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
    }),
    modalHeader: { padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' },
    modalBody: { padding: '20px', overflowY: 'auto', flex: 1 },
    modalFooter: { padding: '15px 20px', display: 'flex', gap: '15px', justifyContent: 'flex-end', borderTop: '1px solid #eee', background: '#fff' },
    
    // Forms & Matrix
    formGroup: { marginBottom: '15px' },
    label: { display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600', color: '#374151' },
    input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '1rem', outline: 'none' },
    userSummary: { marginBottom: '20px', padding: '15px', background: '#F9FAFB', borderRadius: '8px', borderLeft: '4px solid #003399' },
    matrixWrapper: { border: '1px solid #eee', borderRadius: '8px', overflowX: 'auto', marginBottom: '10px' }, // Allows matrix to scroll horizontally inside modal
    checkbox: { width: '18px', height: '18px', cursor: 'pointer', accentColor: '#003399' },

    // Shared Buttons
    btnClose: { background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: '#9CA3AF', lineHeight: 1 },
    btnPrimary: { background: '#003399', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' },
    btnSecondary: { background: 'white', color: '#374151', border: '1px solid #D1D5DB', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' },
};

// Animations
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideDown { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(30px); } }
  input:focus { border-color: #003399 !important; box-shadow: 0 0 0 3px rgba(0, 51, 153, 0.1); }
`;
document.head.appendChild(styleSheet);

export default SystemAdmin;