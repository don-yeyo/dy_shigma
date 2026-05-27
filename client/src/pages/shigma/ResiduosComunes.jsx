import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Trash2, ArrowLeft, Send, CheckCircle, AlertTriangle, Layers, Boxes, Scale, ChevronRight
} from 'lucide-react';
import { Card, Input, Select, Textarea, Switch } from '../../components/FormElements';
import { Button } from '../../components/Button';
import Modal from '../../components/Modal';
import { SHIGMAService } from '../../services/api';
import { useTheme } from '../../config/ThemeContext';

// Componente premium de Input Numérico con botones de +/- integrados
const NumberInput = ({ label, value, onChange, min = 0, step = 1, name, placeholder, required, disabled }) => {
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', opacity: disabled ? 0.6 : 1 }}>
            {label && <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500' }}>{label}</label>}
            <div style={{ display: 'flex', alignItems: 'stretch', gap: '4px' }}>
                <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={disabled}
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
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '46px',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => !disabled && (e.target.style.background = 'var(--surface-hover)')}
                    onMouseLeave={(e) => !disabled && (e.target.style.background = 'var(--surface)')}
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
                    disabled={disabled}
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
                        fontSize: '1.1rem',
                        cursor: disabled ? 'not-allowed' : 'text'
                    }}
                />
                <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={disabled}
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
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '46px',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => !disabled && (e.target.style.background = 'var(--surface-hover)')}
                    onMouseLeave={(e) => !disabled && (e.target.style.background = 'var(--surface)')}
                >
                    +
                </button>
            </div>
        </div>
    );
};

