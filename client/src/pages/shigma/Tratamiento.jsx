import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { Card, Input, Select, Textarea } from '../../components/FormElements';
import { Button } from '../../components/Button';
import Modal from '../../components/Modal';
import { SHIGMAService } from '../../services/api';


const Tratamiento = () => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successId, setSuccessId] = useState('');
    const [operadores, setOperadores] = useState([]);
    
    const [formData, setFormData] = useState({
        procesoTratamiento: '',
        materialEntrada: '',
        cantidadProcesada: '',
        operador: '',
        maquinaUtilizada: '',
        subproductoObtenido: '',
        observaciones: ''
    });

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
        
        if (!formData.procesoTratamiento || !formData.materialEntrada || !formData.cantidadProcesada || !formData.maquinaUtilizada || !formData.subproductoObtenido || !formData.operador) {
            alert('Por favor, complete todos los campos obligatorios marcados con *');
            return;
        }

        setSubmitting(true);
        try {
            const response = await SHIGMAService.createRecord('tratamiento', {
                ...formData,
                cantidadProcesada: parseFloat(formData.cantidadProcesada)
            });

            const resData = response.data;
            setSuccessId(resData.record.id);
            setShowSuccessModal(true);
            setFormData({
                procesoTratamiento: '',
                materialEntrada: '',
                cantidadProcesada: '',
                operador: localStorage.getItem('shigma_last_operator_tratamiento') || '',
                maquinaUtilizada: '',
                subproductoObtenido: '',
                observaciones: ''
            });
        } catch (error) {
            console.error('Error submitting treatment form:', error);
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
                        Tratamiento y Valorización de Residuos<span style={{ color: 'var(--dy-red)' }}>.</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Registro de procesos internos de compactación, trituración y compostado para maximizar el reciclaje.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card style={{ borderLeft: '4px solid #a855f7' }}>
                    <div className="form-section-title" style={{ color: '#a855f7', borderColor: 'rgba(168, 85, 247, 0.2)' }}>
                        Operación de Planta de Tratamiento
                    </div>

                    <div className="form-grid">
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

                    <div className="form-grid" style={{ marginTop: '8px' }}>
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

                    <div className="form-grid" style={{ marginTop: '8px' }}>
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
                        <Send size={18} /> {submitting ? 'Guardando...' : 'Registrar Tratamiento'}
                    </Button>
                </div>
            </form>

            {/* Success Modal */}
            <Modal 
                isOpen={showSuccessModal} 
                onClose={() => setShowSuccessModal(false)}
                title="Tratamiento Registrado Correctamente"
                showFooter={false}
            >
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ color: '#a855f7', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                        <RefreshCw size={64} />
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px', color: 'var(--primary)' }}>
                        ¡Proceso Registrado!
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                        El tratamiento de valorización de residuos se ha ingresado con éxito a la base de datos con el ID único:
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

export default Tratamiento;
