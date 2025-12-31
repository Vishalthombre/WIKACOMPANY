import React, { useEffect, useState } from 'react';
import { safetyApi } from '../../services/safetyApi';
import { useNotification } from '../../context/NotificationContext'; 
import SafetyMasterConfig from './SafetyMasterConfig';

const SafetyAdmin = ({ user }) => {
    const { notify } = useNotification();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // UI States
    const [showConfig, setShowConfig] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null); // Detail Modal
    const [viewImage, setViewImage] = useState(null); // Full Image Modal

    const API_BASE_URL = 'http://localhost:5000'; 

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await safetyApi.getAllTickets(user.location);
            setTickets(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation(); 
        if (!window.confirm("Are you sure you want to delete this ticket?")) return;

        try {
            await safetyApi.deleteTicket(id);
            notify("Ticket deleted successfully", "success");
            setSelectedTicket(null);
            loadData();
        } catch (err) {
            notify("Failed to delete ticket", "error");
        }
    };

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}${path}`;
    };

    return (
        <div style={styles.container}>
            
            {/* --- HEADER --- */}
            <div style={styles.headerRow}>
                <div>
                    <h2 style={styles.header}>Safety Admin Dashboard</h2>
                    <p style={styles.subHeader}>Overview of reported hazards in {user.location}</p>
                </div>
                <button onClick={() => setShowConfig(true)} style={styles.configBtn}>
                    <span>⚙️</span> Configure Hazards
                </button>
            </div>
            
            {loading ? (
                <div className="spinner"></div>
            ) : (
                <>
                    {/* --- DESKTOP TABLE --- */}
                    <div className="desktop-view">
                        <div style={styles.tableCard}>
                            <table style={styles.table}>
                                <thead>
                                    <tr style={styles.trHead}>
                                        <th style={styles.th}>ID</th>
                                        <th style={styles.th}>Date</th>
                                        <th style={styles.th}>Hazard Issue</th>
                                        <th style={styles.th}>Location</th>
                                        <th style={styles.th}>Status</th>
                                        <th style={styles.th}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.map(t => (
                                        <tr 
                                            key={t.TicketID} 
                                            style={styles.trBody} 
                                            onClick={() => setSelectedTicket(t)} 
                                        >
                                            <td style={styles.td}>#{t.TicketID}</td>
                                            <td style={styles.td}>{new Date(t.CreatedAt).toLocaleDateString()}</td>
                                            <td style={{...styles.td, color:'#e11d48', fontWeight:'600'}}>
                                                {t.Keyword} 
                                            </td>
                                            <td style={styles.td}>
                                                {t.BuildingName}
                                                <div style={{fontSize:'0.75rem', color:'#64748b'}}>{t.AreaName}</div>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={styles.statusBadge(t.Status)}>{t.Status}</span>
                                            </td>
                                            <td style={styles.td}>
                                                <button style={styles.detailsBtn}>View Details</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* --- MOBILE CARDS --- */}
                    <div className="mobile-view">
                        <div style={styles.grid}>
                            {tickets.map(t => (
                                <div 
                                    key={t.TicketID} 
                                    style={styles.mobileCard}
                                    onClick={() => setSelectedTicket(t)}
                                >
                                    <div style={styles.cardHeader}>
                                        <span style={{fontWeight:'bold', color:'#64748b'}}>#{t.TicketID}</span>
                                        <span style={styles.statusBadge(t.Status)}>{t.Status}</span>
                                    </div>
                                    
                                    <div style={styles.cardBody}>
                                        <h4 style={{margin:'0 0 5px', color:'#1e293b'}}>{t.Keyword}</h4>
                                        <p style={{margin:'0 0 10px', fontSize:'0.9rem', color:'#475569', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                                            {t.Description}
                                        </p>
                                        <div style={{fontSize:'0.85rem', color:'#64748b'}}>
                                            📍 {t.BuildingName} • {t.AreaName || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* --- CONFIG MODAL --- */}
            {showConfig && <SafetyMasterConfig onClose={() => setShowConfig(false)} />}

            {/* --- TICKET DETAIL POPUP (MODAL) --- */}
            {selectedTicket && (
                <div style={styles.modalOverlay} onClick={() => setSelectedTicket(null)}>
                    <div style={styles.detailModal} onClick={e => e.stopPropagation()}>
                        
                        <div style={styles.detailHeader}>
                            <h3 style={{margin:0, color:'#1e293b'}}>Ticket #{selectedTicket.TicketID}</h3>
                            <button onClick={() => setSelectedTicket(null)} style={styles.closeModalBtn}>&times;</button>
                        </div>

                        <div style={styles.detailBody}>
                            <div style={styles.detailRow}>
                                <label style={styles.label}>Status:</label>
                                <span style={styles.statusBadge(selectedTicket.Status)}>{selectedTicket.Status}</span>
                            </div>
                            
                            <div style={styles.detailRow}>
                                <label style={styles.label}>Issue Category:</label>
                                <strong style={{color:'#d32f2f'}}>{selectedTicket.Keyword}</strong>
                            </div>

                            <div style={styles.detailRow}>
                                <label style={styles.label}>Location:</label>
                                <span>{selectedTicket.BuildingName} &gt; {selectedTicket.AreaName} &gt; {selectedTicket.SubAreaName || 'N/A'}</span>
                            </div>

                            <div style={styles.detailRow}>
                                <label style={styles.label}>Description:</label>
                                <p style={styles.descText}>{selectedTicket.Description}</p>
                            </div>

                            <div style={styles.detailRow}>
                                <label style={styles.label}>Raised By:</label>
                                <span>{selectedTicket.RaiserName} ({new Date(selectedTicket.CreatedAt).toLocaleString()})</span>
                            </div>

                            {selectedTicket.AssignedToName && (
                                <div style={styles.detailRow}>
                                    <label style={styles.label}>Assigned Technician:</label>
                                    <span style={{color:'#0f766e', fontWeight:'600'}}>{selectedTicket.AssignedToName}</span>
                                </div>
                            )}

                            {/* --- THE VIEW PHOTO BUTTON --- */}
                            {selectedTicket.ImageUrl && (
                                <div style={{marginTop:'20px'}}>
                                    <label style={styles.label}>Evidence:</label>
                                    <button 
                                        onClick={() => setViewImage(getImageUrl(selectedTicket.ImageUrl))}
                                        style={styles.viewPhotoBtn}
                                    >
                                        📷 View Image
                                    </button>
                                </div>
                            )}
                        </div>

                        <div style={styles.detailFooter}>
                            <button 
                                onClick={(e) => handleDelete(e, selectedTicket.TicketID)} 
                                style={styles.deleteBtn}
                            >
                                🗑️ Delete Ticket
                            </button>
                            <button onClick={() => setSelectedTicket(null)} style={styles.cancelBtn}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- FULL IMAGE ZOOM MODAL --- */}
            {viewImage && (
                <div style={styles.modalOverlay} onClick={() => setViewImage(null)}>
                    <div style={styles.imageContent} onClick={e => e.stopPropagation()}>
                        <img src={viewImage} alt="Full View" style={styles.fullImage} />
                        <button onClick={() => setViewImage(null)} style={styles.closeImageBtn}>&times;</button>
                    </div>
                </div>
            )}

            <style>{`
                .desktop-view { display: block; }
                .mobile-view { display: none; }
                @media (max-width: 768px) {
                    .desktop-view { display: none; }
                    .mobile-view { display: block; }
                }
                .spinner {
                    border: 4px solid #f3f3f3; border-top: 4px solid #1e293b;
                    border-radius: 50%; width: 30px; height: 30px;
                    animation: spin 1s linear infinite; margin: 20px auto;
                }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

