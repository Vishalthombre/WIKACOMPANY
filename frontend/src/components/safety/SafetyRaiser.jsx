import React, { useState, useEffect } from 'react';
import { safetyApi } from '../../services/safetyApi';
import { useNotification } from '../../context/NotificationContext';
import imageCompression from 'browser-image-compression'; // Import the library

const SafetyRaiser = ({ user }) => {
    const { notify } = useNotification();
    
    // Master Data
    const [locations, setLocations] = useState([]);
    const [areas, setAreas] = useState([]);
    const [subAreas, setSubAreas] = useState([]);
    const [hazards, setHazards] = useState([]);
    
    // User History
    const [myHistory, setMyHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Form State
    const [form, setForm] = useState({ 
        buildingId: '', 
        areaId: '', 
        subAreaId: '', 
        hazardType: '', 
        description: '' 
    });
    
    const [image, setImage] = useState(null); 
    const [preview, setPreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false); // New state for compression loading

    useEffect(() => { 
        loadMasterData(); 
        loadMyHistory();
    }, []);

    // Handle Building Change
    useEffect(() => {
        if (form.buildingId) {
            const selectedBuilding = locations.find(l => String(l.id) === String(form.buildingId));
            setAreas(selectedBuilding ? selectedBuilding.areas : []);
            setSubAreas([]);
            setForm(prev => ({ ...prev, areaId: '', subAreaId: '' }));
        } else {
            setAreas([]); setSubAreas([]);
        }
    }, [form.buildingId, locations]);

    // Handle Area Change
    useEffect(() => {
        if (form.areaId) {
            const selectedArea = areas.find(a => String(a.id) === String(form.areaId));
            setSubAreas(selectedArea ? selectedArea.subAreas : []);
            setForm(prev => ({ ...prev, subAreaId: '' }));
        } else {
            setSubAreas([]);
        }
    }, [form.areaId, areas]);

    const loadMasterData = async () => {
        try {
            const data = await safetyApi.getDropdownData(user.location);
            setLocations(data.locations || []);
            setHazards(data.hazards || []);
        } catch (err) {
            console.error(err);
            notify("Error loading dropdowns", "error");
        }
    };

    const loadMyHistory = async () => {
        setLoadingHistory(true);
        try {
            const allTickets = await safetyApi.getAllTickets(user.location);
            const myTickets = allTickets.filter(t => String(t.RaiserID) === String(user.id));
            setMyHistory(myTickets.slice(0, 5)); 
        } catch (err) {
            console.error("Failed to load history", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    // --- NEW: COMPRESSION LOGIC ---
   // --- OPTIMIZED COMPRESSION LOGIC ---
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // NEW: Aggressive Compression Settings
        const options = {
            maxSizeMB: 0.3,          // Target: 300KB (Much faster than 1MB)
            maxWidthOrHeight: 1024,  // Limit resolution to 1024px (Enough for evidence)
            useWebWorker: true,      // Keeps UI smooth
            initialQuality: 0.7      // Start with lower quality to speed up processing
        };

        setIsCompressing(true); // Show loading state

        try {
            // Compress the file
            const compressedFile = await imageCompression(file, options);
            
            // Set the compressed file to state
            setImage(compressedFile);
            setPreview(URL.createObjectURL(compressedFile));
            
            // Debugging: Check how much space we saved
            console.log(`Original: ${(file.size/1024/1024).toFixed(2)}MB`);
            console.log(`Compressed: ${(compressedFile.size/1024/1024).toFixed(2)}MB`); // Should be ~0.2MB

        } catch (error) {
            console.error("Compression failed:", error);
            notify("Could not process image. Please try again.", "error");
        } finally {
            setIsCompressing(false); // Hide loading state
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!form.buildingId || !form.hazardType || !form.description) {
            return notify("Please fill required fields (*)", "error");
        }

        if (isCompressing) {
            return notify("Please wait for image processing...", "info");
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('raiserId', user.id);
            formData.append('raiserName', user.name);
            formData.append('location', user.location);
            formData.append('buildingId', form.buildingId);
            formData.append('areaId', form.areaId || 0);
            formData.append('subAreaId', form.subAreaId || 0);
            formData.append('hazardType', form.hazardType);
            formData.append('description', form.description);
            if (image) formData.append('safetyImage', image);

            await safetyApi.createTicket(formData);
            
            notify("Safety Issue Reported Successfully", "success");
            
            setForm({ buildingId: '', areaId: '', subAreaId: '', hazardType: '', description: '' });
            setImage(null);
            setPreview(null);
            loadMyHistory(); 

        } catch (err) {
            notify("Failed to submit report.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="safety-raiser-page" style={styles.pageContainer}>
            
            {/* LEFT SIDE: FORM */}
            <div style={styles.card}>
                <div style={styles.header}>
                    <h3 style={{margin:0, color:'#1e293b'}}>Report Safety Issue</h3>
                    <p style={{margin:'5px 0 0', color:'#64748b', fontSize:'0.9rem'}}>Please provide details below</p>
                </div>
                
                <form onSubmit={handleSubmit} style={styles.form}>
                    
                    {/* --- ROW 1: Building & Area --- */}
                    <div style={styles.gridRow}>
                        <div style={styles.formGroup}>
                            <label>Building <span style={styles.req}>*</span></label>
                            <select 
                                style={styles.input} 
                                value={form.buildingId} 
                                onChange={e => setForm({...form, buildingId: e.target.value})} 
                                required
                            >
                                <option value="">Select...</option>
                                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>

                        <div style={styles.formGroup}>
                            <label>Area</label>
                            <select 
                                style={styles.input} 
                                value={form.areaId} 
                                onChange={e => setForm({...form, areaId: e.target.value})}
                                disabled={!form.buildingId} 
                            >
                                <option value="">Select...</option>
                                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* --- ROW 2: SubArea & Safety Issue --- */}
                    <div style={styles.gridRow}>
                        <div style={styles.formGroup}>
                            <label>Sub-Area</label>
                            <select 
                                style={styles.input} 
                                value={form.subAreaId} 
                                onChange={e => setForm({...form, subAreaId: e.target.value})}
                                disabled={!form.areaId} 
                            >
                                <option value="">Select...</option>
                                {subAreas.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div style={styles.formGroup}>
                            <label>Safety Issue <span style={styles.req}>*</span></label>
                            <select 
                                style={styles.input}
                                value={form.hazardType}
                                onChange={e => setForm({...form, hazardType: e.target.value})}
                                required
                            >
                                <option value="">Select...</option>
                                {hazards.map((h, i) => <option key={i} value={h}>{h}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* --- Description --- */}
                    <div style={styles.formGroup}>
                        <label>Description <span style={styles.req}>*</span></label>
                        <textarea 
                            style={{...styles.input, height:'80px', resize:'none'}} 
                            placeholder="Describe the issue..."
                            value={form.description}
                            onChange={e => setForm({...form, description: e.target.value})}
                            required
                        />
                    </div>

                    {/* --- Image Selection Section --- */}
                    <div style={styles.formGroup}>
                        <label>Photo Evidence</label>
                        
                        {/* Hidden Inputs */}
                        <input 
                            type="file" 
                            accept="image/*" 
                            id="safety-upload" 
                            onChange={handleFileSelect} 
                            style={{display: 'none'}} 
                        />
                        <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment" // Forces Camera on Mobile
                            id="safety-camera" 
                            onChange={handleFileSelect} 
                            style={{display: 'none'}} 
                        />
                        
                        {/* Custom Buttons Area */}
                        {!preview && !isCompressing && (
                            <div style={styles.buttonRow}>
                                {/* Capture Button */}
                                <label htmlFor="safety-camera" style={styles.actionBtn}>
                                    <span style={{fontSize:'1.3rem'}}>📷</span>
                                    <span>Capture</span>
                                </label>

                                {/* Upload Button */}
                                <label htmlFor="safety-upload" style={styles.actionBtn}>
                                    <span style={{fontSize:'1.3rem'}}>📁</span>
                                    <span>Upload</span>
                                </label>
                            </div>
                        )}

                        {/* Loading State for Compression */}
                        {isCompressing && (
                            <div style={styles.uploadArea}>
                                <div className="spinner" style={{width:'24px', height:'24px', borderWidth:'3px'}}></div>
                                <span style={{color:'#64748b', fontSize:'0.9rem'}}>Compressing Image...</span>
                            </div>
                        )}

                        {/* Preview State */}
                        {preview && !isCompressing && (
                            <div style={styles.previewContainer}>
                                <img src={preview} alt="Evidence" style={styles.previewImg} />
                                <button type="button" onClick={() => {setImage(null); setPreview(null)}} style={styles.removeBtn}>✕ Remove</button>
                            </div>
                        )}
                    </div>

                    <button type="submit" style={styles.submitBtn} disabled={submitting || isCompressing}>
                        {submitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                </form>
            </div>

            {/* RIGHT SIDE: MY HISTORY */}
            <div style={styles.historyCard} className="history-section">
                <h4 style={styles.historyTitle}>My Recent Reports</h4>
                
                {loadingHistory ? (
                    <p style={{color:'#64748b', textAlign:'center', fontSize:'0.9rem'}}>Loading...</p>
                ) : myHistory.length === 0 ? (
                    <div style={styles.emptyState}>No recent reports.</div>
                ) : (
                    <div style={styles.historyList}>
                        {myHistory.map(t => (
                            <div key={t.TicketID} style={styles.historyItem}>
                                <div style={styles.historyHeader}>
                                    <span style={{fontWeight:'bold', color:'#334155'}}>#{t.TicketID}</span>
                                    <span style={styles.statusBadge(t.Status)}>{t.Status}</span>
                                </div>
                                <div style={{color:'#1e293b', fontWeight:'600', fontSize:'0.9rem'}}>{t.Keyword}</div>
                                <div style={{fontSize:'0.85rem', color:'#64748b'}}>{t.BuildingName}</div>
                                <div style={{fontSize:'0.75rem', color:'#94a3b8', marginTop:'4px'}}>
                                    {new Date(t.CreatedAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* RESPONSIVE CSS */}
            <style>{`
                .safety-raiser-page {
                    display: flex;
                    gap: 20px;
                    max-width: 1000px;
                    margin: 0 auto;
                    align-items: flex-start;
                }
                .history-section {
                    flex: 1;
                }
                @media (max-width: 900px) {
                    .safety-raiser-page {
                        flex-direction: column; 
                    }
                    .history-section {
                        width: 100% !important;
                        margin-top: 10px;
                    }
                }
                .spinner {
                    border: 3px solid #f3f3f3; border-top: 3px solid #1e293b;
                    border-radius: 50%; width: 24px; height: 24px;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

const styles = {
    // --- FORM CARD ---
    card: { 
        flex: 2,
        width: '100%', 
        background: 'white', 
        padding: '25px', 
        borderRadius: '16px', 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', 
        borderTop: '4px solid #1e293b' 
    },
    header: { marginBottom: '20px' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    gridRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    req: { color: '#ef4444', marginLeft: '2px' }, 
    
    input: { 
        padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', 
        background: '#f8fafc', fontSize: '0.95rem', color: '#1e293b', outline: 'none', transition: 'all 0.2s'
    },
    
    // --- Button Row for Camera/Upload ---
    buttonRow: { display: 'flex', gap: '15px' },
    actionBtn: {
        flex: 1,
        border: '2px dashed #cbd5e0',
        borderRadius: '12px',
        padding: '15px',
        textAlign: 'center',
        background: '#f8fafc',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '5px',
        color: '#64748b',
        fontWeight: '500',
        transition: 'all 0.2s'
    },

    // --- Loading Area ---
    uploadArea: { 
        border: '2px dashed #cbd5e0', padding: '10px', borderRadius: '12px', textAlign: 'center', 
        background: '#f8fafc', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' 
    },

    previewContainer: { position: 'relative', width: '100%', height: '180px', borderRadius:'12px', overflow:'hidden', border:'1px solid #e2e8f0' },
    previewImg: { width: '100%', height: '100%', objectFit: 'cover' },
    removeBtn: { 
        position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', 
        background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '20px', 
        padding: '8px 16px', cursor: 'pointer', fontSize:'0.85rem', fontWeight:'600'
    },
    
    submitBtn: { 
        marginTop: '10px', padding: '14px', background: '#1e293b', color: 'white', 
        border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', 
        boxShadow: '0 4px 6px rgba(30, 41, 59, 0.3)', transition: 'background 0.2s',
        opacity: (props) => props.disabled ? 0.7 : 1
    },

    // --- HISTORY CARD ---
    historyCard: {
        background: 'white',
        padding: '20px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        borderTop: '4px solid #334155' 
    },
    historyTitle: { margin: '0 0 15px 0', color: '#1e293b', fontSize: '1.1rem' },
    emptyState: { color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' },
    historyList: { display: 'flex', flexDirection: 'column', gap: '10px' },
    historyItem: { 
        padding: '12px', 
        borderRadius: '10px', 
        background: '#f8fafc', 
        border: '1px solid #e2e8f0' 
    },
    historyHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' },
    
    statusBadge: (status) => {
        const colors = { 
            'Open': { bg: '#fee2e2', text: '#ef4444' },
            'Assigned': { bg: '#fef3c7', text: '#d97706' },
            'Completed': { bg: '#dcfce7', text: '#166534' }
        };
        const c = colors[status] || { bg: '#f1f5f9', text: '#475569' };
        return { background: c.bg, color: c.text, padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' };
    }
};

export default SafetyRaiser;