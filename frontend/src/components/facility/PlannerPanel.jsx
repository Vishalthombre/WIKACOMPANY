import React, { useEffect, useState } from 'react';
import { facilityApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

const PlannerPanel = () => {
    const { notify } = useNotification();
    const [tickets, setTickets] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    
    // Loading State
    const [loading, setLoading] = useState(true);
    
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const [assignmentData, setAssignmentData] = useState({}); 

    useEffect(() => {
        if (currentUser && currentUser.location) {
            loadData();
        }
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const loadData = async () => {
        setLoading(true); 
        try {
            const [tix, techs] = await Promise.all([
                facilityApi.getAllTickets(currentUser.location),
                facilityApi.getTechnicians(currentUser.location)
            ]);
            setTickets(tix);
            setTechnicians(techs);
        } catch (err) {
            console.error("Failed to load planner data");
            notify("Failed to load data", "error");
        } finally {
            setLoading(false); 
        }
    };

    const handleAssignChange = (ticketId, value) => {
        setAssignmentData(prev => ({ ...prev, [ticketId]: value }));
    };

    // --- FIX: Corrected Logic Here ---
    const submitAssignment = async (ticketId) => {
        // 1. Get selected Tech ID
        const techId = assignmentData[ticketId];
        
        // 2. Validation
        if (!techId) return notify("Please select a technician first", "error"); 
        
        // 3. Get Tech Name
        const techName = technicians.find(t => t.id === techId)?.name;

        try {
            // 4. Send Actual Data to API
            await facilityApi.assignTicket({ 
                ticketId, 
                techId, 
                techName,
                plannerName: currentUser.name 
            });

            notify(`Successfully assigned to ${techName}`, "success"); 
            loadData();
            
            // Clear selection
            setAssignmentData(prev => { 
                const n = { ...prev }; 
                delete n[ticketId]; 
                return n; 
            });

        } catch (error) { 
            notify("Failed to assign ticket", "error"); 
        }
    };

    return (
        <div style={styles.container}>
            
            {/* Header visible immediately */}
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Planner Board</h2>
                    {!isMobile && <p style={styles.subtitle}>Assign and schedule maintenance tasks</p>}
                </div>
                <div style={styles.badge}>{tickets.filter(t => t.Status === 'Open').length} Pending</div>
            </div>

            {/* Content with Loading Overlay */}
            <div style={{...styles.contentCard, position:'relative'}}>
                
                {/* Local Loading Overlay */}
                {loading && (
                    <div className="loading-overlay" style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(255,255,255,0.7)', zIndex: 10, backdropFilter: 'none'
                    }}>
                        <div className="spinner" style={{width:'40px', height:'40px'}}></div>
                    </div>
                )}

                {isMobile ? (
                    <div style={styles.mobileList}>
                        {tickets.length === 0 && !loading ? (
                            <div style={styles.empty}>No tickets found.</div>
                        ) : (
                            tickets.map(t => (
                                <div key={t.TicketID} style={styles.mobileCard}>
                                    <div style={styles.cardTop}>
                                        <span style={styles.ticketId}>TKT-{t.TicketID}</span>
                                        <span style={styles.statusBadge(t.Status)}>{t.Status}</span>
                                    </div>
                                    <div style={styles.cardBody}>
                                        <div style={styles.infoRow}><strong>📍 Location:</strong> {t.BuildingName}, {t.AreaName}</div>
                                        <div style={styles.infoRow}><strong>⚠️ Issue:</strong> {t.IssueCategory}</div>
                                        <div style={styles.desc}>"{t.Description}"</div>
                                        <div style={styles.meta}>Raiser: {t.RaiserName}</div>
                                    </div>
                                    <div style={styles.cardAction}>
                                        {t.Status === 'Open' ? (
                                            <div style={styles.assignBlock}>
                                                <select style={styles.mobileSelect} value={assignmentData[t.TicketID] || ''} onChange={(e) => handleAssignChange(t.TicketID, e.target.value)}>
                                                    <option value="">Select Technician...</option>
                                                    {technicians.map(tech => <option key={tech.id} value={tech.id}>{tech.name}</option>)}
                                                </select>
                                                <button style={styles.mobileBtn} onClick={() => submitAssignment(t.TicketID)}>Assign Tech</button>
                                            </div>
                                        ) : <div style={styles.assignedInfo}><span style={{color:'#2E7D32'}}>✔ Assigned to:</span> <strong> {t.AssignedToName}</strong></div>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div style={styles.tableResponsive}>
                        <table style={styles.table}>
                            <thead>
                                <tr><th style={styles.th}>Ticket ID</th><th style={styles.th}>Issue Details</th><th style={styles.th}>Location</th><th style={styles.th}>Status</th><th style={styles.th}>Action</th></tr>
                            </thead>
                            <tbody>
                                {tickets.length === 0 && !loading ? (
                                    <tr><td colSpan="5" style={styles.empty}>No tickets found.</td></tr>
                                ) : (
                                    tickets.map(t => (
                                        <tr key={t.TicketID} style={styles.tr}>
                                            <td style={styles.td}><strong>TKT-{t.TicketID}</strong><br/><span style={{fontSize:'0.8rem', color:'#666'}}>By: {t.RaiserName}</span></td>
                                            <td style={styles.td}><span style={{fontWeight:'600', color:'#003399'}}>{t.IssueCategory}</span><div style={{fontSize:'0.85rem', color:'#555', maxWidth:'250px'}}>{t.Description}</div></td>
                                            <td style={styles.td}>{t.BuildingName}<br/><span style={{fontSize:'0.8rem', color:'#666'}}>{t.AreaName}</span></td>
                                            <td style={styles.td}><span style={styles.statusBadge(t.Status)}>{t.Status}</span></td>
                                            <td style={styles.td}>
                                                {t.Status === 'Open' ? (
                                                    <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                                                        <select style={styles.select} value={assignmentData[t.TicketID] || ''} onChange={(e) => handleAssignChange(t.TicketID, e.target.value)}>
                                                            <option value="">Select Technician...</option>
                                                            {technicians.map(tech => <option key={tech.id} value={tech.id}>{tech.name}</option>)}
                                                        </select>
                                                        <button style={styles.assignBtn} onClick={() => submitAssignment(t.TicketID)}>Assign</button>
                                                    </div>
                                                ) : <div style={{fontSize:'0.9rem', color:'#2E7D32', fontWeight:'500'}}>👤 {t.AssignedToName}</div>}
                                            </td>
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

/* --- STYLES (Unchanged) --- */
const styles = {
    container: { width: '100%', position: 'relative', minHeight:'300px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title: { fontSize: '1.6rem', color: '#111827', margin: 0, fontWeight: '700' },
    subtitle: { fontSize: '0.9rem', color: '#6B7280', margin: '4px 0 0 0' },
    badge: { background: '#FFF3E0', color: '#E65100', padding: '6px 12px', borderRadius: '20px', fontWeight: '700', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    contentCard: { background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #eaeaea', minHeight:'200px' },
    tableResponsive: { width: '100%', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
    th: { textAlign: 'left', padding: '16px 20px', background: '#F9FAFB', color: '#6B7280', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', borderBottom: '1px solid #E5E7EB' },
    tr: { borderBottom: '1px solid #F3F4F6' },
    td: { padding: '16px 20px', verticalAlign: 'middle', fontSize: '0.95rem', color: '#374151' },
    select: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '0.9rem', outline: 'none', width: '180px' },
    assignBtn: { padding: '8px 16px', background: '#003399', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' },
    mobileList: { padding: '15px', backgroundColor: '#F3F4F6' },
    mobileCard: { background: 'white', borderRadius: '10px', padding: '16px', marginBottom: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #003399' },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #eee', paddingBottom: '8px' },
    ticketId: { fontWeight: '800', color: '#003399', fontSize: '1rem' },
    cardBody: { marginBottom: '15px' },
    infoRow: { marginBottom: '6px', fontSize: '0.95rem', color: '#333' },
    desc: { fontSize: '0.9rem', color: '#555', fontStyle: 'italic', background: '#f9f9f9', padding: '8px', borderRadius: '6px', marginTop: '8px' },
    meta: { fontSize: '0.8rem', color: '#888', marginTop: '8px', textAlign: 'right' },
    cardAction: { marginTop: '10px' },
    assignBlock: { display: 'flex', flexDirection: 'column', gap: '10px' },
    mobileSelect: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', backgroundColor: 'white' },
    mobileBtn: { width: '100%', padding: '12px', background: '#003399', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' },
    assignedInfo: { background: '#E8F5E9', padding: '10px', borderRadius: '6px', textAlign: 'center', fontSize: '0.95rem', border: '1px solid #C8E6C9' },
    statusBadge: (status) => {
        const colors = { 'Open': {bg:'#FFEBEE', c:'#D32F2F'}, 'Assigned': {bg:'#E3F2FD', c:'#1976D2'}, 'Completed': {bg:'#E8F5E9', c:'#2E7D32'} };
        const st = colors[status] || {bg:'#eee', c:'#333'};
        return { backgroundColor: st.bg, color: st.c, padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', display: 'inline-block' };
    },
    empty: { padding: '40px', textAlign: 'center', color: '#999', fontStyle: 'italic' }
};

export default PlannerPanel;