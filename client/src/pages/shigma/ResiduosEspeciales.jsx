import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { Card, Input, Select, Textarea } from '../../components/FormElements';
import { Button } from '../../components/Button';
import Modal from '../../components/Modal';
import { SHIGMAService } from '../../services/api';
import { getLocalISOString, validateRecordDate, getDateConstraints } from '../../utils/dateUtils';


const ResiduosEspeciales = () => {
    const navigate = useNavigate();
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
        tipoResiduoEspecial: '',
        cantidad: '',
        unidad: 'kg',
        sectorOrigen: '',
        tipoEnvase: '',
        categoriaPeligro: '',
        certificadoAcopio: '',
        responsable: '',
        observaciones: ''
    });

    const dateInputRef = useRef(null);
    useEffect(() => {
        if (dateInputRef.current) {
            dateInputRef.current.focus();
        }
    }, []);

    const tiposResiduo = [
        { id: 'Aceite mineral usado', label: 'Aceite mineral usado' },
        { id: 'Solventes orgánicos', label: 'Solventes orgánicos' },
        { id: 'Trapos y Absorbentes contaminados', label: 'Trapos y Absorbentes contaminados' },
        { id: 'Pilas y baterías de plomo/litio', label: 'Pilas y baterías' },
        { id: 'Chatarra electrónica (RAEE)', label: 'Chatarra electrónica (RAEE)' }
    ];

    const unidades = [
        { id: 'kg', label: 'Kilogramos (kg)' },
        { id: 'L', label: 'Litros (L)' }
    ];

    const sectores = [
        { id: 'Mantenimiento', label: 'Mantenimiento Central' },
        { id: 'Sala de Compresores', label: 'Sala de Compresores' },
        { id: 'Sala de Calderas', label: 'Sala de Calderas' },
        { id: 'Producción', label: 'Producción / Taller' },
        { id: 'Autoelevadores', label: 'Taller Autoelevadores' }
    ];

    const envases = [
        { id: 'Tambor 200L', label: 'Tambor 200L' },
        { id: 'Bidón 20L', label: 'Bidón 20L' },
        { id: 'Contenedor Metálico', label: 'Contenedor Metálico' },
        { id: 'Caja/IBC 1000L', label: 'Caja / Bin IBC 1000L' }
    ];

    const categorias = [
        { id: 'Y9 (Mezclas Aceite/Agua)', label: 'Y9 - Mezclas de aceites de desecho y agua' },
        { id: 'Y42 (Disolventes Orgánicos)', label: 'Y42 - Disolventes orgánicos desechados' },
        { id: 'Y31 (Baterías de Plomo)', label: 'Y31 - Compuestos de plomo y acumuladores' },
        { id: 'Clase 9 (Residuos Varios)', label: 'Clase 9 - Sustancias peligrosas diversas' }
    ];

    const fetchOperadores = async () => {
        try {
            const response = await SHIGMAService.getOperadoresByForm('residuos-especiales');
            const ops = response.data;
            setOperadores(ops);

            const lastOperator = localStorage.getItem('shigma_last_operator_residuos-especiales');
            if (lastOperator) {
                const exists = ops.some(op => op.apellidoNombre === lastOperator);
                if (exists) {
                    setFormData(prev => ({ ...prev, responsable: lastOperator }));
                } else {
                    localStorage.removeItem('shigma_last_operator_residuos-especiales');
                }
            }
        } catch (error) {
            console.error('Error fetching operators:', error);
        }
    };

    useEffect(() => {
        fetchOperadores();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'responsable') {
            if (value) {
                localStorage.setItem('shigma_last_operator_residuos-especiales', value);
            } else {
                localStorage.removeItem('shigma_last_operator_residuos-especiales');
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

        if (!formData.tipoResiduoEspecial || !formData.cantidad || !formData.sectorOrigen || !formData.tipoEnvase || !formData.categoriaPeligro || !formData.responsable) {
            showAlert('Por favor, complete todos los campos obligatorios marcados con *');
            return;
        }

        setSubmitting(true);
        try {
            const { fechaCarga, horaCarga, ...rest } = formData;
            const response = await SHIGMAService.createRecord('residuos-especiales', {
                ...rest,
                createdAt: combinedCreatedAt,
                cantidad: parseFloat(formData.cantidad)
            });

            const resData = response.data;
            setSuccessId(resData.record.id);
            setShowSuccessModal(true);

            const constraints = getDateConstraints();
            setFormData({
                fechaCarga: constraints.todayStr,
                horaCarga: constraints.nowTimeStr,
                tipoResiduoEspecial: '',
                cantidad: '',
                unidad: 'kg',
                sectorOrigen: '',
                tipoEnvase: '',
                categoriaPeligro: '',
                certificadoAcopio: '',
                responsable: localStorage.getItem('shigma_last_operator_residuos-especiales') || '',
                observaciones: ''
            });
        } catch (error) {
            console.error('Error submitting special waste:', error);
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
                        Residuos Especiales / Peligrosos<span style={{ color: 'var(--dy-red)' }}>.</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Registro de aceites, solventes, absorbentes y baterías bajo normas de ecotoxidad y seguridad.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card style={{ borderLeft: '4px solid var(--warning)' }}>
                    <div className="form-section-title" style={{ color: 'var(--warning)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                        Detalles del Residuo Peligroso
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
                            label="Tipo de Residuo *"
                            name="tipoResiduoEspecial"
                            value={formData.tipoResiduoEspecial}
                            onChange={handleChange}
                            options={tiposResiduo}
                            includePlaceholder={true}
                        />

                        <Select
                            label="Categoría Corriente de Desecho *"
                            name="categoriaPeligro"
                            value={formData.categoriaPeligro}
                            onChange={handleChange}
                            options={categorias}
                            includePlaceholder={true}
                        />
                    </div>

                    <div className="form-grid" style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ flex: 2 }}>
                                <Input
                                    label="Cantidad *"
                                    type="number"
                                    name="cantidad"
                                    placeholder="Ej: 200"
                                    step="0.1"
                                    min="0.1"
                                    value={formData.cantidad}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <Select
                                    label="Unidad *"
                                    name="unidad"
                                    value={formData.unidad}
                                    onChange={handleChange}
                                    options={unidades}
                                />
                            </div>
                        </div>

                        <Select
                            label="Sector de Origen *"
                            name="sectorOrigen"
                            value={formData.sectorOrigen}
                            onChange={handleChange}
                            options={sectores}
                            includePlaceholder={true}
                        />
                    </div>

                    <div className="form-grid" style={{ marginTop: '8px' }}>
                        <Select
                            label="Tipo de Envase / Contenedor *"
                            name="tipoEnvase"
                            value={formData.tipoEnvase}
                            onChange={handleChange}
                            options={envases}
                            includePlaceholder={true}
                        />

                        <Input
                            label="Certificado de Acopio Interno (Opcional)"
                            type="text"
                            name="certificadoAcopio"
                            placeholder="Ej: CAI-2026-0428"
                            value={formData.certificadoAcopio}
                            onChange={handleChange}
                        />
                    </div>

                    <Select
                        label="Operador / Inspector Responsable *"
                        name="responsable"
                        value={formData.responsable}
                        onChange={handleChange}
                        options={operadores.map(op => ({ id: op.apellidoNombre, label: op.apellidoNombre }))}
                        includePlaceholder={true}
                        required
                    />

                    <Textarea
                        label="Observaciones y Protocolos de Seguridad"
                        name="observaciones"
                        placeholder="Registrar detalles sobre hermeticidad, etiquetado de envases, kit antiderrames o precauciones de estiba..."
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
                        style={{ background: 'var(--warning)', color: '#fff' }}
                    >
                        <Send size={18} /> {submitting ? 'Guardando...' : 'Registrar Acopio Peligroso'}
                    </Button>
                </div>
            </form>

            {/* Success Modal */}
            <Modal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="Registro de Residuo Especial"
                showFooter={false}
            >
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ color: 'var(--warning)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                        <ShieldAlert size={64} />
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px', color: 'var(--primary)' }}>
                        ¡Lote Acopiado Exitosamente!
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                        El residuo especial se ha ingresado con éxito al sistema de trazabilidad peligrosa bajo el ID único:
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

export default ResiduosEspeciales;
