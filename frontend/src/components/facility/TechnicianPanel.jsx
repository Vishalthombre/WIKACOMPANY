import React, { useEffect, useState } from 'react';
import { facilityApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

// --- PROFESSIONAL ICONS ---
const Icons = {
    Play: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>,
    CheckCircle: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
    Location: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
    Alert: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>,
    User: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
};

const TechnicianPanel = ({ user }) => {
    const { notify, confirm } = useNotification(); 
    const [myTasks, setMyTasks] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [tasksLoading, setTasksLoading] = useState(true);

    useEffect(() => {
        if (user && user.location) {
            loadTasks();
        }
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [user]);

    const loadTasks = async () => {
        setTasksLoading(true);
        try {
            const allTickets = await facilityApi.getAllTickets(user.location);
            const assigned = allTickets.filter(t => t.AssignedToID === user.id);
            setMyTasks(assigned);
        } catch (err) {
            console.error("Failed to load tasks");
        } finally {
            setTasksLoading(false); 
        }
    };

    const handleStatusChange = async (ticketId, newStatus) => {
        const isConfirmed = await confirm(`Are you sure you want to mark this as ${newStatus}?`);
        if (!isConfirmed) return;
        
        try {
            await facilityApi.updateStatus({ ticketId, status: newStatus });
            notify(`Ticket marked as ${newStatus}`, "success"); 
            loadTasks(); 
        } catch (err) {
            notify("Failed to update status", "error");
        }
    };

    const renderActionButton = (task, fullWidth = false) => {
        const btnStyle = fullWidth ? styles.actionBtnFull : styles.actionBtn;

        if (task.Status === 'Assigned') {
            return (
                <button 
                    onClick={() => handleStatusChange(task.TicketID, 'In Progress')} 
                    style={{...btnStyle, background: '#003399'}}
                >
                    <span style={styles.btnIcon}><Icons.Play /></span> Start Job
                </button>
            );
        }
        if (task.Status === 'In Progress') {
            return (
                <button 
                    onClick={() => handleStatusChange(task.TicketID, 'Completed')} 
                    style={{...btnStyle, background: '#2E7D32'}}
                >
                    <span style={styles.btnIcon}><Icons.CheckCircle /></span> Complete Job
                </button>
            );
        }
        if (task.Status === 'Completed') {
            return (
                <span style={styles.doneBadge}>
                    <Icons.CheckCircle /> <span style={{marginLeft:'6px'}}>Closed</span>
                </span>
            );
        }
        return null;
    };

    return (
        <div style={styles.container}>
            
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>My Tasks</h2>
                    {!isMobile && <p style={styles.subtitle}>Manage your assigned maintenance jobs</p>}
                </div>
                <div style={styles.badge}>
                    {myTasks.filter(t => t.Status !== 'Completed').length} Active
                </div>
            </div>

            <div style={{...styles.contentCard, position: 'relative'}}>
                
                {tasksLoading && (
                    <div className="loading-overlay" style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(255,255,255,0.7)', zIndex: 10, backdropFilter: 'none'
                    }}>
                        <div className="spinner" style={{width:'40px', height:'40px'}}></div>
                    </div>
                )}

                {isMobile ? (
                    <div style={styles.mobileList}>
                        {myTasks.length === 0 && !tasksLoading ? (
                            <div style={styles.empty}>No tasks assigned.</div>
                        ) : (
                            myTasks.map(task => (
                                <div key={task.TicketID} style={styles.mobileCard}>
                                    <div style={styles.cardTop}>
                                        <span style={styles.ticketId}>TKT-{task.TicketID}</span>
                                        <span style={styles.statusBadge(task.Status)}>{task.Status}</span>
                                    </div>
                                    
                                    <div style={styles.cardBody}>
                                        <div style={styles.issueTitle}>
                                            <span style={styles.iconWrap}><Icons.Alert /></span>
                                            {task.IssueCategory}
                                        </div>
                                        <div style={styles.locationRow}>
                                            <span style={styles.iconWrap}><Icons.Location /></span> 
                                            {task.BuildingName}, {task.AreaName}
                                        </div>
                                        <div style={styles.desc}>"{task.Description}"</div>
                                        
                                        <div style={styles.metaGrid}>
                                            <div><span style={styles.label}>Raiser:</span> {task.RaiserName}</div>
                                            <div><span style={styles.label}>Planned By:</span> {task.PlannedBy || 'Direct'}</div>
                                        </div>
                                    </div>

                                    <div style={styles.cardFooter}>
                                        {renderActionButton(task, true)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div style={styles.tableResponsive}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Ticket ID</th>
                                    <th style={styles.th}>Issue Details</th>
                                    <th style={styles.th}>People</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myTasks.length === 0 && !tasksLoading ? (
                                    <tr><td colSpan="5" style={styles.empty}>No tasks assigned.</td></tr>
                                ) : (
                                    myTasks.map(task => (
                                        <tr key={task.TicketID} style={styles.tr}>
                                            <td style={styles.td}><strong>TKT-{task.TicketID}</strong></td>
                                            <td style={styles.td}>
                                                <div style={styles.issueTitleSmall}>{task.IssueCategory}</div>
                                                <div style={{fontSize:'0.85rem', color:'#666', display:'flex', alignItems:'center', gap:'4px'}}>
                                                    <Icons.Location /> {task.BuildingName} • {task.AreaName}
                                                </div>
                                                <div style={{fontSize:'0.8rem', color:'#888', fontStyle:'italic', marginTop:'4px'}}>{task.Description}</div>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={{fontSize:'0.85rem'}}>
                                                    <div style={{display:'flex', alignItems:'center', gap:'4px'}}><Icons.User /> {task.RaiserName}</div>
                                                    <div style={{color:'#888', fontSize:'0.75rem', marginTop:'2px'}}>By: {task.PlannedBy || 'Direct'}</div>
                                                </div>
                                            </td>
                                            <td style={styles.td}><span style={styles.statusBadge(task.Status)}>{task.Status}</span></td>
                                            <td style={styles.td}>{renderActionButton(task)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

/* --- PROFESSIONAL STYLES --- */
const styles = {
    container: { width: '100%', animation: 'fadeIn 0.5s ease-in-out' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title: { fontSize: '1.6rem', color: '#111827', margin: 0, fontWeight: '700' },
    subtitle: { fontSize: '0.9rem', color: '#6B7280', margin: '4px 0 0 0' },
    badge: { background: '#E3F2FD', color: '#1565C0', padding: '6px 15px', borderRadius: '20px', fontWeight: '700', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },

    contentCard: { background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #eaeaea', minHeight:'200px' },

    tableResponsive: { width: '100%', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '800px' },
    th: { textAlign: 'left', padding: '16px 20px', background: '#F9FAFB', color: '#6B7280', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', borderBottom: '1px solid #E5E7EB' },
    tr: { borderBottom: '1px solid #F3F4F6' },
    td: { padding: '16px 20px', verticalAlign: 'middle', fontSize: '0.95rem', color: '#374151' },

    actionBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' },
    actionBtnFull: { width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
    btnIcon: { display: 'flex', alignItems: 'center' },
    
    doneBadge: { color: '#2E7D32', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', background: '#ECFDF5', padding: '6px 12px', borderRadius: '20px', border: '1px solid #A7F3D0' },
    
    statusBadge: (status) => {
        const colors = { 'Assigned': {bg:'#E3F2FD', c:'#1565C0'}, 'In Progress': {bg:'#FFF3E0', c:'#E65100'}, 'Completed': {bg:'#ECFDF5', c:'#2E7D32'} };
        const st = colors[status] || {bg:'#eee', c:'#333'};
        return { backgroundColor: st.bg, color: st.c, padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', display: 'inline-block', textTransform: 'uppercase' };
    },

    // Mobile Card Styles
    mobileList: { padding: '15px', backgroundColor: '#F3F4F6' },
    mobileCard: { background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '5px solid #FF6600' },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #eee', paddingBottom: '8px' },
    ticketId: { fontWeight: '800', color: '#333', fontSize: '1rem' },
    
    cardBody: { marginBottom: '15px' },
    issueTitle: { fontWeight: '700', color: '#003399', fontSize: '1.05rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' },
    issueTitleSmall: { fontWeight: '700', color: '#003399', fontSize: '0.95rem', marginBottom: '2px' },
    
    locationRow: { fontSize: '0.9rem', color: '#555', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' },
    iconWrap: { color: '#64748B', display: 'flex' },
    
    desc: { fontSize: '0.9rem', color: '#666', fontStyle: 'italic', background: '#f9f9f9', padding: '10px', borderRadius: '6px', marginBottom: '10px' },
    
    metaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' },
    label: { color: '#888', fontWeight: '600', marginRight: '5px' },
    
    cardFooter: { marginTop: '10px' },
    empty: { padding: '40px', textAlign: 'center', color: '#999', fontStyle: 'italic' }
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  tr:hover { background-color: #F9FAFB; }
`;
document.head.appendChild(styleSheet);

export default TechnicianPanel;