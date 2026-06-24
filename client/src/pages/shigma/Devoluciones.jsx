import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CornerUpLeft, ArrowLeft, Send } from 'lucide-react';
import { Card, Input, Select, Textarea, NumberInput } from '../../components/FormElements';
import { Button } from '../../components/Button';
import Modal from '../../components/Modal';
import { SHIGMAService } from '../../services/api';
import { validateRecordDate, getDateConstraints } from '../../utils/dateUtils';
import { useMobile } from '../../config/ThemeContext';

const Devoluciones = () => {
    const isMobile = useMobile();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const [submitting, setSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successId, setSuccessId] = useState('');
    const [operadores, setOperadores] = useState([]);

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

    useEffect(() => {
        fetchOperadores();
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

        if (!formData.kilos || !formData.sector || !formData.responsable) {
            showAlert('Por favor, complete todos los campos obligatorios marcados con *');
            return;
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
                    responsable: localStorage.getItem('shigma_last_operator_devoluciones') || '',
                    observaciones: ''
                });
            }
        } catch (error) {
            console.error('Error submitting return form:', error);
            showAlert('Error al guardar en el servidor.', 'Error de Servidor', 'error');
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
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
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
