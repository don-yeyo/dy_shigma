import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../config/AuthContext";
import { Menu, Sun, Moon, LogOut, User } from 'lucide-react';
import pkg from '../../package.json';
const appVersion = pkg.version;

const Header = ({ onMenuClick, theme, toggleTheme }) => {
    const { user, logout } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const navigate = useNavigate();

    const name = user?.name || "Usuario";
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    const handleLogout = () => {
        logout();
    };

    return (
        <header className="header glass">
            <div className="header-left">
                <button className="mode-toggle" onClick={onMenuClick}>
                    <Menu size={24} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 className="desktop-only" style={{ fontSize: '1.1rem', margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        SHIGMA
                        <span style={{ fontSize: '0.65rem', fontWeight: 500, opacity: 0.6, backgroundColor: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                            v{appVersion}
                        </span>
                    </h2>
                    <h2 className="mobile-only" style={{ fontSize: '1.1rem', margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        SHIGMA
                        <span style={{ fontSize: '0.65rem', fontWeight: 500, opacity: 0.6, backgroundColor: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                            v{appVersion}
                        </span>
                    </h2>
                </div>
            </div>

            <div className="header-right">
                <button className="mode-toggle desktop-only" onClick={toggleTheme} title="Cambiar modo">
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                <div
                    className="avatar-container"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    style={{ position: 'relative' }}
                >
                    <span className="user-name desktop-only">{name}</span>
                    <div className="avatar">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                        ) : (
                            initials || <User size={20} />
                        )}
                    </div>

                    {showUserMenu && (
                        <div className="glass" style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '8px',
                            minWidth: '180px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            zIndex: 150,
                            textAlign: 'left'
                        }}>
                            <button
                                className="mobile-only"
                                onClick={toggleTheme}
                                style={{
                                    width: '100%', padding: '12px 16px', borderRadius: 0,
                                    justifyContent: 'flex-start', background: 'transparent',
                                    fontSize: '0.9rem', border: 'none', textAlign: 'left'
                                }}
                            >
                                {theme === 'light' ? <Moon size={18} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> : <Sun size={18} style={{ marginRight: '10px', verticalAlign: 'middle' }} />}
                                {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
                            </button>

                            <button
                                onClick={handleLogout}
                                style={{
                                    width: '100%', padding: '12px 16px', borderRadius: 0,
                                    justifyContent: 'flex-start', color: 'var(--error)',
                                    background: 'transparent', fontSize: '0.9rem',
                                    border: 'none', textAlign: 'left'
                                }}
                            >
                                <LogOut size={18} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
                                Cerrar Sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
