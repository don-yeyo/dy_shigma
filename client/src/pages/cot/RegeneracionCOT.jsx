import React, { useState, useEffect, useRef } from 'react';
import { Card, Input } from '../../components/FormElements';
import { Button } from '../../components/Button';
import Modal from '../../components/Modal';
import { FinnegansService, COTService } from '../../services/api';
import {
    Search, ArrowLeft, ArrowRight, RefreshCcw, Eye, Send,
    Truck, FileText, CheckCircle, AlertCircle, Package, MapPin,
    ChevronDown, ChevronUp, Filter, Calendar, User, Download, Copy
} from 'lucide-react';

const STEPS = [
    { label: 'Hojas de Ruta', icon: Truck },
    { label: 'Configuración', icon: FileText },
    { label: 'Regeneración COT', icon: RefreshCcw }
];

const DEFAULT_DAYS = parseInt(import.meta.env.VITE_DEFAULT_COT_DAYS || '5');

const RegeneracionCOT = () => {
    // --- State ---
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 1: Accordion / Selection
    const [rangoDias, setRangoDias] = useState(() => {
        const saved = localStorage.getItem('dy_cot_rango_dias');
        return saved ? parseInt(saved) : DEFAULT_DAYS;
    });
    const [hojasRuta, setHojasRuta] = useState([]);
    const [expandedHoja, setExpandedHoja] = useState(null);
    const [remitosPorHoja, setRemitosPorHoja] = useState({});
    const [selectedHoja, setSelectedHoja] = useState(null);

    // Step 2: Form
    const [cotForm, setCotForm] = useState({
        cuitTransportista: '',
        razonSocialTransportista: '',
        patente: '',
        patenteAcoplado: '',
        fechaPartida: new Date().toISOString().split('T')[0],
        horaPartida: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }).replace(':', ''),
    });

    const [processingBatch, setProcessingBatch] = useState(false);
    const [batchResults, setBatchResults] = useState([]); // [{ remitoId, success, nroCOT, error }]
    const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
    const [cotResult, setCotResult] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'warning' });
    const [viewingDetalle, setViewingDetalle] = useState(null);
    const [retryingIndex, setRetryingIndex] = useState(null);

    // Transportistas
    const [transportistas, setTransportistas] = useState([]);
    const [loadingTransportistas, setLoadingTransportistas] = useState(false);
    const [transportistaSearch, setTransportistaSearch] = useState('');
    const [showTransportistas, setShowTransportistas] = useState(false);
    const transportistaRef = useRef(null);

    // Clic afuera para cerrar dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (transportistaRef.current && !transportistaRef.current.contains(event.target)) {
                setShowTransportistas(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- Effects ---
    useEffect(() => {
        cargarHojasRuta();
        localStorage.setItem('dy_cot_rango_dias', rangoDias);
    }, [rangoDias]);

    // --- Computed ---
    const hojasFiltradas = hojasRuta.filter(h => {
        // Filtro por texto de búsqueda
        if (!searchTerm) return true;
        
        const term = searchTerm.toLowerCase();
        return (
            String(h.DOCNROINTERNO || '').toLowerCase().includes(term) ||
            String(h.TRANSPORTISTA || '').toLowerCase().includes(term) ||
            String(h.CHOFER || '').toLowerCase().includes(term) ||
            String(h.VIAJE || '').toLowerCase().includes(term) ||
            String(h.PATENTE || '').toLowerCase().includes(term)
        );
    });

    // --- Handlers ---

    const cargarHojasRuta = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await FinnegansService.buscarPorRango(rangoDias);
            let data = Array.isArray(res.data) ? res.data : [];

            // Ordenar por fecha descendente (más recientes primero)
            // Formato esperado: DD-MM-YYYY
            data.sort((a, b) => {
                const dateA = a.FECHA ? a.FECHA.split('-').reverse().join('-') : '';
                const dateB = b.FECHA ? b.FECHA.split('-').reverse().join('-') : '';
                return dateB.localeCompare(dateA);
            });

            setHojasRuta(data);
        } catch (err) {
            setError('Error cargando Hojas de Ruta de Finnegans.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleHoja = async (hoja) => {
        const id = hoja.TRANSACCIONID || hoja.DOCNROINTERNO;
        if (expandedHoja === id) {
            setExpandedHoja(null);
            return;
        }

        setExpandedHoja(id);
        if (!remitosPorHoja[id]) {
            setLoading(true);
            try {
                // Pasamos DOCNROINTERNO porque es el que figura en la DESCRIPCION de los remitos
                const res = await FinnegansService.getRemitos(hoja.TRANSACCIONID || hoja.DOCNROINTERNO, hoja.FECHA);
                setRemitosPorHoja(prev => ({ ...prev, [id]: res.data }));
            } catch (err) {
                console.error('Error cargando remitos:', err);
                const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
                setAlertModal({
                    show: true,
                    title: isTimeout ? 'Tiempo Agotado' : 'Error de Conexión',
                    message: isTimeout
                        ? 'La respuesta de Finnegans tardó demasiado. Por favor, intenta expandir la hoja de ruta nuevamente.'
                        : 'No pudimos obtener los remitos en este momento. Verifica tu conexión o el estado de Finnegans.',
                    type: 'error'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const irAConfigurar = async (hoja) => {
        setLoading(true);
        setError('');
        
        try {
            // Asegurarse de que los remitos estén cargados para validar
            const id = hoja.TRANSACCIONID || hoja.DOCNROINTERNO;
            let remitos = remitosPorHoja[id];
            
            if (!remitos) {
                const res = await FinnegansService.getRemitos(hoja.TRANSACCIONID || hoja.DOCNROINTERNO, hoja.FECHA);
                remitos = res.data;
                setRemitosPorHoja(prev => ({ ...prev, [id]: remitos }));
            }

            if (!remitos || remitos.length === 0) {
                setAlertModal({
                    show: true,
                    title: 'Sin remitos',
                    message: 'No se han encontrado remitos para solicitar la regeneración de COT en esta Hoja de Ruta.',
                    type: 'warning'
                });
                return;
            }

            setSelectedHoja(hoja);
            
            // Cargar transportistas si no están cargados
            if (transportistas.length === 0) {
                setLoadingTransportistas(true);
                try {
                    const resT = await FinnegansService.getTransportistas();
                    setTransportistas(resT.data || []);
                } catch (err) {
                    console.error('Error cargando transportistas:', err);
                } finally {
                    setLoadingTransportistas(false);
                }
            }

            setCotForm(prev => ({
                ...prev,
                cuitTransportista: '',
                razonSocialTransportista: '',
                patente: '',
                patenteAcoplado: '',
            }));
            setTransportistaSearch('');
            setCurrentStep(1);
        } catch (err) {
            console.error('Error al preparar configuración:', err);
            setError('Error al obtener los remitos de la hoja de ruta.');
        } finally {
            setLoading(false);
        }
    };

    const validarPatente = (p) => {
        if (!p) return true;
        // Solo letras y números (alfanumérico)
        return /^[A-Z0-9]+$/.test(p);
    };

    const procesarUnRemito = async (remito) => {
        try {
            // 1. Obtener detalle extendido del remito vía USR_ViewApiCOTMasivo
            const resDetalle = await FinnegansService.getDetalleRemitoCOT(remito.id || remito.remitoId);
            const filasReporte = Array.isArray(resDetalle.data) ? resDetalle.data : [resDetalle.data];

            if (!filasReporte || filasReporte.length === 0 || !filasReporte[0]) {
                throw new Error('No se pudo obtener el detalle extendido del remito.');
            }

            // 2. Agrupar productos y usar la primera fila para el cabezal
            const primerFila = filasReporte[0];
            const productosMapeados = filasReporte.map(fila => ({
                codigoArba: fila.CODIGO_UNICO_PRODUCTO,
                unidadMedida: fila.RENTAS_CODIGO_UNIDAD_MEDIDA,
                cantidad: fila.CANTIDAD,
                codigoPropio: fila.PROPIO_CODIGO_PRODUCTO,
                descripcion: fila.PROPIO_DESCRIPCION_PRODUCTO,
                unidadDescripcion: fila.PROPIO_DESCRIPCION_UNIDAD_MEDIDA,
                cantidadAjustada: fila.CANTIDAD_AJUSTADA
            }));

            // 3. Unir con los datos del formulario (patentes, transportista)
            // Aseguramos que los datos del formulario MANDAN sobre los de la base de datos
            const payload = {
                ...primerFila,
                cuitTransportista: String(cotForm.cuitTransportista || '').replace(/-/g, '').trim(),
                razonSocialTransportista: cotForm.razonSocialTransportista,
                patente: cotForm.patente,
                patenteAcoplado: cotForm.patenteAcoplado,
                fechaPartida: cotForm.fechaPartida,
                horaPartida: cotForm.horaPartida,
                productos: productosMapeados
            };

            // 4. Generar y enviar a ARBA
            const resCOT = await COTService.regenerar(payload);
            return {
                remitoId: remito.id || remito.remitoId,
                comprobante: remito.comprobante,
                success: resCOT.data.success,
                nroCOT: resCOT.data.nroCOT,
                error: resCOT.data.errores?.[0] 
                    ? (resCOT.data.errores[0].codigo !== 'UNKNOWN' 
                        ? `[${resCOT.data.errores[0].codigo}] ${resCOT.data.errores[0].descripcion}`
                        : resCOT.data.errores[0].descripcion)
                    : 'Error desconocido',
                detalle: payload, // Guardamos el payload completo (Cabecera + Productos)
                archivo: resCOT.data.archivoGenerado
            };
        } catch (err) {
            console.error(`Error procesando remito ${remito.id || remito.remitoId}:`, err);
            return {
                remitoId: remito.id || remito.remitoId,
                comprobante: remito.comprobante,
                success: false,
                error: err.response?.data?.error || err.message || 'Error inesperado',
                detalle: null
            };
        }
    };

    /**
     * Dispara la descarga de un archivo TXT en el navegador.
     * Importante: Se usa un Blob con encoding latin1 para compatibilidad con ARBA.
     */
    const descargarTXT = (contenido, nombreArchivo) => {
        try {
            // Convertir string a Uint8Array usando latin1 (ISO-8859-1)
            const encoder = new TextEncoder(); // UTF-8 por defecto
            // Para latin1 real en el navegador, usamos una técnica de mapeo
            const bytes = new Uint8Array(contenido.length);
            for (let i = 0; i < contenido.length; i++) {
                bytes[i] = contenido.charCodeAt(i) & 0xff;
            }
            
            const blob = new Blob([bytes], { type: 'text/plain;charset=ISO-8859-1' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = nombreArchivo || 'cot_arba.txt';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error descargando el archivo:', err);
            setAlertModal({
                show: true,
                title: 'Error de Descarga',
                message: 'No se pudo generar el archivo para descarga local.',
                type: 'error'
            });
        }
    };

    const handlePreConfirm = () => {
        if (!cotForm.razonSocialTransportista || !cotForm.patente || !cotForm.cuitTransportista) {
            setAlertModal({
                show: true,
                title: 'Datos Faltantes',
                message: 'Por favor, complete los campos obligatorios (Transportista, CUIT y Patente) antes de continuar.',
                type: 'warning'
            });
            return;
        }
        if (!validarPatente(cotForm.patente)) {
            setAlertModal({
                show: true,
                title: 'Patente Inválida',
                message: 'El formato de la patente principal no es válido. Asegúrese de ingresar solo letras y números.',
                type: 'warning'
            });
            return;
        }
        setError('');
        setShowConfirmModal(true);
    };

    const enviarBatchARBA = async () => {
        const id = selectedHoja.TRANSACCIONID || selectedHoja.DOCNROINTERNO;
        const remitos = remitosPorHoja[id] || [];

        if (remitos.length === 0) {
            setError('No hay remitos para procesar en esta Hoja de Ruta.');
            return;
        }

        setShowConfirmModal(false);
        setProcessingBatch(true);
        
        // Inicializar la grilla con todos los remitos en estado pendiente
        const initialResults = remitos.map(r => ({
            remitoId: r.id || r.remitoId,
            comprobante: r.comprobante,
            success: false,
            pending: true,
            error: null
        }));
        setBatchResults(initialResults);
        
        setCurrentBatchIndex(0);
        setCurrentStep(2); 

        for (let i = 0; i < remitos.length; i++) {
            const remito = remitos[i];
            setCurrentBatchIndex(i);
            const resultado = await procesarUnRemito(remito);
            
            setBatchResults(prev => {
                const copy = [...prev];
                copy[i] = { ...resultado, pending: false };
                return copy;
            });
        }

        setProcessingBatch(false);
    };

    const reintentarRemito = async (index) => {
        const resultOriginal = batchResults[index];
        if (resultOriginal.success) return;

        setRetryingIndex(index);
        const nuevoResultado = await procesarUnRemito(resultOriginal);
        
        setBatchResults(prev => {
            const copy = [...prev];
            copy[index] = nuevoResultado;
            return copy;
        });
        setRetryingIndex(null);
    };

    const resetFlow = () => {
        setCurrentStep(0);
        setSelectedHoja(null);
        setBatchResults([]);
        setError('');
    };

    // --- Render Helpers ---

    const renderRangoSelector = () => (
        <div style={{ marginBottom: '24px' }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px',
                background: 'var(--surface-hover)', padding: '12px 20px', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)'
            }}>
                <Calendar size={18} style={{ color: 'var(--dy-red)' }} />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Ver Hojas de Ruta de los últimos:</span>
                <select
                    value={rangoDias}
                    onChange={(e) => setRangoDias(parseInt(e.target.value))}
                    className="dy-select"
                >
                    {[1, 2, 3, 5, 10, 15, 30].map(d => (
                        <option key={d} value={d}>{d} días</option>
                    ))}
                </select>
                <div style={{ marginLeft: 'auto' }}>
                    <Button variant="ghost" size="sm" onClick={cargarHojasRuta} loading={loading}>
                        <RefreshCcw size={14} /> Refrescar
                    </Button>
                </div>
            </div>

            <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                    type="text"
                    placeholder="Filtrar por HR, Transportista, Chofer, Viaje o Patente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '48px', width: '100%' }}
                />
            </div>
        </div>
    );

    const renderAccordion = () => (
        <div className="dy-accordion-list">
            {hojasFiltradas.map((hoja, i) => {
                const id = hoja.TRANSACCIONID || hoja.DOCNROINTERNO;
                const isExpanded = expandedHoja === id;

                return (
                    <div key={id} className={`dy-accordion ${isExpanded ? 'expanded' : ''}`}>
                        <div className="dy-accordion-header">
                            <div className="dy-accordion-info" onClick={() => toggleHoja(hoja)} style={{ cursor: 'pointer', flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span className="dy-accordion-title">{hoja.DOCNROINTERNO}</span>
                                    <span className="badge badge-outline">ID: {hoja.TRANSACCIONID}</span>
                                    <span className="badge badge-outline">{hoja.FECHA}</span>
                                    <span className={`badge ${hoja.ESTADOHR === 'Pendiente' ? 'badge-warning' : 'badge-info'}`}>
                                        {hoja.ESTADOHR || 'S/E'}
                                    </span>
                                </div>
                                <div className="dy-accordion-subtitle">
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="Transportista">
                                            <Truck size={14} /> {hoja.TRANSPORTISTA}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="Patente Vehículo">
                                            <Package size={14} /> {hoja.PATENTE || 'S/P'}
                                        </span>
                                        {hoja.CHOFER && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="Chofer">
                                                <User size={14} /> {hoja.CHOFER}
                                            </span>
                                        )}
                                        {hoja.VIAJE && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="Detalle del Viaje">
                                                <MapPin size={14} /> {hoja.VIAJE}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <Button size="sm" onClick={(e) => { e.stopPropagation(); irAConfigurar(hoja); }}>
                                    Regenerar COT
                                </Button>
                                <div onClick={() => toggleHoja(hoja)} style={{ cursor: 'pointer', display: 'flex' }}>
                                    {isExpanded ? <ChevronUp size={20} title="Contraer" /> : <ChevronDown size={20} title="Expandir" />}
                                </div>
                            </div>
                        </div>

                        {isExpanded && (
                            <div className="dy-accordion-body">
                                {loading && !remitosPorHoja[id] ? (
                                    <div className="loader-inline">Cargando remitos...</div>
                                ) : (
                                    <div className="remitos-list">
                                        <table className="results-table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Transacción ID</th>
                                                    <th>Cliente</th>
                                                    <th>Comprobante</th>
                                                    <th>Fecha</th>
                                                    <th>Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(remitosPorHoja[id] || []).map((remito, idx) => {
                                                    return (
                                                        <tr key={idx}>
                                                            <td style={{ fontWeight: 700 }}>{remito.id}</td>
                                                            <td>{remito.cliente}</td>
                                                            <td>{remito.comprobante}</td>
                                                            <td>{remito.fecha}</td>
                                                            <td>
                                                                <span className="badge badge-outline">{remito.pedidoTipo}</span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    // --- Final Render ---

    return (
        <div className="card-anim">
            <header style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2.4rem', fontWeight: '900' }}>
                    Regeneración de COT<span style={{ color: 'var(--dy-red)' }}>.</span>
                </h1>
            </header>

            {/* Stepper */}
            <div className="stepper">
                {STEPS.map((step, i) => (
                    <React.Fragment key={i}>
                        <div className={`stepper-step 
                            ${i === currentStep ? 'active' : ''} 
                            ${i < currentStep || (i === 2 && batchResults.length > 0 && !processingBatch) ? 'completed' : ''}
                        `}>
                            <div className="stepper-circle">
                                {(i < currentStep || (i === 2 && batchResults.length > 0 && !processingBatch)) ? <CheckCircle size={20} /> : i + 1}
                            </div>
                            <span className="stepper-label">{step.label}</span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`stepper-connector ${i < currentStep ? 'active' : ''}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Error Banner */}
            {error && (
                <div className="error-banner">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* STEP 0: Selección */}
            {currentStep === 0 && (
                <Card>
                    {renderRangoSelector()}
                    {hojasRuta.length > 0 ? renderAccordion() : (
                        <div className="empty-state">
                            <Truck size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                            <h3>No se encontraron Hojas de Ruta</h3>
                            <p>Intente ampliando el rango de días o verificando la conexión.</p>
                        </div>
                    )}
                </Card>
            )}

            {/* STEP 1: Formulario y Envío */}
            {currentStep === 1 && (
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                        <Button variant="ghost" onClick={resetFlow} disabled={processingBatch}>
                            <ArrowLeft size={18} /> Volver
                        </Button>
                    </div>

                    <>
                            <div className="form-grid" style={{ marginBottom: '32px' }}>
                                <div className="form-section" style={{ gridColumn: 'span 2' }}>
                                    <div className="form-section-title">
                                        <Truck size={16} /> Vehículo y Transportista
                                    </div>
                                    
                                    {/* Fila 1: Transportista y CUIT */}
                                    <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
                                        <div className="dy-form-group" style={{ position: 'relative' }} ref={transportistaRef}>
                                            <label className="dy-label">Transportista *</label>
                                            <input
                                                type="text"
                                                className="dy-input"
                                                placeholder="Buscar transportista..."
                                                value={transportistaSearch}
                                                onChange={(e) => {
                                                    setTransportistaSearch(e.target.value);
                                                    setShowTransportistas(true);
                                                    setCotForm(prev => ({ ...prev, razonSocialTransportista: 'PERSONALIZADO' }));
                                                }}
                                                onFocus={() => setShowTransportistas(true)}
                                                disabled={loadingTransportistas}
                                                style={{ width: '100%' }}
                                            />
                                            {loadingTransportistas && <span style={{fontSize: '0.7rem', color: 'var(--dy-red)'}}>Cargando transportistas...</span>}
                                            
                                            {showTransportistas && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    left: 0,
                                                    right: 0,
                                                    maxHeight: '200px',
                                                    overflowY: 'auto',
                                                    background: 'var(--surface)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: 'var(--radius)',
                                                    zIndex: 10,
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                }}>
                                                    {transportistas
                                                        .filter(t => t.nombre.toLowerCase().includes(transportistaSearch.toLowerCase()) || (t.cuit && t.cuit.includes(transportistaSearch)))
                                                        .map(t => (
                                                            <div 
                                                                key={t.codigo}
                                                                style={{
                                                                    padding: '8px 12px',
                                                                    cursor: 'pointer',
                                                                    borderBottom: '1px solid var(--border-light)'
                                                                }}
                                                                onClick={() => {
                                                                    setTransportistaSearch(t.nombre);
                                                                    setCotForm({
                                                                        ...cotForm,
                                                                        razonSocialTransportista: t.razonSocial,
                                                                        cuitTransportista: t.cuit ? t.cuit.replace(/\D/g, '') : ''
                                                                    });
                                                                    setShowTransportistas(false);
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                            >
                                                                {t.nombre.length > 30 ? `${t.nombre.substring(0, 30)}...` : t.nombre} {t.cuit ? `(${t.cuit})` : ''}
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="dy-form-group">
                                            <label className="dy-label">CUIT Transportista *</label>
                                            <input
                                                type="text"
                                                className="dy-input"
                                                placeholder="Ej: 30123456789"
                                                value={cotForm.cuitTransportista}
                                                onChange={(e) => {
                                                    const cuit = e.target.value.replace(/\D/g, '');
                                                    let t = transportistas.find(item => item.cuit && item.cuit.replace(/\D/g, '') === cuit);
                                                    setCotForm({
                                                        ...cotForm,
                                                        cuitTransportista: cuit,
                                                        razonSocialTransportista: t ? t.razonSocial : 'PERSONALIZADO'
                                                    });
                                                    setTransportistaSearch(t ? t.nombre : 'PERSONALIZADO');
                                                }}
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Fila 2: Patentes */}
                                    <div className="form-grid">
                                        <Input
                                            label="Patente Camión *"
                                            placeholder="ABC123"
                                            value={cotForm.patente}
                                            onChange={(e) => setCotForm({ ...cotForm, patente: e.target.value.toUpperCase() })}
                                        />
                                        <Input
                                            label="Patente Acoplado"
                                            placeholder="GHI789"
                                            value={cotForm.patenteAcoplado}
                                            onChange={(e) => setCotForm({ ...cotForm, patenteAcoplado: e.target.value.toUpperCase() })}
                                        />
                                    </div>

                                    {/* Fila 3: Fecha y Hora de Partida */}
                                    <div className="form-grid" style={{ marginTop: '1rem' }}>
                                        <Input
                                            type="date"
                                            label="Fecha de Partida *"
                                            value={cotForm.fechaPartida}
                                            onChange={(e) => setCotForm({ ...cotForm, fechaPartida: e.target.value })}
                                        />
                                        <Input
                                            type="text"
                                            label="Hora de Partida (HHmm) *"
                                            placeholder="Ej: 0830"
                                            value={cotForm.horaPartida}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').substring(0, 4);
                                                setCotForm({ ...cotForm, horaPartida: val });
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section" style={{ marginBottom: '32px' }}>
                                <div className="form-section-title">
                                    <FileText size={16} /> Resumen de Remitos a Procesar
                                </div>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                    Se procesarán los remitos listados a continuación pertenecientes a la Hoja de Ruta <strong>{selectedHoja?.DOCNROINTERNO}</strong>.
                                </p>
                                <div className="results-table-container-sm">
                                    <table className="results-table-sm">
                                        <thead>
                                            <tr>
                                                <th>Transacción ID</th>
                                                <th>Cliente</th>
                                                <th>Comprobante</th>
                                                <th>Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(remitosPorHoja[selectedHoja?.TRANSACCIONID || selectedHoja?.DOCNROINTERNO] || []).map((remito, idx) => (
                                                <tr key={idx}>
                                                    <td style={{ fontWeight: 700 }}>{remito.id}</td>
                                                    <td>{remito.cliente}</td>
                                                    <td>{remito.comprobante}</td>
                                                    <td><span className="badge badge-outline">{remito.pedidoTipo}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '40px' }}>
                                <Button
                                    variant="primary"
                                    size="lg"
                                    style={{
                                        background: 'linear-gradient(135deg, #e40521 0%, #b3041a 100%)',
                                        boxShadow: '0 10px 20px rgba(228, 5, 33, 0.2)'
                                    }}
                                    onClick={handlePreConfirm}
                                >
                                    <Send size={18} /> Iniciar Regeneración Masiva
                                </Button>
                            </div>
                        </>
                </Card>
            )}

            {/* STEP 2: Regeneración COT (Progreso) */}
            {currentStep === 2 && (
                <Card>
                    <div className="batch-processing-view">
                        <div style={{ marginBottom: '24px' }}>
                            {processingBatch && retryingIndex === null ? (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    <div className="loader-inline" style={{ marginBottom: '12px' }}></div>
                                    <h3>Procesando remitos... ({currentBatchIndex + 1} de {(remitosPorHoja[selectedHoja?.TRANSACCIONID || selectedHoja?.DOCNROINTERNO] || []).length})</h3>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                    <h2 style={{ color: 'var(--success)' }}>
                                        {batchResults.every(r => r.success) ? 'Proceso Finalizado' : 'Resumen del Proceso'}
                                    </h2>
                                    <p>Se han procesado los remitos de la hoja de ruta.</p>
                                </div>
                            )}
                        </div>

                        <table className="results-table">
                            <thead>
                                <tr>
                                    <th>Remito</th>
                                    <th>Estado</th>
                                    <th>Nro COT / Error</th>
                                    <th style={{ textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {batchResults.map((res, idx) => (
                                    <tr key={idx} className={retryingIndex === idx ? 'row-processing' : ''}>
                                        <td style={{ fontWeight: 600 }}>{res.comprobante}</td>
                                        <td>
                                            {res.pending ? (
                                                <span className="badge badge-outline">Pendiente</span>
                                            ) : retryingIndex === idx ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                                                    <div className="loader-inline-xs"></div>
                                                    <span style={{ fontSize: '0.8rem' }}>Reintentando...</span>
                                                </div>
                                            ) : res.success ? (
                                                <span className="badge badge-success">Éxito</span>
                                            ) : (
                                                <span className="badge badge-error">Error</span>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '0.9rem' }}>
                                            {res.pending ? (
                                                <span style={{ color: 'var(--text-muted)' }}>Esperando...</span>
                                            ) : res.success ? (
                                                <strong style={{ color: 'var(--success)' }}>{res.nroCOT}</strong>
                                            ) : (
                                                <span style={{ color: 'var(--error)' }}>{res.error}</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                {res.detalle && (
                                                    <Button 
                                                        size="xs" 
                                                        variant="ghost" 
                                                        title="Ver Detalle Técnico Finnegans"
                                                        onClick={() => setViewingDetalle(res.detalle)}
                                                    >
                                                        <Eye size={14} />
                                                    </Button>
                                                )}
                                                {res.archivo && (
                                                    <Button 
                                                        size="xs" 
                                                        variant="ghost" 
                                                        title="Descargar archivo TXT para ARBA"
                                                        style={{ color: 'var(--success)' }}
                                                        onClick={() => descargarTXT(res.archivo.contenido, res.archivo.nombreArchivo)}
                                                    >
                                                        <Download size={14} />
                                                    </Button>
                                                )}
                                                {!res.success && retryingIndex === null && !processingBatch && (
                                                    <Button 
                                                        size="xs" 
                                                        variant="outline" 
                                                        onClick={() => reintentarRemito(idx)}
                                                        title="Reintentar este remito"
                                                    >
                                                        <RefreshCcw size={14} />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ marginTop: '32px', textAlign: 'center' }}>
                            <Button 
                                onClick={resetFlow} 
                                variant="secondary"
                                disabled={processingBatch || retryingIndex !== null}
                            >
                                <RefreshCcw size={18} title="Volver a empezar" /> Finalizar y Volver
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Modal de Alertas/Validaciones */}

            {/* Modal de Alertas/Validaciones */}
            <Modal
                isOpen={alertModal.show}
                onClose={() => setAlertModal(prev => ({ ...prev, show: false }))}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
                confirmLabel="Entendido"
                showCancel={false}
            />

            <Modal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                title="¿Confirmar Regeneración Masiva?"
                type="warning"
                onConfirm={enviarBatchARBA}
                confirmLabel="Sí, Generar COTs"
            >
                Usted está por generar nuevos COTs para <strong>todos los remitos</strong> de la hoja de ruta. Esta acción presentará múltiples solicitudes ante ARBA.
            </Modal>

            <Modal
                isOpen={!!viewingDetalle}
                onClose={() => setViewingDetalle(null)}
                title="Detalle del Remito (Finnegans)"
                maxWidth="900px"
                confirmLabel="Cerrar"
                showCancel={false}
            >
                {viewingDetalle && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                    navigator.clipboard.writeText(JSON.stringify(viewingDetalle, null, 2));
                                    // Opcional: podrías poner un toast aquí
                                }}
                                title="Copiar JSON al portapapeles"
                            >
                                <Copy size={16} /> Copiar JSON
                            </Button>
                        </div>

                        {/* Cabecera */}
                        <div className="form-section">
                            <div className="form-section-title"><Truck size={16} /> Datos de Cabecera</div>
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                                gap: '12px',
                                fontSize: '0.85rem',
                                background: 'var(--surface-hover)',
                                padding: '16px',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <div><strong>Remito:</strong> {viewingDetalle.CODIGO_DOC}</div>
                                <div><strong>Fecha Emisión:</strong> {viewingDetalle.FECHA_EMISION}</div>
                                <div><strong>CUIT Dest:</strong> {viewingDetalle.DESTINATARIO_CUIT}</div>
                                <div><strong>Cliente:</strong> {viewingDetalle.DESTINATARIO_RAZON_SOCIAL}</div>
                                <div><strong>Localidad:</strong> {viewingDetalle.DESTINO_DOMICILIO_LOCALIDAD}</div>
                                <div><strong>Importe:</strong> ${viewingDetalle.IMPORTE || viewingDetalle.importeTotal}</div>
                                <div><strong>Patente:</strong> {viewingDetalle.patente}</div>
                                <div><strong>Transportista:</strong> {viewingDetalle.razonSocialTransportista}</div>
                            </div>
                        </div>

                        {/* Productos */}
                        <div className="form-section">
                            <div className="form-section-title"><Package size={16} /> Productos ({viewingDetalle.productos?.length})</div>
                            <div className="results-table-container-sm" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                <table className="results-table-sm">
                                    <thead>
                                        <tr>
                                            <th>Código</th>
                                            <th>Descripción</th>
                                            <th style={{ textAlign: 'right' }}>Cantidad</th>
                                            <th>Unidad</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(viewingDetalle.productos || []).map((p, i) => (
                                            <tr key={i}>
                                                <td>{p.codigoArba || p.codigoPropio}</td>
                                                <td style={{ fontSize: '0.75rem' }}>{p.descripcion}</td>
                                                <td style={{ textAlign: 'right' }}>{p.cantidad}</td>
                                                <td>{p.unidadDescripcion || 'Un.'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default RegeneracionCOT;
