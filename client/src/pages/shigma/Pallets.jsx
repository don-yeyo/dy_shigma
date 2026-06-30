import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Package, ArrowLeft, Send, Trash2, Wrench, Hammer, PlusCircle, ArrowRightLeft, Truck } from 'lucide-react';
import { Card, Input, Select, Textarea, NumberInput } from '../../components/FormElements';
import { Button } from '../../components/Button';
import Modal from '../../components/Modal';
import { SHIGMAService } from '../../services/api';
import { validateRecordDate, getDateConstraints } from '../../utils/dateUtils';
import { useMobile } from '../../config/ThemeContext';

const Pallets = () => {
    const isMobile = useMobile();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const [submitting, setSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successId, setSuccessId] = useState('');
    const [operadores, setOperadores] = useState([]);
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '' });

    const showAlert = (title, message) => setAlertModal({ isOpen: true, title, message });

    const { todayStr, nowTimeStr, minDateStr, maxDateStr } = getDateConstraints();

    const [formData, setFormData] = useState({
        fechaCarga: todayStr,
        horaCarga: nowTimeStr,
        tipoRegistro: '', // Descartes, Reparación Interna, Reparación Externa, Ingreso de Nuevos, Entrega Interna, Entrega Externa
        cantidad: '',
        destino: '',
        remito: '',
        proveedor: '',
        planta: '',
        sector: '',
        operarioEntrega: '',
        operarioRecibe: '',
        estado: '', // 'Retirado', 'Devuelto' for Reparations
        observaciones: ''
    });

    const dateInputRef = useRef(null);
    useEffect(() => {
        if (dateInputRef.current) {
            dateInputRef.current.focus();
        }
    }, [formData.tipoRegistro]); // Autofocus on date when selection changes

    const selectOptions = [
        { id: 'Descartes', label: 'Descartes', icon: Trash2, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.04)', selectedBg: 'rgba(239, 68, 68, 0.12)' },
        { id: 'Reparación Interna', label: 'Reparación Interna', icon: Wrench, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.04)', selectedBg: 'rgba(6, 182, 212, 0.12)' },
        { id: 'Reparación Externa', label: 'Reparación Externa', icon: Hammer, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.04)', selectedBg: 'rgba(59, 130, 246, 0.12)' },
        { id: 'Ingreso de Nuevos', label: 'Ingreso de Nuevos', icon: PlusCircle, color: '#10b981', bg: 'rgba(16, 185, 129, 0.04)', selectedBg: 'rgba(16, 185, 129, 0.12)' },
        { id: 'Entrega Interna', label: 'Entrega Interna', icon: ArrowRightLeft, color: '#84cc16', bg: 'rgba(132, 204, 22, 0.04)', selectedBg: 'rgba(132, 204, 22, 0.12)' },
        { id: 'Entrega Externa', label: 'Entrega Externa', icon: Truck, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.04)', selectedBg: 'rgba(245, 158, 11, 0.12)' }
    ];

    const plantas = [
        { id: 'Elguea Roman', label: 'Elguea Roman' },
        { id: 'Hipólito Yrigoyen', label: 'Hipólito Yrigoyen' },
        { id: 'Pellegrini', label: 'Pellegrini' }
    ];

    const sectores = [
        { id: 'Expedición', label: 'Expedición' },
        { id: 'Lavado de Cajones', label: 'Lavado de Cajones' },
        { id: 'Mantenimiento', label: 'Mantenimiento' },
        { id: 'Materias Primas', label: 'Materias Primas' },
        { id: 'Otros', label: 'Otros' },
        { id: 'Producción', label: 'Producción' },
        { id: 'Reciclado', label: 'Reciclado' }
    ];

    const fetchOperadores = async () => {
        try {
            const response = await SHIGMAService.getOperadoresByForm('pallets');
            const ops = response.data;
            setOperadores(ops);

            const lastOperator = localStorage.getItem('shigma_last_operator_pallets');
            if (lastOperator) {
                const exists = ops.some(op => op.apellidoNombre === lastOperator);
                if (exists) {
                    setFormData(prev => ({
                        ...prev,
                        operarioEntrega: prev.operarioEntrega || lastOperator,
                        operarioRecibe: prev.operarioRecibe || lastOperator
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching operators:', error);
        }
    };

    useEffect(() => {
        fetchOperadores();
    }, []);

    useEffect(() => {
        if (editId) {
            const loadRecord = async () => {
                try {
                    const response = await SHIGMAService.getRecordsByForm('pallets');
                    const record = response.data.find(r => r.id === editId);
                    if (record) {
                        const dateObj = new Date(record.createdAt || record.fecha);
                        const fechaCarga = dateObj.toISOString().split('T')[0];
                        const horaCarga = dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
                        setFormData({
                            fechaCarga,
                            horaCarga,
                            tipoRegistro: record.tipoRegistro || '',
                            cantidad: String(record.cantidad) || '',
                            destino: record.destino || '',
                            remito: record.remito || '',
                            proveedor: record.proveedor || '',
                            planta: record.planta || '',
                            sector: record.sector || '',
                            operarioEntrega: record.operarioEntrega || '',
                            operarioRecibe: record.operarioRecibe || '',
                            estado: record.estado || '',
                            observaciones: record.observaciones || ''
                        });
                    } else {
                        showAlert('Error', 'No se encontró el registro a editar.');
                    }
                } catch (err) {
                    console.error('Error loading record:', err);
                    showAlert('Error', 'Error al cargar el registro para editar.');
                }
            };
            loadRecord();
        }
    }, [editId]);

    const capitalizeText = (text) => {
        return text.replace(/\b\w/g, c => c.toUpperCase());
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        let processedValue = value;
        // Capitalizar campos específicos
        if (name === 'destino' || name === 'proveedor') {
            processedValue = capitalizeText(value);
        }

        if (name === 'remito') {
            processedValue = value.toUpperCase();
        }

        setFormData(prev => ({
            ...prev,
            [name]: processedValue
        }));

        if (name === 'operarioEntrega' || name === 'operarioRecibe') {
            if (value) {
                localStorage.setItem('shigma_last_operator_pallets', value);
            }
        }
    };

    const handleTypeChange = (type) => {
        const defaultState = (type === 'Reparación Interna' || type === 'Reparación Externa') ? 'Retirado' : '';
        const lastOperator = localStorage.getItem('shigma_last_operator_pallets') || '';

        setFormData(prev => ({
            ...prev,
            tipoRegistro: type,
            destino: '',
            remito: '',
            proveedor: '',
            planta: '',
            sector: '',
            operarioEntrega: lastOperator,
            operarioRecibe: lastOperator,
            estado: defaultState
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const combinedCreatedAt = `${formData.fechaCarga}T${formData.horaCarga}`;
        const dateError = validateRecordDate(combinedCreatedAt);
        if (dateError) {
            showAlert('Fecha inválida', dateError);
            return;
        }

        if (!formData.tipoRegistro) {
            showAlert('Campo requerido', 'Seleccione el Tipo de Registro.');
            return;
        }
        if (!formData.cantidad || parseInt(formData.cantidad) <= 0) {
            showAlert('Campo requerido', 'Ingrese una cantidad válida mayor a cero.');
            return;
        }

        // Validaciones condicionales según tipo de registro
        if (formData.tipoRegistro === 'Descartes') {
            if (!formData.destino.trim()) return showAlert('Campo requerido', 'Ingrese el Destino del descarte.');
            if (!formData.remito.trim()) return showAlert('Campo requerido', 'Ingrese el número de Remito.');
            if (!formData.operarioEntrega) return showAlert('Campo requerido', 'Seleccione el Operario de entrega.');
        } else if (formData.tipoRegistro === 'Reparación Externa') {
            if (!formData.operarioEntrega) return showAlert('Campo requerido', 'Seleccione el Operario de entrega.');
            if (!formData.proveedor.trim()) return showAlert('Campo requerido', 'Ingrese el Proveedor.');
            if (!formData.remito.trim()) return showAlert('Campo requerido', 'Ingrese el número de Remito.');
        } else if (formData.tipoRegistro === 'Reparación Interna') {
            if (!formData.operarioEntrega) return showAlert('Campo requerido', 'Seleccione el Operario de entrega.');
            if (!formData.operarioRecibe) return showAlert('Campo requerido', 'Seleccione el Operario que recibe.');
        } else if (formData.tipoRegistro === 'Ingreso de Nuevos') {
            if (!formData.proveedor.trim()) return showAlert('Campo requerido', 'Ingrese el Proveedor.');
            if (!formData.remito.trim()) return showAlert('Campo requerido', 'Ingrese el número de Remito.');
            if (!formData.operarioRecibe) return showAlert('Campo requerido', 'Seleccione el Operario que recibe.');
        } else if (formData.tipoRegistro === 'Entrega Interna') {
            if (!formData.planta) return showAlert('Campo requerido', 'Seleccione la Planta.');
            if (!formData.sector) return showAlert('Campo requerido', 'Seleccione el Sector.');
            if (!formData.operarioEntrega) return showAlert('Campo requerido', 'Seleccione el Operario de entrega.');
            if (!formData.operarioRecibe) return showAlert('Campo requerido', 'Seleccione el Operario que recibe.');
        } else if (formData.tipoRegistro === 'Entrega Externa') {
            if (!formData.proveedor.trim()) return showAlert('Campo requerido', 'Ingrese el Proveedor.');
            if (!formData.remito.trim()) return showAlert('Campo requerido', 'Ingrese el número de Remito.');
            if (!formData.operarioEntrega) return showAlert('Campo requerido', 'Seleccione el Operario de entrega.');
        }

        setSubmitting(true);
        try {
            // Estructurar el payload final limpiando campos no aplicables
            const payload = {
                tipoRegistro: formData.tipoRegistro,
                cantidad: parseInt(formData.cantidad) || 0,
                observaciones: formData.observaciones ? formData.observaciones.trim() : null,
                createdAt: combinedCreatedAt,
                destino: null,
                remito: null,
                proveedor: null,
                planta: null,
                sector: null,
                operarioEntrega: null,
                operarioRecibe: null,
                estado: null
            };

            if (formData.tipoRegistro === 'Descartes') {
                payload.destino = formData.destino.trim();
                payload.remito = formData.remito.trim();
                payload.operarioEntrega = formData.operarioEntrega;
            } else if (formData.tipoRegistro === 'Reparación Externa') {
                payload.operarioEntrega = formData.operarioEntrega;
                payload.proveedor = formData.proveedor.trim();
                payload.remito = formData.remito.trim();
                payload.estado = editId ? (formData.estado || 'Retirado') : 'Retirado';
            } else if (formData.tipoRegistro === 'Reparación Interna') {
                payload.operarioEntrega = formData.operarioEntrega;
                payload.operarioRecibe = formData.operarioRecibe;
                payload.estado = editId ? (formData.estado || 'Retirado') : 'Retirado';
            } else if (formData.tipoRegistro === 'Ingreso de Nuevos') {
                payload.proveedor = formData.proveedor.trim();
                payload.remito = formData.remito.trim();
                payload.operarioRecibe = formData.operarioRecibe;
            } else if (formData.tipoRegistro === 'Entrega Interna') {
                payload.planta = formData.planta;
                payload.sector = formData.sector;
                payload.operarioEntrega = formData.operarioEntrega;
                payload.operarioRecibe = formData.operarioRecibe;
            } else if (formData.tipoRegistro === 'Entrega Externa') {
                payload.proveedor = formData.proveedor.trim();
                payload.remito = formData.remito.trim();
                payload.operarioEntrega = formData.operarioEntrega;
            }

            if (editId) {
                await SHIGMAService.updateRecord('pallets', editId, payload);
                setSuccessId(editId);
                setShowSuccessModal(true);
            } else {
                const response = await SHIGMAService.createRecord('pallets', payload);
                setSuccessId(response.data.record.id);
                setShowSuccessModal(true);

                // Reset form
                const constraints = getDateConstraints();
                setFormData({
                    fechaCarga: constraints.todayStr,
                    horaCarga: constraints.nowTimeStr,
                    tipoRegistro: '',
                    cantidad: '',
                    destino: '',
                    remito: '',
                    proveedor: '',
                    planta: '',
                    sector: '',
                    operarioEntrega: localStorage.getItem('shigma_last_operator_pallets') || '',
                    operarioRecibe: localStorage.getItem('shigma_last_operator_pallets') || '',
                    estado: '',
                    observaciones: ''
                });
            }
        } catch (error) {
            console.error('Error submitting pallets form:', error);
            showAlert('Error del servidor', error.response?.data?.error || 'No se pudo guardar el registro. Por favor, intente nuevamente.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="card-anim" style={{ maxWidth: '800px', margin: '0 auto' }}>
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
                    <h1 style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--primary)' }}>
                        {editId ? 'Modificar Registro' : 'Gestión de Pallets'}<span style={{ color: 'var(--dy-red)' }}>.</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        {editId ? `Editando registro ${editId} del historial.` : 'Registro de ingreso, entrega, reparación y descarte de pallets de madera.'}
                    </p>
                </div>
            </div>

            {/* Selector de Tipo de Registro (Botonera de 2 columnas) */}
            <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '12px' }}>
                    Seleccione el Tipo de Registro *
                </label>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                    gap: '16px'
                }}>
                    {selectOptions.map(opt => {
                        const IconComponent = opt.icon;
                        const isSelected = formData.tipoRegistro === opt.id;
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleTypeChange(opt.id)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    padding: '20px 16px',
                                    borderRadius: '12px',
                                    border: `2px solid ${isSelected ? opt.color : 'var(--border)'}`,
                                    backgroundColor: isSelected ? opt.selectedBg : opt.bg,
                                    color: isSelected ? 'var(--text)' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: isSelected ? `0 0 10px ${opt.color}20` : 'none',
                                    outline: 'none'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) e.currentTarget.style.borderColor = opt.color;
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) e.currentTarget.style.borderColor = 'var(--border)';
                                }}
                            >
                                <IconComponent size={28} style={{ color: opt.color }} />
                                <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{opt.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {formData.tipoRegistro && (
                <form onSubmit={handleSubmit}>
                    <Card style={{ borderLeft: `4px solid ${selectOptions.find(o => o.id === formData.tipoRegistro)?.color || '#14b8a6'}` }}>
                        <div className="form-section-title" style={{
                            color: selectOptions.find(o => o.id === formData.tipoRegistro)?.color || '#14b8a6',
                            borderColor: `${selectOptions.find(o => o.id === formData.tipoRegistro)?.color || '#14b8a6'}20`
                        }}>
                            Datos del Movimiento: {formData.tipoRegistro}
                        </div>

                        {/* Fecha y Hora de la Carga */}
                        <div className="form-grid" style={isMobile ? {
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            marginBottom: '24px'
                        } : {
                            marginBottom: '24px'
                        }}>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                                    Fecha de la Carga *
                                </label>
                                <input
                                    ref={dateInputRef}
                                    type="date"
                                    name="fechaCarga"
                                    value={formData.fechaCarga}
                                    onChange={handleChange}
                                    min={minDateStr}
                                    max={maxDateStr}
                                    onKeyDown={(e) => e.preventDefault()}
                                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid var(--border)',
                                        backgroundColor: 'var(--surface)',
                                        color: 'var(--text)',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer'
                                    }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                                    Hora de la Carga *
                                </label>
                                <input
                                    type="time"
                                    name="horaCarga"
                                    value={formData.horaCarga}
                                    onChange={handleChange}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid var(--border)',
                                        backgroundColor: 'var(--surface)',
                                        color: 'var(--text)',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        transition: 'all 0.2s'
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        {/* Cantidad (Estilo similar a kilos en devoluciones, NumberInput) */}
                        <div style={{ marginBottom: '24px', maxWidth: '300px' }}>
                            <NumberInput
                                label="Cantidad (en unidades) *"
                                name="cantidad"
                                value={formData.cantidad}
                                onChange={handleChange}
                                min={1}
                                required
                            />
                        </div>

                        {/* Campos específicos según el tipo de registro */}

                        {/* Descartes */}
                        {formData.tipoRegistro === 'Descartes' && (
                            <>
                                <div className="form-grid" style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '16px' } : {}}>
                                    <Input
                                        label="Destino *"
                                        type="text"
                                        name="destino"
                                        placeholder="Ej: Destrucción O Taller Externo"
                                        maxLength={100}
                                        value={formData.destino}
                                        onChange={handleChange}
                                        required
                                    />
                                    <Input
                                        label="Remito *"
                                        type="text"
                                        name="remito"
                                        placeholder="Ej: R-0006-0032322"
                                        maxLength={30}
                                        value={formData.remito}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <Select
                                    label="Operario Entrega *"
                                    name="operarioEntrega"
                                    value={formData.operarioEntrega}
                                    onChange={handleChange}
                                    options={operadores.map(op => ({ id: op.apellidoNombre, label: op.apellidoNombre }))}
                                    includePlaceholder={true}
                                    required
                                />
                            </>
                        )}

                        {/* Reparación Externa */}
                        {formData.tipoRegistro === 'Reparación Externa' && (
                            <>
                                <div className="form-grid" style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '16px' } : {}}>
                                    <Input
                                        label="Proveedor *"
                                        type="text"
                                        name="proveedor"
                                        placeholder="Ej: Maderas Y Pallets Yeyo"
                                        maxLength={100}
                                        value={formData.proveedor}
                                        onChange={handleChange}
                                        required
                                    />
                                    <Input
                                        label="Remito *"
                                        type="text"
                                        name="remito"
                                        placeholder="Ej: R-0006-0032322"
                                        maxLength={30}
                                        value={formData.remito}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <Select
                                    label="Operario Entrega *"
                                    name="operarioEntrega"
                                    value={formData.operarioEntrega}
                                    onChange={handleChange}
                                    options={operadores.map(op => ({ id: op.apellidoNombre, label: op.apellidoNombre }))}
                                    includePlaceholder={true}
                                    required
                                />
                            </>
                        )}

                        {/* Reparación Interna */}
                        {formData.tipoRegistro === 'Reparación Interna' && (
                            <>
                                <div className="form-grid" style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '16px' } : {}}>
                                    <Select
                                        label="Operario Entrega *"
                                        name="operarioEntrega"
                                        value={formData.operarioEntrega}
                                        onChange={handleChange}
                                        options={operadores.map(op => ({ id: op.apellidoNombre, label: op.apellidoNombre }))}
                                        includePlaceholder={true}
                                        required
                                    />
                                    <Select
                                        label="Operario Recibe *"
                                        name="operarioRecibe"
                                        value={formData.operarioRecibe}
                                        onChange={handleChange}
                                        options={operadores.map(op => ({ id: op.apellidoNombre, label: op.apellidoNombre }))}
                                        includePlaceholder={true}
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {/* Ingreso de Nuevos */}
                        {formData.tipoRegistro === 'Ingreso de Nuevos' && (
                            <>
                                <div className="form-grid" style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '16px' } : {}}>
                                    <Input
                                        label="Proveedor *"
                                        type="text"
                                        name="proveedor"
                                        placeholder="Ej: Pallets Express S.A."
                                        maxLength={100}
                                        value={formData.proveedor}
                                        onChange={handleChange}
                                        required
                                    />
                                    <Input
                                        label="Remito *"
                                        type="text"
                                        name="remito"
                                        placeholder="Ej: R-0006-0032322"
                                        maxLength={30}
                                        value={formData.remito}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <Select
                                    label="Operario Recibe *"
                                    name="operarioRecibe"
                                    value={formData.operarioRecibe}
                                    onChange={handleChange}
                                    options={operadores.map(op => ({ id: op.apellidoNombre, label: op.apellidoNombre }))}
                                    includePlaceholder={true}
                                    required
                                />
                            </>
                        )}

                        {/* Entrega Interna */}
                        {formData.tipoRegistro === 'Entrega Interna' && (
                            <>
                                <div className="form-grid" style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '16px' } : {}}>
                                    <Select
                                        label="Planta Destino *"
                                        name="planta"
                                        value={formData.planta}
                                        onChange={handleChange}
                                        options={plantas}
                                        includePlaceholder={true}
                                        required
                                    />
                                    <Select
                                        label="Sector Destino *"
                                        name="sector"
                                        value={formData.sector}
                                        onChange={handleChange}
                                        options={sectores}
                                        includePlaceholder={true}
                                        required
                                    />
                                </div>
                                <div className="form-grid" style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '16px' } : {}}>
                                    <Select
                                        label="Operario Entrega *"
                                        name="operarioEntrega"
                                        value={formData.operarioEntrega}
                                        onChange={handleChange}
                                        options={operadores.map(op => ({ id: op.apellidoNombre, label: op.apellidoNombre }))}
                                        includePlaceholder={true}
                                        required
                                    />
                                    <Select
                                        label="Operario Recibe *"
                                        name="operarioRecibe"
                                        value={formData.operarioRecibe}
                                        onChange={handleChange}
                                        options={operadores.map(op => ({ id: op.apellidoNombre, label: op.apellidoNombre }))}
                                        includePlaceholder={true}
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {/* Entrega Externa */}
                        {formData.tipoRegistro === 'Entrega Externa' && (
                            <>
                                <div className="form-grid" style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '16px' } : {}}>
                                    <Input
                                        label="Proveedor *"
                                        type="text"
                                        name="proveedor"
                                        placeholder="Ej: Distribuidora Logística Sur"
                                        maxLength={100}
                                        value={formData.proveedor}
                                        onChange={handleChange}
                                        required
                                    />
                                    <Input
                                        label="Remito *"
                                        type="text"
                                        name="remito"
                                        placeholder="Ej: R-0006-0032322"
                                        maxLength={30}
                                        value={formData.remito}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <Select
                                    label="Operario Entrega *"
                                    name="operarioEntrega"
                                    value={formData.operarioEntrega}
                                    onChange={handleChange}
                                    options={operadores.map(op => ({ id: op.apellidoNombre, label: op.apellidoNombre }))}
                                    includePlaceholder={true}
                                    required
                                />
                            </>
                        )}

                        <Textarea
                            label="Observaciones"
                            name="observaciones"
                            placeholder="Ingrese notas adicionales o aclaraciones del movimiento de pallets..."
                            value={formData.observaciones}
                            onChange={handleChange}
                        />
                    </Card>

                    {/* Submit Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '24px' }}>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/')}
                            disabled={submitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className={submitting ? 'btn-loading' : ''}
                            disabled={submitting}
                            style={{ background: selectOptions.find(o => o.id === formData.tipoRegistro)?.color || '#14b8a6', color: '#fff' }}
                        >
                            <Send size={18} /> {submitting ? 'Guardando...' : editId ? 'Guardar Cambios' : 'Registrar Movimiento'}
                        </Button>
                    </div>
                </form>
            )}

            {/* Alert Modal */}
            <Modal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ isOpen: false, title: '', message: '' })}
                title={alertModal.title}
                showFooter={false}
            >
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ color: 'var(--dy-red)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    </div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '1rem' }}>{alertModal.message}</p>
                    <Button variant="primary" onClick={() => setAlertModal({ isOpen: false, title: '', message: '' })} style={{ background: selectOptions.find(o => o.id === formData.tipoRegistro)?.color || '#14b8a6', color: '#fff' }}>Entendido</Button>
                </div>
            </Modal>

            {/* Success Modal */}
            <Modal
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    if (editId) navigate('/historial');
                }}
                title={editId ? "Registro Modificado" : "Movimiento de Pallets Guardado"}
                showFooter={false}
            >
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ color: selectOptions.find(o => o.id === formData.tipoRegistro)?.color || '#14b8a6', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                        <Package size={64} />
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px', color: 'var(--primary)' }}>
                        {editId ? "¡Modificación Guardada!" : "¡Movimiento Registrado!"}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                        {editId
                            ? "El control de pallets de madera ha sido actualizado con éxito en el sistema de trazabilidad con el ID único:"
                            : "El control de pallets de madera ha sido ingresado al sistema de trazabilidad con el ID único:"}
                        <br />
                        <strong style={{ color: 'var(--text)', fontSize: '1.1rem', display: 'inline-block', marginTop: '8px', padding: '6px 12px', background: 'var(--surface-hover)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            {successId}
                        </strong>
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                        {editId ? (
                            <Button
                                variant="primary"
                                onClick={() => navigate('/historial')}
                            >
                                Volver al Historial
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowSuccessModal(false);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                >
                                    Cargar Otro
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => navigate('/')}
                                >
                                    Ir al Dashboard
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Pallets;
