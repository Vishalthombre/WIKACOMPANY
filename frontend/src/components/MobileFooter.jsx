import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const MobileFooter = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // 1. Handle Screen Resize (Hide on Desktop, Show on Mobile)
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 2. Add Padding to Body so content isn't hidden behind footer
    useEffect(() => {
        if (isMobile) {
            document.body.style.paddingBottom = '85px';
        } else {
            document.body.style.paddingBottom = '0px';
        }
        // Cleanup when component unmounts
        return () => { document.body.style.paddingBottom = '0px'; };
    }, [isMobile]);

    // 3. Don't render if not mobile or if on Login page
    if (!isMobile || location.pathname === '/login' || location.pathname === '/') {
        return null;
    }

    const isActive = location.pathname === '/dashboard';

    return (
        <div style={styles.container}>
            <button 
                onClick={() => navigate('/dashboard')} 
                style={isActive ? styles.activeButton : styles.button}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                {/* Home Icon */}
                <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={isActive ? styles.activeIcon : styles.icon}
                >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                
                <span style={styles.text}>HOME</span>
            </button>
        </div>
    );
};

// --- INLINE STYLES (No CSS File Needed) ---
const styles = {
    container: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '65px',
        backgroundColor: '#ffffff',
        zIndex: 9999,
        
        // Flex centering
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        
        // 3D & Modern Look
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        borderTop: '1px solid #3b90ffff',
        borderLeft: '1px solid #3b90ffff',
        borderRight: '1px solid #3b90ffff',
        boxShadow: '0 -10px 25px rgba(0,0,0,0.03)',
        
        // iPhone Safe Area
        paddingBottom: 'env(safe-area-inset-bottom)',
    },
    button: {
        background: 'transparent',
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94a3b8', // Inactive Grey
        cursor: 'pointer',
        padding: '8px 30px',
        transition: 'transform 0.1s ease', // Smooth click effect
        borderRadius: '12px',
    },
    activeButton: {
        background: '#f8fafc', // Light BG when active
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#003399', // Active Blue
        cursor: 'pointer',
        padding: '8px 30px',
        transition: 'transform 0.1s ease',
        borderRadius: '12px',
    },
    icon: {
        strokeWidth: '2px',
        transition: 'all 0.2s',
    },
    activeIcon: {
        strokeWidth: '2.5px',
        filter: 'drop-shadow(0 2px 4px rgba(0, 51, 153, 0.2))', // Glow effect
        transform: 'translateY(-2px)', // Slight lift
    },
    text: {
        fontSize: '0.7rem',
        fontWeight: '700',
        marginTop: '4px',
        letterSpacing: '0.5px',
    }
};

export default MobileFooter;