import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../config/AuthContext';
import { 
    Package, ArrowLeft, RefreshCw, AlertTriangle, Calendar, Clock, FileText, CheckCircle, Boxes
} from 'lucide-react';
import { Card, Input, Select } from '../../components/FormElements';
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
                >
                    +
                </button>
            </div>
        </div>
    );
};

const GestionDeposito = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isRegistrador = user?.rol === 'registrador';

    const [stock, setStock] = useState({
        'Cartón': 0,
        'Metal': 0,
        'Cajones': 0,
        'Conos de Film Streech': 0,
        'Aceite vegetal': 0,
        'Otros': 0
    });
    const [loadingStock, setLoadingStock] = useState(true);
    const [salidas, setSalidas] = useState([]);
    const [loadingSalidas, setLoadingSalidas] = useState(true);

    // Modal de Despacho
    const [showDespachoModal, setShowDespachoModal] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState('');
    const [despachando, setDespachando] = useState(false);
    const [despachoFormData, setDespachoFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        nroManifiesto: '',
        pesoBalanza: '',
        proveedor: ''
    });

    const [proveedoresSugeridos, setProveedoresSugeridos] = useState([]);

    // Modal de Ajuste de Stock
    const [showAjusteModal, setShowAjusteModal] = useState(false);
    const [ajustando, setAjustando] = useState(false);
    const [ajusteFormData, setAjusteFormData] = useState({
        id: null,
        material: '',
        cantidadDiferencia: '',
        observaciones: '',
        operador: ''
    });
    const [operadores, setOperadores] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const editId = searchParams.get('edit');

    // Modal de Confirmación de Recepción
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedSalidaId, setSelectedSalidaId] = useState(null);
    const [nroCertificadoInput, setNroCertificadoInput] = useState('');
    const [confirming, setConfirming] = useState(false);


    // Alertas
    const [alertModal, setAlertModal] = useState({
        isOpen: false,
        title: 'Notificación',
        message: '',
        type: 'info'
    });

    const showAlert = (message, title = 'Notificación', type = 'info') => {
        setAlertModal({ isOpen: true, title, message, type });
    };

    const fetchStockData = async () => {
        setLoadingStock(true);
        try {
            const response = await SHIGMAService.getDepositoStatus();
            setStock(response.data);
        } catch (error) {
            console.error('Error fetching deposito status:', error);
            showAlert('Error al obtener el stock del depósito.', 'Error', 'error');
        } finally {
            setLoadingStock(false);
        }
    };

    const fetchSalidasData = async () => {
        setLoadingSalidas(true);
        try {
            const response = await SHIGMAService.getDepositoSalidas();
            setSalidas(response.data.filter(s => s.status === 'pendiente'));
        } catch (error) {
            console.error('Error fetching deposito salidas:', error);
        } finally {
            setLoadingSalidas(false);
        }
    };

    // Cargar proveedores desde memoria local
    const cargarProveedoresDeMemoria = () => {
        try {
            const list = JSON.parse(localStorage.getItem('shigma_deposito_proveedores') || '[]');
            setProveedoresSugeridos(list);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchOperadores = async () => {
        try {
            const response = await SHIGMAService.getDepositoOperadores();
            setOperadores(response.data);
        } catch (error) {
            console.error('Error fetching operadores:', error);
        }
    };

    const fetchRecordAndEdit = async (id) => {
        try {
            const response = await SHIGMAService.getAllRecords({ search: id });
            const records = response.data.records || [];
            const record = records.find(r => r.id === id);
            if (record) {
                // Obtener el material y cantidad del JSON de materialesRecuperados
                let material = '';
                let cantidad = 0;
                if (record.materialesRecuperados) {
                    const entries = Object.entries(record.materialesRecuperados);
                    if (entries.length > 0) {
                        material = entries[0][0];
                        cantidad = entries[0][1].cantidad || entries[0][1].amount || 0;
                    }
                }
                setAjusteFormData({
                    id: record.id,
                    material,
                    cantidadDiferencia: String(cantidad),
                    observaciones: record.observaciones || '',
                    operador: record.operador || ''
                });
                setShowAjusteModal(true);
            }
        } catch (error) {
            console.error('Error fetching record to edit:', error);
            showAlert('Error al recuperar los datos del registro a editar.', 'Error', 'error');
        }
    };

    useEffect(() => {
        fetchStockData();
        fetchSalidasData();
        cargarProveedoresDeMemoria();
        fetchOperadores();
        
        if (editId) {
            fetchRecordAndEdit(editId);
        }
    }, [editId]);


    const handleOpenDespachoModal = (material) => {
        const pesoMaterial = stock[material] || 0;
        const list = JSON.parse(localStorage.getItem('shigma_deposito_proveedores') || '[]');
        const ultimoProveedor = list.length > 0 ? list[0] : '';

        setSelectedMaterial(material);
        setDespachoFormData({
            fecha: new Date().toISOString().split('T')[0],
            hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
            nroManifiesto: '',
            pesoBalanza: pesoMaterial > 0 ? String(pesoMaterial) : '',
            proveedor: ultimoProveedor
        });
        setProveedoresSugeridos(list);
        setShowDespachoModal(true);
    };

    const handleDespachoSubmit = async (e) => {
        e.preventDefault();
        const provText = despachoFormData.proveedor.trim();

        if (!despachoFormData.fecha || !despachoFormData.hora || !despachoFormData.pesoBalanza || !provText) {
            showAlert('Por favor, complete todos los campos obligatorios (incluyendo Proveedor).', 'Validación', 'warning');
            return;
        }

        const pesoMaterial = stock[selectedMaterial] || 0;
        if (pesoMaterial === 0) {
            showAlert(`No hay stock disponible de ${selectedMaterial} en el depósito para despachar.`, 'Validación', 'warning');
            return;
        }

        setDespachando(true);
        try {
            // Capitalizar proveedor (primera letra de cada palabra)
            const proveedorCapitalizado = provText
                .toLowerCase()
                .replace(/\b\w/g, c => c.toUpperCase());

            await SHIGMAService.despacharDeposito({
                material: selectedMaterial,
                proveedor: proveedorCapitalizado,
                fecha: despachoFormData.fecha,
                hora: despachoFormData.hora,
                nroManifiesto: despachoFormData.nroManifiesto,
                pesoBalanza: parseFloat(despachoFormData.pesoBalanza),
                usuario: user?.nombre || 'Gabriel Tonelli'
            });

            // Guardar proveedor en memoria local para futuras sugerencias
            let list = JSON.parse(localStorage.getItem('shigma_deposito_proveedores') || '[]');
            list = list.filter(p => p.toLowerCase() !== proveedorCapitalizado.toLowerCase());
            list.unshift(proveedorCapitalizado);
            // Mantener un historial de máximo 10 proveedores
            if (list.length > 10) list.pop();
            localStorage.setItem('shigma_deposito_proveedores', JSON.stringify(list));

            setShowDespachoModal(false);
            fetchStockData();
            fetchSalidasData();
            cargarProveedoresDeMemoria();
            showAlert(`¡Despacho de ${selectedMaterial} registrado con éxito!`, 'Éxito', 'success');
        } catch (error) {
            console.error('Error dispatching deposito:', error);
            const errorMsg = error.response?.data?.error || 'Error al procesar el despacho del depósito.';
            showAlert(errorMsg, 'Error', 'error');
        } finally {
            setDespachando(false);
        }
    };

    const handleOpenAjusteModal = (material) => {
        setAjusteFormData({
            id: null,
            material,
            cantidadDiferencia: '',
            observaciones: '',
            operador: ''
        });
        setShowAjusteModal(true);
    };

    const handleAjusteSubmit = async (e) => {
        e.preventDefault();
        const diff = parseFloat(ajusteFormData.cantidadDiferencia);

        if (!ajusteFormData.material || isNaN(diff) || diff === 0) {
            showAlert('Por favor, ingrese una cantidad de ajuste válida distinta de cero.', 'Validación', 'warning');
            return;
        }

        if (!ajusteFormData.operador) {
            showAlert('Por favor, seleccione un operador. Es obligatorio.', 'Validación', 'warning');
            return;
        }

        // Si es un ajuste negativo, verificar que no supere el stock actual (solo al crear nuevo, o si modificamos y el nuevo es negativo)
        const stockActual = stock[ajusteFormData.material] || 0;
        if (diff < 0 && Math.abs(diff) > stockActual && !ajusteFormData.id) {
            showAlert(`El ajuste negativo (${Math.abs(diff)} kg) no puede superar el stock actual del material (${stockActual} kg).`, 'Validación', 'warning');
            return;
        }

        setAjustando(true);
        try {
            if (ajusteFormData.id) {
                // Actualizar registro existente
                // Configurar los materiales recuperados de forma homologada
                const materialesRecuperados = {
                    [ajusteFormData.material]: {
                        amount: diff,
                        cantidad: diff,
                        unidad: 'kg'
                    }
                };
                
                await SHIGMAService.updateRecord('residuos-comunes', ajusteFormData.id, {
                    peso: diff,
                    observaciones: ajusteFormData.observaciones,
                    materialesRecuperados,
                    operador: ajusteFormData.operador
                });
                
                // Limpiar el parámetro de edición de la URL
                setSearchParams({});
                showAlert(`Ajuste de stock modificado con éxito.`, 'Éxito', 'success');
            } else {
                // Registrar nuevo ajuste
                await SHIGMAService.ajustarDeposito({
                    material: ajusteFormData.material,
                    cantidadDiferencia: diff,
                    observaciones: ajusteFormData.observaciones,
                    operador: ajusteFormData.operador
                });
                showAlert(`Ajuste de stock para ${ajusteFormData.material} registrado con éxito.`, 'Éxito', 'success');
            }

            setShowAjusteModal(false);
            fetchStockData();
        } catch (error) {
            console.error('Error adjusting stock:', error);
            const errorMsg = error.response?.data?.error || 'Error al procesar el ajuste de stock.';
            showAlert(errorMsg, 'Error', 'error');
        } finally {
            setAjustando(false);
        }
    };


    const handleOpenConfirmModal = (salidaId) => {
        if (isRegistrador) {
            showAlert('No tienes permisos para confirmar la recepción de despachos.', 'Acceso Denegado', 'error');
            return;
        }
        setSelectedSalidaId(salidaId);
        setNroCertificadoInput('');
        setShowConfirmModal(true);
    };

    const handleConfirmSubmit = async (e) => {
        e.preventDefault();
        const cert = nroCertificadoInput.trim();

        if (cert && cert.length > 30) {
            showAlert('El número de certificado no puede exceder los 30 caracteres.', 'Validación', 'warning');
            return;
        }

        setConfirming(true);
        try {
            await SHIGMAService.confirmDepositoSalida(selectedSalidaId, { nroCertificado: cert || null });
            setShowConfirmModal(false);
            showAlert('¡Despacho de depósito confirmado y archivado con éxito!', 'Éxito', 'success');
            fetchSalidasData();
        } catch (error) {
            console.error('Error confirming deposito salida:', error);
            const errorMsg = error.response?.data?.error || 'Error al confirmar el despacho de depósito.';
            showAlert(errorMsg, 'Error', 'error');
        } finally {
            setConfirming(false);
        }
    };

    const materialColors = {
        'Cartón': { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.2)', text: '#d97706' },
        'Metal': { bg: 'rgba(107, 114, 128, 0.08)', border: 'rgba(107, 114, 128, 0.2)', text: '#4b5563' },
        'Cajones': { bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.2)', text: '#2563eb' },
        'Conos de Film Streech': { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)', text: '#059669' },
        'Aceite vegetal': { bg: 'rgba(217, 70, 239, 0.08)', border: 'rgba(217, 70, 239, 0.2)', text: '#c026d3' },
        'Otros': { bg: 'rgba(139, 92, 246, 0.08)', border: 'rgba(139, 92, 246, 0.2)', text: '#7c3aed' }
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
                        Control de Depósito de Recuperables RINE<span style={{ color: 'var(--dy-red)' }}>.</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Monitoreo de acopio físico de materiales inorgánicos recuperables y gestión de despachos.
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
                
                {/* COLUMNA 1: Estado del Depósito */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Card style={{ padding: '24px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                                <Boxes size={20} style={{ color: 'var(--dy-red)' }} />
                                Acopio Actual por Material
                            </h3>
                            <button 
                                onClick={() => { fetchStockData(); fetchSalidasData(); }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                title="Actualizar datos"
                            >
                                <RefreshCw size={16} className={loadingStock ? 'spin-anim' : ''} />
                            </button>
                        </div>

                        {loadingStock ? (
                            <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                                Cargando stock actual del depósito...
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    {Object.entries(stock).map(([material, cantidad]) => {
                                        const themeColors = materialColors[material] || { bg: 'var(--surface-hover)', border: 'var(--border)', text: 'var(--text)' };
                                        return (
                                            <div 
                                                key={material} 
                                                style={{ 
                                                    border: `1px solid ${themeColors.border}`, 
                                                    borderRadius: '12px', 
                                                    padding: '16px',
                                                    background: themeColors.bg,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'space-between',
                                                    minHeight: '140px',
                                                    gap: '8px'
                                                }}
                                            >
                                                <div>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                                                        {material === 'Cajones' ? 'Cajones Rotos' : material}
                                                    </span>
                                                    <span style={{ fontSize: '1.4rem', fontWeight: '900', color: themeColors.text, display: 'block', marginTop: '4px' }}>
                                                        {cantidad.toLocaleString()} kg
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                    <button
                                                        type="button"
                                                        disabled={cantidad <= 0}
                                                        onClick={() => handleOpenDespachoModal(material)}
                                                        style={{
                                                            flex: 1,
                                                            padding: '6px 8px',
                                                            borderRadius: '8px',
                                                            border: 'none',
                                                            background: cantidad > 0 ? themeColors.text : 'var(--border)',
                                                            color: '#fff',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '700',
                                                            cursor: cantidad > 0 ? 'pointer' : 'not-allowed',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '4px',
                                                            transition: 'opacity 0.2s',
                                                            opacity: cantidad > 0 ? 0.9 : 0.5
                                                        }}
                                                        onMouseOver={(e) => { if (cantidad > 0) e.currentTarget.style.opacity = 1; }}
                                                        onMouseOut={(e) => { if (cantidad > 0) e.currentTarget.style.opacity = 0.9; }}
                                                    >
                                                        <Package size={12} /> Despachar
                                                    </button>
                                                    
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenAjusteModal(material)}
                                                        style={{
                                                            padding: '6px 10px',
                                                            borderRadius: '8px',
                                                            border: '1px solid var(--border)',
                                                            background: 'var(--surface)',
                                                            color: 'var(--text)',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '600',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '4px',
                                                            transition: 'background 0.2s'
                                                        }}
                                                        onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                                                        onMouseOut={(e) => { e.currentTarget.style.background = 'var(--surface)'; }}
                                                        title="Ajustar stock físicamente"
                                                    >
                                                        Ajustar
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div style={{
                                    borderTop: '1px solid var(--border)',
                                    paddingTop: '16px',
                                    marginTop: '8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block' }}>Total Acumulado</span>
                                        <strong style={{ fontSize: '1.2rem', color: 'var(--primary)', fontWeight: '800' }}>
                                            {Object.values(stock).reduce((a, b) => a + b, 0).toLocaleString()} kg
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                {/* COLUMNA 2: Despachos Pendientes */}
                <div>
                    <Card style={{ padding: '24px', border: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                            <FileText size={20} style={{ color: '#3b82f6' }} />
                            Despachos de Depósito Pendientes
                        </h3>

                        {loadingSalidas ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem', padding: '30px 0' }}>
                                Cargando despachos pendientes...
                            </div>
                        ) : salidas.length === 0 ? (
                            <div style={{ 
                                padding: '40px 20px', 
                                border: '1px dashed var(--border)', 
                                borderRadius: '16px', 
                                color: 'var(--text-muted)',
                                fontSize: '0.9rem',
                                textAlign: 'center'
                            }}>
                                <CheckCircle size={32} style={{ color: 'var(--success)', margin: '0 auto 12px auto', opacity: 0.8 }} />
                                No hay despachos de depósito en pendiente.
                                <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Todos los despachos de residuos recuperables han sido confirmados.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {salidas.map(salida => {
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
                                                <div style={{ marginBottom: '2px' }}>Material: <strong style={{ color: 'var(--text)' }}>{salida.material === 'Cajones' ? 'Cajones Rotos' : salida.material}</strong></div>
                                                <div style={{ marginBottom: '2px' }}>Proveedor: <strong style={{ color: 'var(--text)' }}>{salida.proveedor}</strong></div>
                                                <div style={{ marginBottom: '2px' }}>Nro. de Manifiesto: <strong style={{ color: 'var(--text)' }}>{salida.nroManifiesto || 'No informado'}</strong></div>
                                                <div style={{ marginBottom: '6px' }}>Peso de Balanza: <strong style={{ color: 'var(--primary)' }}>{salida.pesoBalanza.toLocaleString()} kg</strong> (Peso calculado: {salida.pesoAcumulado.toLocaleString()} kg)</div>
                                                
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

                                                {!isRegistrador && (
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                                                        <Button
                                                            variant="primary"
                                                            onClick={() => handleOpenConfirmModal(salida.id)}
                                                            style={{ 
                                                                background: 'var(--success)', 
                                                                fontSize: '0.75rem', 
                                                                padding: '6px 12px',
                                                                borderRadius: '8px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                height: '32px'
                                                            }}
                                                        >
                                                            <CheckCircle size={14} /> Confirmar Recepción
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Modal de Registro de Despacho */}
            {showDespachoModal && (
                <Modal
                    isOpen={showDespachoModal}
                    onClose={() => setShowDespachoModal(false)}
                    title={`Despacho de ${selectedMaterial}`}
                    showFooter={false}
                >
                    <form onSubmit={handleDespachoSubmit} style={{ padding: '8px 0' }}>
                        <div style={{ 
                            background: 'rgba(228, 5, 33, 0.08)', 
                            border: '1px solid rgba(228, 5, 33, 0.2)', 
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
                                Confirmar este despacho registrará la salida del peso ingresado y reducirá el stock actual de <strong>{selectedMaterial}</strong> en el depósito. Se creará una salida en estado <strong>pendiente</strong>.
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <Input
                                label="Fecha de Despacho *"
                                type="date"
                                value={despachoFormData.fecha}
                                onChange={(e) => setDespachoFormData(prev => ({ ...prev, fecha: e.target.value }))}
                                required
                            />
                            <Input
                                label="Hora de Despacho *"
                                type="time"
                                value={despachoFormData.hora}
                                onChange={(e) => setDespachoFormData(prev => ({ ...prev, hora: e.target.value }))}
                                required
                            />
                        </div>

                        <div style={{ position: 'relative', marginBottom: '16px' }}>
                            <Input
                                label="Proveedor *"
                                type="text"
                                placeholder="Ej: Reciclados Don Yeyo"
                                list="proveedores-sugeridos"
                                value={despachoFormData.proveedor}
                                onChange={(e) => setDespachoFormData(prev => ({ ...prev, proveedor: e.target.value }))}
                                required
                            />
                            <datalist id="proveedores-sugeridos">
                                {proveedoresSugeridos.map(p => (
                                    <option key={p} value={p} />
                                ))}
                            </datalist>
                        </div>

                        <Input
                            label="Nro de Manifiesto"
                            type="text"
                            placeholder="Ej: MAN-DEP-2026-012"
                            value={despachoFormData.nroManifiesto}
                            onChange={(e) => setDespachoFormData(prev => ({ ...prev, nroManifiesto: e.target.value }))}
                        />

                        <NumberInput
                            label="Peso en Balanza (kg) *"
                            name="pesoBalanza"
                            placeholder="Ej: 750"
                            step={0.5}
                            min={0.1}
                            value={despachoFormData.pesoBalanza}
                            onChange={(e) => setDespachoFormData(prev => ({ ...prev, pesoBalanza: e.target.value }))}
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
                            <strong>Total Calculado de {selectedMaterial}:</strong> {(stock[selectedMaterial] || 0).toLocaleString()} kg
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '24px' }}>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setShowDespachoModal(false)}
                                disabled={despachando}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="submit" 
                                variant="primary" 
                                className={despachando ? 'btn-loading' : ''}
                                disabled={despachando}
                                style={{ background: 'var(--dy-red)' }}
                            >
                                {despachando ? 'Registrando...' : 'Confirmar Despacho'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal de Ajuste de Stock */}
            {showAjusteModal && (
                <Modal
                    isOpen={showAjusteModal}
                    onClose={() => setShowAjusteModal(false)}
                    title={
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span>Ajuste {ajusteFormData.material}</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                                Cant. actual: <span style={{ color: '#888888', fontWeight: '500' }}>{(stock[ajusteFormData.material] || 0).toLocaleString()} kg</span>
                            </span>
                        </div>
                    }
                    showFooter={false}
                >
                    <form onSubmit={handleAjusteSubmit} style={{ padding: '4px 0' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <Input
                                label="Cantidad de Ajuste (kg) *"
                                type="number"
                                step="any"
                                allowNegative={true}
                                placeholder="Ej: 150 o -75"
                                value={ajusteFormData.cantidadDiferencia}
                                onChange={(e) => setAjusteFormData(prev => ({ ...prev, cantidadDiferencia: e.target.value }))}
                                required
                            />

                            <Select
                                label="Operador *"
                                name="operador"
                                value={ajusteFormData.operador}
                                onChange={(e) => setAjusteFormData(prev => ({ ...prev, operador: e.target.value }))}
                                required
                                includePlaceholder={true}
                                options={operadores.map(op => ({
                                    id: op.apellidoNombre,
                                    label: `${op.apellidoNombre} (${op.legajo})`
                                }))}
                            />
                        </div>

                        <Input
                            label="Observaciones / Motivo *"
                            type="text"
                            placeholder="Ej: Corrección por inventario visual"
                            value={ajusteFormData.observaciones}
                            onChange={(e) => setAjusteFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                            required
                        />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setShowAjusteModal(false)}
                                disabled={ajustando}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="submit" 
                                variant="primary" 
                                className={ajustando ? 'btn-loading' : ''}
                                disabled={ajustando}
                                style={{ background: 'var(--dy-red)' }}
                            >
                                {ajustando ? 'Guardando...' : 'Aplicar'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal de Recepción */}
            {showConfirmModal && (
                <Modal
                    isOpen={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    title="Confirmación de Recepción de Depósito"
                    showFooter={false}
                >
                    <form onSubmit={handleConfirmSubmit} style={{ padding: '8px 0' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px', lineHeight: '1.4' }}>
                            Para confirmar y archivar la recepción del despacho <strong>{selectedSalidaId}</strong>, puedes ingresar opcionalmente el número de certificado de disposición final.
                        </p>

                        <Input
                            label="Número de Certificado"
                            type="text"
                            placeholder="Ej: CERT-DEP-0023"
                            value={nroCertificadoInput}
                            onChange={(e) => setNroCertificadoInput(e.target.value)}
                            maxLength={30}
                        />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '24px' }}>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setShowConfirmModal(false)}
                                disabled={confirming}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="submit" 
                                variant="primary" 
                                className={confirming ? 'btn-loading' : ''}
                                disabled={confirming}
                                style={{ background: 'var(--success)' }}
                            >
                                {confirming ? 'Confirmando...' : 'Confirmar Recepción'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal de Alerta Genérico */}
            {alertModal.isOpen && (
                <Modal
                    isOpen={alertModal.isOpen}
                    onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                    title={alertModal.title}
                    showCancel={false}
                    showFooter={false}
                >
                    <div style={{ padding: '8px 0', textAlign: 'center' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: alertModal.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 
                                        alertModal.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: alertModal.type === 'error' ? 'var(--error)' : 
                                   alertModal.type === 'success' ? 'var(--success)' : 'var(--warning)',
                            marginBottom: '16px'
                        }}>
                            <CheckCircle size={24} />
                        </div>
                        <p style={{ color: 'var(--text)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: '1.5' }}>
                            {alertModal.message}
                        </p>
                        <Button
                            variant="primary"
                            onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                            style={{ margin: '0 auto', display: 'block', minWidth: '120px' }}
                        >
                            Entendido
                        </Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default GestionDeposito;
