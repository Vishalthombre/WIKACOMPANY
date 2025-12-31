import React, { useState, useEffect } from 'react';
import { safetyApi } from '../../services/safetyApi';
import { useNotification } from '../../context/NotificationContext';

const SafetyMasterConfig = ({ onClose }) => {
    const { notify } = useNotification();
    const [keywords, setKeywords] = useState([]);
    const [newKeyword, setNewKeyword] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadKeywords();
    }, []);

    const loadKeywords = async () => {
        try {
            // Fetch existing dropdown data to get the list of hazards
            const data = await safetyApi.getDropdownData('Pune'); 
            setKeywords(data.hazards || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newKeyword.trim()) return;
        try {
            await safetyApi.addHazardType({ name: newKeyword });
            notify("Safety Category Added", "success");
            setNewKeyword('');
            loadKeywords(); // Refresh the list
        } catch (err) {
            notify("Failed to add category", "error");
        }
    };

    const handleDelete = async (name) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
        try {
            await safetyApi.deleteHazardType(name);
            notify("Category Deleted", "success");
            loadKeywords(); // Refresh the list
        } catch (err) {
            notify("Failed to delete category", "error");
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h3 style={{margin:0, color:'#1e293b'}}>⚙️ Configure Safety Hazards</h3>
                    <button onClick={onClose} style={styles.closeBtn}>&times;</button>
                </div>

                <div style={styles.inputRow}>
                    <input 
                        type="text" 
                        placeholder="New Hazard Category..." 
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        style={styles.input}
                    />
                    <button onClick={handleAdd} style={styles.addBtn}>Add</button>
                </div>

                <div style={styles.listContainer}>
                    {loading ? <div className="spinner" style={{width:'20px', height:'20px'}}></div> : (
                        keywords.length === 0 ? <p style={{color:'#94a3b8', textAlign:'center'}}>No categories found.</p> :
                        <ul style={styles.list}>
                            {keywords.map((k, i) => (
                                <li key={i} style={styles.item}>
                                    <span style={{fontWeight:'500', color:'#334155'}}>{k}</span>
                                    <button onClick={() => handleDelete(k)} style={styles.delBtn}>🗑️</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' },
    modal: { background: 'white', width: '90%', maxWidth: '450px', borderRadius: '12px', padding: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' },
    closeBtn: { background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', lineHeight: '0.5', color:'#64748b' },
    
    inputRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
    input: { flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize:'0.95rem' },
    addBtn: { background: '#16a34a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
    
    listContainer: { maxHeight: '300px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '8px' },
    list: { listStyle: 'none', padding: 0, margin: 0 },
    item: { display: 'flex', justifyContent: 'space-between', padding: '12px 15px', borderBottom: '1px solid #f1f5f9', alignItems: 'center', background:'white' },
    delBtn: { background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize:'1rem' }
};

export default SafetyMasterConfig;