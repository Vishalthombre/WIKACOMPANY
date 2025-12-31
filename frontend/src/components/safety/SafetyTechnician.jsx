import React, { useEffect, useState } from 'react';
import { safetyApi } from '../../services/safetyApi';
import { useNotification } from '../../context/NotificationContext';

// --- PROFESSIONAL ICONS ---
const Icons = {
    Hazard: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
    Location: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
    Calendar: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
    Photo: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
    Play: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>,
    Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
};

const SafetyTechnician = ({ user }) => {
    const { notify, confirm } = useNotification(); 
    const [myTasks, setMyTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null); 

    // Base URL for images
    const API_BASE_URL = 'http://localhost:5000';

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const allTickets = await safetyApi.getAllTickets(user.location);
            // Filter assigned tasks for this user
            const assigned = allTickets.filter(t => String(t.AssignedToID) === String(user.id));
            setMyTasks(assigned);
        } catch (err) {
            console.error("Failed to load tasks");
        } finally {
            setLoading(false); 
        }
    };

    const handleStatusChange = async (ticketId, newStatus) => {
        const isConfirmed = await confirm(`Mark this safety issue as ${newStatus}?`);
        if (!isConfirmed) return;
        
        try {
            await safetyApi.updateStatus({ ticketId, status: newStatus });
            notify(`Task updated to ${newStatus}`, "success"); 
            loadTasks(); 
        } catch (err) {
            notify("Failed to update status", "error");
        }
    };

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}${path}`;
    };

    return (
        <div style={styles.container}>
            {/* Fixed Header */}
            <div style={styles.header}>
                <h3 style={styles.title}>My Safety Tasks</h3>
                <div style={styles.countBadge}>{myTasks.length} Assigned</div>
            </div>
            
            {/* --- LOCAL LOADING OVERLAY --- */}
            {loading && (
                <div style={styles.localOverlay}>
                    <div className="spinner" style={{borderColor: '#1e293b', borderTopColor: 'transparent'}}></div>
                </div>
            )}
            
            {/* Scrollable List */}
            <div style={styles.scrollArea}>
                {!loading && myTasks.length === 0 && (
                    <div style={styles.emptyState}>
                        <p>No tasks assigned to you currently.</p>
                    </div>
                )}
                
                {myTasks.map(task => (
                    <div key={task.TicketID} style={styles.card}>
                        <div style={styles.cardTop}>
                            <div style={styles.hazardType}>
                                <Icons.Hazard />
                                <span>{task.Keyword}</span>
                            </div>
                            <span style={styles.badge(task.Status)}>{task.Status}</span>
                        </div>
                        
                        <p style={styles.description}>{task.Description}</p>
                        
                        <div style={styles.meta}>
                            <span style={styles.metaItem}>
                                <Icons.Location /> {task.BuildingName} {task.AreaName ? `• ${task.AreaName}` : ''}
                            </span>
                            <span style={styles.metaItem}>
                                <Icons.Calendar /> {new Date(task.CreatedAt).toLocaleDateString()}
                            </span>
                        </div>

                        {/* --- VIEW PHOTO BUTTON --- */}
                        {task.ImageUrl && (
                            <button 
                                onClick={() => setSelectedImage(getImageUrl(task.ImageUrl))}
                                style={styles.viewPhotoBtn}
                            >
                                <Icons.Photo /> View Image
                            </button>
                        )}

                        {/* Actions */}
                        <div style={styles.actionArea}>
                            {task.Status === 'Assigned' && (
                                <button onClick={() => handleStatusChange(task.TicketID, 'In Progress')} style={styles.startBtn}>
                                    <Icons.Play /> Start Work
                                </button>
                            )}
                            {task.Status === 'In Progress' && (
                                <button onClick={() => handleStatusChange(task.TicketID, 'Completed')} style={styles.completeBtn}>
                                    <Icons.Check /> Mark Resolved
                                </button>
                            )}
                            {task.Status === 'Completed' && (
                                <div style={styles.completedMsg}>
                                    <Icons.Check /> Task Completed
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* --- IMAGE MODAL --- */}
            {selectedImage && (
                <div style={styles.modalOverlay} onClick={() => setSelectedImage(null)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <img src={selectedImage} alt="Evidence" style={styles.modalImg} />
                        <button onClick={() => setSelectedImage(null)} style={styles.closeModal}>&times;</button>
                    </div>
                </div>
            )}

            <style>{`
                .spinner {
                    border: 4px solid #f3f3f3; border-top: 4px solid #1e293b;
                    border-radius: 50%; width: 30px; height: 30px;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

const styles = {
    // Container fixes height for scrolling
    container: { 
        height: 'calc(100vh - 80px)', // Adjust based on navbar height
        display: 'flex',
        flexDirection: 'column',
        padding: '20px', 
        position: 'relative', 
        maxWidth: '800px', 
        margin: '0 auto',
        boxSizing: 'border-box'
    },
    
    // Header stays fixed
    header: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        flexShrink: 0
    },
    title: { color: '#1e293b', fontSize: '1.4rem', margin: 0, fontWeight: '700' },
    countBadge: { background: '#f1f5f9', color: '#64748b', padding: '5px 12px', borderRadius: '15px', fontSize: '0.85rem', fontWeight: '600' },
    
    // Scroll Area
    scrollArea: {
        flex: 1,
        overflowY: 'auto',
        paddingRight: '5px',
        paddingBottom: '20px'
    },

    localOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(255,255,255,0.8)',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        backdropFilter: 'blur(2px)'
    },

    emptyState: { textAlign: 'center', color: '#64748b', padding: '40px', background: 'white', borderRadius: '12px' },

    // Card Styles
    card: { 
        background: 'white', 
        padding: '20px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', 
        borderTop: '4px solid #1e293b', // Navy border
        marginBottom: '20px'
    },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    
    hazardType: { color: '#1e293b', fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' },
    
    description: { margin: '0 0 15px 0', fontSize: '0.95rem', color: '#334155', lineHeight: '1.5' },
    
    meta: { fontSize: '0.85rem', color: '#64748b', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '8px' },
    metaItem: { display: 'flex', alignItems: 'center', gap: '6px' },

    // Compact Photo Button (Matches Planner)
    viewPhotoBtn: {
        width: '100%',
        padding: '10px',
        background: '#f8fafc',
        border: '1px solid #cbd5e0',
        borderRadius: '8px',
        color: '#334155',
        fontWeight: '600',
        fontSize: '0.9rem',
        cursor: 'pointer',
        textAlign: 'center',
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'background 0.2s'
    },

    actionArea: { borderTop: '1px solid #f1f5f9', paddingTop: '15px' },
    
    startBtn: { 
        width: '100%', padding: '12px', background: '#3b82f6', color: 'white', 
        border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
    },
    completeBtn: { 
        width: '100%', padding: '12px', background: '#10b981', color: 'white', 
        border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
    },
    completedMsg: { 
        textAlign: 'center', color: '#059669', fontWeight: '600', padding: '12px', 
        background: '#d1fae5', borderRadius: '8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
    },

    badge: (status) => ({
        padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase',
        background: status === 'In Progress' ? '#ffedd5' : (status === 'Completed' ? '#dcfce7' : '#f1f5f9'),
        color: status === 'In Progress' ? '#c2410c' : (status === 'Completed' ? '#15803d' : '#475569')
    }),

    // Modal Styles
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter:'blur(4px)' },
    modalContent: { position: 'relative', maxWidth: '90%', maxHeight: '90%' },
    modalImg: { maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
    closeModal: { position: 'absolute', top: '-40px', right: '-10px', background: 'transparent', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer' }
};

export default SafetyTechnician;