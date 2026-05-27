import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { Card, Input, Select, Textarea } from '../../components/FormElements';
import { Button } from '../../components/Button';
import Modal from '../../components/Modal';
import { SHIGMAService } from '../../services/api';


const ResiduosComunes = () => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successId, setSuccessId] = useState('');
    
    const [formData, setFormData] = useState({
        sector: '',
        tipoResiduo: '',
        peso: '',
        destino: '',
        responsable: 'Gabriel Tonelli',
        observaciones: ''
    });

    const sectores = [
        { id: 'Producción', label: 'Producción' },
        { id: 'Embalaje', label: 'Embalaje' },
        { id: 'Administración', label: 'Administración' },
        { id: 'Almacén', label: 'Almacén' },
        { id: 'Expedición', label: 'Expedición' },
        { id: 'Mantenimiento', label: 'Mantenimiento' }
    ];

    const tiposResiduo = [
        { id: 'Cartón', label: 'Cartón' },
        { id: 'Plástico', label: 'Plástico' },
        { id: 'Vidrio', label: 'Vidrio' },
        { id: 'Metal', label: 'Metal' },
        { id: 'Orgánico', label: 'Orgánico' }
    ];

    const destinos = [
        { id: 'Contenedor Verde A', label: 'Contenedor Verde A' },
        { id: 'Contenedor Verde B', label: 'Contenedor Verde B' },
        { id: 'Acopio General', label: 'Acopio General de Reciclables' },
        { id: 'Compostera Interna', label: 'Compostera Interna (Solo Orgánicos)' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validación básica
        if (!formData.sector || !formData.tipoResiduo || !formData.peso || !formData.destino) {
            alert('Por favor, complete todos los campos obligatorios.');
            return;
        }

        setSubmitting(true);
        try {
            const response = await SHIGMAService.createRecord('residuos-comunes', {
                ...formData,
                peso: parseFloat(formData.peso)
            });

            const resData = response.data;
            setSuccessId(resData.record.id);
            setShowSuccessModal(true);
            // Reset form
            setFormData({
                sector: '',
                tipoResiduo: '',
                peso: '',
                destino: '',
                responsable: 'Gabriel Tonelli',
                observaciones: ''
            });
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Error al guardar el registro en el servidor.');
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
                        Registro de Residuos Comunes<span style={{ color: 'var(--dy-red)' }}>.</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Pesaje y clasificación de cartón, plástico, vidrio, metales y orgánicos reciclables.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <div className="form-section-title">Datos de Trazabilidad</div>
                    
                    <div className="form-grid">
                        <Select
                            label="Sector Generador *"
                            name="sector"
                            value={formData.sector}
                            onChange={handleChange}
                            options={sectores}
                            includePlaceholder={true}
                        />

                        <Select
                            label="Tipo de Residuo *"
                            name="tipoResiduo"
                            value={formData.tipoResiduo}
                            onChange={handleChange}
                            options={tiposResiduo}
                            includePlaceholder={true}
                        />
                    </div>

                    <div className="form-grid" style={{ marginTop: '8px' }}>
                        <Input
                            label="Peso del Lote (kg) *"
                            type="number"
                            name="peso"
                            placeholder="Ej: 45.5"
                            step="0.01"
                            min="0.1"
                            value={formData.peso}
                            onChange={handleChange}
                            required
                        />

                        <Select
                            label="Destino / Depósito *"
                            name="destino"
                            value={formData.destino}
                            onChange={handleChange}
                            options={destinos}
                            includePlaceholder={true}
                        />
                    </div>

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
                        <Send size={18} /> {submitting ? 'Guardando...' : 'Registrar Pesaje'}
                    </Button>
                </div>
            </form>

            {/* Success Modal */}
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
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                        El pesaje de residuo común ha sido ingresado al historial de trazabilidad con el ID único:
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

export default ResiduosComunes;
