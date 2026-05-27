import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Scale, ArrowLeft, RefreshCw, AlertTriangle, Calendar, Clock, FileText, CheckCircle
} from 'lucide-react';
import { Card, Input } from '../../components/FormElements';
import { Button } from '../../components/Button';
import Modal from '../../components/Modal';
import { SHIGMAService } from '../../services/api';

// Componente premium de Input Numérico con botones de +/- integrados
const NumberInput = ({ label, value, onChange, min = 0, step = 1, name, placeholder, required }) => {
    const numericStep = typeof step === 'number' ? step : parseFloat(step) || 1;

    const handleDecrement = () => {
        const val = parseFloat(value || 0);
        const newVal = Math.max(min, val - numericStep);
        onChange({ target: { name, value: String(Math.round(newVal * 10) / 10) } });
    };

    const handleIncrement = () => {
        const val = parseFloat(value || 0);
        const newVal = val + numericStep;
        onChange({ target: { name, value: String(Math.round(newVal * 10) / 10) } });
    };

    const handleMouseDown = (e) => {
        if (document.activeElement !== e.target) {
            e.preventDefault();
            e.target.focus();
            e.target.select();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === '-' || e.key === 'e' || e.key === 'E') {
            e.preventDefault();
        }
    };

    const handleInputChange = (e) => {
        let val = e.target.value;
        if (val.includes('-')) {
            val = val.replace(/-/g, '');
        }
        e.target.value = val;
        onChange(e);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {label && <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500' }}>{label}</label>}
            <div style={{ display: 'flex', alignItems: 'stretch', gap: '4px' }}>
                <button
                    type="button"
                    onClick={handleDecrement}
                    style={{
                        padding: '0 16px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        borderTopRightRadius: '0',
                        borderBottomRightRadius: '0',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '46px',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'var(--surface-hover)'}
                    onMouseLeave={(e) => e.target.style.background = 'var(--surface)'}
                >
                    -
                </button>
                <input
                    type="number"
                    name={name}
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onMouseDown={handleMouseDown}
                    placeholder={placeholder}
                    required={required}
                    min={min}
                    step="any"
                    onFocus={(e) => e.target.select()}
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        height: '46px',
                        outline: 'none',
                        border: '1px solid var(--border)',
                        borderLeft: 'none',
                        borderRight: 'none',
                        borderRadius: '0',
                        backgroundColor: 'var(--background)',
                        color: 'var(--text)',
                        fontWeight: '700',
                        fontSize: '1.1rem'
                    }}
                />
                <button
                    type="button"
                    onClick={handleIncrement}
                    style={{
                        padding: '0 16px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        borderTopLeftRadius: '0',
                        borderBottomLeftRadius: '0',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '46px',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'var(--surface-hover)'}
                    onMouseLeave={(e) => e.target.style.background = 'var(--surface)'}
                >
                    +
                </button>
            </div>
        </div>
    );
};

const GestionBateas = () => {
    const navigate = useNavigate();
    
    // Bateas State
    const [bateas, setBateas] = useState([]);
    const [loadingBateas, setLoadingBateas] = useState(true);
    const [pendingSalidas, setPendingSalidas] = useState([]);
    const [loadingSalidas, setLoadingSalidas] = useState(true);
    
    // Modal de Reinicio
    const [showRestartModal, setShowRestartModal] = useState(false);
    const [selectedBatea, setSelectedBatea] = useState(null);
    const [restarting, setRestarting] = useState(false);
    const [restartFormData, setRestartFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        nroManifiesto: '',
        pesoBalanza: ''
    });

    // Cargar Bateas y Salidas desde el backend
    const fetchBateasData = async () => {
        setLoadingBateas(true);
        try {
            const response = await SHIGMAService.getBateasStatus();
            setBateas(response.data);
        } catch (error) {
            console.error('Error fetching bateas status:', error);
        } finally {
            setLoadingBateas(false);
        }
    };

    const fetchSalidasData = async () => {
        setLoadingSalidas(true);
        try {
            const response = await SHIGMAService.getBateaSalidas();
            // Filtrar solo las que quedan en pendiente para la vista rápida
            setPendingSalidas(response.data.filter(s => s.status === 'pendiente'));
        } catch (error) {
            console.error('Error fetching batea salidas:', error);
        } finally {
            setLoadingSalidas(false);
        }
    };

    useEffect(() => {
        fetchBateasData();
        fetchSalidasData();
    }, []);

    // Lógica para reiniciar batea
    const handleOpenRestartModal = (batea) => {
        setSelectedBatea(batea);
        setRestartFormData({
            fecha: new Date().toISOString().split('T')[0],
            hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
            nroManifiesto: '',
            pesoBalanza: String(batea.pesoAcumulado) // Autopoblar con el peso acumulado
        });
        setShowRestartModal(true);
    };

    const handleRestartSubmit = async (e) => {
        e.preventDefault();
        if (!restartFormData.fecha || !restartFormData.hora || !restartFormData.nroManifiesto || !restartFormData.pesoBalanza) {
            alert('Por favor, complete todos los campos obligatorios del manifiesto de reinicio.');
            return;
        }

        setRestarting(true);
        try {
            await SHIGMAService.restartBatea(selectedBatea.id, {
                ...restartFormData,
                pesoBalanza: parseFloat(restartFormData.pesoBalanza),
                usuario: 'Gabriel Tonelli'
            });

            setShowRestartModal(false);
            // Actualizar vistas
            fetchBateasData();
            fetchSalidasData();
            alert(`¡Batea "${selectedBatea.nombre}" reiniciada correctamente! Salida en estado PENDIENTE generada.`);
        } catch (error) {
            console.error('Error restarting batea:', error);
            alert('Error al reiniciar la batea.');
        } finally {
            setRestarting(false);
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 8px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <Button 
                    variant="ghost" 
                    onClick={() => navigate('/')} 
                    style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0 }}
                >
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 style={{ fontSize: '2.1rem', fontWeight: '900', color: 'var(--primary)' }}>
                        Control de Capacidades y Bateas RINE<span style={{ color: 'var(--dy-red)' }}>.</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Monitoreo de almacenamiento de residuos industriales no especiales en tiempo real y despacho de batea con manifiestos.
                    </p>
                </div>
            </div>

            {/* Layout de Rejilla Principal */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                gap: '24px',
                alignItems: 'start'
            }}>
                
                {/* COLUMNA 1: Tarjetas de Bateas */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Card style={{ padding: '24px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                                <Scale size={20} style={{ color: 'var(--dy-red)' }} />
                                Estado de Bateas Activas
                            </h3>
                            <button 
                                onClick={() => { fetchBateasData(); fetchSalidasData(); }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                title="Actualizar datos"
                            >
                                <RefreshCw size={16} className={loadingBateas ? 'spin-anim' : ''} />
                            </button>
                        </div>

                        {loadingBateas ? (
                            <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                                Cargando estado de bateas en tiempo real...
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {bateas.map(b => {
                                    // Determinar colores según nivel de llenado
                                    let barColor = 'var(--success)';
                                    let bgAlert = 'rgba(16, 185, 129, 0.08)';
                                    let textColor = 'var(--success)';
                                    let isFull = b.porcentaje >= 90;
                                    let disponible = Math.max(0, b.capacidad - b.pesoAcumulado);
                                    
                                    if (b.porcentaje >= 70 && b.porcentaje < 90) {
                                        barColor = 'var(--warning)';
                                        bgAlert = 'rgba(245, 158, 11, 0.08)';
                                        textColor = 'var(--warning)';
                                    } else if (b.porcentaje >= 90) {
                                        barColor = 'var(--dy-red)';
                                        bgAlert = 'rgba(228, 5, 33, 0.08)';
                                        textColor = 'var(--dy-red)';
                                    }

                                    return (
                                        <div 
                                            key={b.id} 
                                            style={{ 
                                                border: '1px solid var(--border)', 
                                                borderRadius: '16px', 
                                                padding: '20px',
                                                background: isFull ? bgAlert : 'var(--surface-hover)',
                                                transition: 'all 0.3s ease',
                                                position: 'relative',
                                                boxShadow: isFull ? '0 0 15px rgba(228, 5, 33, 0.05)' : 'none'
                                            }}
                                        >
                                            {/* Encabezado Batea */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <div>
                                                    <span style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--text)' }}>
                                                        {b.nombre}
                                                    </span>
                                                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '2px' }}>
                                                        Destinado a: {b.tipo}
                                                    </span>
                                                </div>
                                                <span style={{ fontWeight: '800', fontSize: '1.2rem', color: textColor }}>
                                                    {b.porcentaje}%
                                                </span>
                                            </div>

                                            {/* Barra de Progreso */}
                                            <div style={{ width: '100%', height: '12px', backgroundColor: 'var(--border)', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
                                                <div style={{ 
                                                    width: `${b.porcentaje}%`, 
                                                    height: '100%', 
                                                    backgroundColor: barColor, 
                                                    borderRadius: '6px',
                                                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                                                }} />
                                            </div>

                                            {/* Métricas y Acción */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: '700' }}>
                                                        {b.pesoAcumulado.toLocaleString()} kg cargados
                                                    </span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                                        Disponible: <strong>{disponible.toLocaleString()} kg</strong> (Capacidad: {b.capacidad.toLocaleString()} kg)
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenRestartModal(b)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        borderRadius: '12px',
                                                        border: isFull ? '1px solid var(--dy-red)' : '1px solid var(--border)',
                                                        background: isFull ? 'var(--dy-red)' : 'var(--surface)',
                                                        color: isFull ? '#fff' : 'var(--text)',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '700',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <RefreshCw size={14} /> Despachar / Vaciar
                                                </button>
                                            </div>

                                            {/* Alerta de Lleno Flashing */}
                                            {isFull && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '8px',
                                                    right: '70px',
                                                    fontSize: '0.65rem',
                                                    background: 'var(--dy-red)',
                                                    color: '#fff',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontWeight: '800',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    animation: 'pulse 1.5s infinite'
                                                }}>
                                                    CRÍTICO
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </div>

                {/* COLUMNA 2: Historial de Manifiestos de Vaciado en Pendiente */}
                <div>
                    <Card style={{ padding: '24px', border: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                            <FileText size={20} style={{ color: '#3b82f6' }} />
                            Despachos Pendientes de Confirmación (Salidas)
                        </h3>

                        {loadingSalidas ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem', padding: '30px 0' }}>
                                Cargando manifiestos de salida...
                            </div>
                        ) : pendingSalidas.length === 0 ? (
                            <div style={{ 
                                padding: '40px 20px', 
                                border: '1px dashed var(--border)', 
                                borderRadius: '16px', 
                                color: 'var(--text-muted)',
                                fontSize: '0.9rem',
                                textAlign: 'center'
                            }}>
                                <CheckCircle size={32} style={{ color: 'var(--success)', margin: '0 auto 12px auto', opacity: 0.8 }} />
                                No hay manifiestos en pendiente.
                                <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Todas las salidas de batea de residuos han sido procesadas o confirmadas.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {pendingSalidas.map(salida => {
                                    const formattedDate = new Date(salida.fecha + 'T' + (salida.hora.length === 5 ? salida.hora + ':00' : salida.hora)).toLocaleDateString('es-AR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    });

                                    return (
                                        <div 
                                            key={salida.id}
                                            style={{
                                                background: 'var(--surface-hover)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '16px',
                                                padding: '16px',
                                                fontSize: '0.9rem',
                                                borderLeft: '5px solid #3b82f6'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <strong style={{ color: 'var(--text)', fontSize: '0.95rem' }}>{salida.id}</strong>
                                                <span style={{ 
                                                    fontSize: '0.75rem', 
                                                    background: 'rgba(59, 130, 246, 0.1)', 
                                                    color: '#3b82f6', 
                                                    padding: '3px 8px', 
                                                    borderRadius: '6px',
                                                    fontWeight: '800',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    PENDIENTE
                                                </span>
                                            </div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                                                <div style={{ marginBottom: '2px' }}>Batea de origen: <strong style={{ color: 'var(--text)' }}>{salida.bateaNombre}</strong></div>
                                                <div style={{ marginBottom: '2px' }}>Nro. de Manifiesto: <strong style={{ color: 'var(--text)' }}>{salida.nroManifiesto}</strong></div>
                                                <div style={{ marginBottom: '6px' }}>Peso de Balanza: <strong style={{ color: 'var(--primary)' }}>{salida.pesoBalanza.toLocaleString()} kg</strong> (Kilos en batea: {salida.pesoAcumulado.toLocaleString()} kg)</div>
                                                
                                                <div style={{ 
                                                    marginTop: '8px', 
                                                    paddingTop: '8px',
                                                    borderTop: '1px dashed var(--border)',
                                                    fontSize: '0.8rem', 
                                                    display: 'flex', 
                                                    gap: '12px', 
                                                    color: 'var(--text-muted)' 
                                                }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={13} /> {formattedDate}</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={13} /> {salida.hora} hs</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}><FileText size={13} /> Lotes: {salida.recordIds.length}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Modal para Reiniciar Batea / Registrar Salida */}
            {selectedBatea && (
                <Modal
                    isOpen={showRestartModal}
                    onClose={() => setShowRestartModal(false)}
                    title={`Manifiesto de Salida - ${selectedBatea.nombre}`}
                    showFooter={false}
                >
                    <form onSubmit={handleRestartSubmit} style={{ padding: '8px 0' }}>
                        <div style={{ 
                            background: 'rgba(228, 5, 33, 0.05)', 
                            border: '1px solid rgba(228, 5, 33, 0.1)', 
                            borderRadius: '12px', 
                            padding: '12px 16px', 
                            color: 'var(--dy-red)', 
                            fontSize: '0.85rem',
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                            <span>
                                Confirmar este vaciado restablecerá el peso cargado de la batea en RINE a <strong>0 kg</strong>. Se creará una salida con estado <strong>pendiente</strong>.
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <Input
                                label="Fecha de Despacho *"
                                type="date"
                                value={restartFormData.fecha}
                                onChange={(e) => setRestartFormData(prev => ({ ...prev, fecha: e.target.value }))}
                                required
                            />
                            <Input
                                label="Hora de Despacho *"
                                type="time"
                                value={restartFormData.hora}
                                onChange={(e) => setRestartFormData(prev => ({ ...prev, hora: e.target.value }))}
                                required
                            />
                        </div>

                        <Input
                            label="Nro de Manifiesto *"
                            type="text"
                            placeholder="Ej: MAN-2026-00329"
                            value={restartFormData.nroManifiesto}
                            onChange={(e) => setRestartFormData(prev => ({ ...prev, nroManifiesto: e.target.value }))}
                            required
                        />

                        {/* Incrementador/Decrementador Custom Premium */}
                        <NumberInput
                            label="Peso en Balanza (kg) *"
                            name="pesoBalanza"
                            placeholder="Ej: 980.5"
                            step={0.5}
                            min={0.1}
                            value={restartFormData.pesoBalanza}
                            onChange={(e) => setRestartFormData(prev => ({ ...prev, pesoBalanza: e.target.value }))}
                            required
                        />
                        
                        <div style={{
                            marginTop: '12px',
                            padding: '12px',
                            background: 'var(--surface-hover)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)'
                        }}>
                            <strong>Neto Registrado en Batea:</strong> {selectedBatea.pesoAcumulado.toLocaleString()} kg ({selectedBatea.recordsCount} lotes)
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '24px' }}>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setShowRestartModal(false)}
                                disabled={restarting}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="submit" 
                                variant="primary" 
                                className={restarting ? 'btn-loading' : ''}
                                disabled={restarting}
                                style={{ background: 'var(--dy-red)' }}
                            >
                                {restarting ? 'Guardando...' : 'Confirmar Vaciado y Salida'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default GestionBateas;
