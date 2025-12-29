import React from 'react';
import Navbar from '../../components/Navbar';

const KaizenDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return (
        <div style={{background: '#f4f6f9', minHeight: '100vh'}}>
            <Navbar user={user} />
            <div style={{padding: '40px', textAlign: 'center', marginTop: '50px'}}>
                <h1 style={{fontSize: '3rem', marginBottom: '10px'}}>💡</h1>
                <h2 style={{color: '#388e3c'}}>Kaizen Portal</h2>
                <p style={{color: '#666', fontSize: '1.1rem'}}>Idea submission and tracking module coming soon.</p>
                <button onClick={() => window.history.back()} style={styles.backBtn}>Go Back</button>
            </div>
        </div>
    );
};

const styles = {
    backBtn: { marginTop: '20px', padding: '10px 20px', background: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};

export default KaizenDashboard;