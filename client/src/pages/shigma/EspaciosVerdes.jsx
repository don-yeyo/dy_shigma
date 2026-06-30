import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Leaf, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { Card, Input, Select, Textarea } from '../../components/FormElements';
import { Button } from '../../components/Button';
import Modal from '../../components/Modal';
import { SHIGMAService } from '../../services/api';
import { getLocalISOString, validateRecordDate, getDateConstraints } from '../../utils/dateUtils';
import { useMobile } from '../../config/ThemeContext';


const EspaciosVerdes = () => {
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
        espacioVerde: '',
        tareaRealizada: '',
        consumoAgua: '',
        plantasAgregadas: '0',
        especieAgregada: '',
        estadoSalud: '',
        responsableTarea: 'Jardinería & Mantenimiento',
        responsable: '',
        observaciones: ''
    });

    const dateInputRef = useRef(null);
    useEffect(() => {
        if (dateInputRef.current) {
            dateInputRef.current.focus();
        }
    }, []);

    const espacios = [
        { id: 'Jardín Frontal de Administración', label: 'Jardín Frontal de Administración' },
        { id: 'Perímetro Norte Compresores', label: 'Perímetro Norte Compresores' },
        { id: 'Parque Recreativo del Comedor', label: 'Parque Recreativo del Comedor' },
        { id: 'Pulmón Verde de Logística', label: 'Pulmón Verde de Logística' },
        { id: 'Barrera Forestal Trasera (Cortina de Viento)', label: 'Barrera Forestal Trasera' }
    ];

    const tareas = [
        { id: 'Riego ecológico controlado', label: 'Riego ecológico controlado' },
        { id: 'Poda selectiva y Parquizado', label: 'Poda selectiva y Parquizado' },
        { id: 'Plantación de nuevos ejemplares', label: 'Plantación de nuevos ejemplares' },
        { id: 'Fertilización orgánica con Compost interno', label: 'Fertilización orgánica con compost interno' },
        { id: 'Desmalezado manual / Control malezas', label: 'Desmalezado manual / Control malezas' }
    ];

    const estados = [
        { id: 'Excelente / Floración y Vigoroso', label: 'Excelente / Floración y Vigoroso' },
        { id: 'Bueno / Crecimiento Estable', label: 'Bueno / Crecimiento Estable' },
        { id: 'Falta Riego / Estrés Hídrico Leve', label: 'Falta Riego / Estrés Hídrico Leve' },
        { id: 'Bajo Tratamiento de control biológico de Plagas', label: 'Bajo Control Biológico de Plagas' }
    ];

    const fetchOperadores = async () => {
        try {
            const response = await SHIGMAService.getOperadoresByForm('espacios-verdes');
            const ops = response.data;
            setOperadores(ops);

            const lastOperator = localStorage.getItem('shigma_last_operator_espacios-verdes');
            if (lastOperator) {
                const exists = ops.some(op => op.apellidoNombre === lastOperator);
                if (exists) {
                    setFormData(prev => ({ ...prev, responsable: lastOperator }));
                } else {
                    localStorage.removeItem('shigma_last_operator_espacios-verdes');
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
                    const response = await SHIGMAService.getRecordsByForm('espacios-verdes');
                    const record = response.data.find(r => r.id === editId);
                    if (record) {
                        const dateObj = new Date(record.createdAt || record.fecha);
                        const fechaCarga = dateObj.toISOString().split('T')[0];
                        const horaCarga = dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
                        setFormData({
                            fechaCarga,
                            horaCarga,
                            espacioVerde: record.espacioVerde || '',
                            tareaRealizada: record.tareaRealizada || '',
                            consumoAgua: String(record.consumoAgua) || '',
                            plantasAgregadas: String(record.plantasAgregadas) || '0',
                            especieAgregada: record.especieAgregada || '',
                            estadoSalud: record.estadoSalud || '',
                            responsableTarea: record.responsableTarea || `Jardinería & Mantenimiento ${import.meta.env.VITE_COMPANY_NAME_SHORT || 'DEMO'}`,
                            responsable: record.responsable || '',
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'responsable') {
            if (value) {
                localStorage.setItem('shigma_last_operator_espacios-verdes', value);
            } else {
                localStorage.removeItem('shigma_last_operator_espacios-verdes');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const combinedCreatedAt = `${formData.fechaCarga}T${formData.horaCarga}`;
        const dateError = validateRecordDate(combinedCreatedAt);
        if (dateError) {
            showAlert('Fecha inválida', dateError);
            return;
        }

        if (!formData.espacioVerde) {
            showAlert('Campo requerido', 'Seleccione el Espacio Verde a registrar.');
            return;
        }
        if (!formData.tareaRealizada) {
            showAlert('Campo requerido', 'Seleccione la Tarea Realizada.');
            return;
        }
        if (!formData.consumoAgua) {
            showAlert('Campo requerido', 'Ingrese el Consumo de Agua (litros).');
            return;
        }
        if (!formData.estadoSalud) {
            showAlert('Campo requerido', 'Seleccione el Estado de Salud de la Vegetación.');
            return;
        }
        if (!formData.responsable) {
            showAlert('Campo requerido', 'Seleccione el Responsable de la Tarea.');
            return;
        }

        setSubmitting(true);
        try {
            const { fechaCarga, horaCarga, ...rest } = formData;
            const payload = {
                ...rest,
                createdAt: combinedCreatedAt,
                consumoAgua: parseFloat(formData.consumoAgua),
                plantasAgregadas: parseInt(formData.plantasAgregadas) || 0
            };

            if (editId) {
                await SHIGMAService.updateRecord('espacios-verdes', editId, payload);
                setSuccessId(editId);
                setShowSuccessModal(true);
            } else {
                const response = await SHIGMAService.createRecord('espacios-verdes', payload);

                const resData = response.data;
                setSuccessId(resData.record.id);
                setShowSuccessModal(true);

                const constraints = getDateConstraints();
                setFormData({
                    fechaCarga: constraints.todayStr,
                    horaCarga: constraints.nowTimeStr,
                    espacioVerde: '',
                    tareaRealizada: '',
                    consumoAgua: '',
                    plantasAgregadas: '0',
                    especieAgregada: '',
                    estadoSalud: '',
                    responsableTarea: `Jardinería & Mantenimiento ${import.meta.env.VITE_COMPANY_NAME_SHORT || 'DEMO'}`,
                    responsable: localStorage.getItem('shigma_last_operator_espacios-verdes') || '',
                    observaciones: ''
                });
            }
        } catch (error) {
            console.error('Error submitting green spaces form:', error);
            showAlert('Error del servidor', 'No se pudo guardar el registro. Por favor, intente nuevamente.');
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
                        {editId ? 'Modificar Registro' : 'Espacios Verdes'}<span style={{ color: 'var(--dy-red)' }}>.</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        {editId ? `Editando registro ${editId} del historial.` : 'Registro de mantenimiento botánico, forestación industrial y optimización de agua de riego ecológico.'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card style={{ borderLeft: '4px solid #84cc16' }}>
                    <div className="form-section-title" style={{ color: '#84cc16', borderColor: 'rgba(132, 204, 22, 0.2)' }}>
                        Gestión Ambiental de Zonas Verdes
                    </div>

                    {/* Fecha y Hora de la Carga (Separadas en grilla responsive, con Autofoco) */}
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

                    <div className="form-grid" style={isMobile ? {
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    } : {}}>
                        <Select
                            label="Zona Ambiental / Espacio *"
                            name="espacioVerde"
                            value={formData.espacioVerde}
                            onChange={handleChange}
                            options={espacios}
                            includePlaceholder={true}
                        />

                        <Select
                            label="Tarea de Mantenimiento *"
                            name="tareaRealizada"
                            value={formData.tareaRealizada}
                            onChange={handleChange}
                            options={tareas}
                            includePlaceholder={true}
                        />
                    </div>

                    <div className="form-grid" style={isMobile ? {
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        marginTop: '8px'
                    } : {
                        marginTop: '8px'
                    }}>
                        <Input
                            label="Consumo de Agua Estimado (Litros) *"
                            type="number"
                            name="consumoAgua"
                            placeholder="Ej: 150"
                            min="0"
                            value={formData.consumoAgua}
                            onChange={handleChange}
                            required
                        />

                        <Select
                            label="Estado de Salud Vegetal *"
                            name="estadoSalud"
                            value={formData.estadoSalud}
                            onChange={handleChange}
                            options={estados}
                            includePlaceholder={true}
                        />
                    </div>

                    <div className="form-section-title" style={{ marginTop: '24px', color: '#84cc16', borderColor: 'rgba(132, 204, 22, 0.2)' }}>
                        Forestación y Plantación (Nuevas Especies)
                    </div>

                    <div className="form-grid" style={isMobile ? {
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    } : {}}>
                        <Input
                            label="Cantidad de Plantas/Árboles Agregados"
                            type="number"
                            name="plantasAgregadas"
                            placeholder="Ej: 5"
                            min="0"
                            value={formData.plantasAgregadas}
                            onChange={handleChange}
                        />

                        <Input
                            label="Especie / Nombre Botánico Sembrado"
                            type="text"
                            name="especieAgregada"
                            placeholder="Ej: Plantas florales nativas, Jacarandá, etc."
                            value={formData.especieAgregada}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-grid" style={isMobile ? {
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        marginTop: '8px'
                    } : {
                        marginTop: '8px'
                    }}>
                        <Input
                            label="Equipo Ejecutor"
                            type="text"
                            name="responsableTarea"
                            value={formData.responsableTarea}
                            onChange={handleChange}
                            required
                        />

                        <Select
                            label="Supervisor de Seguridad Ambiental *"
                            name="responsable"
                            value={formData.responsable}
                            onChange={handleChange}
                            options={operadores.map(op => ({ id: op.apellidoNombre, label: op.apellidoNombre }))}
                            includePlaceholder={true}
                            required
                        />
                    </div>

                    <Textarea
                        label="Observaciones y Planificación de Jardinería"
                        name="observaciones"
                        placeholder="Comentar sobre la efectividad del compost biológico, control de insectos o necesidades climáticas para la semana..."
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
                        style={{ background: '#84cc16', color: '#fff' }}
                    >
                        <Send size={18} /> {submitting ? 'Guardando...' : editId ? 'Guardar Cambios' : 'Registrar Mantenimiento'}
                    </Button>
                </div>
            </form>

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
                    <Button variant="primary" onClick={() => setAlertModal({ isOpen: false, title: '', message: '' })} style={{ background: '#84cc16', color: '#fff' }}>Entendido</Button>
                </div>
            </Modal>

            {/* Success Modal */}
            <Modal
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    if (editId) navigate('/historial');
                }}
                title={editId ? "Registro Modificado" : "Mantenimiento de Espacio Verde Registrado"}
                showFooter={false}
            >
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ color: '#84cc16', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                        <Leaf size={64} />
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px', color: 'var(--primary)' }}>
                        {editId ? "¡Registro Modificado Exitosamente!" : "¡Parquizado Registrado!"}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                        {editId
                            ? "La modificación se ha guardado correctamente en la base de datos de trazabilidad bajo el ID único:"
                            : "La tarea ambiental en el pulmón verde ha sido guardada en la base de trazabilidad ecológica con el ID único:"}
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

export default EspaciosVerdes;
