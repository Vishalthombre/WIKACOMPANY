import React, { useEffect, useState } from 'react';

const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Check if user "Snoozed" this recently
    const dismissedTime = localStorage.getItem('installPromptDismissed');
    const isSnoozed = dismissedTime && (Date.now() - parseInt(dismissedTime) < 7 * 24 * 60 * 60 * 1000); // 7 Days

    if (isSnoozed) return;

    const handler = (e) => {
      e.preventDefault(); // Prevent default browser banner
      setDeferredPrompt(e); // Save event
      setIsVisible(true);   // Show our button
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    // If they install, hide button permanently
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    // 2. Snooze for 7 days
    localStorage.setItem('installPromptDismissed', Date.now().toString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <span style={styles.icon}>📲</span>
        <div style={styles.text}>
          <div style={styles.title}>Install App</div>
          <div style={styles.desc}>Add to Home Screen for quick access</div>
        </div>
      </div>
      <div style={styles.actions}>
        <button onClick={handleDismiss} style={styles.dismissBtn}>Later</button>
        <button onClick={handleInstall} style={styles.installBtn}>Install</button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
    width: '90%', maxWidth: '400px', background: 'white',
    borderRadius: '12px', padding: '15px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 10000,
    display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid #eee',
    animation: 'slideUp 0.5s ease-out'
  },
  content: { display: 'flex', alignItems: 'center', gap: '15px' },
  icon: { fontSize: '2rem' },
  text: { flex: 1 },
  title: { fontWeight: '700', color: '#333', fontSize: '1rem' },
  desc: { color: '#666', fontSize: '0.85rem' },
  actions: { display: 'flex', gap: '10px' },
  installBtn: {
    flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
    background: '#003399', color: 'white', fontWeight: '700', cursor: 'pointer'
  },
  dismissBtn: {
    flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd',
    background: 'white', color: '#666', fontWeight: '600', cursor: 'pointer'
  }
};

// Add animation style globally or inline
const styleSheet = document.createElement("style");
styleSheet.innerText = `@keyframes slideUp { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }`;
document.head.appendChild(styleSheet);

export default InstallButton;