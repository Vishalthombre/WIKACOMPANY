import React, { useState, useEffect } from 'react';
import { facilityApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

const RaiserPanel = ({ user }) => {
    // Notification Hook
    const { notify } = useNotification();

    // State
    const [locations, setLocations] = useState([]);
    const [keywords, setKeywords] = useState([]);
    const [myHistory, setMyHistory] = useState([]); 
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
    
    // Loading States
    const [historyLoading, setHistoryLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);  
    
    // Form State
    const [formData, setFormData] = useState({
        building: '', area: '', subArea: '', keyword: '', description: ''
    });

    // --- FIX 1: Robust Location Extraction ---
    // We try 'location' (frontend style) first, then 'PlantLocation' (DB style), then 'Location'
    const userLocation = user?.location || user?.PlantLocation || user?.Location || '';
    const userId = user?.id || user?.GlobalID || '';
    const userName = user?.name || user?.Name || user?.FullName || '';

    useEffect(() => {
        if (user && userLocation) {
            // 1. Load Dropdowns
            facilityApi.getDropdownData(userLocation)
                .then(data => {
                    setLocations(data.locations);
                    setKeywords(data.keywords);
                })
                .catch(err => console.error("Dropdown load error", err));

            // 2. Load History
            loadHistory();
        }

        const handleResize = () => setIsMobile(window.innerWidth <= 900);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [user, userLocation]); // Add userLocation to dependency array

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const allTickets = await facilityApi.getAllTickets(userLocation);
            // Filter by ID (Check both formats just in case)
            const myTickets = allTickets.filter(t => t.RaiserID === userId).reverse();
            setMyHistory(myTickets);
        } catch (err) {
            console.error("History load error", err);
        } finally {
            setHistoryLoading(false);
        }
    };

    // Logic for dropdowns
    const selectedBuildingObj = locations.find(l => l.name === formData.building);
    const availableAreas = selectedBuildingObj ? selectedBuildingObj.areas : [];
    const selectedAreaObj = availableAreas.find(a => a.name === formData.area);
    const availableSubAreas = selectedAreaObj ? selectedAreaObj.subAreas : [];

    const handleChange = (field, value) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };
            if (field === 'building') { newData.area = ''; newData.subArea = ''; }
            if (field === 'area') { newData.subArea = ''; }
            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.building) return notify("Please select a Building", "error");
        if (!formData.description.trim()) return notify("Description is required", "error");

        // --- FIX 2: Safety Check for User Data ---
        if (!userId || !userLocation) {
            console.error("User Data Missing:", user); // Log for debugging
            return notify("Error: User session invalid. Please log out and back in.", "error");
        }

        setSubmitting(true);
        try {
            await facilityApi.createTicket({
                ...formData,
                keyword: formData.keyword || 'General',
                // Use the Safe Variables defined above
                raiserID: userId,
                raiserName: userName,
                location: userLocation 
            });
            
            notify("Ticket Raised Successfully!", "success");
            
            setFormData({ building: '', area: '', subArea: '', keyword: '', description: '' });
            loadHistory();
        } catch (error) {
            notify("Failed to raise ticket", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={styles.container}>
            
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Raise Request</h2>
                    <p style={styles.subtitle}>Report issues & track status</p>
                </div>
            </div>

            <div style={isMobile ? styles.layoutStack : styles.layoutSplit}>
                
                {/* --- LEFT: FORM CARD --- */}
                <div style={styles.formCard}>
                    <div style={styles.cardHeader}>New Ticket</div>
                    <form onSubmit={handleSubmit} style={styles.form}>
                        {/* Row 1 */}
                        <div style={styles.row}>
                            <div style={styles.group}>
                                <label style={styles.label}>Building <span style={{color:'red'}}>*</span></label>
                                <select style={styles.select} value={formData.building} onChange={(e) => handleChange('building', e.target.value)}>
                                    <option value="">Select...</option>
                                    {locations.map(loc => <option key={loc.id} value={loc.name}>{loc.name}</option>)}
                                </select>
                            </div>
                            <div style={styles.group}>
                                <label style={styles.label}>Area <span style={{color:'red'}}>*</span></label>
                                <select style={styles.select} value={formData.area} onChange={(e) => handleChange('area', e.target.value)} disabled={!formData.building}>
                                    <option value="">Select...</option>
                                    {availableAreas.map((area, i) => <option key={i} value={area.name}>{area.name}</option>)}
                                </select>
                            </div>
                        </div>
                        {/* Row 2 */}
                        <div style={styles.row}>
                            <div style={styles.group}>
                                <label style={styles.label}>Sub Area <span style={{color:'red'}}>*</span></label>
                                <select style={styles.select} value={formData.subArea} onChange={(e) => handleChange('subArea', e.target.value)} disabled={!formData.area}>
                                    <option value="">Select...</option>
                                    {availableSubAreas.map((sub, i) => <option key={i} value={sub}>{sub}</option>)}
                                </select>
                            </div>
                            <div style={styles.group}>
                                <label style={styles.label}>Issue Type</label>
                                <select style={styles.select} value={formData.keyword} onChange={(e) => handleChange('keyword', e.target.value)}>
                                    <option value="">General</option>
                                    {keywords.map((kw, i) => <option key={i} value={kw}>{kw}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={styles.group}>
                            <label style={styles.label}>Description <span style={{color:'red'}}>*</span></label>
                            <textarea rows="3" placeholder="Details..." style={styles.textarea} value={formData.description} onChange={(e) => handleChange('description', e.target.value)}/>
                        </div>
                        <button type="submit" style={styles.submitBtn} disabled={submitting}>
                            {submitting ? 'Sending...' : 'Submit Ticket'}
                        </button>
                    </form>
                </div>

                {/* --- RIGHT: HISTORY CARD --- */}
                <div style={{...styles.historyCard, position: 'relative'}}>
                    {/* Local History Loader */}
                    {historyLoading && (
                        <div className="loading-overlay" style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            background: 'rgba(255,255,255,0.7)', borderRadius: '12px', zIndex: 10, backdropFilter: 'none'
                        }}>
                            <div className="spinner" style={{width:'30px', height:'30px', borderWidth:'3px'}}></div>
                        </div>
                    )}

                    <div style={styles.cardHeader}>My History <span style={styles.countBadge}>{myHistory.length}</span></div>
                    <div style={styles.historyList}>
                        {myHistory.length === 0 && !historyLoading ? <div style={styles.emptyHistory}>No tickets raised yet.</div> : 
                            myHistory.map(t => (
                                <div key={t.TicketID} style={styles.historyItem}>
                                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                                        <span style={styles.historyId}>TKT-{t.TicketID}</span>
                                        <span style={styles.statusBadge(t.Status)}>{t.Status}</span>
                                    </div>
                                    <div style={styles.historyTitle}>{t.IssueCategory || 'General'}</div>
                                    <div style={styles.historyLoc}>{t.BuildingName} - {t.AreaName}</div>
                                    <div style={styles.historyDate}>{new Date(t.CreatedAt).toLocaleDateString()}</div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

/* --- STYLES (Same as before) --- */
const styles = {
    container: { width: '100%', animation: 'fadeIn 0.5s ease-in-out' },
    header: { marginBottom: '20px', borderBottom: '1px solid #e0e0e0', paddingBottom: '10px' },
    title: { fontSize: '1.6rem', color: '#003399', margin: 0, fontWeight: '700' },
    subtitle: { fontSize: '0.9rem', color: '#666', margin: '2px 0 0 0' },
    layoutSplit: { display: 'flex', gap: '25px', alignItems: 'flex-start' },
    layoutStack: { display: 'flex', flexDirection: 'column', gap: '20px' },
    formCard: { flex: 3, background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #eaeaea' },
    historyCard: { flex: 2, background: 'white', borderRadius: '12px', padding: '0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #eaeaea', display: 'flex', flexDirection: 'column', maxHeight: '500px', overflow: 'hidden' },
    cardHeader: { padding: '15px 20px', background: '#F9FAFB', borderBottom: '1px solid #eee', fontWeight: '700', color: '#333', fontSize: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    group: { display: 'flex', flexDirection: 'column' },
    label: { fontSize: '0.85rem', fontWeight: '600', color: '#444', marginBottom: '5px' },
    select: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem', backgroundColor: '#fff', outline: 'none' },
    textarea: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' },
    submitBtn: { width: '100%', padding: '12px', background: '#003399', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 6px rgba(0, 51, 153, 0.2)' },
    countBadge: { background: '#E0E7FF', color: '#003399', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem' },
    historyList: { padding: '15px', overflowY: 'auto', flex: 1, backgroundColor: '#fff' },
    historyItem: { padding: '12px', borderBottom: '1px solid #f0f0f0', marginBottom: '8px', borderRadius: '8px', transition: 'background 0.2s' },
    historyId: { fontSize: '0.8rem', fontWeight: 'bold', color: '#888' },
    historyTitle: { fontSize: '0.95rem', fontWeight: '600', color: '#333', margin: '2px 0' },
    historyLoc: { fontSize: '0.85rem', color: '#666' },
    historyDate: { fontSize: '0.75rem', color: '#aaa', marginTop: '4px', textAlign: 'right' },
    emptyHistory: { textAlign: 'center', padding: '30px', color: '#999', fontStyle: 'italic' },
    statusBadge: (status) => {
        const colors = { 'Open': {bg:'#FFEBEE', c:'#D32F2F'}, 'Assigned': {bg:'#E3F2FD', c:'#1976D2'}, 'Completed': {bg:'#E8F5E9', c:'#2E7D32'} };
        const st = colors[status] || {bg:'#eee', c:'#333'};
        return { backgroundColor: st.bg, color: st.c, padding: '3px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '700' };
    }
};

export default RaiserPanel;