const styles = {
    container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
    
    // Header
    headerRow: { 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid #e2e8f0', 
        flexWrap: 'wrap', gap: '15px' 
    },
    header: { color: '#1e293b', fontSize: '1.6rem', margin: 0, fontWeight:'700' },
    subHeader: { margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' },
    
    configBtn: { 
        background: '#1e293b', color: 'white', border: 'none', padding: '10px 20px', 
        borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
    },
    
    // Table
    tableCard: { background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '600px' },
    trHead: { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
    th: { padding: '16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' },
    trBody: { borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s' },
    td: { padding: '16px', fontSize: '0.95rem', color: '#334155' },
    
    detailsBtn: { background: '#e2e8f0', color: '#475569', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize:'0.8rem', fontWeight:'600', cursor:'pointer' },

    // Mobile
    grid: { display: 'flex', flexDirection: 'column', gap: '15px' },
    mobileCard: { background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', cursor:'pointer' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    cardBody: { display: 'flex', flexDirection: 'column' },

    // --- Detail Modal Styles ---
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px', backdropFilter:'blur(3px)' },
    detailModal: { background: 'white', width: '100%', maxWidth: '600px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'fadeIn 0.2s' },
    detailHeader: { padding: '20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    closeModalBtn: { background: 'none', border: 'none', fontSize: '2rem', lineHeight: '0.5', cursor: 'pointer', color:'#64748b' },
    detailBody: { padding: '25px', maxHeight: '60vh', overflowY: 'auto' },
    
    detailRow: { marginBottom: '15px' },
    label: { display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '4px', fontWeight: '600', textTransform:'uppercase' },
    descText: { background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9', color:'#334155', lineHeight:'1.5' },
    
    // --- THIS IS THE PHOTO BUTTON STYLE ---
    viewPhotoBtn: {
        width: '100%',
        padding: '12px',
        background: '#f1f5f9', // Light gray background
        border: '1px solid #cbd5e0', // Subtle border
        borderRadius: '8px',
        color: '#334155', // Dark gray text
        fontWeight: '600',
        fontSize: '0.95rem',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'background 0.2s',
        display: 'block'
    },

    detailFooter: { padding: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' },
    deleteBtn: { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
    cancelBtn: { background: 'white', color: '#64748b', border: '1px solid #cbd5e0', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },

    // --- Full Image Modal ---
    imageContent: { position: 'relative', maxWidth: '90%', maxHeight: '90%' },
    fullImage: { maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' },
    closeImageBtn: { position: 'absolute', top: '-40px', right: '-10px', background: 'transparent', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer' },

    // Helpers
    statusBadge: (status) => {
        const colors = { 'Open': { bg: '#fee2e2', text: '#991b1b' }, 'Assigned': { bg: '#fef3c7', text: '#92400e' }, 'Completed': { bg: '#dcfce7', text: '#166534' } };
        const c = colors[status] || { bg: '#f1f5f9', text: '#64748b' };
        return { background: c.bg, color: c.text, padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' };
    }
};

export default SafetyAdmin;