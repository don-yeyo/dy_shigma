import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Scale, CornerUpLeft } from 'lucide-react';
import { Button } from '../../components/Button';

const DespachoRine = () => {
    const navigate = useNavigate();

    // Scroll to top always on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const options = [
        {
            id: 'estado-bateas',
            label: 'Estado de Bateas',
            icon: Scale,
            color: '#10b981',
            bg: 'rgba(16, 185, 129, 0.05)',
            selectedBg: 'rgba(16, 185, 129, 0.1)',
            path: '/gestion-bateas',
            desc: 'Monitoreo de almacenamiento de residuos y despacho con manifiestos.'
        },
        {
            id: 'despacho-recuperables',
            label: 'Despacho de Recuperables',
            icon: Package,
            color: '#3b82f6',
            bg: 'rgba(59, 130, 246, 0.05)',
            selectedBg: 'rgba(59, 130, 246, 0.1)',
            path: '/gestion-deposito',
            desc: 'Monitoreo de acopio físico de materiales y gestión de despachos.'
        },
        {
            id: 'devoluciones',
            label: 'Devoluciones',
            icon: CornerUpLeft,
            color: '#f59e0b',
            bg: 'rgba(245, 158, 11, 0.05)',
            selectedBg: 'rgba(245, 158, 11, 0.1)',
            path: '/devoluciones',
            desc: 'Devolución de materiales, envases o cajones rotos a proveedores.'
        }
    ];

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2.1rem', fontWeight: '900', color: 'var(--primary)' }}>
                        Despacho de RINE<span style={{ color: 'var(--dy-red)' }}>.</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Seleccione el tipo de operación de despacho que desea realizar.
                    </p>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
            }}>
                {options.map(opt => {
                    const IconComponent = opt.icon;
                    return (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => navigate(opt.path)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                padding: '32px 24px',
                                borderRadius: '16px',
                                border: '2px solid var(--border)',
                                backgroundColor: opt.bg,
                                color: 'var(--text)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                outline: 'none'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = opt.color;
                                e.currentTarget.style.backgroundColor = opt.selectedBg;
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = `0 8px 16px ${opt.color}20`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border)';
                                e.currentTarget.style.backgroundColor = opt.bg;
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <IconComponent size={48} style={{ color: opt.color, marginBottom: '8px' }} />
                            <span style={{ fontWeight: '800', fontSize: '1.2rem', textAlign: 'center', color: opt.color }}>
                                {opt.label}
                            </span>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.4' }}>
                                {opt.desc}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default DespachoRine;
