import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = ({ user }) => {
    const navigate = useNavigate();
    
    const handleLogout = () => {
        if(window.confirm("Are you sure you want to log out?")) {
            localStorage.clear();
            navigate('/login');
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">WIKAMaint</div>
            
            <div className="navbar-user-section">
                {user && (
                    <span className="user-info">
                        {user.name} | <strong>{user.location}</strong>
                    </span>
                )}
                <button className="btn-logout" onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;