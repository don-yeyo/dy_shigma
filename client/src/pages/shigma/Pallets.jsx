import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { Card, Input, Select, Textarea } from '../../components/FormElements';
import { Button } from '../../components/Button';
import Modal from '../../components/Modal';
import { SHIGMAService } from '../../services/api';


const Pallets = () => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successId, setSuccessId] = useState('');
    
    const [formData, setFormData] = useState({
        tipoPallet: '',
        cantidadIngresados: '',
        cantidadReparados: '',
        cantidadDescartados: '',
        cantidadCircular: '',
        responsableReparacion: 'Taller de Pallets - Mantenimiento',
        responsable: 'Gabriel Tonelli',
        observaciones: ''
    });

    const tipos = [
        { id: 'Estándar ARLOG (1200x1000)', label: 'Estándar ARLOG (1200x1000 mm)' },
        { id: 'EUR / EPAL (1200x800)', label: 'EUR / EPAL (1200x800 mm)' },
        { id: 'Pallet Descartable Ligero', label: 'Pallet Descartable Ligero' },
        { id: 'Pallet de Plástico Reforzado', label: 'Pallet de Plástico Reforzado' }
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
        
        if (!formData.tipoPallet || !formData.cantidadIngresados || !formData.cantidadReparados || !formData.cantidadDescartados || !formData.cantidadCircular) {
            alert('Por favor, complete todos los campos obligatorios marcados con *');
            return;
        }

        const ingresados = parseInt(formData.cantidadIngresados) || 0;
        const reparados = parseInt(formData.cantidadReparados) || 0;
        const descartados = parseInt(formData.cantidadDescartados) || 0;
        const circular = parseInt(formData.cantidadCircular) || 0;

        if (reparados + descartados + circular > ingresados) {
            alert('La suma de reparados, descartados y enviados a economía circular no puede superar la cantidad ingresada.');
            return;
        }

        setSubmitting(true);
        try {
            const response = await SHIGMAService.createRecord('pallets', {
                ...formData,
                cantidadIngresados: ingresados,
                cantidadReparados: reparados,
                cantidadDescartados: descartados,
                cantidadCircular: circular
            });

            const resData = response.data;
            setSuccessId(resData.record.id);
            setShowSuccessModal(true);
            setFormData({
                tipoPallet: '',
                cantidadIngresados: '',
                cantidadReparados: '',
                cantidadDescartados: '',
                cantidadCircular: '',
                responsableReparacion: 'Taller de Pallets - Mantenimiento',
                responsable: 'Gabriel Tonelli',
                observaciones: ''
            });
        } catch (error) {
            console.error('Error submitting pallets form:', error);
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
                        Control de Stock y Pallets<span style={{ color: 'var(--dy-red)' }}>.</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Registro de ingreso, reparación y reciclaje de pallets de madera para logística circular.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card style={{ borderLeft: '4px solid #14b8a6' }}>
                    <div className="form-section-title" style={{ color: '#14b8a6', borderColor: 'rgba(20, 184, 166, 0.2)' }}>
                        Inventario y Clasificación de Pallets
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

                    <Input
                        label="Inspector Responsable"
                        type="text"
                        name="responsable"
                        value={formData.responsable}
                        onChange={handleChange}
                        disabled
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
                        <Send size={18} /> {submitting ? 'Guardando...' : 'Registrar Movimiento'}
                    </Button>
                </div>
            </form>

            {/* Success Modal */}
            <Modal 
                isOpen={showSuccessModal} 
                onClose={() => setShowSuccessModal(false)}
                title="Movimiento de Pallets Guardado"
            >
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ color: '#14b8a6', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                        <Package size={64} />
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px', color: 'var(--primary)' }}>
                        ¡Movimiento Registrado!
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                        El control de pallets de madera ha sido ingresado al sistema de trazabilidad con el ID único:
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

export default Pallets;
