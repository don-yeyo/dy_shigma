import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Trash2, ShieldAlert, CornerUpLeft, RefreshCw,
    Recycle, Package, Leaf, ArrowRight, Activity, TrendingUp, DollarSign, Calendar, Scale
} from 'lucide-react';
import { SHIGMAService } from '../services/api';
import { Button } from '../components/Button';
import Modal from '../components/Modal';
import { useAuth } from '../config/AuthContext';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, hasModulo } = useAuth();
    const isRegistrador = user?.rol === 'registrador';

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const [alertModal, setAlertModal] = useState({
        isOpen: false,
        title: 'Advertencia de Filtrado',
        message: '',
        type: 'warning'
    });

    const showAlert = (message, title = 'Advertencia de Filtrado', type = 'warning') => {
        setAlertModal({
            isOpen: true,
            title,
            message,
            type
        });
    };

    const getFormattedDate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const getInitialDates = () => {
        const today = new Date();
        const defaultDaysBack = parseInt(import.meta.env.VITE_DASHBOARD_DEFAULT_DAYS_BACK || '30', 10);

        const since = new Date();
        since.setDate(today.getDate() - defaultDaysBack);

        return {
            sinceStr: getFormattedDate(since),
            todayStr: getFormattedDate(today),
            maxStr: (() => {
                const maxDate = new Date();
                maxDate.setDate(today.getDate() + 3);
                return getFormattedDate(maxDate);
            })()
        };
    };

    const { sinceStr, todayStr, maxStr } = getInitialDates();
    const [fechaDesde, setFechaDesde] = useState(sinceStr);
    const [fechaHasta, setFechaHasta] = useState(todayStr);

    const fetchStats = async (desde = fechaDesde, hasta = fechaHasta) => {
        setLoading(true);
        try {
            const response = await SHIGMAService.getStats(desde, hasta);
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.rol && user.rol !== 'registrador') {
            fetchStats(sinceStr, todayStr);
        } else if (user?.rol === 'registrador') {
            setLoading(false);
        }
    }, [user]);

    const handleApplyFilter = (e) => {
        if (e) e.preventDefault();

        const maxLimit = new Date();
        maxLimit.setDate(maxLimit.getDate() + 3);
        maxLimit.setHours(23, 59, 59, 999);

        const selectedHasta = new Date(`${fechaHasta}T23:59:59`);

        if (selectedHasta > maxLimit) {
            showAlert('La fecha de fin no puede superar más de 3 días en el futuro.');
            return;
        }

        if (fechaDesde > fechaHasta) {
            showAlert('La fecha de inicio no puede ser posterior a la fecha de fin.');
            return;
        }

        fetchStats(fechaDesde, fechaHasta);
    };


    const modules = [
        {
            icon: <Trash2 size={24} />,
            title: 'Residuos Industriales No Especiales (RINE)',
            description: 'Registrar pesajes de residuos industriales no especiales generados.',
            path: '/residuos-comunes',
            color: 'var(--success)'
        },
        {
            icon: <Scale size={24} />,
            title: 'Gestión de Bateas',
            description: 'Monitorear el nivel de llenado de las bateas y registrar manifiestos de despacho.',
            path: '/gestion-bateas',
            color: '#3b82f6'
        },
        {
            icon: <ShieldAlert size={24} />,
            title: 'Residuos Especiales',
            description: 'Control de aceites usados, solventes y trapos contaminados con trazabilidad.',
            path: '/residuos-especiales',
            color: 'var(--warning)'
        },
        {
            icon: <CornerUpLeft size={24} />,
            title: 'Devoluciones',
            description: 'Inspeccionar y clasificar mercadería devuelta para su reinserción o reciclaje.',
            path: '/devoluciones',
            color: '#3b82f6'
        },
        {
            icon: <RefreshCw size={24} />,
            title: 'Tratamiento',
            description: 'Registrar procesos de compactado, triturado y compostaje interno.',
            path: '/tratamiento',
            color: '#a855f7'
        },
        {
            icon: <Recycle size={24} />,
            title: 'Economía Circular',
            description: 'Trazabilidad de materiales revalorizados y cálculo de huella de carbono.',
            path: '/economia-circular',
            color: 'var(--dy-red)'
        },
        {
            icon: <Package size={24} />,
            title: 'Gestión de Pallets',
            description: 'Inventariar, reparar y descartar pallets de madera de logística.',
            path: '/pallets',
            color: '#14b8a6'
        },
        {
            icon: <Leaf size={24} />,
            title: 'Espacios Verdes',
            description: 'Monitorear áreas verdes, riego ecológico y nuevas plantaciones.',
            path: '/espacios-verdes',
            color: '#84cc16'
        }
    ];

    // Datos por defecto si el servidor falla o está vacío
    const displayStats = stats || {
        totalKgComunes: 0,
        totalKgEspeciales: 0,
        totalPalletsReparados: 0,
        totalLitrosAgua: 0,
        totalPlantaciones: 0,
        totalCO2Reducido: 0,
        totalAhorroCircular: 0,
        materialBreakdown: { Carton: 0, Plastico: 0, Vidrio: 0, Metal: 0, Organico: 0 }
    };

    const totalMaterials = Object.values(displayStats.materialBreakdown).reduce((a, b) => a + b, 0) || 1;

    return (
        <div className="card-anim">
            {/* Header */}
            {!isRegistrador && (
                <header style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '2.4rem', fontWeight: '900', color: 'var(--primary)', letterSpacing: '-0.025em' }}>
                        Dashboard<span style={{ color: 'var(--dy-red)' }}>.</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '1.1rem' }}>
                        Sistema de Gestión de Seguridad, Higiene y Medioambiente de {import.meta.env.VITE_COMPANY_NAME || 'la empresa'}.
                    </p>
                </header>
            )}

            {/* Barra de Filtro de Fechas */}
            {!isRegistrador && (
                <form onSubmit={handleApplyFilter} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px 24px',
                    borderRadius: '16px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    marginBottom: '32px',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px', flex: '1 1 200px' }}>
                        <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                            Rango de Análisis:
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', flex: '3 1 400px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 180px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Desde:</span>
                            <input
                                type="date"
                                value={fechaDesde}
                                onChange={(e) => setFechaDesde(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'var(--surface-hover)',
                                    color: 'var(--text)',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    flex: 1
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 180px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Hasta:</span>
                            <input
                                type="date"
                                value={fechaHasta}
                                max={maxStr}
                                onChange={(e) => setFechaHasta(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'var(--surface-hover)',
                                    color: 'var(--text)',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    flex: 1
                                }}
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            style={{ padding: '8px 20px', fontSize: '0.9rem', minHeight: '38px', background: 'var(--dy-blue)', color: '#fff' }}
                            disabled={loading}
                        >
                            {loading ? 'Filtrando...' : 'Aplicar Filtro'}
                        </Button>
                    </div>
                </form>
            )}

            {/* KPI Cards Grid y Secciones Visuales (solo para supervisores y admins) */}
            {!isRegistrador && (
                <>
                    {/* KPI Cards Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '20px',
                        marginBottom: '40px'
                    }}>
                        {/* KPI 1 */}
                        <div className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Material Reciclado</span>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyCentert: 'center', justifyContent: 'center' }}>
                                    <Trash2 size={20} />
                                </div>
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>
                                {loading ? '...' : `${displayStats.totalKgComunes.toLocaleString()} kg`}
                            </h2>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Residuos no especiales pesados</p>
                        </div>

                        {/* KPI 2 */}
                        <div className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Residuos Especiales</span>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyCentert: 'center', justifyContent: 'center' }}>
                                    <ShieldAlert size={20} />
                                </div>
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>
                                {loading ? '...' : `${displayStats.totalKgEspeciales.toLocaleString()} kg`}
                            </h2>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Aceites y solventes acopiados</p>
                        </div>

                        {/* KPI 3 */}
                        <div className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Economía Circular</span>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(228, 5, 33, 0.1)', color: 'var(--dy-red)', display: 'flex', alignItems: 'center', justifyCentert: 'center', justifyContent: 'center' }}>
                                    <Recycle size={20} />
                                </div>
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>
                                {loading ? '...' : `${displayStats.totalCO2Reducido.toLocaleString()} kg`}
                            </h2>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                CO₂ evitado y ${displayStats.totalAhorroCircular.toLocaleString()} ahorrados
                            </p>
                        </div>

                        {/* KPI 4 */}
                        <div className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Logística Circular</span>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(20, 184, 166, 0.1)', color: '#14b8a6', display: 'flex', alignItems: 'center', justifyCentert: 'center', justifyContent: 'center' }}>
                                    <Package size={20} />
                                </div>
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>
                                {loading ? '...' : `${displayStats.totalPalletsReparados.toLocaleString()} uds`}
                            </h2>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Pallets de madera recuperados</p>
                        </div>
                    </div>

                    {/* Split Visual Section */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                        gap: '24px',
                        marginBottom: '40px'
                    }}>
                        {/* Left Visual: Material Breakdown */}
                        <div className="glass" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <TrendingUp size={20} /> Distribución de Reciclaje RINE
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {Object.entries(displayStats.materialBreakdown).map(([material, kg]) => {
                                    const pct = Math.round((kg / totalMaterials) * 100) || 0;
                                    let barColor = 'var(--success)';
                                    if (material === 'Carton') barColor = '#f59e0b';
                                    if (material === 'Plastico') barColor = '#3b82f6';
                                    if (material === 'Vidrio') barColor = '#a855f7';
                                    if (material === 'Metal') barColor = '#64748b';
                                    if (material === 'Organico') barColor = '#84cc16';

                                    return (
                                        <div key={material}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px', fontWeight: '600' }}>
                                                <span>{material === 'Carton' ? 'Cartón' : material === 'Plastico' ? 'Plástico' : material === 'Organico' ? 'Orgánico' : material}</span>
                                                <span style={{ color: 'var(--text-muted)' }}>{kg.toLocaleString()} kg ({pct}%)</span>
                                            </div>
                                            <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '4px', transition: 'width 0.5s ease-out' }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Visual: Green Space Metrics & Eco-Tips */}
                        <div className="glass" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Leaf size={20} style={{ color: '#84cc16' }} /> Impacto Ambiental Espacios Verdes
                                </h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '20px' }}>
                                    La fábrica cuenta con zonas verdes activas gestionadas ecológicamente. A través de riego controlado, hemos optimizado el recurso hídrico.
                                </p>

                                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                                    <div style={{ flex: 1, background: 'rgba(132, 204, 22, 0.08)', padding: '16px', borderRadius: '16px', textAlign: 'center', border: '1px dashed rgba(132, 204, 22, 0.2)' }}>
                                        <h4 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#84cc16', margin: 0 }}>
                                            {displayStats.totalPlantaciones}
                                        </h4>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '600' }}>Plantas agregadas</p>
                                    </div>
                                    <div style={{ flex: 1, background: 'rgba(59, 130, 246, 0.08)', padding: '16px', borderRadius: '16px', textAlign: 'center', border: '1px dashed rgba(59, 130, 246, 0.2)' }}>
                                        <h4 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#3b82f6', margin: 0 }}>
                                            {displayStats.totalLitrosAgua.toLocaleString()} L
                                        </h4>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '600' }}>Agua de riego eficiente</p>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                padding: '12px 16px',
                                borderRadius: '12px',
                                background: 'var(--surface-hover)',
                                borderLeft: '4px solid var(--dy-red)',
                                fontSize: '0.85rem'
                            }}>
                                <strong>Eco-Tip Industrial:</strong> Cada pallet de madera reparado evita la tala de 0.05 árboles y reduce 15 kg de emisiones de carbono en la cadena logística.
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Launchers Section Title */}
            <header style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--primary)' }}>
                    Módulos de Registro de Trazabilidad
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
                    Seleccione un formulario para registrar trazabilidad o estado de reciclado.
                </p>
            </header>

            {/* Grid Launchers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                {modules.filter(module => hasModulo(module.path.replace('/', ''))).length === 0 ? (
                    <div style={{
                        gridColumn: '1 / -1',
                        padding: '36px 24px',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        background: 'var(--surface)',
                        border: '1px dashed var(--border)',
                        borderRadius: '16px',
                        fontSize: '0.92rem',
                        fontWeight: 500
                    }}>
                        Actualmente no tenés ningún módulo de registro habilitado en tu perfil. Por favor, solicitá a un administrador que asigne tus accesos.
                    </div>
                ) : (
                    modules.filter(module => hasModulo(module.path.replace('/', ''))).map((module, index) => (
                        <div
                            key={index}
                            className="addon-card"
                            onClick={() => navigate(module.path)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="addon-card-icon" style={{
                                background: `rgba(${module.color === 'var(--success)' ? '16, 185, 129' :
                                    module.color === 'var(--warning)' ? '245, 158, 11' :
                                        module.color === 'var(--dy-red)' ? '228, 5, 33' :
                                            module.color === '#3b82f6' ? '59, 130, 246' :
                                                module.color === '#a855f7' ? '168, 85, 247' :
                                                    module.color === '#14b8a6' ? '20, 184, 166' : '132, 204, 22'}, 0.08)`,
                                color: module.color
                            }}>
                                {module.icon}
                            </div>
                            <div className="addon-card-content" style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1.15rem' }}>{module.title}</h3>
                                <p style={{ fontSize: '0.85rem', lineHeight: '1.4', marginTop: '4px' }}>{module.description}</p>
                            </div>
                            <ArrowRight size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        </div>
                    ))
                )}
            </div>

            {/* Footer / About */}
            <div style={{
                padding: '24px',
                borderRadius: 'var(--radius)',
                background: 'var(--surface)',
                border: '1px dashed var(--border)',
                textAlign: 'center'
            }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <strong>SHIGMA</strong> — Seguridad e Higiene Industrial y Medioambiente de {import.meta.env.VITE_COMPANY_NAME || 'la empresa'}.
                    <br />
                    Herramienta de control operativa certificada bajo normativas de Seguridad e Higiene y Economía Circular.
                </p>
            </div>

            <Modal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
                confirmLabel="Entendido"
                showCancel={false}
            />
        </div>
    );
};

export default Dashboard;
