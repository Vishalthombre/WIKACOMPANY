import React, { useEffect, useState } from 'react';
import { facilityApi } from '../../services/api';
import MasterDataManager from './MasterDataManager';
import { useNotification } from '../../context/NotificationContext';

const AdminPanel = () => {
    const { notify, confirm } = useNotification();
    const [stats, setStats] = useState({ total: 0, open: 0, closed: 0 });
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // UI State
    const [showMasterData, setShowMasterData] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    
    // NEW: Loading State
    const [loading, setLoading] = useState(true);

    const currentUser = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (currentUser && currentUser.location) {
            loadData();
        }
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const results = tickets.filter(t => 
            String(t.TicketID).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.IssueCategory || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.RaiserName || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredTickets(results);
    }, [searchTerm, tickets]);

    const loadData = async () => {
        setLoading(true); // Start Spinner
        try {
            const data = await facilityApi.getAllTickets(currentUser.location);
            setTickets(data);
            setStats({
                total: data.length,
                open: data.filter(t => t.Status === 'Open' || t.Status === 'Assigned').length,
                closed: data.filter(t => t.Status === 'Completed').length
            });
        } catch (err) {
            console.error("Failed to load admin data");
        } finally {
            setLoading(false); // Stop Spinner
        }
    };

    const handleDeleteTicket = async (id) => {
        // Professional Confirm
        const isConfirmed = await confirm("⚠️ This action is permanent. Delete this ticket?");
        if(isConfirmed) {
            await facilityApi.deleteTicket(id);
            notify("Ticket deleted permanently", "success");
            setSelectedTicket(null);
            loadData();
        }
    };

    return (
        <div style={styles.container}>
            
            <div style={styles.header}>
                <div style={styles.headerTextGroup}>
                    <h2 style={styles.title}>Facility Admin</h2>
                    {!isMobile && <p style={styles.subtitle}>Overview of maintenance requests for <strong>{currentUser.location}</strong></p>}
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                    <button style={styles.configBtn} onClick={() => setShowMasterData(true)}>
                        <span style={{fontSize:'1.2rem'}}>⚙️</span> 
                        {!isMobile && <span> Config Dropdowns</span>}
                    </button>
                </div>
            </div>

            {/* KPI Stats load instantly if possible, or wait for data */}
            <div style={styles.kpiGrid}>
                <div style={styles.kpiCard}>
                    <div style={styles.kpiIcon}>📂</div>
                    <div><div style={styles.kpiLabel}>Total Tickets</div><div style={styles.kpiValue}>{stats.total}</div></div>
                </div>
                <div style={styles.kpiCard}>
                    <div style={{...styles.kpiIcon, background: '#FFEBEE', color: '#D32F2F'}}>🔥</div>
                    <div><div style={styles.kpiLabel}>Pending</div><div style={{...styles.kpiValue, color: '#D32F2F'}}>{stats.open}</div></div>
                </div>
                <div style={styles.kpiCard}>
                    <div style={{...styles.kpiIcon, background: '#E8F5E9', color: '#2E7D32'}}>✅</div>
                    <div><div style={styles.kpiLabel}>Completed</div><div style={{...styles.kpiValue, color: '#2E7D32'}}>{stats.closed}</div></div>
                </div>
            </div>

            {/* Content Card with Loading Overlay */}
            <div style={{...styles.tableCard, position: 'relative'}}>
                
                {/* Local Loading Overlay */}
                {loading && (
                    <div className="loading-overlay" style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(255,255,255,0.7)', zIndex: 10, backdropFilter: 'none'
                    }}>
                        <div className="spinner" style={{width:'40px', height:'40px'}}></div>
                    </div>
                )}

                <div style={styles.tableHeader}>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}><h3>Ticket Log</h3><span style={styles.badge}>{filteredTickets.length}</span></div>
                    <input style={styles.searchInput} placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>

                {isMobile ? (
                    <div style={styles.mobileList}>
                        {filteredTickets.length === 0 && !loading ? (
                            <div style={styles.emptyState}>No tickets found.</div>
                        ) : (
                            filteredTickets.map(t => (
                                <div key={t.TicketID} style={styles.mobileListItem} onClick={() => setSelectedTicket(t)} >
                                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}><span style={{fontWeight:'700', color:'#003399'}}>TKT-{t.TicketID}</span><span style={styles.statusBadge(t.Status)}>{t.Status}</span></div>
                                    <div style={{fontSize:'0.9rem', color:'#333', fontWeight:'600'}}>{t.IssueCategory}</div>
                                    <div style={{fontSize:'0.8rem', color:'#666', marginTop:'2px'}}>{t.BuildingName}</div>
                                    <div style={{fontSize:'0.8rem', color:'#888', marginTop:'5px', fontStyle:'italic'}}>Tap to view details &rarr;</div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div style={styles.tableResponsive}>
                        <table style={styles.table}>
                            <thead>
                                <tr><th style={styles.th}>ID</th><th style={styles.th}>Issue Details</th><th style={styles.th}>Raiser / Tech</th><th style={styles.th}>Status</th><th style={styles.th}>Action</th></tr>
                            </thead>
                            <tbody>
                                {filteredTickets.length === 0 && !loading ? (
                                    <tr><td colSpan="5" style={styles.emptyState}>No tickets found.</td></tr>
                                ) : (
                                    filteredTickets.map(t => (
                                        <tr key={t.TicketID} style={styles.tr}>
                                            <td style={styles.td}><strong>{t.TicketID}</strong></td>
                                            <td style={styles.td}><div style={{fontWeight:'600', color:'#333'}}>{t.IssueCategory}</div><div style={{fontSize:'0.85rem', color:'#666'}}>{t.BuildingName} - {t.AreaName}</div></td>
                                            <td style={styles.td}><div style={{fontSize:'0.85rem'}}><strong>By:</strong> {t.RaiserName}<br/><strong>To:</strong> {t.AssignedToName || '-'}</div></td>
                                            <td style={styles.td}><span style={styles.statusBadge(t.Status)}>{t.Status}</span></td>
                                            <td style={styles.td}><button onClick={() => handleDeleteTicket(t.TicketID)} style={styles.deleteBtn}>Delete</button></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedTicket && (
                <div style={styles.overlay}>
                    <div style={styles.popup}>
                        <div style={styles.popupHeader}><h3 style={{margin:0, color:'#003399'}}>TKT-{selectedTicket.TicketID}</h3><button onClick={() => setSelectedTicket(null)} style={styles.closeBtn}>&times;</button></div>
                        <div style={styles.popupBody}>
                            <div style={styles.detailRow}><label>Status:</label> <span style={styles.statusBadge(selectedTicket.Status)}>{selectedTicket.Status}</span></div>
                            <div style={styles.detailRow}><label>Issue:</label> <span>{selectedTicket.IssueCategory}</span></div>
                            <div style={styles.detailRow}><label>Location:</label> <span>{selectedTicket.BuildingName}, {selectedTicket.AreaName}</span></div>
                            <div style={styles.detailRow}><label>Description:</label> <p style={{margin:'5px 0', fontStyle:'italic', color:'#555'}}>{selectedTicket.Description}</p></div>
                            <hr style={{margin:'15px 0', border:'0', borderTop:'1px solid #eee'}}/>
                            <div style={styles.detailRow}><label>Raised By:</label> <span>{selectedTicket.RaiserName}</span></div>
                            <div style={styles.detailRow}><label>Technician:</label> <span>{selectedTicket.AssignedToName || 'Unassigned'}</span></div>
                            <div style={styles.detailRow}><label>Planner:</label> <span>{selectedTicket.PlannedBy || '-'}</span></div>
                        </div>
                        <div style={styles.popupFooter}><button onClick={() => handleDeleteTicket(selectedTicket.TicketID)} style={styles.deleteBtnLarge}>Delete Ticket</button></div>
                    </div>
                </div>
            )}

            {showMasterData && <MasterDataManager location={currentUser.location} onClose={() => setShowMasterData(false)} />}
        </div>
    );
};

/* --- STYLES (Keep Existing) --- */
const styles = {
    container: { width: '100%', position: 'relative', animation: 'fadeIn 0.5s ease-in-out', minHeight: '300px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap:'wrap', gap:'10px' },
    title: { fontSize: '1.6rem', color: '#003399', margin: 0, fontWeight: '700' },
    subtitle: { fontSize: '0.9rem', color: '#666', margin: '2px 0 0 0' },
    configBtn: { backgroundColor: '#333', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
    kpiGrid: { display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' },
    kpiCard: { flex: '1 1 150px', background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderLeft: '4px solid transparent', display: 'flex', alignItems: 'center', gap: '15px' },
    kpiIcon: { width: '45px', height: '45px', borderRadius: '50%', background: '#E3F2FD', color: '#003399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' },
    kpiLabel: { fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', fontWeight: '600' },
    kpiValue: { fontSize: '1.8rem', fontWeight: 'bold', color: '#333', lineHeight:1 },
    tableCard: { background: 'white', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden', minHeight: '200px' },
    tableHeader: { padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent:'space-between', alignItems: 'center' },
    badge: { background: '#E3F2FD', color: '#003399', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold' },
    searchInput: { padding:'8px 12px', borderRadius:'20px', border:'1px solid #ddd', outline:'none', fontSize:'0.9rem', width:'120px' },
    mobileList: { padding: '10px', background: '#f9fafb' },
    mobileListItem: { background: 'white', padding: '15px', borderRadius: '8px', marginBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderLeft: '4px solid #003399', cursor: 'pointer' },
    emptyState: { padding:'30px', textAlign:'center', color:'#999' },
    tableResponsive: { width: '100%', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '700px' },
    th: { textAlign: 'left', padding: '12px 15px', background: '#f8f9fa', color: '#666', fontSize: '0.85rem', fontWeight: '600' },
    tr: { borderBottom: '1px solid #eee' },
    td: { padding: '12px 15px', fontSize: '0.9rem', color: '#333' },
    statusBadge: (status) => {
        const colors = { 'Open': '#FF9800', 'Assigned': '#2196F3', 'Completed': '#4CAF50' };
        return { background: (colors[status] || '#999') + '20', color: colors[status] || '#999', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' };
    },
    deleteBtn: { background: '#FFEBEE', color: '#D32F2F', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' },
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    popup: { background: 'white', width: '90%', maxWidth: '400px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', animation: 'slideUp 0.3s ease' },
    popupHeader: { padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa' },
    popupBody: { padding: '20px' },
    detailRow: { marginBottom: '12px', fontSize: '0.95rem' },
    popupFooter: { padding: '15px 20px', borderTop: '1px solid #eee', textAlign: 'right' },
    closeBtn: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' },
    deleteBtnLarge: { width:'100%', padding:'12px', background: '#D32F2F', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '1rem' }
};

export default AdminPanel;