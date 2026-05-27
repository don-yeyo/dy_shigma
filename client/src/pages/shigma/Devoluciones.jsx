import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerUpLeft, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { Card, Input, Select, Textarea } from '../../components/FormElements';
import { Button } from '../../components/Button';
import Modal from '../../components/Modal';
import { SHIGMAService } from '../../services/api';


const Devoluciones = () => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successId, setSuccessId] = useState('');
    const [operadores, setOperadores] = useState([]);
    
    const [formData, setFormData] = useState({
        clienteOrigen: '',
        productoDevuelto: '',
        cantidadBultos: '',
        pesoEstimado: '',
        motivoDevolucion: '',
        inspeccionCalidad: '',
        disposicionFinal: '',
        responsable: '',
        observaciones: ''
    });

    const motivos = [
        { id: 'Vencimiento de producto', label: 'Vencimiento de producto' },
        { id: 'Defecto de empaque / Rotura', label: 'Defecto de empaque / Rotura' },
        { id: 'Error de despacho / Logística', label: 'Error de despacho / Logística' },
        { id: 'Rechazo de control de calidad', label: 'Rechazo de control de calidad' }
    ];

    const estadosInspeccion = [
        { id: 'Apto para reproceso interno', label: 'Apto para reproceso interno' },
        { id: 'Apto para Economía Circular / Donación', label: 'Apto para Economía Circular / Donación' },
        { id: 'Descarte / Destrucción Directa', label: 'Descarte / Destrucción Directa' }
    ];

    const disposiciones = [
        { id: 'Reutilizar pallets/cajas secundarias', label: 'Reutilizar pallets / cajas secundarias' },
        { id: 'Compostaje Interno (Orgánicos)', label: 'Compostaje Interno (Orgánicos)' },
        { id: 'Reciclado de Plástico/Cartón exterior', label: 'Reciclado de Plástico/Cartón exterior' },
        { id: 'Donación a Banco de Alimentos', label: 'Donación a Banco de Alimentos' },
        { id: 'Relleno Sanitario (No recuperable)', label: 'Relleno Sanitario (No recuperable)' }
    ];

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
        
        if (!formData.clienteOrigen || !formData.productoDevuelto || !formData.cantidadBultos || !formData.motivoDevolucion || !formData.inspeccionCalidad || !formData.disposicionFinal || !formData.responsable) {
            alert('Por favor, complete todos los campos obligatorios marcados con *');
            return;
        }

        setSubmitting(true);
        try {
            const response = await SHIGMAService.createRecord('devoluciones', {
                ...formData,
                cantidadBultos: parseInt(formData.cantidadBultos),
                pesoEstimado: formData.pesoEstimado ? parseFloat(formData.pesoEstimado) : 0
            });

            const resData = response.data;
            setSuccessId(resData.record.id);
            setShowSuccessModal(true);
            setFormData({
                clienteOrigen: '',
                productoDevuelto: '',
                cantidadBultos: '',
                pesoEstimado: '',
                motivoDevolucion: '',
                inspeccionCalidad: '',
                disposicionFinal: '',
                responsable: localStorage.getItem('shigma_last_operator_devoluciones') || '',
                observaciones: ''
            });
        } catch (error) {
            console.error('Error submitting return form:', error);
            alert('Error al guardar en el servidor.');
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
                        Clasificación de Devoluciones<span style={{ color: 'var(--dy-red)' }}>.</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Clasificación e inspección de mercadería retornada para canalizar su reciclaje, compostaje o reutilización.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card style={{ borderLeft: '4px solid #3b82f6' }}>
                    <div className="form-section-title" style={{ color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                        Datos del Lote Devuelto
                    </div>

                    <div className="form-grid">
                        <Input
                            label="Cliente / Origen de Devolución *"
                            type="text"
                            name="clienteOrigen"
                            placeholder="Ej: Distribuidora Norte S.A. o Sucursal Palermo"
                            value={formData.clienteOrigen}
                            onChange={handleChange}
                            required
                        />

                        <Input
                            label="Producto / Material Devuelto *"
                            type="text"
                            name="productoDevuelto"
                            placeholder="Ej: Galletitas Don Yeyo Dulces 400g"
                            value={formData.productoDevuelto}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-grid" style={{ marginTop: '8px' }}>
                        <Input
                            label="Cantidad de Bultos / Cajas *"
                            type="number"
                            name="cantidadBultos"
                            placeholder="Ej: 15"
                            min="1"
                            value={formData.cantidadBultos}
                            onChange={handleChange}
                            required
                        />

                        <Input
                            label="Peso Estimado Total (kg) - Opcional"
                            type="number"
                            name="pesoEstimado"
                            placeholder="Ej: 120.5"
                            step="0.1"
                            value={formData.pesoEstimado}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-section-title" style={{ marginTop: '24px', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                        Inspección Ambiental y Disposición
                    </div>

                    <div className="form-grid">
                        <Select
                            label="Motivo de la Devolución *"
                            name="motivoDevolucion"
                            value={formData.motivoDevolucion}
                            onChange={handleChange}
                            options={motivos}
                            includePlaceholder={true}
                        />

                        <Select
                            label="Resultado Inspección de Calidad *"
                            name="inspeccionCalidad"
                            value={formData.inspeccionCalidad}
                            onChange={handleChange}
                            options={estadosInspeccion}
                            includePlaceholder={true}
                        />
                    </div>

                    <Select
                        label="Disposición Final Adoptada (Canal Verde) *"
                        name="disposicionFinal"
                        value={formData.disposicionFinal}
                        onChange={handleChange}
                        options={disposiciones}
                        includePlaceholder={true}
                    />

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
                        label="Observaciones y Detalles del Lote"
                        name="observaciones"
                        placeholder="Detallar el estado físico de los bultos, si la rotura fue en viaje, porcentaje de material seco reciclable..."
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
                        <Send size={18} /> {submitting ? 'Guardando...' : 'Registrar Inspección'}
                    </Button>
                </div>
            </form>

            {/* Success Modal */}
            <Modal 
                isOpen={showSuccessModal} 
                onClose={() => setShowSuccessModal(false)}
                title="Inspección de Devolución Registrada"
                showFooter={false}
            >
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ color: '#3b82f6', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                        <CornerUpLeft size={64} />
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px', color: 'var(--primary)' }}>
                        ¡Devolución Clasificada!
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                        La inspección y el destino ecológico del lote devuelto han sido registrados en la trazabilidad con el ID:
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
                            Cargar Otra
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

export default Devoluciones;
