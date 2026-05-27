import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Recycle, ArrowLeft, Send, CheckCircle, Award } from 'lucide-react';
import { Card, Input, Select, Textarea } from '../../components/FormElements';
import { Button } from '../../components/Button';
import Modal from '../../components/Modal';
import { SHIGMAService } from '../../services/api';
import { getLocalISOString, validateRecordDate, getDateConstraints } from '../../utils/dateUtils';


const EconomiaCircular = () => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successId, setSuccessId] = useState('');
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '' });

    const showAlert = (title, message) => setAlertModal({ isOpen: true, title, message });
    
    const { todayStr, nowTimeStr, minDateStr, maxDateStr } = getDateConstraints();
    
    const [formData, setFormData] = useState({
        fechaCarga: todayStr,
        horaCarga: nowTimeStr,
        materialRevalorizado: '',
        cantidad: '',
        unidad: 'kg',
        destinoReinsercion: '',
        ahorroEstimado: '',
        co2Evitado: 0,
        responsable: 'Gabriel Tonelli',
        observaciones: ''
    });

    const dateInputRef = useRef(null);
    useEffect(() => {
        if (dateInputRef.current) {
            dateInputRef.current.focus();
        }
    }, []);

    const materiales = [
        { id: 'Compost orgánico maduro', label: 'Compost orgánico (masa/comedor)' },
        { id: 'Pallets recuperados logísticos', label: 'Pallets reconstruidos / reparados' },
        { id: 'Film stretch de Nylon re-compactado', label: 'Film plástico stretch re-compactado' },
        { id: 'Cajas de cartón corrugado reutilizadas', label: 'Cajas de cartón reutilizadas en expedición' }
    ];

    const destinos = [
        { id: 'Venta a recicladora externa certificada', label: 'Venta a recicladora externa certificada' },
        { id: 'Donación a huertas ecológicas comunitarias', label: 'Donación a huertas ecológicas comunitarias' },
        { id: 'Reuso logístico interno en fábrica', label: 'Reuso logístico interno en fábrica' },
        { id: 'Uso interno en parquizado y jardinería', label: 'Uso interno en parquizado / jardines fábrica' }
    ];

    const unidades = [
        { id: 'kg', label: 'Kilogramos (kg)' },
        { id: 'uds', label: 'Unidades (uds)' }
    ];

    // Cálculo dinámico de huella de carbono mitigada (CO2 Evitado)
    useEffect(() => {
        const cant = parseFloat(formData.cantidad) || 0;
        let factor = 0;

        if (formData.materialRevalorizado === 'Compost orgánico maduro') {
            factor = 0.5; // 0.5 kg de CO2 por kg de compost
        } else if (formData.materialRevalorizado === 'Pallets recuperados logísticos') {
            factor = 15.0; // 15 kg de CO2 por pallet de madera reparado
        } else if (formData.materialRevalorizado === 'Film stretch de Nylon re-compactado') {
            factor = 1.5; // 1.5 kg de CO2 por kg de nylon reciclado
        } else if (formData.materialRevalorizado === 'Cajas de cartón corrugado reutilizadas') {
            factor = 0.9; // 0.9 kg de CO2 por kg de cartón reutilizado
        }

        const calculatedCO2 = Math.round((cant * factor) * 100) / 100;
        setFormData(prev => ({
            ...prev,
            co2Evitado: calculatedCO2
        }));
    }, [formData.materialRevalorizado, formData.cantidad]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
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

        if (!formData.materialRevalorizado) {
            showAlert('Campo requerido', 'Seleccione el Material Revalorizado.');
            return;
        }
        if (!formData.cantidad) {
            showAlert('Campo requerido', 'Ingrese la Cantidad del material.');
            return;
        }
        if (!formData.destinoReinsercion) {
            showAlert('Campo requerido', 'Seleccione el Destino / Reinserción.');
            return;
        }
        if (!formData.ahorroEstimado) {
            showAlert('Campo requerido', 'Ingrese el Ahorro Estimado.');
            return;
        }

        setSubmitting(true);
        try {
            const { fechaCarga, horaCarga, ...rest } = formData;
            const response = await SHIGMAService.createRecord('economia-circular', {
                ...rest,
                createdAt: combinedCreatedAt,
                cantidad: parseFloat(formData.cantidad),
                ahorroEstimado: parseFloat(formData.ahorroEstimado)
            });

            const resData = response.data;
            setSuccessId(resData.record.id);
            setShowSuccessModal(true);
            
            const constraints = getDateConstraints();
            setFormData({
                fechaCarga: constraints.todayStr,
                horaCarga: constraints.nowTimeStr,
                materialRevalorizado: '',
                cantidad: '',
                unidad: 'kg',
                destinoReinsercion: '',
                ahorroEstimado: '',
                co2Evitado: 0,
                responsable: 'Gabriel Tonelli',
                observaciones: ''
            });
        } catch (error) {
            console.error('Error submitting circular economy form:', error);
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
                        Valorización Economía Circular<span style={{ color: 'var(--dy-red)' }}>.</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Trazabilidad de recursos reinsertados a la cadena productiva y cálculo de huella ecológica reducida.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card style={{ borderLeft: '4px solid var(--dy-red)' }}>
                    <div className="form-section-title" style={{ color: 'var(--dy-red)', borderColor: 'rgba(228, 5, 33, 0.2)' }}>
                        Reinserción y Valorización Ecológica
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
                            label="Recurso Revalorizado *"
                            name="materialRevalorizado"
                            value={formData.materialRevalorizado}
                            onChange={handleChange}
                            options={materiales}
                            includePlaceholder={true}
                        />

                        <Select
                            label="Destino de Reinserción *"
                            name="destinoReinsercion"
                            value={formData.destinoReinsercion}
                            onChange={handleChange}
                            options={destinos}
                            includePlaceholder={true}
                        />
                    </div>

                    <div className="form-grid" style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ flex: 2 }}>
                                <Input
                                    label="Cantidad Valorizada *"
                                    type="number"
                                    name="cantidad"
                                    placeholder="Ej: 50"
                                    min="0.1"
                                    step="0.1"
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

                        <Input
                            label="Ahorro Económico Estimado ($) *"
                            type="number"
                            name="ahorroEstimado"
                            placeholder="Ej: 25000"
                            min="0"
                            value={formData.ahorroEstimado}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* CO2 Calculation Glowing Card */}
                    {formData.materialRevalorizado && formData.cantidad && (
                        <div className="card-anim" style={{
                            margin: '24px 0 16px 0',
                            padding: '16px',
                            borderRadius: '16px',
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center' }}>
                                <Award size={36} />
                            </div>
                            <div>
                                <h4 style={{ color: 'var(--success)', margin: 0, fontWeight: '800', fontSize: '1.05rem' }}>
                                    Reducción de Huella de Carbono Estimada
                                </h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    Esta reinserción evita la emisión a la atmósfera de aproximadamente:{' '}
                                    <strong style={{ color: 'var(--text)', fontSize: '1rem' }}>
                                        {formData.co2Evitado} kg de CO₂ equivalente.
                                    </strong>
                                </p>
                            </div>
                        </div>
                    )}

                    <Input
                        label="Responsable del Cálculo"
                        type="text"
                        name="responsable"
                        value={formData.responsable}
                        onChange={handleChange}
                        disabled
                    />

                    <Textarea
                        label="Observaciones e Impacto Social / Ambiental"
                        name="observaciones"
                        placeholder="Registrar detalles sobre el receptor del material, el ahorro de energía logrado, o el uso del abono orgánico en la planta..."
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
                        style={{ background: 'var(--dy-red)' }}
                    >
                        <Send size={18} /> {submitting ? 'Guardando...' : 'Registrar Economía Circular'}
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
                    <Button variant="primary" onClick={() => setAlertModal({ isOpen: false, title: '', message: '' })} style={{ background: 'var(--dy-red)' }}>Entendido</Button>
                </div>
            </Modal>

            {/* Success Modal */}
            <Modal 
                isOpen={showSuccessModal} 
                onClose={() => setShowSuccessModal(false)}
                title="Impacto Circular Registrado"
                showFooter={false}
            >
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ color: 'var(--dy-red)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                        <Recycle size={64} />
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px', color: 'var(--primary)' }}>
                        ¡Lote Valorizado!
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                        El registro de Economía Circular y la huella mitigada han sido computados en la auditoría con el ID:
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
        </div>
    );
};

export default EconomiaCircular;
