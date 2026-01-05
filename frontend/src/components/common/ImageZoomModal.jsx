import React, { useState } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { IMAGE_BASE_URL } from '../../config';

// Simple Icon for the Error State
const ImageOffIcon = () => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{color: '#94a3b8', marginBottom:'15px'}}>
        <line x1="1" y1="1" x2="23" y2="23"></line>
        <path d="M21 21l-2-2m-3.268-3.268L12.5 12.5"></path>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <path d="M3 11V6a2 2 0 0 1 2-2h2"></path>
        <path d="M12 4h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

const ImageZoomModal = ({ imagePath, onClose }) => {
    const [hasError, setHasError] = useState(false);

    // --- ROBUST URL GENERATOR ---
    const getSafeUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path; 

        // 1. Clean Windows slashes
        let clean = path.replace(/\\/g, '/');

        // 2. Remove accidental prefixes
        clean = clean.replace(/^public\//, '').replace(/^backend\//, '');

        // 3. Remove leading slash
        if (clean.startsWith('/')) clean = clean.substring(1);

        // 4. Default Logic: Ensure it starts with uploads/
        if (!clean.startsWith('uploads/')) {
            clean = 'uploads/' + clean;
        }

        // 5. Construct URL + Cache Buster
        return `${IMAGE_BASE_URL}/${clean}?t=${Date.now()}`;
    };

    const imageUrl = getSafeUrl(imagePath);

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.container} onClick={e => e.stopPropagation()}>
                
                {/* HEADER */}
                <div style={styles.header}>
                    <span style={styles.title}>Image View</span>
                    <button onClick={onClose} style={styles.closeBtn}>&times;</button>
                </div>

                {/* CONTENT AREA */}
                <div style={styles.content}>
                    {hasError ? (
                        // --- ERROR STATE UI ---
                        <div style={styles.errorBox}>
                            <ImageOffIcon />
                            <h3 style={{color:'#1e293b', margin:'0 0 5px'}}>Image Not Available</h3>
                            <p style={{color:'#64748b', fontSize:'0.9rem', textAlign:'center', maxWidth:'80%'}}>
                                The file could not be loaded. It may have been deleted or moved.
                            </p>
                        </div>
                    ) : (
                        <TransformWrapper
                            initialScale={1}
                            minScale={0.5}
                            maxScale={4}
                            centerOnInit={true}
                            wheel={{ step: 0.2 }}
                        >
                            {({ zoomIn, zoomOut, resetTransform }) => (
                                <React.Fragment>
                                    <div style={styles.imageWrapper}>
                                        <TransformComponent wrapperStyle={{width:'100%', height:'100%'}}>
                                            <img 
                                                src={imageUrl} 
                                                alt="Evidence" 
                                                style={styles.img} 
                                                onError={() => setHasError(true)}
                                            />
                                        </TransformComponent>
                                    </div>

                                    {/* CONTROLS */}
                                    <div style={styles.controls}>
                                        <button onClick={() => zoomIn()} style={styles.ctrlBtn} title="Zoom In">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                        </button>
                                        <button onClick={() => zoomOut()} style={styles.ctrlBtn} title="Zoom Out">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                        </button>
                                        <div style={styles.divider}></div>
                                        <button onClick={() => resetTransform()} style={styles.resetBtn}>
                                            Reset
                                        </button>
                                    </div>
                                </React.Fragment>
                            )}
                        </TransformWrapper>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- STYLES ---
const styles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        // Semi-transparent dark background to make the dashboard behind visible but dim
        backgroundColor: 'rgba(0, 0, 0, 0.6)', 
        zIndex: 2000,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '20px',
        // BLUR EFFECT ON THE BACKGROUND
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
    },
    container: {
        width: '100%', maxWidth: '900px', height: '80vh',
        backgroundColor: '#ffffff', // White Background (Light Mode)
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0',
        animation: 'fadeIn 0.2s ease-out'
    },
    header: {
        padding: '15px 25px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    title: { color: '#1e293b', fontWeight: '700', fontSize: '1.1rem', letterSpacing: '0.5px' },
    closeBtn: {
        background: 'transparent', border: 'none', color: '#64748b',
        fontSize: '2rem', lineHeight: '0.5', cursor: 'pointer',
        transition: 'color 0.2s', padding: '0 5px'
    },
    content: {
        flex: 1, position: 'relative',
        backgroundColor: '#f8fafc', // Very light gray for image area
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        overflow: 'hidden',
        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', // Subtle pattern
        backgroundSize: '20px 20px'
    },
    imageWrapper: { width: '100%', height: '100%' },
    img: { width: '100%', height: '100%', objectFit: 'contain' },
    
    // Controls - Floating Pill
    controls: {
        position: 'absolute', bottom: '25px',
        display: 'flex', alignItems: 'center', gap: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Glassy White
        padding: '8px 12px', borderRadius: '50px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(4px)'
    },
    ctrlBtn: {
        background: 'white', 
        color: '#334155', 
        border: '1px solid #cbd5e0',
        width: '40px', height: '40px', borderRadius: '50%', // Circle buttons
        cursor: 'pointer', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    },
    resetBtn: {
        background: '#1e293b', // Dark button for primary action
        color: 'white', 
        border: 'none',
        padding: '0 20px', // Horizontal padding so text fits
        height: '40px', 
        borderRadius: '20px', // Pill shape
        cursor: 'pointer', 
        fontWeight: '600',
        fontSize: '0.9rem',
        transition: 'all 0.2s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        whiteSpace: 'nowrap' // Prevents text wrapping
    },
    divider: {
        width: '1px', height: '24px', background: '#cbd5e0', margin: '0 5px'
    },
    
    // Error State
    errorBox: { 
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100%', width: '100%', padding: '20px'
    }
};

export default ImageZoomModal;