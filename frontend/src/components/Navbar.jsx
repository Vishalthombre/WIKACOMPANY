import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import { api } from '../services/api';
import { getCroppedImg } from '../utils/cropUtils';

// --- VECTOR ICONS ---
const Icons = {
    Camera: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
    Mail: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    Pin: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    Logout: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

const Navbar = ({ user }) => {
    const navigate = useNavigate();
    const [showProfile, setShowProfile] = useState(false);
    const [profileImg, setProfileImg] = useState(user?.profileImage || null);
    
    // Crop & Upload State
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropping, setIsCropping] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const fileInputRef = useRef(null);

    useEffect(() => {
        if (user?.profileImage) setProfileImg(user.profileImage);
    }, [user]);

    const handleLogout = () => {
        if(window.confirm("Are you sure you want to log out?")) {
            localStorage.clear();
            navigate('/login');
        }
    };

    const onFileSelect = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setImageSrc(reader.result);
                setIsCropping(true);
                setShowProfile(false);
            };
        }
    };

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const saveCroppedImage = async () => {
        try {
            setIsUploading(true);
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            const options = { maxSizeMB: 0.4, maxWidthOrHeight: 800, useWebWorker: true };
            const compressedFile = await imageCompression(croppedBlob, options);

            const reader = new FileReader();
            reader.readAsDataURL(compressedFile);
            reader.onloadend = async () => {
                const base64String = reader.result;
                await api.updateProfilePic({
                    globalId: user.id || user.GlobalID,
                    imageBase64: base64String
                });

                setProfileImg(base64String);
                const storedUser = JSON.parse(localStorage.getItem('user'));
                if (storedUser) {
                    storedUser.profileImage = base64String;
                    localStorage.setItem('user', JSON.stringify(storedUser));
                }

                setIsCropping(false);
                setIsUploading(false);
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            };
        } catch (e) {
            console.error(e);
            setIsUploading(false);
        }
    };

    const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

    return (
        <>
            <nav style={styles.navbar}>
                {/* --- BRANDING --- */}
                <div style={styles.brand}>
                    <div style={styles.logo3D}>
                        WIKA<span style={{ color: '#FF8800' }}>MAINT</span>
                    </div>
                    <div style={styles.subText}>{user?.location || 'Plant Dashboard'}</div>
                </div>

                {/* --- PROFILE AVATAR --- */}
                <div style={{ position: 'relative' }}>
                    <div 
                        onClick={() => setShowProfile(!showProfile)} 
                        style={{...styles.avatarContainer, ...(showProfile ? styles.avatarActive : {})}}
                    >
                        <img src={profileImg || defaultAvatar} style={styles.avatarImg} alt="Profile" />
                        <div style={styles.statusDot}></div>
                    </div>

                    {showProfile && (
                        <>
                            <div style={styles.overlay} onClick={() => setShowProfile(false)} />
                            
                            {/* POPUP CARD */}
                            <div style={styles.dropdown}>
                                <div style={styles.dropdownHeader}>
                                    <div style={styles.largeAvatarWrapper}>
                                        <img src={profileImg || defaultAvatar} style={styles.largeAvatarImg} />
                                        <button 
                                            className="camera-hover" 
                                            onClick={() => fileInputRef.current.click()} 
                                            style={styles.cameraBtn}
                                        >
                                            <Icons.Camera />
                                        </button>
                                        <input type="file" ref={fileInputRef} style={{display:'none'}} accept="image/*" onChange={onFileSelect}/>
                                    </div>
                                    <div style={styles.userName}>{user?.name}</div>
                                    <div style={styles.userRole}>ID: {user?.id || user?.GlobalID}</div>
                                </div>

                                <div style={styles.dropdownBody}>
                                    <div style={styles.infoRow}>
                                        <span style={styles.icon}><Icons.Mail /></span>
                                        <span style={styles.infoText}>{user?.email}</span>
                                    </div>
                                    <div style={styles.infoRow}>
                                        <span style={styles.icon}><Icons.Pin /></span>
                                        <span style={styles.infoText}>{user?.location}</span>
                                    </div>
                                </div>

                                <div style={styles.dropdownFooter}>
                                    <button 
                                        className="logout-hover" 
                                        onClick={handleLogout} 
                                        style={styles.logoutBtn}
                                    >
                                        <span style={{marginRight:'8px', display:'flex'}}><Icons.Logout /></span>
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </nav>

            {/* --- CROP MODAL --- */}
            {isCropping && (
                <div style={styles.modalOverlay}>
                    <div style={styles.cropContainer}>
                        <div style={styles.cropHeader}>Update Profile Photo</div>
                        <div style={styles.cropWrapper}>
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                cropShape="round"
                            />
                        </div>
                        <div style={styles.controls}>
                            <span style={styles.zoomLabel}>Zoom Level</span>
                            <input 
                                type="range" 
                                value={zoom} min={1} max={3} step={0.1} 
                                onChange={(e) => setZoom(e.target.value)} 
                                style={styles.slider}
                            />
                            <div style={styles.buttonGroup}>
                                <button className="btn-hover" onClick={() => setIsCropping(false)} style={styles.cancelBtn}>Cancel</button>
                                <button className="btn-hover" onClick={saveCroppedImage} style={styles.saveBtn} disabled={isUploading}>
                                    {isUploading ? "Processing..." : "Save Photo"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SUCCESS POPUP --- */}
            {showSuccess && (
                <div style={styles.successPopup}>
                    ✅ Profile Updated Successfully!
                </div>
            )}
        </>
    );
};

// --- STYLES ---
const styles = {
    navbar: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 30px', height: '70px',
        background: 'linear-gradient(135deg, #001a4d 0%, #003399 100%)', 
        color: 'white', position: 'relative', zIndex: 100,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)' 
    },
    
    brand: { display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    
    logo3D: { 
        fontFamily: 'Poppins, sans-serif', 
        fontWeight: '900', 
        fontSize: '1.8rem', 
        letterSpacing: '1px',
        color: 'white',
        textShadow: '0 2px 0 #ccc, 0 3px 0 #bbb, 0 4px 10px rgba(0,0,0,0.4)',
        lineHeight: '1'
    },
    subText: { 
        fontSize: '0.75rem', opacity: 0.8, fontWeight: '500', 
        letterSpacing: '2px', textTransform: 'uppercase', marginTop: '4px', marginLeft: '2px'
    },
    
    // Avatar
    avatarContainer: { 
        width: '45px', height: '45px', borderRadius: '50%', 
        border: '2px solid rgba(255,255,255,0.4)', 
        cursor: 'pointer', position: 'relative',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
    },
    
    // ✅ FIX: Using full 'border' property to prevent mixing conflicts
    avatarActive: { 
        border: '2px solid #fff', // Replaces borderColor
        transform: 'scale(1.05)', 
        boxShadow: '0 0 0 4px rgba(255,255,255,0.1)' 
    },
    
    avatarImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
    statusDot: { width: '12px', height: '12px', background: '#2ecc71', borderRadius: '50%', position: 'absolute', bottom: '0', right: '0', border: '2px solid #003399' },
    
    // Dropdown
    overlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99 },
    dropdown: { 
        position: 'absolute', top: '75px', right: '0', width: '300px',
        background: 'white', borderRadius: '16px', 
        boxShadow: '0 25px 60px -10px rgba(0,0,0,0.4)', 
        overflow: 'hidden', zIndex: 100, color: '#1e293b',
        transformOrigin: 'top right',
        animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    },
    dropdownHeader: { background: 'linear-gradient(to bottom, #f1f5f9, #fff)', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid #e2e8f0' },
    largeAvatarWrapper: { width: '80px', height: '80px', borderRadius: '50%', border: '4px solid white', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', position: 'relative', marginBottom: '12px', background: '#e2e8f0' },
    largeAvatarImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
    
    cameraBtn: { position: 'absolute', bottom: '0', right: '0', width: '32px', height: '32px', borderRadius: '50%', background: '#003399', border: '3px solid white', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'transform 0.2s' },
    
    userName: { fontFamily: 'Poppins, sans-serif', fontWeight: '700', fontSize: '1.2rem', color: '#0f172a' },
    userRole: { fontSize: '0.8rem', color: '#64748b', marginTop: '4px', background: '#f1f5f9', padding: '4px 12px', borderRadius: '20px', fontWeight: '500' },
    
    dropdownBody: { padding: '20px' },
    infoRow: { display: 'flex', alignItems: 'center', marginBottom: '14px', color: '#334155' },
    icon: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: '#f8fafc', color: '#003399', marginRight: '14px' },
    infoText: { fontSize: '0.9rem', fontWeight: '500' },
    
    dropdownFooter: { padding: '16px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' },
    
    logoutBtn: { width: '100%', padding: '12px', border: 'none', background: '#fff', color: '#ef4444', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fee2e2', transition: 'all 0.2s' },

    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    cropContainer: { width: '90%', maxWidth: '450px', background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
    cropHeader: { padding: '16px', textAlign: 'center', fontWeight: '600', fontSize: '1.1rem', borderBottom: '1px solid #e2e8f0', color: '#1e293b' },
    cropWrapper: { position: 'relative', width: '100%', height: '300px', background: '#0f172a' },
    controls: { padding: '24px' },
    slider: { width: '100%', margin: '10px 0 24px', accentColor: '#003399' },
    buttonGroup: { display: 'flex', gap: '12px' },
    saveBtn: { flex: 1, padding: '12px', background: '#003399', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'opacity 0.2s' },
    cancelBtn: { flex: 1, padding: '12px', background: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' },
    
    successPopup: { position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: '#065f46', color: 'white', padding: '12px 24px', borderRadius: '50px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: '500', fontSize: '0.95rem', zIndex: 3000, animation: 'slideUp 0.4s ease-out' }
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes popIn { from { opacity: 0; transform: scale(0.95) translateY(-5px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    @keyframes slideUp { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
    
    /* HOVER EFFECTS */
    .logout-hover:hover { background-color: #fee2e2 !important; border-color: #ef4444 !important; }
    .camera-hover:hover { transform: scale(1.15); }
    .btn-hover:hover { opacity: 0.9; transform: translateY(-1px); }
`;
document.head.appendChild(styleSheet);

export default Navbar;