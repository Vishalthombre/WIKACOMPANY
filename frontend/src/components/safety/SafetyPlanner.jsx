import React, { useEffect, useState } from 'react';
import { safetyApi } from '../../services/safetyApi';
import { useNotification } from '../../context/NotificationContext';
// 1. Import the reusable component
import ImageZoomModal from '../common/ImageZoomModal';

// --- PROFESSIONAL ICONS ---
const Icons = {
    Hazard: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
    Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
    Location: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
    User: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
    Photo: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
};

const SafetyPlanner = ({ user }) => {
    const { notify } = useNotification();
    const [tickets, setTickets] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assignmentData, setAssignmentData] = useState({});
    
    // 2. State to hold the raw image path string
    const [selectedImage, setSelectedImage] = useState(null); 

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true); 
        try {
            const [tix, techs] = await Promise.all([
                safetyApi.getAllTickets(user.location),
                safetyApi.getTechnicians(user.location)
            ]);
            setTickets(tix);
            const uniqueTechs = Array.from(new Map(techs.map(item => [item.id, item])).values());
            setTechnicians(uniqueTechs);
        } catch (err) {
            console.error("Failed to load safety data", err);
        } finally {
            setLoading(false); 
        }
    };

    const handleAssignChange = (ticketId, value) => {
        setAssignmentData(prev => ({ ...prev, [ticketId]: value }));
    };

    const submitAssignment = async (ticketId) => {
        const techId = assignmentData[ticketId];
        if (!techId) return notify("Please select a technician", "error"); 
        
        const techObj = technicians.find(t => String(t.id) === String(techId));
        if (!techObj) return notify("Technician not found", "error");

        try {
            await safetyApi.assignTicket({ 
                ticketId, 
                techId, 
                techName: techObj.name,
                plannerName: user.name 
            });
            notify(`Assigned to ${techObj.name}`, "success"); 
            loadData();
            setAssignmentData(prev => { const n = { ...prev }; delete n[ticketId]; return n; });
        } catch (error) { 
            notify("Failed to assign ticket", "error"); 
        }
    };

    // Sort: Open Tickets First
    const sortedTickets = [...tickets].sort((a, b) => {
        if (a.Status === 'Open' && b.Status !== 'Open') return -1;
        if (a.Status !== 'Open' && b.Status === 'Open') return 1;
        return new Date(b.CreatedAt) - new Date(a.CreatedAt);
    });

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h3 style={styles.title}>Safety Planner Board</h3>
                <div style={styles.badge}>{tickets.filter(t => t.Status === 'Open').length} Pending</div>
            </div>

            {loading && <div className="spinner"></div>}

            {/* Grid Layout (Natural Scrolling) */}
            <div className="planner-grid" style={styles.grid}>
                {sortedTickets.map(t => (
                    <div key={t.TicketID} style={styles.card}>
                        <div style={styles.cardHeader}>
                            <span style={styles.id}>#{t.TicketID}</span>
                            <span style={styles.statusBadge(t.Status)}>{t.Status}</span>
                        </div>
                        
                        <div style={styles.cardBody}>
                            <div style={styles.hazardType}>
                                <Icons.Hazard /> 
                                <span>{t.Keyword}</span>
                            </div>
                            <div style={styles.desc}>{t.Description}</div>
                            
                            <div style={styles.meta}>
                                <span style={styles.metaItem}>
                                    <Icons.Location /> {t.BuildingName} {t.AreaName ? `• ${t.AreaName}` : ''}
                                </span>
                                <span style={styles.metaItem}>
                                    <Icons.User /> Raised by: {t.RaiserName}
                                </span>
                            </div>

                            {t.ImageUrl && (
                                <button 
                                    // 3. Pass raw path to state
                                    onClick={() => setSelectedImage(t.ImageUrl)}
                                    style={styles.viewPhotoBtn}
                                >
                                    <Icons.Photo /> View Image
                                </button>
                            )}

                            <div style={styles.date}>{new Date(t.CreatedAt).toLocaleString()}</div>
                        </div>

                        <div style={styles.cardFooter}>
                            {t.Status === 'Open' ? (
                                <div style={styles.assignRow}>
                                    <select 
                                        style={styles.select} 
                                        value={assignmentData[t.TicketID] || ''} 
                                        onChange={(e) => handleAssignChange(t.TicketID, e.target.value)}
                                    >
                                        <option value="">Select Technician...</option>
                                        {technicians.map((tech, index) => (
                                            <option key={`${tech.id}-${index}`} value={tech.id}>{tech.name}</option>
                                        ))}
                                    </select>
                                    <button style={styles.btn} onClick={() => submitAssignment(t.TicketID)}>Assign</button>
                                </div>
                            ) : (
                                <div style={styles.assigned}>
                                    <Icons.Check /> Assigned to <strong>{t.AssignedToName}</strong>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* 4. Use ImageZoomModal Component */}
            {selectedImage && (
                <ImageZoomModal 
                    imagePath={selectedImage} 
                    onClose={() => setSelectedImage(null)} 
                />
            )}

            <style>{`
                .planner-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 20px;
                }
                @media (max-width: 768px) {
                    .planner-grid {
                        grid-template-columns: 1fr;
                    }
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
    // Main Container - Removed fixed height for natural scrolling
    container: { 
        padding: '20px', 
        maxWidth: '1400px', 
        margin: '0 auto',
        minHeight: '80vh' // Ensures it takes up space but grows naturally
    },
    
    header: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '25px'
    },
    title: { fontSize: '1.5rem', color: '#1e293b', margin: 0, fontWeight: '700' },
    badge: { background: '#f1f5f9', color: '#1e293b', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize:'0.9rem', border: '1px solid #e2e8f0' },
    
    grid: { /* CSS handled in style tag */ },
    
    // Card Styling
    card: { 
        background: 'white', 
        borderRadius: '12px', 
        padding: '20px', 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', 
        borderTop: '4px solid #1e293b', 
        border: '1px solid #e2e8f0', 
        borderTopWidth: '4px',
        display: 'flex',
        flexDirection: 'column'
    },
    cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
    id: { fontWeight: '700', color: '#64748b', fontSize: '0.9rem' },
    
    hazardType: { color: '#1e293b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '1.05rem' },
    desc: { fontSize: '0.95rem', color: '#334155', marginBottom: '15px', lineHeight: '1.5' },
    
    meta: { fontSize: '0.85rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' },
    metaItem: { display: 'flex', alignItems: 'center', gap: '6px' },
    
    date: { fontSize: '0.75rem', color: '#94a3b8', marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' },

    viewPhotoBtn: {
        width: '100%',
        padding: '8px',
        background: 'white',
        border: '1px solid #cbd5e0',
        borderRadius: '6px',
        color: '#334155',
        fontWeight: '600',
        fontSize: '0.85rem',
        cursor: 'pointer',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        transition: 'all 0.2s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    },
    
    cardFooter: { marginTop: 'auto', paddingTop: '15px' },
    assignRow: { display: 'flex', gap: '10px' },
    select: { flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', background: '#f8fafc', fontSize: '0.9rem', color: '#334155' },
    
    btn: { background: '#1e293b', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' },
    
    // Updated: Smaller Font & Cleaner Look for Assigned Text
    assigned: { 
        fontSize: '0.75rem', // Smaller Font
        color: '#0f766e', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px', 
        fontWeight: '600', 
        background: '#ccfbf1', 
        padding: '8px 12px', 
        borderRadius: '6px', 
        border: '1px solid #99f6e4',
        justifyContent: 'center'
    },
    
    statusBadge: (status) => ({
        padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold',
        background: status === 'Open' ? '#fee2e2' : '#dcfce7',
        color: status === 'Open' ? '#991b1b' : '#166534',
        textTransform: 'uppercase',
        border: status === 'Open' ? '1px solid #fca5a5' : '1px solid #86efac'
    }),
};

export default SafetyPlanner;