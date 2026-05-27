import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { Card, Input, Select, Textarea } from '../../components/FormElements';
import { Button } from '../../components/Button';
import Modal from '../../components/Modal';
import { SHIGMAService } from '../../services/api';


const EspaciosVerdes = () => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successId, setSuccessId] = useState('');
    const [operadores, setOperadores] = useState([]);
    
    const [formData, setFormData] = useState({
        espacioVerde: '',
        tareaRealizada: '',
        consumoAgua: '',
        plantasAgregadas: '0',
        especieAgregada: '',
        estadoSalud: '',
        responsableTarea: 'Jardinería & Mantenimiento Don Yeyo',
        responsable: '',
        observaciones: ''
    });

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
        
        if (!formData.espacioVerde || !formData.tareaRealizada || !formData.consumoAgua || !formData.estadoSalud || !formData.responsable) {
            alert('Por favor, complete todos los campos obligatorios marcados con *');
            return;
        }

        setSubmitting(true);
        try {
            const response = await SHIGMAService.createRecord('espacios-verdes', {
                ...formData,
                consumoAgua: parseFloat(formData.consumoAgua),
                plantasAgregadas: parseInt(formData.plantasAgregadas) || 0
            });

            const resData = response.data;
            setSuccessId(resData.record.id);
            setShowSuccessModal(true);
            setFormData({
                espacioVerde: '',
                tareaRealizada: '',
                consumoAgua: '',
                plantasAgregadas: '0',
                especieAgregada: '',
                estadoSalud: '',
                responsableTarea: 'Jardinería & Mantenimiento Don Yeyo',
                responsable: localStorage.getItem('shigma_last_operator_espacios-verdes') || '',
                observaciones: ''
            });
        } catch (error) {
            console.error('Error submitting green spaces form:', error);
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
                        Control de Espacios Verdes<span style={{ color: 'var(--dy-red)' }}>.</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Registro de mantenimiento botánico, forestación industrial y optimización de agua de riego ecológico.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card style={{ borderLeft: '4px solid #84cc16' }}>
                    <div className="form-section-title" style={{ color: '#84cc16', borderColor: 'rgba(132, 204, 22, 0.2)' }}>
                        Gestión Ambiental de Zonas Verdes
                    </div>

                    <div className="form-grid">
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

                    <div className="form-grid" style={{ marginTop: '8px' }}>
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

                    <div className="form-grid">
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

                    <div className="form-grid" style={{ marginTop: '8px' }}>
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
                        <Send size={18} /> {submitting ? 'Guardando...' : 'Registrar Mantenimiento'}
                    </Button>
                </div>
            </form>

            {/* Success Modal */}
            <Modal 
                isOpen={showSuccessModal} 
                onClose={() => setShowSuccessModal(false)}
                title="Mantenimiento de Espacio Verde Registrado"
                showFooter={false}
            >
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ color: '#84cc16', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                        <Leaf size={64} />
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px', color: 'var(--primary)' }}>
                        ¡Parquizado Registrado!
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                        La tarea ambiental en el pulmón verde ha sido guardada en la base de trazabilidad ecológica con el ID único:
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

export default EspaciosVerdes;
