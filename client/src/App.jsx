import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
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
import GestionUsuarios from './pages/GestionUsuarios';

import logo from './assets/logo-don-yeyo-png-sin-fondo.png';
import microsoftLogo from './assets/microsoft-logo.png';
import googleLogo from './assets/google-logo.svg';
import { Sun, Moon, ShieldAlert, ArrowLeft } from 'lucide-react';

// ── Componente de Acceso Restringido ──────────────────────────────────────────
const AccessDenied = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleGoBack = () => {
        if (user?.rol === 'sysadmin' || user?.rol === 'supervisor') {
            navigate('/');
        } else if (user?.modulos && user.modulos.length > 0) {
            navigate(`/${user.modulos[0]}`);
        } else {
            navigate('/configuracion');
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '70vh',
            padding: '24px',
            textAlign: 'center',
        }}>
            <div className="card" style={{
                maxWidth: '460px',
                padding: '40px 32px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                borderRadius: '16px'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(228, 5, 33, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--dy-red)',
                    marginBottom: '24px',
                }}>
                    <ShieldAlert size={36} />
                </div>

                <h1 style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    color: 'var(--header-text)',
                    margin: '0 0 12px 0',
                }}>
                    Acceso Restringido
                </h1>

                <p style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.95rem',
                    lineHeight: '1.5',
                    margin: '0 0 28px 0',
                }}>
                    No tenés los permisos o el módulo asignado necesario para acceder a esta sección del sistema. Si considerás que es un error, por favor contactate con el administrador.
                </p>

                <button
                    onClick={handleGoBack}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 24px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'var(--dy-red)',
                        color: '#fff',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        transition: 'opacity 0.2s',
                    }}
                >
                    <ArrowLeft size={16} /> Volver a mi Sección
                </button>
            </div>
        </div>
    );
};

// ── Guardián de Rutas (Roles y Módulos) ─────────────────────────────────────────
const RouteGuard = ({ children, allowedRoles, requiredModulo }) => {
    const { hasRole, hasModulo, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="card loading-card">Cargando permisos...</div>
            </div>
        );
    }

    let hasAccess = true;
    if (allowedRoles && allowedRoles.length > 0) {
        hasAccess = hasRole(...allowedRoles);
    }
    if (hasAccess && requiredModulo) {
        hasAccess = hasModulo(requiredModulo);
    }

    if (!hasAccess) {
        return <AccessDenied />;
    }

    return children;
};

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
                                <Route path="/residuos-comunes" element={
                                    <RouteGuard requiredModulo="residuos-comunes">
                                        <ResiduosComunes />
                                    </RouteGuard>
                                } />
                                <Route path="/gestion-bateas" element={
                                    <RouteGuard requiredModulo="gestion-bateas">
                                        <GestionBateas />
                                    </RouteGuard>
                                } />
                                <Route path="/residuos-especiales" element={
                                    <RouteGuard requiredModulo="residuos-especiales">
                                        <ResiduosEspeciales />
                                    </RouteGuard>
                                } />
                                <Route path="/devoluciones" element={
                                    <RouteGuard requiredModulo="devoluciones">
                                        <Devoluciones />
                                    </RouteGuard>
                                } />
                                <Route path="/tratamiento" element={
                                    <RouteGuard requiredModulo="tratamiento">
                                        <Tratamiento />
                                    </RouteGuard>
                                } />
                                <Route path="/economia-circular" element={
                                    <RouteGuard requiredModulo="economia-circular">
                                        <EconomiaCircular />
                                    </RouteGuard>
                                } />
                                <Route path="/pallets" element={
                                    <RouteGuard requiredModulo="pallets">
                                        <Pallets />
                                    </RouteGuard>
                                } />
                                <Route path="/espacios-verdes" element={
                                    <RouteGuard requiredModulo="espacios-verdes">
                                        <EspaciosVerdes />
                                    </RouteGuard>
                                } />
                                <Route path="/historial" element={<HistorialTrazabilidad />} />
                                <Route path="/gestion-operadores" element={
                                    <RouteGuard requiredModulo="gestion-operadores">
                                        <GestionOperadores />
                                    </RouteGuard>
                                } />
                                <Route path="/gestion-usuarios" element={
                                    <RouteGuard allowedRoles={['sysadmin']}>
                                        <GestionUsuarios />
                                    </RouteGuard>
                                } />
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