const ResiduosComunes = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    
    const [submitting, setSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successId, setSuccessId] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [consentChecked, setConsentChecked] = useState(false);
    const [showConsentError, setShowConsentError] = useState(false);
    
    // Bateas State para disponible
    const [bateas, setBateas] = useState([]);
    
    // Modal de Advertencia por capacidad superada
    const [warningModalData, setWarningModalData] = useState({
        isOpen: false,
        bateaNombre: '',
        pesoIngresado: '',
        disponible: 0
    });

    const [formData, setFormData] = useState({
        sector: '', // Planta Generadora
        tipoResiduo: '',
        clasificacionInorganico: 'Irrecuperables', // Irrecuperables o Recuperable
        materialesRecuperados: {
            'Cartón': { cantidad: '', unidad: 'Kilos' },
            'Metal': { cantidad: '', unidad: 'Kilos' },
            'Cajones': { cantidad: '', unidad: 'Kilos' },
            'Conos de Film Streech': { cantidad: '', unidad: 'Kilos' },
            'Otros': { cantidad: '', unidad: 'Kilos' }
        },
        peso: '',
        destino: '',
        responsable: 'Gabriel Tonelli',
        observaciones: ''
    });

    const plantas = [
        { id: 'ER', label: 'Elguea Roman' },
        { id: 'HY', label: 'Hipólito Yrigoyen' },
        { id: 'PE', label: 'Pellegrini' }
    ];

    const tiposResiduo = [
        { id: 'Inorgánicos marca Don Yeyo', label: 'Inorgánicos marca Don Yeyo' },
        { id: 'Inorgánicos Generales', label: 'Inorgánicos Generales' },
        { id: 'Orgánicos', label: 'Orgánicos' }
    ];

    const materialesDisponibles = ['Cartón', 'Metal', 'Cajones', 'Conos de Film Streech', 'Otros'];

    // Cargar Bateas desde el backend
    const fetchBateasData = async () => {
        try {
            const response = await SHIGMAService.getBateasStatus();
            setBateas(response.data);
        } catch (error) {
            console.error('Error fetching bateas status:', error);
        }
    };

    useEffect(() => {
        fetchBateasData();
    }, []);

    // Obtener los destinos para el Select: Filtrados por tipo de residuo (Organicos / Inorganicos)
    const getDestinoOptions = () => {
        if (!formData.tipoResiduo) return [];
        
        let filteredBateas = [];
        if (formData.tipoResiduo === 'Orgánicos') {
            // Filtrar y mostrar sólo bateas destinadas a Orgánicos
            filteredBateas = bateas.filter(b => b.tipo === 'Orgánicos');
        } else {
            // Filtrar y mostrar sólo bateas destinadas a Inorgánicos
            filteredBateas = bateas.filter(b => b.tipo === 'Inorgánicos');
        }

        return filteredBateas.map(b => ({
            id: b.nombre,
            label: b.nombre
        }));
    };

    // Obtener color para el nivel de ocupación en tonos claros si es dark mode para contraste
    const getCapacityColor = (percentage) => {
        if (percentage < 60) {
            return isDark ? '#34d399' : '#10b981'; // Verde claro / Esmeralda
        } else if (percentage < 85) {
            return isDark ? '#fbbf24' : '#b45309'; // Amarillo oro / Ámbar oscuro
        } else {
            return isDark ? '#f87171' : '#dc2626'; // Rojo claro / Rojo oscuro
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            
            // Si cambia el tipo de residuo, reseteamos el destino para evitar inconsistencias
            if (name === 'tipoResiduo') {
                updated.destino = '';
                if (value !== 'Inorgánicos Generales') {
                    updated.clasificacionInorganico = 'Irrecuperables';
                }
            }
            return updated;
        });
    };

    // Recalcular peso inmediatamente al seleccionar/deseleccionar el switch de Recuperable
    const handleSwitchChange = (e) => {
        const { checked } = e.target;
        setFormData(prev => {
            const newClasif = checked ? 'Recuperable' : 'Irrecuperables';
            let newPeso = prev.peso;
            
            if (newClasif === 'Recuperable') {
                // Calcular peso sumando materiales en Kilos
                let totalKilos = 0;
                Object.entries(prev.materialesRecuperados).forEach(([mat, data]) => {
                    if (data.unidad === 'Kilos' && data.cantidad) {
                        totalKilos += parseFloat(data.cantidad || 0);
                    }
                });
                newPeso = totalKilos > 0 ? String(Math.round(totalKilos * 10) / 10) : '';
            } else {
                // Si vuelve a Irrecuperables, limpiamos el peso
                newPeso = '';
            }

            return {
                ...prev,
                clasificacionInorganico: newClasif,
                peso: newPeso
            };
        });
    };

    // Cambios en los materiales recuperables
    const handleInputMouseDown = (e) => {
        if (document.activeElement !== e.target) {
            e.preventDefault();
            e.target.focus();
            e.target.select();
        }
    };

    const handleMaterialQtyChange = (material, val) => {
        // No permitir números negativos: eliminar el signo menos
        if (typeof val === 'string') {
            val = val.replace(/-/g, '');
            
            // Si es Cajones y la unidad seleccionada es Unidades, no permitir decimales
            if (material === 'Cajones' && formData.materialesRecuperados[material].unidad === 'Unidades') {
                const dotIndex = val.indexOf('.');
                const commaIndex = val.indexOf(',');
                if (dotIndex !== -1) {
                    val = val.substring(0, dotIndex);
                } else if (commaIndex !== -1) {
                    val = val.substring(0, commaIndex);
                }
                // Eliminar cualquier otro caracter que no sea numérico
                val = val.replace(/[^0-9]/g, '');
            }
        } else if (typeof val === 'number') {
            if (val < 0) {
                val = 0;
            }
            if (material === 'Cajones' && formData.materialesRecuperados[material].unidad === 'Unidades') {
                val = Math.floor(val);
            }
        }

        setFormData(prev => {
            const updatedMaterials = {
                ...prev.materialesRecuperados,
                [material]: {
                    ...prev.materialesRecuperados[material],
                    cantidad: val
                }
            };
            
            // Calcular automáticamente el Peso del Lote (solo sumando los que están en Kilos)
            let totalKilos = 0;
            Object.entries(updatedMaterials).forEach(([mat, data]) => {
                if (data.unidad === 'Kilos' && data.cantidad) {
                    totalKilos += parseFloat(data.cantidad || 0);
                }
            });

            return {
                ...prev,
                materialesRecuperados: updatedMaterials,
                peso: totalKilos > 0 ? String(Math.round(totalKilos * 10) / 10) : prev.peso
            };
        });
    };

    const handleMaterialUnitChange = (material, checked) => {
        const newUnit = checked ? 'Unidades' : 'Kilos';
        setFormData(prev => {
            const updatedMaterials = {
                ...prev.materialesRecuperados,
                [material]: {
                    ...prev.materialesRecuperados[material],
                    unidad: newUnit,
                    cantidad: '' // Limpiar cantidad al cambiar la unidad
                }
            };

            // Recalcular peso
            let totalKilos = 0;
            Object.entries(updatedMaterials).forEach(([mat, data]) => {
                if (data.unidad === 'Kilos' && data.cantidad) {
                    totalKilos += parseFloat(data.cantidad || 0);
                }
            });

            return {
                ...prev,
                materialesRecuperados: updatedMaterials,
                peso: totalKilos > 0 ? String(Math.round(totalKilos * 10) / 10) : ''
            };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const isRecuperable = formData.tipoResiduo === 'Inorgánicos Generales' && formData.clasificacionInorganico === 'Recuperable';

        // Validación básica
        if (!formData.sector || !formData.tipoResiduo) {
            alert('Por favor, complete todos los campos obligatorios.');
            return;
        }

        // Si NO es recuperable, Cantidad y Destino son obligatorios
        if (!isRecuperable && (!formData.peso || !formData.destino)) {
            alert('Por favor, complete todos los campos obligatorios (Cantidad y Destino).');
            return;
        }

        // Si es Recuperable, validar que se haya cargado al menos un material
        if (isRecuperable) {
            const tieneMaterial = Object.values(formData.materialesRecuperados).some(data => data.cantidad && parseFloat(data.cantidad) > 0);
            if (!tieneMaterial) {
                alert('Por favor, indique la cantidad de al menos uno de los materiales recuperables.');
                return;
            }
        }

        // VALIDACIÓN DE CAPACIDAD DE BATEA (Sólo si NO es recuperable, ya que los recuperables no van a batea)
        if (!isRecuperable) {
            const selectedB = bateas.find(b => b.nombre === formData.destino);
            if (selectedB) {
                const disponible = Math.max(0, selectedB.capacidad - selectedB.pesoAcumulado);
                if (parseFloat(formData.peso) > disponible) {
                    // Emitir modal de advertencia al usuario y bloquear
                    setWarningModalData({
                        isOpen: true,
                        bateaNombre: selectedB.nombre,
                        pesoIngresado: formData.peso,
                        disponible: disponible
                    });
                    return;
                }
            }
        }

        // En lugar de guardar, abrimos el modal de confirmación
        setConsentChecked(false);
        setShowConsentError(false);
        setShowConfirmModal(true);
    };

    const handleConfirmClick = () => {
        if (!consentChecked) {
            setShowConsentError(true);
            return;
        }
        executeSubmit();
    };

    const executeSubmit = async () => {
        if (!consentChecked) return;

        setSubmitting(true);
        setShowConfirmModal(false);
        try {
            const isRecuperable = formData.tipoResiduo === 'Inorgánicos Generales' && formData.clasificacionInorganico === 'Recuperable';

            // Calcular peso total sumado en el background para recuperables
            let finalPeso = formData.peso;
            if (isRecuperable) {
                let totalKilos = 0;
                Object.entries(formData.materialesRecuperados).forEach(([mat, data]) => {
                    if (data.unidad === 'Kilos' && data.cantidad) {
                        totalKilos += parseFloat(data.cantidad || 0);
                    }
                });
                finalPeso = totalKilos > 0 ? String(Math.round(totalKilos * 10) / 10) : '0';
            }

            // Crear payload estructurado
            let payload = {
                sector: formData.sector,
                tipoResiduo: formData.tipoResiduo,
                peso: parseFloat(finalPeso),
                // Los inorgánicos recuperables NO van a batea, se asigna acopio general
                destino: isRecuperable ? 'Acopio de Recuperables' : formData.destino,
                responsable: formData.responsable,
                observaciones: formData.observaciones
            };

            if (formData.tipoResiduo === 'Inorgánicos Generales') {
                payload.clasificacionInorganico = formData.clasificacionInorganico;
                if (formData.clasificacionInorganico === 'Recuperable') {
                    const filtrados = {};
                    Object.entries(formData.materialesRecuperados).forEach(([mat, data]) => {
                        if (data.cantidad && parseFloat(data.cantidad) > 0) {
                            filtrados[mat] = {
                                cantidad: parseFloat(data.cantidad),
                                unidad: data.unidad
                            };
                        }
                    });
                    payload.materialesRecuperados = filtrados;
                }
            }

            const response = await SHIGMAService.createRecord('residuos-comunes', payload);

            const resData = response.data;
            setSuccessId(resData.record.id);
            setShowSuccessModal(true);
            
            // Reset form
            setFormData({
                sector: '',
                tipoResiduo: '',
                clasificacionInorganico: 'Irrecuperables',
                materialesRecuperados: {
                    'Cartón': { cantidad: '', unidad: 'Kilos' },
                    'Metal': { cantidad: '', unidad: 'Kilos' },
                    'Cajones': { cantidad: '', unidad: 'Kilos' },
                    'Conos de Film Streech': { cantidad: '', unidad: 'Kilos' },
                    'Otros': { cantidad: '', unidad: 'Kilos' }
                },
                peso: '',
                destino: '',
                responsable: 'Gabriel Tonelli',
                observaciones: ''
            });

            // Refrescar bateas para la siguiente validación
            fetchBateasData();
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Error al guardar el registro en el servidor.');
        } finally {
            setSubmitting(false);
        }
    };

    // Batea seleccionada para el bloque informativo sutil
    const selectedBateaObj = bateas.find(b => b.nombre === formData.destino);
    const isRecuperable = formData.tipoResiduo === 'Inorgánicos Generales' && formData.clasificacionInorganico === 'Recuperable';

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
                    <h1 style={{ fontSize: '2.1rem', fontWeight: '900', color: 'var(--primary)' }}>
                        Residuos Industriales No Especiales (RINE)<span style={{ color: 'var(--dy-red)' }}>.</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Registro y clasificación de desperdicios orgánicos, inorgánicos de marca y generales.
                    </p>
                </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit}>
                <Card style={{ padding: '28px', border: '1px solid var(--border)' }}>
                    <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                        <Layers size={18} style={{ color: 'var(--dy-red)' }} />
                        Datos del Lote
                    </div>
                    
                    <div className="form-grid">
                        <Select
                            label="Planta Generadora *"
                            name="sector"
                            value={formData.sector}
                            onChange={handleChange}
                            options={plantas}
                            includePlaceholder={true}
                            required
                        />

                        <Select
                            label="Tipo de Residuo *"
                            name="tipoResiduo"
                            value={formData.tipoResiduo}
                            onChange={handleChange}
                            options={tiposResiduo}
                            includePlaceholder={true}
                            required
                        />
                    </div>

                    {/* CONDICIONAL: Inorgánicos Generales */}
                    {formData.tipoResiduo === 'Inorgánicos Generales' && (
                        <div className="card-anim" style={{
                            background: 'var(--surface-hover)', 
                            padding: '20px', 
                            borderRadius: '16px', 
                            border: '1px solid var(--border)',
                            marginBottom: '20px',
                            marginTop: '8px'
                        }}>
                            {/* Switch sin label redundante para mejor visualización y UX limpia */}
                            <Switch
                                name="clasificacionInorganico"
                                checked={formData.clasificacionInorganico === 'Recuperable'}
                                onChange={handleSwitchChange}
                                activeLabel="Recuperable (Se puede clasificar material)"
                                inactiveLabel="Irrecuperables (Basura General)"
                            />

                            {/* CONDICIONAL: Materiales Recuperables ALINEADOS (Grid ancho óptimo para 1 millón) */}
                            {formData.clasificacionInorganico === 'Recuperable' && (
                                <div className="card-anim" style={{ marginTop: '20px', borderTop: '1px dashed var(--border)', paddingTop: '16px' }}>
                                    <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Boxes size={16} /> Clasificación de Materiales Recuperables
                                    </h4>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {materialesDisponibles.map(mat => {
                                            const isCajones = mat === 'Cajones';
                                            const currentMatData = formData.materialesRecuperados[mat];
                                            
                                            return (
                                                <div key={mat} style={{ 
                                                    display: 'grid', 
                                                    gridTemplateColumns: '120px 1fr 110px', 
                                                    alignItems: 'center', 
                                                    gap: '12px',
                                                    background: 'var(--surface)',
                                                    padding: '10px 16px',
                                                    borderRadius: '12px',
                                                    border: '1px solid var(--border)',
                                                    transition: 'all 0.2s'
                                                }}>
                                                    {/* Columna 1: Label fijo compacto */}
                                                    <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {mat === 'Cajones' ? 'Cajones Rotos' : mat}
                                                    </span>

                                                    {/* Columna 2: Input de cantidades Ancho doble (180px) para alojar números de hasta 1 millón */}
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'stretch', width: '180px', height: '34px' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const val = parseFloat(currentMatData.cantidad || 0);
                                                                    const newVal = Math.max(0, val - 1);
                                                                    handleMaterialQtyChange(mat, newVal > 0 ? String(Math.round(newVal * 10) / 10) : '');
                                                                }}
                                                                style={{
                                                                    padding: 0,
                                                                    width: '36px',
                                                                    border: '1px solid var(--border)',
                                                                    borderRadius: '8px 0 0 8px',
                                                                    background: 'var(--surface)',
                                                                    color: 'var(--text)',
                                                                    fontWeight: 'bold',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                            >
                                                                -
                                                            </button>
                                                            <input
                                                                type="number"
                                                                placeholder="0"
                                                                value={currentMatData.cantidad}
                                                                onChange={(e) => handleMaterialQtyChange(mat, e.target.value)}
                                                                min="0"
                                                                step={isCajones && currentMatData.unidad === 'Unidades' ? "1" : "0.1"}
                                                                onFocus={(e) => e.target.select()}
                                                                onMouseDown={handleInputMouseDown}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                                                                        e.preventDefault();
                                                                    }
                                                                    if (isCajones && currentMatData.unidad === 'Unidades' && (e.key === '.' || e.key === ',')) {
                                                                        e.preventDefault();
                                                                    }
                                                                }}
                                                                style={{ 
                                                                    flex: 1, 
                                                                    width: '108px', // Ancho aumentado para soportar hasta 1,000,000.0 sin desbordarse
                                                                    padding: '4px 8px',
                                                                    border: '1px solid var(--border)',
                                                                    borderLeft: 'none',
                                                                    borderRight: 'none',
                                                                    borderRadius: '0',
                                                                    textAlign: 'center',
                                                                    outline: 'none',
                                                                    fontWeight: '700',
                                                                    fontSize: '0.95rem',
                                                                    backgroundColor: 'var(--background)',
                                                                    color: 'var(--text)'
                                                                }}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const val = parseFloat(currentMatData.cantidad || 0);
                                                                    const newVal = val + 1;
                                                                    handleMaterialQtyChange(mat, String(Math.round(newVal * 10) / 10));
                                                                }}
                                                                style={{
                                                                    padding: 0,
                                                                    width: '36px',
                                                                    border: '1px solid var(--border)',
                                                                    borderRadius: '0 8px 8px 0',
                                                                    background: 'var(--surface)',
                                                                    color: 'var(--text)',
                                                                    fontWeight: 'bold',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Columna 3: Unidad de Medida alineada a la derecha y segura de overflow */}
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                        {isCajones ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <span style={{ fontSize: '0.75rem', color: currentMatData.unidad === 'Kilos' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '700' }}>Kilos</span>
                                                                <div 
                                                                    onClick={() => handleMaterialUnitChange(mat, currentMatData.unidad === 'Kilos')}
                                                                    style={{
                                                                        width: '30px', height: '16px',
                                                                        backgroundColor: currentMatData.unidad === 'Unidades' ? 'var(--dy-red)' : 'var(--border)',
                                                                        borderRadius: '8px', position: 'relative', cursor: 'pointer', transition: 'all 0.2s'
                                                                    }}
                                                                >
                                                                    <div style={{
                                                                        width: '12px', height: '12px', backgroundColor: '#fff', borderRadius: '50%',
                                                                        position: 'absolute', top: '2px', left: currentMatData.unidad === 'Unidades' ? '16px' : '2px',
                                                                        transition: 'all 0.2s'
                                                                    }} />
                                                                </div>
                                                                <span style={{ fontSize: '0.75rem', color: currentMatData.unidad === 'Unidades' ? 'var(--dy-red)' : 'var(--text-muted)', fontWeight: '700' }}>Uds</span>
                                                            </div>
                                                        ) : (
                                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', paddingRight: '4px' }}>
                                                                Kilos
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* HABILITADO SOLO SI NO ES RECUPERABLE (Los recuperables NO cargan peso general ni destino batea) */}
                    {!isRecuperable && (
                        <div className="form-grid" style={{ marginTop: '8px' }}>
                            {/* Cantidad (Kilos) con incrementador custom y sin placeholders innecesarios */}
                            <NumberInput
                                label="Cantidad (Kilos) *"
                                name="peso"
                                placeholder=""
                                step={0.5}
                                min={0.1}
                                value={formData.peso}
                                onChange={handleChange}
                                required
                            />

                            {/* Select de Destino (Filtrado dinámico por tipo de residuo y nombres limpios) */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <Select
                                    label="Destino (Batea) *"
                                    name="destino"
                                    value={formData.destino}
                                    onChange={handleChange}
                                    options={getDestinoOptions()}
                                    includePlaceholder={true}
                                    disabled={!formData.tipoResiduo}
                                    required
                                />

                                {/* INFORMACIÓN DE CAPACIDAD SUTIL FUERA DEL SELECTOR */}
                                {selectedBateaObj && (() => {
                                    const disponible = Math.max(0, selectedBateaObj.capacidad - selectedBateaObj.pesoAcumulado);
                                    const porcentaje = selectedBateaObj.porcentaje;
                                    const color = getCapacityColor(porcentaje);
                                    
                                    return (
                                        <div className="card-anim" style={{ 
                                            marginTop: '-4px', 
                                            marginBottom: '16px',
                                            padding: '12px 16px', 
                                            borderRadius: '12px', 
                                            background: 'var(--surface-hover)', 
                                            border: '1px solid var(--border)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '6px'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Ocupación de Batea:</span>
                                                <span style={{ color: color, fontWeight: '800' }}>{porcentaje}%</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Espacio Disponible:</span>
                                                <span style={{ color: color, fontWeight: '800' }}>{disponible.toLocaleString()} kg</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                <span>Capacidad Física Máxima:</span>
                                                <span style={{ fontWeight: '600' }}>{selectedBateaObj.capacidad.toLocaleString()} kg</span>
                                            </div>
                                            {/* Mini progress bar sutil */}
                                            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
                                                <div style={{ width: `${porcentaje}%`, height: '100%', backgroundColor: color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    <Input
                        label="Responsable del Registro"
                        type="text"
                        name="responsable"
                        value={formData.responsable}
                        onChange={handleChange}
                        disabled
                    />

                    <Textarea
                        label="Observaciones Adicionales"
                        name="observaciones"
                        placeholder="Detalles sobre el estado del residuo, impurezas o condiciones específicas..."
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
                        style={{ background: 'var(--success)' }}
                    >
                        <Send size={18} /> {submitting ? 'Guardando...' : 'Registrar Lote RINE'}
                    </Button>
                </div>
            </form>

            {/* Modal de Confirmación de Registro Exitoso */}
            <Modal 
                isOpen={showSuccessModal} 
                onClose={() => setShowSuccessModal(false)}
                title="Registro Completado"
            >
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ color: 'var(--success)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                        <CheckCircle size={64} />
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px', color: 'var(--primary)' }}>
                        ¡Guardado Correctamente!
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem' }}>
                        El pesaje de RINE ha sido ingresado al historial de trazabilidad con el ID único:
                        <br />
                        <strong style={{ color: 'var(--text)', fontSize: '1.1rem', display: 'inline-block', marginTop: '8px', padding: '6px 12px', background: 'var(--surface-hover)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            {successId}
                        </strong>
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                        <Button 
                            variant="outline" 
                            onClick={() => setShowSuccessModal(false)}
                        >
                            Cargar Otro
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={() => navigate('/')}
                        >
                            Ir al Dashboard
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal de Advertencia de Capacidad Superada */}
            {warningModalData.isOpen && (
                <Modal
                    isOpen={warningModalData.isOpen}
                    onClose={() => setWarningModalData(prev => ({ ...prev, isOpen: false }))}
                    title="Advertencia: Capacidad de Batea Superada"
                >
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <div style={{ color: 'var(--error)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                            <AlertTriangle size={64} />
                        </div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px', color: 'var(--primary)' }}>
                            ¡Límite de Capacidad Superado!
                        </h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: '1.5' }}>
                            La batea seleccionada (<strong>{warningModalData.bateaNombre}</strong>) solo cuenta con <strong>{warningModalData.disponible.toLocaleString()} kg</strong> de espacio disponible. 
                            <br />
                            Estás intentando registrar un lote de <strong>{warningModalData.pesoIngresado} kg</strong>, lo cual superaría el límite físico de almacenamiento.
                        </p>
                        <div style={{ 
                            padding: '12px', 
                            background: 'var(--surface-hover)', 
                            border: '1px solid var(--border)', 
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            color: 'var(--text)',
                            marginBottom: '24px',
                            lineHeight: '1.4'
                        }}>
                            Por favor, realice el despacho de vaciado en **Gestión de Bateas** o distribuya los residuos seleccionando otra batea como destino.
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                            <Button 
                                variant="outline" 
                                onClick={() => setWarningModalData(prev => ({ ...prev, isOpen: false }))}
                            >
                                Ajustar Pesaje
                            </Button>
                            <Button 
                                type="button"
                                variant="primary" 
                                style={{ background: 'var(--dy-red)' }}
                                onClick={() => {
                                    setWarningModalData(prev => ({ ...prev, isOpen: false }));
                                    navigate('/gestion-bateas');
                                }}
                            >
                                Ir a Gestión de Bateas
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal de Confirmación y Consentimiento de Lote */}
            {showConfirmModal && (
                <Modal
                    isOpen={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    title="Confirmación de Registro de Lote"
                    showCancel={false}
                    showFooter={false}
                >
                    <div style={{ padding: '8px 0' }}>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            background: 'var(--surface-hover)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '20px'
                        }}>
                            {/* Fila Planta */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Planta Generadora:</span>
                                <strong style={{ color: 'var(--text)' }}>
                                    {formData.sector === 'ER' ? 'Elguea Roman' : formData.sector === 'HY' ? 'Hipólito Yrigoyen' : formData.sector === 'PE' ? 'Pellegrini' : formData.sector}
                                </strong>
                            </div>

                            {/* Fila Tipo Residuo */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Tipo de Residuo:</span>
                                <strong style={{ color: 'var(--text)' }}>{formData.tipoResiduo}</strong>
                            </div>

                            {/* Fila Clasificación si es Inorgánicos Generales */}
                            {formData.tipoResiduo === 'Inorgánicos Generales' && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Clasificación:</span>
                                    <strong style={{ color: 'var(--text)' }}>{formData.clasificacionInorganico}</strong>
                                </div>
                            )}

                            {/* Fila Destino */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Destino / Batea:</span>
                                <strong style={{ color: 'var(--primary)' }}>
                                    {isRecuperable ? 'Acopio de Recuperables' : formData.destino}
                                </strong>
                            </div>

                            {/* Cantidad/Desglose de Materiales */}
                            {isRecuperable ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>Materiales Clasificados:</span>
                                    <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {Object.entries(formData.materialesRecuperados)
                                            .filter(([_, data]) => data.cantidad && parseFloat(data.cantidad) > 0)
                                            .map(([mat, data]) => (
                                                <div key={mat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>{mat === 'Cajones' ? 'Cajones Rotos' : mat}:</span>
                                                    <strong style={{ color: 'var(--text)' }}>{data.cantidad} {data.unidad}</strong>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            ) : null}

                            {/* Fila Peso Total */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', paddingTop: '4px' }}>
                                <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>
                                    {isRecuperable ? 'Peso Total Estimado:' : 'Cantidad Registrada:'}
                                </span>
                                <strong style={{ color: 'var(--success)', fontSize: '1.05rem', fontWeight: '800' }}>
                                    {isRecuperable ? (() => {
                                        let totalKilos = 0;
                                        Object.entries(formData.materialesRecuperados).forEach(([_, data]) => {
                                            if (data.unidad === 'Kilos' && data.cantidad) {
                                                totalKilos += parseFloat(data.cantidad || 0);
                                            }
                                        });
                                        return Math.round(totalKilos * 10) / 10;
                                    })() : formData.peso} Kilos
                                </strong>
                            </div>

                            {/* Observaciones si existen */}
                            {formData.observaciones && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--border)', paddingTop: '8px', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Observaciones:</span>
                                    <p style={{ color: 'var(--text)', fontStyle: 'italic', margin: 0 }}>"{formData.observaciones}"</p>
                                </div>
                            )}
                        </div>

                        {/* Checkbox de Consentimiento */}
                        <div 
                            onClick={() => {
                                const newChecked = !consentChecked;
                                setConsentChecked(newChecked);
                                if (newChecked) {
                                    setShowConsentError(false);
                                }
                            }}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px', 
                                padding: '12px 16px', 
                                background: consentChecked ? 'rgba(16, 185, 129, 0.08)' : 'var(--surface-hover)', 
                                border: consentChecked ? '1px solid var(--success)' : '1px solid var(--border)', 
                                borderRadius: '12px', 
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                marginBottom: '24px'
                            }}
                        >
                            <input 
                                type="checkbox" 
                                id="consent-check"
                                checked={consentChecked}
                                onChange={(e) => e.stopPropagation()} 
                                style={{ 
                                    width: '18px', 
                                    height: '18px', 
                                    accentColor: 'var(--success)',
                                    cursor: 'pointer' 
                                }}
                            />
                            <label 
                                htmlFor="consent-check" 
                                style={{ 
                                    fontSize: '0.875rem', 
                                    color: consentChecked ? 'var(--text)' : 'var(--text-muted)', 
                                    fontWeight: '700', 
                                    cursor: 'pointer',
                                    userSelect: 'none'
                                }}
                            >
                                Confirmo que los datos ingresados son correctos.
                            </label>
                        </div>

                        {/* Mensaje de validación de consentimiento */}
                        {showConsentError && (
                            <div style={{ 
                                color: 'var(--error)', 
                                fontSize: '0.85rem', 
                                fontWeight: '700', 
                                marginBottom: '12px', 
                                textAlign: 'right',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: '4px'
                            }}>
                                <span>⚠️ Debe confirmar los datos marcando la casilla de verificación antes de registrar.</span>
                            </div>
                        )}

                        {/* Botones de Acción */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                            <Button 
                                type="button"
                                variant="outline" 
                                onClick={() => setShowConfirmModal(false)}
                            >
                                Volver a Editar
                            </Button>
                            <Button 
                                type="button"
                                variant="primary" 
                                disabled={submitting}
                                onClick={handleConfirmClick}
                                style={{ 
                                    background: consentChecked ? 'var(--success)' : 'var(--border)', 
                                    color: consentChecked ? '#fff' : 'var(--text-muted)',
                                    cursor: consentChecked ? 'pointer' : 'not-allowed'
                                }}
                            >
                                Confirmar y Registrar
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default ResiduosComunes;
