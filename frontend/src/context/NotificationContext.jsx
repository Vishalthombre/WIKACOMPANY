import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    // State for Toasts
    const [toasts, setToasts] = useState([]);
    
    // State for Confirm Dialog
    const [confirmState, setConfirmState] = useState({ 
        isOpen: false, 
        message: '', 
        resolve: null 
    });

    // --- TOAST FUNCTION ---
    const notify = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    // --- CONFIRM FUNCTION (Promise based) ---
    // Usage: const isConfirmed = await confirm("Are you sure?");
    const confirm = (message) => {
        return new Promise((resolve) => {
            setConfirmState({ isOpen: true, message, resolve });
        });
    };

    const handleConfirmChoice = (choice) => {
        if (confirmState.resolve) confirmState.resolve(choice);
        setConfirmState({ ...confirmState, isOpen: false });
    };

    return (
        <NotificationContext.Provider value={{ notify, confirm }}>
            {children}

            {/* Render Toasts */}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast ${t.type}`}>
                        <span className="toast-icon">
                            {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}
                        </span>
                        <span className="toast-msg">{t.message}</span>
                    </div>
                ))}
            </div>

            {/* Render Confirm Modal */}
            {confirmState.isOpen && (
                <div className="confirm-overlay">
                    <div className="confirm-box">
                        <div className="confirm-title">Confirmation Required</div>
                        <div className="confirm-desc">{confirmState.message}</div>
                        <div className="confirm-actions">
                            <button className="btn-confirm-no" onClick={() => handleConfirmChoice(false)}>Cancel</button>
                            <button className="btn-confirm-yes" onClick={() => handleConfirmChoice(true)}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);