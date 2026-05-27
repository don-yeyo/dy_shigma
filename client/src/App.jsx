import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, useTheme } from "./config/ThemeContext";
import { AuthProvider, useAuth } from './config/AuthContext';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import './index.css';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import { Button } from './components/Button';

// SHIGMA Pages
import ResiduosComunes from './pages/shigma/ResiduosComunes';
import ResiduosEspeciales from './pages/shigma/ResiduosEspeciales';
import Devoluciones from './pages/shigma/Devoluciones';
import Tratamiento from './pages/shigma/Tratamiento';
import EconomiaCircular from './pages/shigma/EconomiaCircular';
import Pallets from './pages/shigma/Pallets';
import EspaciosVerdes from './pages/shigma/EspaciosVerdes';
import HistorialTrazabilidad from './pages/shigma/HistorialTrazabilidad';
import GestionBateas from './pages/shigma/GestionBateas';
import GestionOperadores from './pages/shigma/GestionOperadores';

import logo from './assets/logo-don-yeyo-png-sin-fondo.png';
import microsoftLogo from './assets/microsoft-logo.png';
import googleLogo from './assets/google-logo.svg';
import { Sun, Moon } from 'lucide-react';

const AuthGate = ({ children }) => {
    const { isAuthenticated, loading, login, loginGoogle, logout, authError } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const googleId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // Solo inicializamos el hook si hay un ID válido
    const handleGoogleLogin = googleId ? useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                loginGoogle(res.data);
            } catch (error) {
                console.error('Error fetching Google user info:', error);
            }
        },
        onError: (error) => console.log('Login Failed:', error)
    }) : null;

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="card loading-card">Cargando aplicación...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="glass login-container" style={{
                height: '100vh',
                display: 'flex',
                gap: '8px',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                background: 'var(--dy-bg-dark)',
            }}>
                <button
                    onClick={toggleTheme}
                    className="mode-toggle"
                    style={{
                        position: 'absolute',
                        top: '24px',
                        right: '24px',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                    title="Cambiar modo"
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                <img src={logo} alt={import.meta.env.VITE_COMPANY_NAME_SHORT || 'SHIGMA'} style={{ height: '140px', marginBottom: '16px', objectFit: 'contain' }} />
                
                <h1 style={{ fontWeight: '800', color: 'var(--header-text)', margin: 0 }}>
                    SHIGMA
                </h1>

                <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '16px 0 32px 0', fontSize: '1.1rem', textAlign: 'center' }}>
                    Bienvenido. Gestión de Seguridad, Higiene y Medioambiente de {import.meta.env.VITE_COMPANY_NAME || 'la empresa'}.
                </p>

                <div className="login-options">
                    {authError ? (
                        <div style={{
                            padding: '16px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid var(--dy-red)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--dy-red)',
                            textAlign: 'center',
                            marginBottom: '16px',
                            fontSize: '0.9rem'
                        }}>
                            <p style={{ margin: '0 0 12px 0' }}>{authError}</p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    // Limpiamos todo para que pueda intentar con otra cuenta
                                    logout();
                                }}
                                style={{ width: '100%' }}
                            >
                                Cambiar de Cuenta
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Button
                                className="btn-microsoft"
                                onClick={login}
                                disabled={loading}
                            >
                                <img
                                    src={microsoftLogo}
                                    alt="Microsoft"
                                    style={{ height: '26px', width: '26px', objectFit: 'contain' }}
                                />
                                Inicia sesión con Microsoft
                            </Button>

                            {googleId && import.meta.env.VITE_ENABLE_GOOGLE_LOGIN !== 'false' && (
                                <>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        width: '100%',
                                        maxWidth: '320px',
                                        margin: '8px 0',
                                        color: 'var(--text-muted)',
                                        fontSize: '0.9rem'
                                    }}>
                                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                                        <span>O</span>
                                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                                    </div>

                                    <Button
                                        className="btn-google"
                                        onClick={() => handleGoogleLogin && handleGoogleLogin()}
                                        disabled={loading}
                                    >
                                        <img
                                            src={googleLogo}
                                            alt="Google"
                                            style={{ height: '26px', width: '26px', objectFit: 'contain' }}
                                        />
                                        Inicia sesión con Google
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }

    return children;
};

function App() {
    const googleId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    const content = (
        <AuthProvider>
            <ThemeProvider>
                <Router>
                    <AuthGate>
                        <Layout>
                            <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/configuracion" element={<Settings />} />

                                {/* SHIGMA Routes */}
                                <Route path="/residuos-comunes" element={<ResiduosComunes />} />
                                <Route path="/gestion-bateas" element={<GestionBateas />} />
                                <Route path="/residuos-especiales" element={<ResiduosEspeciales />} />
                                <Route path="/devoluciones" element={<Devoluciones />} />
                                <Route path="/tratamiento" element={<Tratamiento />} />
                                <Route path="/economia-circular" element={<EconomiaCircular />} />
                                <Route path="/pallets" element={<Pallets />} />
                                <Route path="/espacios-verdes" element={<EspaciosVerdes />} />
                                <Route path="/historial" element={<HistorialTrazabilidad />} />
                                <Route path="/gestion-operadores" element={<GestionOperadores />} />
                            </Routes>
                        </Layout>
                    </AuthGate>
                </Router>
            </ThemeProvider>
        </AuthProvider>
    );

    if (googleId) {
        return (
            <GoogleOAuthProvider clientId={googleId}>
                {content}
            </GoogleOAuthProvider>
        );
    }

    return content;
}

export default App;
