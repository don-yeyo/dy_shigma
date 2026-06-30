import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CornerUpLeft, ArrowLeft, Send, AlertTriangle } from 'lucide-react';
import { Card, Input, Select, Textarea, NumberInput } from '../../components/FormElements';
import { Button } from '../../components/Button';
import Modal from '../../components/Modal';
import { SHIGMAService } from '../../services/api';
import { validateRecordDate, getDateConstraints } from '../../utils/dateUtils';
import { useMobile, useTheme } from '../../config/ThemeContext';

const Devoluciones = () => {
    const isMobile = useMobile();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const [submitting, setSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successId, setSuccessId] = useState('');
    const [operadores, setOperadores] = useState([]);
    const [bateas, setBateas] = useState([]);

    // Modal de Advertencia por capacidad superada
    const [warningModalData, setWarningModalData] = useState({
        isOpen: false,
        bateaNombre: '',
        pesoIngresado: '',
        disponible: 0
    });

    const [alertModal, setAlertModal] = useState({
        isOpen: false,
        title: 'Validación',
        message: '',
        type: 'warning'
    });

    const showAlert = (message, title = 'Validación', type = 'warning') => {
        setAlertModal({
            isOpen: true,
            title,
            message,
            type
        });
    };

    const { todayStr, nowTimeStr, minDateStr, maxDateStr } = getDateConstraints();

    const [formData, setFormData] = useState({
        fechaCarga: todayStr,
        horaCarga: nowTimeStr,
        kilos: '',
        sector: '',
        destino: '',
        responsable: '',
        observaciones: ''
    });

    const dateInputRef = useRef(null);
    useEffect(() => {
        if (dateInputRef.current) {
            dateInputRef.current.focus();
        }
    }, []);

    const sectoresOpciones = (import.meta.env.VITE_SECTORES_DEVOLUCIONES || 'Panificados,Tapas,Pastas')
        .split(',')
        .map(sec => ({ id: sec.trim(), label: sec.trim() }));

    const fetchOperadores = async () => {
        try {
            const response = await SHIGMAService.getOperadoresByForm('devoluciones');
            const ops = response.data;
            setOperadores(ops);

            const lastOperator = localStorage.getItem('shigma_last_operator_devoluciones');
            if (lastOperator) {
                const exists = ops.some(op => op.apellidoNombre === lastOperator);
                if (exists) {
                    setFormData(prev => ({ ...prev, responsable: lastOperator }));
                } else {
                    localStorage.removeItem('shigma_last_operator_devoluciones');
                }
            }
        } catch (error) {
            console.error('Error fetching operators:', error);
        }
    };

    const fetchBateasData = async () => {
        try {
            const response = await SHIGMAService.getBateasStatus();
            console.log('Devoluciones - Bateas cargadas:', response.data);
            setBateas(response.data || []);
        } catch (error) {
            console.error('Error fetching bateas status:', error);
        }
    };

    useEffect(() => {
        fetchOperadores();
        fetchBateasData();
    }, []);

    useEffect(() => {
        if (editId) {
            const loadRecord = async () => {
                try {
                    const response = await SHIGMAService.getRecordsByForm('devoluciones');
                    const record = response.data.find(r => r.id === editId);
                    if (record) {
                        const dateObj = new Date(record.createdAt || record.fecha);
                        const fechaCarga = dateObj.toISOString().split('T')[0];
                        const horaCarga = dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
                        setFormData({
                            fechaCarga,
                            horaCarga,
                            kilos: record.kilos ? String(record.kilos) : '',
                            sector: record.sector || '',
                            destino: record.destino || '',
                            responsable: record.responsable || '',
                            observaciones: record.observaciones || ''
                        });
                    } else {
                        showAlert('No se encontró el registro a editar.', 'Error', 'error');
                    }
                } catch (err) {
                    console.error('Error loading record:', err);
                    showAlert('Error al cargar el registro para editar.', 'Error', 'error');
                }
            };
            loadRecord();
        }
    }, [editId]);

    const getDestinoOptions = () => {
        console.log('Devoluciones - getDestinoOptions called. Bateas en state:', bateas);
        // En Devoluciones, todos son orgánicos (Panificados, Tapas, Pastas)
        const filteredBateas = bateas.filter(b => b.tipo === 'Orgánicos');
        console.log('Devoluciones - Bateas filtradas (Orgánicos):', filteredBateas);
        return filteredBateas.map(b => ({
            id: b.nombre,
            label: b.nombre
        }));
    };

    const getCapacityColor = (percentage) => {
        if (percentage < 60) {
            return isDark ? '#34d399' : '#10b981';
        } else if (percentage < 85) {
            return isDark ? '#fbbf24' : '#b45309';
        } else {
            return isDark ? '#f87171' : '#dc2626';
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'responsable') {
            if (value) {
                localStorage.setItem('shigma_last_operator_devoluciones', value);
            } else {
                localStorage.removeItem('shigma_last_operator_devoluciones');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const combinedCreatedAt = `${formData.fechaCarga}T${formData.horaCarga}`;
        const dateError = validateRecordDate(combinedCreatedAt);
        if (dateError) {
            showAlert(dateError);
            return;
        }

        if (!formData.kilos || !formData.sector || !formData.responsable || !formData.destino) {
            showAlert('Por favor, complete todos los campos obligatorios marcados con *');
            return;
        }

        // VALIDACIÓN DE CAPACIDAD DE BATEA
        const selectedB = bateas.find(b => b.nombre === formData.destino);
        if (selectedB) {
            const disponible = Math.max(0, selectedB.capacidad - selectedB.pesoAcumulado);
            if (parseFloat(formData.kilos) > disponible) {
                // Emitir modal de advertencia al usuario y bloquear
                setWarningModalData({
                    isOpen: true,
                    bateaNombre: selectedB.nombre,
                    pesoIngresado: formData.kilos,
                    disponible: disponible
                });
                return;
            }
        }

        setSubmitting(true);
        try {
            const { fechaCarga, horaCarga, ...rest } = formData;
            const payload = {
                ...rest,
                createdAt: combinedCreatedAt,
                kilos: parseFloat(formData.kilos)
            };

            if (editId) {
                await SHIGMAService.updateRecord('devoluciones', editId, payload);
                setSuccessId(editId);
                setShowSuccessModal(true);
            } else {
                const response = await SHIGMAService.createRecord('devoluciones', payload);

                const resData = response.data;
                setSuccessId(resData.record.id);
                setShowSuccessModal(true);

                const constraints = getDateConstraints();
                setFormData({
                    fechaCarga: constraints.todayStr,
                    horaCarga: constraints.nowTimeStr,
                    kilos: '',
                    sector: '',
                    destino: '',
                    responsable: localStorage.getItem('shigma_last_operator_devoluciones') || '',
                    observaciones: ''
                });
                // Recargar estado de bateas
                fetchBateasData();
            }
        } catch (error) {
            console.error('Error submitting return form:', error);
            showAlert('Error al guardar en el servidor.', 'Error de Servidor', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Batea seleccionada para el bloque informativo sutil
    const selectedBateaObj = bateas.find(b => b.nombre === formData.destino);

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
                        Devoluciones<span style={{ color: 'var(--dy-red)' }}>.</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        {editId ? `Editando registro ${editId} del historial.` : 'Registro de mermas y devoluciones de mercadería.'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card style={{ borderLeft: '4px solid #3b82f6' }}>
                    <div className="form-section-title" style={{ color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                        Datos del Lote Devuelto
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
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                                Fecha *
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
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                                Hora *
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

                    <div className="form-grid" style={isMobile ? {
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    } : {}}>
                        <NumberInput
                            label="Kilos *"
                            name="kilos"
                            placeholder=""
                            step={0.5}
                            min={0.1}
                            value={formData.kilos}
                            onChange={handleChange}
                            required
                        />

                        <Select
                            label="Sector *"
                            name="sector"
                            value={formData.sector}
                            onChange={handleChange}
                            options={sectoresOpciones}
                            includePlaceholder={true}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '24px' }}>
                        <Select
                            label="Destino (Batea) *"
                            name="destino"
                            value={formData.destino}
                            onChange={handleChange}
                            options={getDestinoOptions()}
                            includePlaceholder={true}
                            required
                        />

                        {selectedBateaObj && (() => {
                            const disponible = Math.max(0, selectedBateaObj.capacidad - selectedBateaObj.pesoAcumulado);
                            const porcentaje = selectedBateaObj.porcentaje;
                            const color = getCapacityColor(porcentaje);

                            return (
                                <div className="card-anim" style={{
                                    marginTop: '-4px',
                                    marginBottom: '8px',
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
                                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
                                        <div style={{ width: `${porcentaje}%`, height: '100%', backgroundColor: color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    <Select
                        label="Operador Inspector *"
                        name="responsable"
                        value={formData.responsable}
                        onChange={handleChange}
                        options={operadores.map(op => ({ id: op.apellidoNombre, label: op.apellidoNombre }))}
                        includePlaceholder={true}
                        required
                    />

                    <Textarea
                        label="Observaciones"
                        name="observaciones"
                        placeholder="Detalles adicionales sobre el lote..."
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
                        style={{ background: '#3b82f6', color: '#fff' }}
                    >
                        <Send size={18} /> {submitting ? 'Guardando...' : editId ? 'Guardar Cambios' : 'Registrar Devolución'}
                    </Button>
                </div>
            </form>

            {/* Success Modal */}
            <Modal
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    if (editId) navigate('/historial');
                }}
                title={editId ? "Registro Modificado" : "Devolución Registrada"}
                showFooter={false}
            >
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ color: '#3b82f6', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                        <CornerUpLeft size={64} />
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px', color: 'var(--primary)' }}>
                        {editId ? "¡Modificación Guardada!" : "¡Devolución Registrada!"}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                        {editId 
                            ? "El registro de la devolución ha sido actualizado con éxito en el historial de trazabilidad con el ID:"
                            : "El registro de la devolución ha sido asentado en la trazabilidad con el ID:"}
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
                                    Cargar Otra
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

            {/* Modal de Advertencia de Capacidad Superada */}
            {warningModalData.isOpen && (
                <Modal
                    isOpen={warningModalData.isOpen}
                    onClose={() => setWarningModalData(prev => ({ ...prev, isOpen: false }))}
                    title="Advertencia: Capacidad Superada"
                    showFooter={false}
                >
                    <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <div style={{ color: 'var(--error)', marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
                            <AlertTriangle size={48} />
                        </div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '6px', color: 'var(--primary)' }}>
                            ¡Límite de Capacidad Superado!
                        </h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.875rem', lineHeight: '1.4' }}>
                            La batea <strong>{warningModalData.bateaNombre}</strong> solo tiene <strong>{warningModalData.disponible.toLocaleString()} kg</strong> libres.
                            Está intentando ingresar <strong>{warningModalData.pesoIngresado} kg</strong>.
                        </p>
                        <div style={{
                            padding: '10px 12px',
                            background: 'var(--surface-hover)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            color: 'var(--text)',
                            marginBottom: '16px',
                            lineHeight: '1.4'
                        }}>
                            Realice el despacho de vaciado en <strong>Gestión de Bateas</strong> o distribuya los residuos en otro destino.
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <Button
                                variant="outline"
                                onClick={() => setWarningModalData(prev => ({ ...prev, isOpen: false }))}
                                style={{ flex: '1 1 140px', minWidth: '120px' }}
                            >
                                Reasignar batea
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                style={{ background: 'var(--dy-red)', flex: '1 1 140px', minWidth: '120px' }}
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

export default Devoluciones;
