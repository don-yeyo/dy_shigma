import React from 'react';
import { 
    X, Settings, LayoutDashboard, History, Trash2, 
    ShieldAlert, CornerUpLeft, RefreshCw, Recycle, Package, Leaf, Scale, Users
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Drawer = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const mainItems = [
        { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/' },
        { icon: <History size={18} />, label: 'Historial / Auditoría', path: '/historial' },
        { icon: <Users size={18} />, label: 'Gestión de Operadores', path: '/gestion-operadores' },
    ];

    const formItems = [
        { icon: <Trash2 size={18} />, label: 'Residuos No Especiales (RINE)', path: '/residuos-comunes' },
        { icon: <Scale size={18} />, label: 'Gestión de Bateas', path: '/gestion-bateas' },
        { icon: <ShieldAlert size={18} />, label: 'Residuos Especiales', path: '/residuos-especiales' },
        { icon: <CornerUpLeft size={18} />, label: 'Devoluciones', path: '/devoluciones' },
        { icon: <RefreshCw size={18} />, label: 'Tratamiento', path: '/tratamiento' },
        { icon: <Recycle size={18} />, label: 'Economía Circular', path: '/economia-circular' },
        { icon: <Package size={18} />, label: 'Gestión de Pallets', path: '/pallets' },
        { icon: <Leaf size={18} />, label: 'Espacios Verdes', path: '/espacios-verdes' },
    ];

    const handleClick = (path) => {
        navigate(path);
        onClose();
    };

    const renderLink = (item) => {
        const isActive = location.pathname === item.path;
        return (
            <button
                key={item.path}
                onClick={() => handleClick(item.path)}
                style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    background: isActive ? 'rgba(228, 5, 33, 0.08)' : 'transparent',
                    color: isActive ? 'var(--dy-red)' : 'var(--text)',
                    fontWeight: isActive ? 700 : 500,
                    border: isActive ? '1px solid rgba(228, 5, 33, 0.2)' : 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    marginBottom: '4px',
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap'
                }}
            >
                <span style={{ 
                    color: isActive ? 'var(--dy-red)' : 'var(--text-muted)', 
                    marginRight: '12px', 
                    display: 'flex', 
                    alignItems: 'center' 
                }}>
                    {item.icon}
                </span>
                {item.label}
            </button>
        );
    };

    return (
        <>
            <div
                className={`drawer-overlay ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />
            <div className={`drawer ${isOpen ? 'open' : ''} glass`} style={{ 
                display: 'flex', 
                flexDirection: 'column',
                height: '100vh',
                paddingBottom: '20px'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexShrink: 0 }}>
                    <h2 style={{ fontSize: '1.2rem', color: 'var(--drawer-title)', fontWeight: 800 }}>Menú SHIGMA</h2>
                    <button className="mode-toggle" onClick={onClose} style={{ cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation (Scrollable) */}
                <div style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    paddingRight: '4px',
                    marginBottom: '20px'
                }}>
                    {/* Sección Principal */}
                    <div style={{ marginBottom: '20px' }}>
                        <p style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 700, 
                            color: 'var(--text-muted)', 
                            textTransform: 'uppercase', 
                            letterSpacing: '1px',
                            marginBottom: '8px',
                            paddingLeft: '8px'
                        }}>General</p>
                        {mainItems.map(renderLink)}
                    </div>

                    {/* Sección Formularios */}
                    <div style={{ marginBottom: '20px' }}>
                        <p style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 700, 
                            color: 'var(--text-muted)', 
                            textTransform: 'uppercase', 
                            letterSpacing: '1px',
                            marginBottom: '8px',
                            paddingLeft: '8px'
                        }}>Registros Reciclado</p>
                        {formItems.map(renderLink)}
                    </div>

                    {/* Separador */}
                    <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />

                    {/* Configuración */}
                    {renderLink({ icon: <Settings size={18} />, label: 'Configuración', path: '/configuracion' })}
                </div>

                {/* Footer */}
                <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: 'auto' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--drawer-footer)', fontWeight: 700, letterSpacing: '0.5px' }}>DON YEYO S.A.</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SHIGMA v{__APP_VERSION__}</p>
                </div>
            </div>
        </>
    );
};

export default Drawer;
