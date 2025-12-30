import React, { useEffect, useState } from 'react';
import { facilityApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

// --- ICONS ---
const Icons = {
    Ticket: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>,
    Location: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
    User: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
    Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
};

const PlannerPanel = () => {
    const { notify } = useNotification();
    const [tickets, setTickets] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
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

    // --- FIX IS HERE ---
    const submitAssignment = async (ticketId) => {
        const techId = assignmentData[ticketId];
        if (!techId) return notify("Please select a technician first", "error"); 
        
        // FIX: Compare as strings to ensure match regardless of type (int/string)
        const techObj = technicians.find(t => String(t.id) === String(techId));
        
        if (!techObj) {
            return notify("Error: Technician not found in list", "error");
        }

        const techName = techObj.name;

        try {
            await facilityApi.assignTicket({ 
                ticketId, 
                techId, 
                techName,
                plannerName: currentUser.name 
            });

            notify(`Assigned to ${techName}`, "success"); 
            loadData();
            // Clear dropdown selection
            setAssignmentData(prev => { const n = { ...prev }; delete n[ticketId]; return n; });

        } catch (error) { 
            notify("Failed to assign ticket", "error"); 
        }
    };

    const sortedTickets = [...tickets].sort((a, b) => {
        if (a.Status === 'Open' && b.Status !== 'Open') return -1;
        if (a.Status !== 'Open' && b.Status === 'Open') return 1;
        return 0;
    });

    return (
        <div style={styles.container}>
            
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Planner Board</h2>
                    {!isMobile && <p style={styles.subtitle}>Assign and schedule maintenance tasks</p>}
                </div>
                <div style={styles.badge}>{tickets.filter(t => t.Status === 'Open').length} Pending</div>
            </div>

            <div style={{...styles.contentCard, position:'relative'}}>
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
                            sortedTickets.map(t => (
                                <div key={t.TicketID} style={styles.mobileCard}>
                                    <div style={styles.cardTop}>
                                        <span style={styles.ticketId}>TKT-{t.TicketID}</span>
                                        <span style={styles.statusBadge(t.Status)}>{t.Status}</span>
                                    </div>
                                    <div style={styles.cardBody}>
                                        <div style={styles.infoRow}>
                                            <span style={styles.iconWrap}><Icons.Location /></span>
                                            {t.BuildingName}, {t.AreaName}
                                        </div>
                                        <div style={styles.infoRow}>
                                            <span style={styles.iconWrap}><Icons.Ticket /></span>
                                            {t.IssueCategory}
                                        </div>
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
                                        ) : (
                                            <div style={styles.assignedInfo}>
                                                <span style={styles.checkIcon}><Icons.Check /></span>
                                                <span>Assigned to: <strong>{t.AssignedToName}</strong></span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div style={styles.tableScrollWrapper}>
                        <table style={styles.table}>
                            <thead style={styles.thead}>
                                <tr>
                                    <th style={styles.th}>Ticket ID</th>
                                    <th style={styles.th}>Issue Details</th>
                                    <th style={styles.th}>Location</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.length === 0 && !loading ? (
                                    <tr><td colSpan="5" style={styles.empty}>No tickets found.</td></tr>
                                ) : (
                                    sortedTickets.map(t => (
                                        <tr key={t.TicketID} style={styles.tr}>
                                            <td style={styles.td}>
                                                <strong>TKT-{t.TicketID}</strong>
                                                <div style={styles.subText}><Icons.User /> {t.RaiserName}</div>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{fontWeight:'600', color:'#003399'}}>{t.IssueCategory}</span>
                                                <div style={styles.descText}>{t.Description}</div>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={{fontWeight:'500'}}>{t.BuildingName}</div>
                                                <div style={styles.subText}>{t.AreaName}</div>
                                            </td>
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
                                                ) : (
                                                    <div style={styles.assignedBadge}>
                                                        <Icons.User /> {t.AssignedToName}
                                                    </div>
                                                )}
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

const styles = {
    container: { width: '100%', position: 'relative', minHeight:'300px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    title: { fontSize: '1.5rem', color: '#003399', margin: 0, fontWeight: '700' },
    subtitle: { fontSize: '0.9rem', color: '#666', margin: '4px 0 0 0' },
    badge: { background: '#FFF3E0', color: '#E65100', padding: '6px 12px', borderRadius: '20px', fontWeight: '700', fontSize: '0.85rem', border: '1px solid #FFE0B2' },
    
    contentCard: { background: 'white', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '65vh', minHeight: '400px' },
    
    tableScrollWrapper: { flex: 1, overflowY: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
    
    thead: { position: 'sticky', top: 0, zIndex: 5 },
    th: { textAlign: 'left', padding: '12px 20px', background: '#F8FAFC', color: '#64748B', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', borderBottom: '2px solid #E2E8F0' },
    tr: { borderBottom: '1px solid #F1F5F9' },
    td: { padding: '14px 20px', verticalAlign: 'middle', fontSize: '0.95rem', color: '#334155' },
    
    subText: { fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' },
    descText: { fontSize: '0.85rem', color: '#475569', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontStyle: 'italic' },
    
    select: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none', width: '180px', background: 'white' },
    assignBtn: { padding: '8px 16px', background: '#003399', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' },
    
    assignedBadge: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#059669', fontWeight: '600', background: '#ECFDF5', padding: '6px 10px', borderRadius: '20px', width: 'fit-content' },

    mobileList: { padding: '15px', backgroundColor: '#F8FAFC', overflowY: 'auto', flex: 1 },
    mobileCard: { background: 'white', borderRadius: '10px', padding: '16px', marginBottom: '15px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0' },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' },
    ticketId: { fontWeight: '700', color: '#003399', fontSize: '1rem' },
    cardBody: { marginBottom: '15px' },
    infoRow: { marginBottom: '8px', fontSize: '0.95rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' },
    iconWrap: { color: '#64748B', display: 'flex' },
    desc: { fontSize: '0.9rem', color: '#475569', fontStyle: 'italic', background: '#F1F5F9', padding: '10px', borderRadius: '6px', marginTop: '8px' },
    meta: { fontSize: '0.8rem', color: '#94A3B8', marginTop: '8px', textAlign: 'right' },
    
    cardAction: { marginTop: '10px' },
    assignBlock: { display: 'flex', flexDirection: 'column', gap: '10px' },
    mobileSelect: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '1rem', backgroundColor: 'white' },
    mobileBtn: { width: '100%', padding: '12px', background: '#003399', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' },
    
    assignedInfo: { background: '#ECFDF5', padding: '12px', borderRadius: '8px', textAlign: 'center', fontSize: '0.95rem', border: '1px solid #A7F3D0', color: '#065F46', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    checkIcon: { color: '#059669', display: 'flex' },
    
    statusBadge: (status) => {
        const colors = { 'Open': {bg:'#FEF2F2', c:'#DC2626'}, 'Assigned': {bg:'#EFF6FF', c:'#2563EB'}, 'Completed': {bg:'#ECFDF5', c:'#059669'} };
        const st = colors[status] || {bg:'#F3F4F6', c:'#4B5563'};
        return { backgroundColor: st.bg, color: st.c, padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', display: 'inline-block', textTransform: 'uppercase' };
    },
    empty: { padding: '40px', textAlign: 'center', color: '#94A3B8', fontStyle: 'italic' }
};

export default PlannerPanel;