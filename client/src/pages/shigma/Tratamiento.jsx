import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { Card, Input, Select, Textarea } from '../../components/FormElements';
import { Button } from '../../components/Button';
import Modal from '../../components/Modal';
import { SHIGMAService } from '../../services/api';
import { getLocalISOString, validateRecordDate, getDateConstraints } from '../../utils/dateUtils';
import { useMobile } from '../../config/ThemeContext';


const Tratamiento = () => {
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
        procesoTratamiento: '',
        materialEntrada: '',
        cantidadProcesada: '',
        operador: '',
        maquinaUtilizada: '',
        subproductoObtenido: '',
        observaciones: ''
    });

    const dateInputRef = useRef(null);
    useEffect(() => {
        if (dateInputRef.current) {
            dateInputRef.current.focus();
        }
    }, []);

    const procesos = [
        { id: 'Compactado Hidráulico', label: 'Compactado Hidráulico' },
        { id: 'Triturado de Plásticos', label: 'Triturado de Plásticos' },
        { id: 'Compostado Orgánico', label: 'Compostado Orgánico' },
        { id: 'Neutralización química', label: 'Neutralización química' },
        { id: 'Desguace / Clasificación Manual', label: 'Desguace / Clasificación Manual' }
    ];

    const materiales = [
        { id: 'Film de Nylon / Stretch', label: 'Film de Nylon / Stretch' },
        { id: 'Cartón corrugado / Cajas', label: 'Cartón corrugado / Cajas' },
        { id: 'Botellas de PET / Plástico duro', label: 'Botellas de PET / Plástico duro' },
        { id: 'Residuos de masa y harinas', label: 'Residuos de masa y harinas' },
        { id: 'Bidones plásticos químicos vacíos', label: 'Bidones plásticos químicos vacíos' }
    ];

    const maquinas = [
        { id: 'Prensa Compactadora Hidráulica P1', label: 'Prensa Compactadora Hidráulica P1' },
        { id: 'Molino Triturador Escamador M3', label: 'Molino Triturador Escamador M3' },
        { id: 'Composteras Industriales de Fábrica', label: 'Composteras Industriales de Fábrica' },
        { id: 'Línea de Desmantelamiento manual', label: 'Línea de Desmantelamiento manual' }
    ];

    const subproductos = [
        { id: 'Fardo prensado de alta densidad (apilado)', label: 'Fardo prensado de alta densidad (apilado)' },
        { id: 'Plástico escamado molido (materia prima)', label: 'Plástico escamado molido (materia prima)' },
        { id: 'Compost maduro para espacios verdes', label: 'Compost maduro para espacios verdes' },
        { id: 'Líquido neutralizado para descarte seguro', label: 'Líquido neutralizado para descarte seguro' },
        { id: 'Material clasificado a granel', label: 'Material clasificado a granel' }
    ];

    const fetchOperadores = async () => {
        try {
            const response = await SHIGMAService.getOperadoresByForm('tratamiento');
            const ops = response.data;
            setOperadores(ops);
            
            const lastOperator = localStorage.getItem('shigma_last_operator_tratamiento');
            if (lastOperator) {
                const exists = ops.some(op => op.apellidoNombre === lastOperator);
                if (exists) {
                    setFormData(prev => ({ ...prev, operador: lastOperator }));
                } else {
                    localStorage.removeItem('shigma_last_operator_tratamiento');
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
                    const response = await SHIGMAService.getRecordsByForm('tratamiento');
                    const record = response.data.find(r => r.id === editId);
                    if (record) {
                        const dateObj = new Date(record.createdAt || record.fecha);
                        const fechaCarga = dateObj.toISOString().split('T')[0];
                        const horaCarga = dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
                        setFormData({
                            fechaCarga,
                            horaCarga,
                            procesoTratamiento: record.procesoTratamiento || '',
                            materialEntrada: record.materialEntrada || '',
                            cantidadProcesada: String(record.cantidadProcesada) || '',
                            operador: record.operador || '',
                            maquinaUtilizada: record.maquinaUtilizada || '',
                            subproductoObtenido: record.subproductoObtenido || '',
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

        if (name === 'operador') {
            if (value) {
                localStorage.setItem('shigma_last_operator_tratamiento', value);
            } else {
                localStorage.removeItem('shigma_last_operator_tratamiento');
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

        if (!formData.procesoTratamiento) {
            showAlert('Campo requerido', 'Seleccione el Tipo de Proceso / Tratamiento.');
            return;
        }
        if (!formData.materialEntrada) {
            showAlert('Campo requerido', 'Seleccione el Material a Procesar (Entrada).');
            return;
        }
        if (!formData.cantidadProcesada) {
            showAlert('Campo requerido', 'Ingrese la Cantidad Procesada (kg).');
            return;
        }
        if (!formData.maquinaUtilizada) {
            showAlert('Campo requerido', 'Seleccione la Máquina / Prensa Utilizada.');
            return;
        }
        if (!formData.subproductoObtenido) {
            showAlert('Campo requerido', 'Seleccione el Subproducto Obtenido (Salida).');
            return;
        }
        if (!formData.operador) {
            showAlert('Campo requerido', 'Seleccione el Operador a Cargo.');
            return;
        }

        setSubmitting(true);
        try {
            const { fechaCarga, horaCarga, ...rest } = formData;
            const payload = {
                ...rest,
                createdAt: combinedCreatedAt,
                cantidadProcesada: parseFloat(formData.cantidadProcesada)
            };

            if (editId) {
                await SHIGMAService.updateRecord('tratamiento', editId, payload);
                setSuccessId(editId);
                setShowSuccessModal(true);
            } else {
                const response = await SHIGMAService.createRecord('tratamiento', payload);

                const resData = response.data;
                setSuccessId(resData.record.id);
                setShowSuccessModal(true);
                
                const constraints = getDateConstraints();
                setFormData({
                    fechaCarga: constraints.todayStr,
                    horaCarga: constraints.nowTimeStr,
                    procesoTratamiento: '',
                    materialEntrada: '',
                    cantidadProcesada: '',
                    operador: localStorage.getItem('shigma_last_operator_tratamiento') || '',
                    maquinaUtilizada: '',
                    subproductoObtenido: '',
                    observaciones: ''
                });
            }
        } catch (error) {
            console.error('Error submitting treatment form:', error);
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
                        {editId ? 'Modificar' : 'Tratamiento y'} Valorización de Residuos<span style={{ color: 'var(--dy-red)' }}>.</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        {editId ? `Editando registro ${editId} del historial.` : 'Registro de procesos internos de compactación, trituración y compostado para maximizar el reciclaje.'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card style={{ borderLeft: '4px solid #a855f7' }}>
                    <div className="form-section-title" style={{ color: '#a855f7', borderColor: 'rgba(168, 85, 247, 0.2)' }}>
                        Operación de Planta de Tratamiento
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
                            label="Tipo de Proceso / Tratamiento *"
                            name="procesoTratamiento"
                            value={formData.procesoTratamiento}
                            onChange={handleChange}
                            options={procesos}
                            includePlaceholder={true}
                        />

                        <Select
                            label="Material a Procesar (Entrada) *"
                            name="materialEntrada"
                            value={formData.materialEntrada}
                            onChange={handleChange}
                            options={materiales}
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
                            label="Cantidad Procesada (kg) *"
                            type="number"
                            name="cantidadProcesada"
                            placeholder="Ej: 320"
                            step="0.1"
                            min="0.1"
                            value={formData.cantidadProcesada}
                            onChange={handleChange}
                            required
                        />

                        <Select
                            label="Máquina / Prensa Utilizada *"
                            name="maquinaUtilizada"
                            value={formData.maquinaUtilizada}
                            onChange={handleChange}
                            options={maquinas}
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
                        <Select
                            label="Subproducto Obtenido (Salida) *"
                            name="subproductoObtenido"
                            value={formData.subproductoObtenido}
                            onChange={handleChange}
                            options={subproductos}
                            includePlaceholder={true}
                        />

                        <Select
                            label="Operador a Cargo *"
                            name="operador"
                            value={formData.operador}
                            onChange={handleChange}
                            options={operadores.map(op => ({ id: op.apellidoNombre, label: op.apellidoNombre }))}
                            includePlaceholder={true}
                            required
                        />
                    </div>

                    <Textarea
                        label="Observaciones Técnicas de la Molienda o Prensado"
                        name="observaciones"
                        placeholder="Registrar anomalías de la máquina, estado del material obtenido (humedad, impurezas) o código de fardo generado..."
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
                        style={{ background: '#a855f7', color: '#fff' }}
                    >
                        <Send size={18} /> {submitting ? 'Guardando...' : editId ? 'Guardar Cambios' : 'Registrar Tratamiento'}
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
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '1rem' }}>{alertModal.message}</p>
                    <Button variant="primary" onClick={() => setAlertModal({ isOpen: false, title: '', message: '' })} style={{ background: '#a855f7', color: '#fff' }}>Entendido</Button>
                </div>
            </Modal>

            {/* Success Modal */}
            <Modal 
                isOpen={showSuccessModal} 
                onClose={() => {
                    setShowSuccessModal(false);
                    if (editId) navigate('/historial');
                }}
                title={editId ? "Registro Modificado" : "Tratamiento Registrado Correctamente"}
                showFooter={false}
            >
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ color: '#a855f7', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                        <RefreshCw size={64} />
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px', color: 'var(--primary)' }}>
                        {editId ? "¡Modificación Guardada!" : "¡Proceso Registrado!"}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                        {editId 
                            ? "El tratamiento de valorización de residuos se ha actualizado con éxito en la base de datos con el ID único:"
                            : "El tratamiento de valorización de residuos se ha ingresado con éxito a la base de datos con el ID único:"}
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

export default Tratamiento;
