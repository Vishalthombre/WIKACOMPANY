import React, { useEffect, useState } from 'react';
import { adminApi } from '../services/api';
import { useNotification } from '../context/NotificationContext';

const AccessConfig = ({ onClose }) => {
    const { notify } = useNotification();
    const [activeTab, setActiveTab] = useState('MASTER'); // 'MASTER' or 'RULES'
    
    // Master Data State
    const [depts, setDepts] = useState([]);
    const [desigs, setDesigs] = useState([]);
    const [newItem, setNewItem] = useState('');
    
    // Rules State
    const [existingRules, setExistingRules] = useState([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedDesig, setSelectedDesig] = useState('');
    const [selectedRoles, setSelectedRoles] = useState([]);

    const modules = [
        { code: 'FAC', name: 'Facility' },
        { code: 'SAF', name: 'Safety' }
    ];
    const roles = ['ADM', 'PLN', 'TEC', 'USR'];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const master = await adminApi.getJobMasterData();
            setDepts(master.departments);
            setDesigs(master.designations);
            const rules = await adminApi.getAccessRules();
            setExistingRules(rules);
        } catch (err) {
            console.error(err);
        }
    };

    // --- MASTER DATA HANDLERS ---
    const handleAddMaster = async (type) => {
        if (!newItem) return;
        try {
            await adminApi.manageJobMaster({ type, action: 'ADD', name: newItem });
            notify(`${type === 'DEPT' ? 'Department' : 'Designation'} Added`, 'success');
            setNewItem('');
            loadData();
        } catch (err) {
            notify("Failed to add (Duplicate?)", "error");
        }
    };

    const handleDeleteMaster = async (type, id) => {
        if(!window.confirm("Delete this? It might break existing user mappings.")) return;
        try {
            await adminApi.manageJobMaster({ type, action: 'DELETE', id });
            loadData();
        } catch (err) {
            notify("Cannot delete (In Use)", "error");
        }
    };

    // --- RULE HANDLERS ---
    const toggleRuleRole = (mod, role) => {
        const exists = selectedRoles.find(r => r.Module === mod && r.Role === role);
        if (exists) {
            setSelectedRoles(selectedRoles.filter(r => !(r.Module === mod && r.Role === role)));
        } else {
            setSelectedRoles([...selectedRoles, { Module: mod, Role: role }]);
        }
    };

    const handleSaveRule = async () => {
        if (!selectedDept || !selectedDesig || selectedRoles.length === 0) {
            return notify("Please select Dept, Designation and at least one Role", "error");
        }
        try {
            await adminApi.addAccessRule({
                deptId: selectedDept,
                desigId: selectedDesig,
                roles: selectedRoles
            });
            notify("Default Access Rule Saved!", "success");
            setSelectedRoles([]);
            loadData();
        } catch (err) {
            notify("Failed to save rule", "error");
        }
    };

    const handleDeleteRule = async (id) => {
        try {
            await adminApi.deleteAccessRule(id);
            loadData();
        } catch (err) { notify("Failed delete", "error"); }
    };

    return (
        <div style={styles.container}>
            <div style={styles.tabs}>
                <button onClick={() => setActiveTab('MASTER')} style={activeTab === 'MASTER' ? styles.activeTab : styles.tab}>Manage Lists</button>
                <button onClick={() => setActiveTab('RULES')} style={activeTab === 'RULES' ? styles.activeTab : styles.tab}>Manage Default Access</button>
            </div>

            {/* --- TAB 1: MASTER DATA --- */}
            {activeTab === 'MASTER' && (
                <div style={styles.grid}>
                    {/* Departments Column */}
                    <div style={styles.column}>
                        <h4>Departments</h4>
                        <div style={styles.inputGroup}>
                            <input 
                                style={styles.input} 
                                placeholder="New Dept Name" 
                                value={newItem} 
                                onChange={e => setNewItem(e.target.value)}
                            />
                            <button onClick={() => handleAddMaster('DEPT')} style={styles.addBtn}>Add</button>
                        </div>
                        <ul style={styles.list}>
                            {depts.map(d => (
                                <li key={d.DeptID} style={styles.listItem}>
                                    {d.DeptName}
                                    <button onClick={() => handleDeleteMaster('DEPT', d.DeptID)} style={styles.delBtn}>&times;</button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Designations Column */}
                    <div style={styles.column}>
                        <h4>Designations</h4>
                        <div style={styles.inputGroup}>
                            <input 
                                style={styles.input} 
                                placeholder="New Designation" 
                                value={newItem} 
                                onChange={e => setNewItem(e.target.value)}
                            />
                            <button onClick={() => handleAddMaster('DESIG')} style={styles.addBtn}>Add</button>
                        </div>
                        <ul style={styles.list}>
                            {desigs.map(d => (
                                <li key={d.DesigID} style={styles.listItem}>
                                    {d.DesigName}
                                    <button onClick={() => handleDeleteMaster('DESIG', d.DesigID)} style={styles.delBtn}>&times;</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* --- TAB 2: ACCESS RULES --- */}
            {activeTab === 'RULES' && (
                <div style={styles.rulesContainer}>
                    <div style={styles.ruleForm}>
                        <h4>Create Rule</h4>
                        <p style={{fontSize:'0.85rem', color:'#666', marginBottom:'15px'}}>
                            Select a combination. Any NEW employee with this Job Profile will automatically get these roles.
                        </p>
                        
                        <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
                            <select style={styles.select} value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                                <option value="">Select Department...</option>
                                {depts.map(d => <option key={d.DeptID} value={d.DeptID}>{d.DeptName}</option>)}
                            </select>
                            <select style={styles.select} value={selectedDesig} onChange={e => setSelectedDesig(e.target.value)}>
                                <option value="">Select Designation...</option>
                                {desigs.map(d => <option key={d.DesigID} value={d.DesigID}>{d.DesigName}</option>)}
                            </select>
                        </div>

                        <div style={styles.matrix}>
                            {modules.map(mod => (
                                <div key={mod.code} style={styles.matrixRow}>
                                    <span style={{fontWeight:'bold', minWidth:'80px'}}>{mod.name}:</span>
                                    {roles.map(role => (
                                        <label key={role} style={styles.checkboxLabel}>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedRoles.some(r => r.Module === mod.code && r.Role === role)}
                                                onChange={() => toggleRuleRole(mod.code, role)}
                                            />
                                            {role}
                                        </label>
                                    ))}
                                </div>
                            ))}
                        </div>
                        <button onClick={handleSaveRule} style={styles.saveBtn}>Save Rule</button>
                    </div>

                    {/* EXISTING RULES LIST */}
                    <div style={styles.rulesList}>
                        <h4>Active Rules</h4>
                        {existingRules.length === 0 && <p style={{fontStyle:'italic', color:'#999'}}>No rules defined.</p>}
                        <div style={{maxHeight:'300px', overflowY:'auto'}}>
                            {existingRules.map((rule) => (
                                <div key={rule.RuleID} style={styles.ruleItem}>
                                    <div>
                                        <strong>{rule.DeptName}</strong> - {rule.DesigName}
                                    </div>
                                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                        <span style={styles.tag}>{rule.ModulePrefix}-{rule.RoleCode}</span>
                                        <button onClick={() => handleDeleteRule(rule.RuleID)} style={styles.delBtnSmall}>&times;</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { padding: '10px' },
    tabs: { display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '20px' },
    tab: { padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', color: '#666' },
    activeTab: { padding: '10px 20px', background: 'none', borderBottom: '2px solid #003399', fontWeight: 'bold', color: '#003399', cursor: 'pointer' },
    
    // Master Data
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    column: { background: '#f9fafb', padding: '15px', borderRadius: '8px' },
    inputGroup: { display: 'flex', gap: '5px', marginBottom: '10px' },
    input: { flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' },
    addBtn: { background: '#003399', color: 'white', border: 'none', borderRadius: '4px', padding: '0 15px', cursor: 'pointer' },
    list: { listStyle: 'none', padding: 0, margin: 0, maxHeight: '300px', overflowY: 'auto' },
    listItem: { display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #eee', background: 'white' },
    delBtn: { background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px' },

    // Rules
    rulesContainer: { display: 'flex', flexDirection: 'column', gap: '20px' },
    ruleForm: { background: '#fff', border: '1px solid #eee', padding: '20px', borderRadius: '8px' },
    select: { flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ddd' },
    matrix: { marginBottom: '15px', background: '#f4f6f8', padding: '15px', borderRadius: '8px' },
    matrixRow: { display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '15px' },
    checkboxLabel: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', cursor: 'pointer' },
    saveBtn: { width: '100%', padding: '10px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
    
    rulesList: { background: '#fff', border: '1px solid #eee', padding: '20px', borderRadius: '8px' },
    ruleItem: { display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #f0f0f0' },
    tag: { background: '#e3f2fd', color: '#1565c0', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold' },
    delBtnSmall: { background: 'none', border: 'none', color: '#999', fontSize: '1.2rem', cursor: 'pointer' }
};

export default AccessConfig;