import React, { useState, useEffect } from 'react';
import { facilityApi } from '../../services/api';

const MasterDataManager = ({ location, onClose }) => {
    const [locations, setLocations] = useState([]);
    const [keywords, setKeywords] = useState([]);
    const [activeTab, setActiveTab] = useState('locations'); 
    const [isClosing, setIsClosing] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    
    // We keep loading only for the INITIAL fetch
    const [loading, setLoading] = useState(false);

    // Selection State
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [selectedArea, setSelectedArea] = useState(null);

    const [inputs, setInputs] = useState({ building: '', area: '', subArea: '', keyword: '' });

    useEffect(() => {
        if(location) loadData();
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [location]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await facilityApi.getDropdownData(location);
            setLocations(data.locations);
            setKeywords(data.keywords);
        } catch (err) {
            console.error("Failed to load master data");
        } finally {
            setLoading(false);
        }
    };

    // --- OPTIMIZED ADD HANDLER (Updates Local State Immediately) ---
    const handleAdd = async (type) => {
        if (!inputs[type].trim()) return;
        const val = inputs[type];
        
        try {
            if (type === 'building') {
                const res = await facilityApi.addBuilding({ name: val, location });
                if (res.success) {
                    // Direct Update: No Re-fetch needed!
                    setLocations([...locations, { id: res.id, name: val, areas: [] }]);
                }
            }
            if (type === 'area') {
                const res = await facilityApi.addArea({ buildingId: selectedBuilding.id, name: val });
                if (res.success) {
                    // Update nested state
                    const updatedLocations = locations.map(b => {
                        if (b.id === selectedBuilding.id) {
                            const newArea = { id: res.id, name: val, subAreas: [] };
                            // Also update selectedBuilding so UI reflects it immediately
                            setSelectedBuilding({ ...b, areas: [...b.areas, newArea] });
                            return { ...b, areas: [...b.areas, newArea] };
                        }
                        return b;
                    });
                    setLocations(updatedLocations);
                }
            }
            if (type === 'subArea') {
                const res = await facilityApi.addSubArea({ areaId: selectedArea.id, name: val });
                if (res.success) {
                    const updatedLocations = locations.map(b => {
                        if (b.id === selectedBuilding.id) {
                            const updatedAreas = b.areas.map(a => {
                                if (a.id === selectedArea.id) {
                                    const newSubAreas = [...a.subAreas, val];
                                    setSelectedArea({ ...a, subAreas: newSubAreas });
                                    return { ...a, subAreas: newSubAreas };
                                }
                                return a;
                            });
                            return { ...b, areas: updatedAreas };
                        }
                        return b;
                    });
                    setLocations(updatedLocations);
                }
            }
            if (type === 'keyword') {
                const res = await facilityApi.addKeyword({ name: val });
                if (res.success) {
                    setKeywords([...keywords, val]);
                }
            }
            setInputs(prev => ({ ...prev, [type]: '' }));
        } catch (err) {
            alert("Failed to add. It might already exist.");
        }
    };

    // --- OPTIMIZED DELETE HANDLER (Updates Local State Immediately) ---
    const handleDelete = async (type, item, e) => {
        if(e) e.stopPropagation();
        if (!window.confirm("⚠️ Delete this item?")) return;

        try {
            if (type === 'building') {
                await facilityApi.deleteBuilding(item.id);
                setLocations(locations.filter(b => b.id !== item.id));
                setSelectedBuilding(null); setSelectedArea(null);
            }
            if (type === 'area') {
                await facilityApi.deleteArea(item.id);
                const updatedLocations = locations.map(b => {
                    if (b.id === selectedBuilding.id) {
                        return { ...b, areas: b.areas.filter(a => a.id !== item.id) };
                    }
                    return b;
                });
                setLocations(updatedLocations);
                // Re-sync selected building
                setSelectedBuilding(updatedLocations.find(b => b.id === selectedBuilding.id));
                setSelectedArea(null);
            }
            if (type === 'subArea') {
                await facilityApi.deleteSubArea(selectedArea.id, item);
                const updatedLocations = locations.map(b => {
                    if (b.id === selectedBuilding.id) {
                        const updatedAreas = b.areas.map(a => {
                            if (a.id === selectedArea.id) {
                                const newSubs = a.subAreas.filter(s => s !== item);
                                setSelectedArea({...a, subAreas: newSubs});
                                return {...a, subAreas: newSubs};
                            }
                            return a;
                        });
                        return { ...b, areas: updatedAreas };
                    }
                    return b;
                });
                setLocations(updatedLocations);
            }
            if (type === 'keyword') {
                await facilityApi.deleteKeyword(item);
                setKeywords(keywords.filter(k => k !== item));
            }
        } catch (err) {
            alert("Failed to delete.");
        }
    };

    // --- Keep Helper Functions & UI as is ---
    const handleClose = () => { setIsClosing(true); setTimeout(onClose, 300); };
    const goBack = () => { if (selectedArea) setSelectedArea(null); else if (selectedBuilding) setSelectedBuilding(null); };
    const getMobileHeader = () => {
        if (selectedArea) return `${selectedBuilding.name} > ${selectedArea.name}`;
        if (selectedBuilding) return selectedBuilding.name;
        return "All Buildings";
    };

    return (
        <div style={styles.overlay(isClosing)}>
            <div style={styles.modal(isClosing, isMobile)}>
                
                {/* Loader only shows on initial load now, not on every action */}
                {loading && (
                    <div className="loading-overlay" style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.8)', zIndex: 50}}>
                        <div className="spinner"></div>
                    </div>
                )}

                {/* --- HEADER --- */}
                <div style={styles.header}>
                    <div>
                        <h2 style={styles.title}>Configuration</h2>
                        <p style={styles.subtitle}>Manage Dropdowns for <strong>{location}</strong></p>
                    </div>
                    <button onClick={handleClose} style={styles.closeBtn}>&times;</button>
                </div>

                {/* --- TABS --- */}
                <div style={styles.tabContainer}>
                    <button style={activeTab === 'locations' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('locations')}>Locations</button>
                    <button style={activeTab === 'keywords' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('keywords')}>Keywords</button>
                </div>

                {/* --- CONTENT AREA --- */}
                <div style={styles.content}>
                    {activeTab === 'locations' ? (
                        <div style={styles.columnsWrapper(isMobile)}>
                            
                            {/* MOBILE BREADCRUMB */}
                            {isMobile && selectedBuilding && (
                                <div style={styles.mobileBreadcrumb}>
                                    <button onClick={goBack} style={styles.backBtn}>&larr;</button>
                                    <span style={{fontWeight:'600', marginLeft:'10px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{getMobileHeader()}</span>
                                </div>
                            )}

                            {/* COLUMN 1: BUILDINGS */}
                            {(!isMobile || !selectedBuilding) && (
                                <div style={styles.column}>
                                    <div style={styles.colHeader}>1. Buildings</div>
                                    <div style={styles.list}>
                                        {locations.map(b => (
                                            <div key={b.id} onClick={() => { setSelectedBuilding(b); setSelectedArea(null); }} style={selectedBuilding?.id === b.id ? styles.selectedItem : styles.item}>
                                                <span style={{flex:1}}>{b.name}</span>
                                                <span style={styles.arrow}>›</span>
                                                <button onClick={(e) => handleDelete('building', b, e)} style={styles.deleteBtn}>×</button>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={styles.inputWrapper}>
                                        <input placeholder="New Building..." value={inputs.building} onChange={e => setInputs({...inputs, building: e.target.value})} style={styles.input} />
                                        <button onClick={() => handleAdd('building')} style={styles.addBtn}>+</button>
                                    </div>
                                </div>
                            )}

                            {/* COLUMN 2: AREAS */}
                            {(!isMobile || (selectedBuilding && !selectedArea)) && (
                                <div style={selectedBuilding ? styles.column : styles.disabledColumn}>
                                    <div style={styles.colHeader}>2. Areas / Floors</div>
                                    {selectedBuilding ? (
                                        <>
                                            <div style={styles.list}>
                                                {selectedBuilding.areas.map(a => (
                                                    <div key={a.id} onClick={() => setSelectedArea(a)} style={selectedArea?.id === a.id ? styles.selectedItem : styles.item}>
                                                        <span style={{flex:1}}>{a.name}</span>
                                                        <span style={styles.arrow}>›</span>
                                                        <button onClick={(e) => handleDelete('area', a, e)} style={styles.deleteBtn}>×</button>
                                                    </div>
                                                ))}
                                                {selectedBuilding.areas.length === 0 && <div style={styles.emptyText}>No areas yet</div>}
                                            </div>
                                            <div style={styles.inputWrapper}>
                                                <input placeholder="New Area..." value={inputs.area} onChange={e => setInputs({...inputs, area: e.target.value})} style={styles.input} />
                                                <button onClick={() => handleAdd('area')} style={styles.addBtn}>+</button>
                                            </div>
                                        </>
                                    ) : <div style={styles.emptyState}>Select a Building</div>}
                                </div>
                            )}

                            {/* COLUMN 3: SUB-AREAS */}
                            {(!isMobile || selectedArea) && (
                                <div style={selectedArea ? styles.column : styles.disabledColumn}>
                                    <div style={styles.colHeader}>3. Sub-Areas</div>
                                    {selectedArea ? (
                                        <>
                                            <div style={styles.list}>
                                                {selectedArea.subAreas.map((s, i) => (
                                                    <div key={i} style={styles.item}>
                                                        <span style={{flex:1}}>{s}</span>
                                                        <button onClick={(e) => handleDelete('subArea', s, e)} style={styles.deleteBtn}>×</button>
                                                    </div>
                                                ))}
                                                {selectedArea.subAreas.length === 0 && <div style={styles.emptyText}>No sub-areas yet</div>}
                                            </div>
                                            <div style={styles.inputWrapper}>
                                                <input placeholder="New Sub-Area..." value={inputs.subArea} onChange={e => setInputs({...inputs, subArea: e.target.value})} style={styles.input} />
                                                <button onClick={() => handleAdd('subArea')} style={styles.addBtn}>+</button>
                                            </div>
                                        </>
                                    ) : <div style={styles.emptyState}>Select an Area</div>}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={styles.keywordPanel}>
                            <div style={styles.tagsContainer}>
                                {keywords.map((kw, i) => (
                                    <div key={i} style={styles.tag}>
                                        {kw}
                                        <button onClick={() => handleDelete('keyword', kw)} style={styles.tagDelete}>&times;</button>
                                    </div>
                                ))}
                            </div>
                            <div style={styles.stickyKeywordInput}>
                                <input placeholder="Enter new issue keyword..." value={inputs.keyword} onChange={e => setInputs({...inputs, keyword: e.target.value})} style={styles.bigInput} />
                                <button onClick={() => handleAdd('keyword')} style={styles.bigAddBtn}>Add</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/* --- STYLES (Keep exactly the same as before) --- */
const styles = {
    overlay: (isClosing) => ({ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', animation: isClosing ? 'fadeOut 0.3s forwards' : 'fadeIn 0.3s forwards' }),
    modal: (isClosing, isMobile) => ({ width: isMobile ? '100%' : '90%', height: isMobile ? '100%' : '85vh', maxWidth: '1100px', backgroundColor: '#ffffff', borderRadius: isMobile ? '0' : '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: isClosing ? 'scaleOut 0.3s forwards' : 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards', position: 'relative' }),
    header: { padding: '15px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', flexShrink: 0 },
    title: { margin: 0, fontSize: '1.2rem', color: '#111827', fontWeight: '700' },
    subtitle: { margin: '2px 0 0', color: '#6B7280', fontSize: '0.85rem' },
    closeBtn: { background: 'transparent', border: 'none', fontSize: '2rem', color: '#9CA3AF', cursor: 'pointer', lineHeight: '1', transition: 'color 0.2s' },
    tabContainer: { display: 'flex', padding: '0 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', overflowX: 'auto', flexShrink: 0 },
    tab: { padding: '12px 20px', background: 'transparent', border: 'none', borderBottom: '3px solid transparent', color: '#6B7280', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' },
    activeTab: { padding: '12px 20px', background: 'transparent', border: 'none', borderBottom: '3px solid #003399', color: '#003399', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' },
    content: { flex: 1, overflow: 'hidden', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' },
    columnsWrapper: (isMobile) => ({ display: 'flex', height: '100%', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }),
    mobileBreadcrumb: { padding: '10px 15px', background: '#E3F2FD', color: '#003399', display: 'flex', alignItems: 'center', borderBottom: '1px solid #BBDEFB', flexShrink: 0 },
    backBtn: { background: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', color: '#003399', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    column: { flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #f0f0f0', height: '100%', overflow: 'hidden' },
    disabledColumn: { flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #f0f0f0', height: '100%', overflow: 'hidden', backgroundColor: '#f9fafb', opacity: 0.6, pointerEvents: 'none' },
    colHeader: { padding: '15px', background: '#f8f9fa', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '700', color: '#9CA3AF', letterSpacing: '0.05em', borderBottom: '1px solid #eee', flexShrink: 0 },
    list: { flex: 1, overflowY: 'auto', padding: '10px', minHeight: 0 },
    item: { display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '6px', color: '#374151', fontSize: '0.95rem', fontWeight: '500', transition: 'all 0.2s', border: '1px solid #f3f4f6', backgroundColor: '#fff' },
    selectedItem: { display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '6px', backgroundColor: '#E3F2FD', color: '#003399', fontWeight: '600', border: '1px solid #BBDEFB' },
    arrow: { marginLeft: '8px', color: '#9CA3AF', fontSize: '1.2rem' },
    deleteBtn: { marginLeft: '10px', background: '#FEE2E2', color: '#EF4444', border: 'none', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, paddingBottom: '3px' },
    emptyText: { color: '#ccc', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' },
    inputWrapper: { display: 'flex', gap: '8px', padding: '15px', borderTop: '1px solid #eee', background: 'white', flexShrink: 0 },
    input: { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s' },
    addBtn: { background: '#003399', color: 'white', border: 'none', borderRadius: '8px', width: '45px', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    emptyState: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontStyle: 'italic', fontSize: '0.95rem' },
    keywordPanel: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
    tagsContainer: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', gap: '10px' },
    stickyKeywordInput: { padding: '15px', borderTop: '1px solid #eee', background: 'white', display: 'flex', gap: '10px' },
    bigInput: { flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem', outline: 'none' },
    bigAddBtn: { padding: '14px 20px', background: '#003399', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '1rem' },
    tag: { display: 'flex', alignItems: 'center', padding: '8px 14px', backgroundColor: '#F3F4F6', borderRadius: '24px', color: '#374151', fontWeight: '500', fontSize: '0.9rem', border: '1px solid #E5E7EB', height: 'fit-content' },
    tagDelete: { marginLeft: '8px', background: '#D1D5DB', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }
};

export default MasterDataManager;