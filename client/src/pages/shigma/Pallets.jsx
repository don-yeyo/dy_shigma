import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Package, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { Card, Input, Select, Textarea } from '../../components/FormElements';
import { Button } from '../../components/Button';
import Modal from '../../components/Modal';
import { SHIGMAService } from '../../services/api';
import { getLocalISOString, validateRecordDate, getDateConstraints } from '../../utils/dateUtils';


const Pallets = () => {
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
        tipoPallet: '',
        cantidadIngresados: '',
        cantidadReparados: '',
        cantidadDescartados: '',
        cantidadCircular: '',
        responsableReparacion: 'Taller de Pallets - Mantenimiento',
        responsable: '',
        observaciones: ''
    });

    const dateInputRef = useRef(null);
    useEffect(() => {
        if (dateInputRef.current) {
            dateInputRef.current.focus();
        }
    }, []);

    const tipos = [
        { id: 'Estándar ARLOG (1200x1000)', label: 'Estándar ARLOG (1200x1000 mm)' },
        { id: 'EUR / EPAL (1200x800)', label: 'EUR / EPAL (1200x800 mm)' },
        { id: 'Pallet Descartable Ligero', label: 'Pallet Descartable Ligero' },
        { id: 'Pallet de Plástico Reforzado', label: 'Pallet de Plástico Reforzado' }
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
                    setFormData(prev => ({ ...prev, responsable: lastOperator }));
                } else {
                    localStorage.removeItem('shigma_last_operator_pallets');
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
                            tipoPallet: record.tipoPallet || '',
                            cantidadIngresados: String(record.cantidadIngresados) || '',
                            cantidadReparados: String(record.cantidadReparados) || '',
                            cantidadDescartados: String(record.cantidadDescartados) || '',
                            cantidadCircular: String(record.cantidadCircular) || '',
                            responsableReparacion: record.responsableReparacion || 'Taller de Pallets - Mantenimiento',
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
                localStorage.setItem('shigma_last_operator_pallets', value);
            } else {
                localStorage.removeItem('shigma_last_operator_pallets');
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

        if (!formData.tipoPallet) {
            showAlert('Campo requerido', 'Seleccione el Tipo de Pallet.');
            return;
        }
        if (!formData.cantidadIngresados) {
            showAlert('Campo requerido', 'Ingrese la Cantidad de Pallets Ingresados.');
            return;
        }
        if (!formData.cantidadReparados) {
            showAlert('Campo requerido', 'Ingrese la Cantidad de Pallets Reparados.');
            return;
        }
        if (!formData.cantidadDescartados) {
            showAlert('Campo requerido', 'Ingrese la Cantidad de Pallets Descartados.');
            return;
        }
        if (!formData.cantidadCircular) {
            showAlert('Campo requerido', 'Ingrese la Cantidad enviada a Economía Circular.');
            return;
        }
        if (!formData.responsable) {
            showAlert('Campo requerido', 'Seleccione el Responsable / Operador.');
            return;
        }

        const ingresados = parseInt(formData.cantidadIngresados) || 0;
        const reparados = parseInt(formData.cantidadReparados) || 0;
        const descartados = parseInt(formData.cantidadDescartados) || 0;
        const circular = parseInt(formData.cantidadCircular) || 0;

        if (reparados + descartados + circular > ingresados) {
            showAlert('Cantidades inconsistentes', 'La suma de reparados, descartados y enviados a economía circular no puede superar la cantidad ingresada.');
            return;
        }

        setSubmitting(true);
        try {
            const { fechaCarga, horaCarga, ...rest } = formData;
            const payload = {
                ...rest,
                createdAt: combinedCreatedAt,
                cantidadIngresados: ingresados,
                cantidadReparados: reparados,
                cantidadDescartados: descartados,
                cantidadCircular: circular
            };

            if (editId) {
                await SHIGMAService.updateRecord('pallets', editId, payload);
                setSuccessId(editId);
                setShowSuccessModal(true);
            } else {
                const response = await SHIGMAService.createRecord('pallets', payload);

                const resData = response.data;
                setSuccessId(resData.record.id);
                setShowSuccessModal(true);
                
                const constraints = getDateConstraints();
                setFormData({
                    fechaCarga: constraints.todayStr,
                    horaCarga: constraints.nowTimeStr,
                    tipoPallet: '',
                    cantidadIngresados: '',
                    cantidadReparados: '',
                    cantidadDescartados: '',
                    cantidadCircular: '',
                    responsableReparacion: 'Taller de Pallets - Mantenimiento',
                    responsable: localStorage.getItem('shigma_last_operator_pallets') || '',
                    observaciones: ''
                });
            }
        } catch (error) {
            console.error('Error submitting pallets form:', error);
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
                        {editId ? 'Modificar' : 'Control de'} Stock y Pallets<span style={{ color: 'var(--dy-red)' }}>.</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        {editId ? `Editando registro ${editId} del historial.` : 'Registro de ingreso, reparación y reciclaje de pallets de madera para logística circular.'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card style={{ borderLeft: '4px solid #14b8a6' }}>
                    <div className="form-section-title" style={{ color: '#14b8a6', borderColor: 'rgba(20, 184, 166, 0.2)' }}>
                        Inventario y Clasificación de Pallets
                    </div>

                    {/* Fecha y Hora de la Carga (Separadas en grilla responsive, con Autofoco) */}
                    <div className="form-grid" style={{ marginBottom: '24px' }}>
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

                    <div className="form-grid">
                        <Select
                            label="Formato / Tipo de Pallet *"
                            name="tipoPallet"
                            value={formData.tipoPallet}
                            onChange={handleChange}
                            options={tipos}
                            includePlaceholder={true}
                        />

                        <Input
                            label="Cantidad Total Ingresada *"
                            type="number"
                            name="cantidadIngresados"
                            placeholder="Ej: 50"
                            min="1"
                            value={formData.cantidadIngresados}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-section-title" style={{ marginTop: '24px', color: '#14b8a6', borderColor: 'rgba(20, 184, 166, 0.2)' }}>
                        Estado y Disposición de Reparaciones
                    </div>

                    <div className="form-grid">
                        <Input
                            label="Cantidad Reparados / Aptos *"
                            type="number"
                            name="cantidadReparados"
                            placeholder="Ej: 38"
                            min="0"
                            value={formData.cantidadReparados}
                            onChange={handleChange}
                            required
                        />

                        <Input
                            label="Cantidad Descartados / Inservibles *"
                            type="number"
                            name="cantidadDescartados"
                            placeholder="Ej: 5"
                            min="0"
                            value={formData.cantidadDescartados}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-grid" style={{ marginTop: '8px' }}>
                        <Input
                            label="Enviados a Economía Circular (Madera recuperable) *"
                            type="number"
                            name="cantidadCircular"
                            placeholder="Ej: 7"
                            min="0"
                            value={formData.cantidadCircular}
                            onChange={handleChange}
                            required
                        />

                        <Input
                            label="Taller Encargado"
                            type="text"
                            name="responsableReparacion"
                            value={formData.responsableReparacion}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <Select
                        label="Inspector Responsable *"
                        name="responsable"
                        value={formData.responsable}
                        onChange={handleChange}
                        options={operadores.map(op => ({ id: op.apellidoNombre, label: op.apellidoNombre }))}
                        includePlaceholder={true}
                        required
                    />

                    <Textarea
                        label="Observaciones y Diagnóstico de Roturas"
                        name="observaciones"
                        placeholder="Describir tipo de daño detectado (clavos sueltos, listones rotos, tacos dañados) o destino final de la madera descartada..."
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
                        style={{ background: '#14b8a6', color: '#fff' }}
                    >
                        <Send size={18} /> {submitting ? 'Guardando...' : editId ? 'Guardar Cambios' : 'Registrar Movimiento'}
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
                    <Button variant="primary" onClick={() => setAlertModal({ isOpen: false, title: '', message: '' })} style={{ background: '#14b8a6', color: '#fff' }}>Entendido</Button>
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
                    <div style={{ color: '#14b8a6', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
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
                            </>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Pallets;
