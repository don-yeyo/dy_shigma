import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, Search, UserPlus, Edit3, Trash2, CheckCircle, 
    XCircle, AlertTriangle, ArrowLeft, Check, Plus, FormInput
} from 'lucide-react';
import { Card, Input, Switch } from '../../components/FormElements';
import { Button } from '../../components/Button';
import Modal from '../../components/Modal';
import { SHIGMAService } from '../../services/api';

const FORM_TYPES = [
    { id: 'residuos-comunes', label: 'RINE (No Especiales)', color: 'rgba(239, 68, 68, 0.1)', textColor: 'var(--dy-red)' },
    { id: 'residuos-especiales', label: 'Residuos Especiales', color: 'rgba(245, 158, 11, 0.1)', textColor: 'var(--warning)' },
    { id: 'devoluciones', label: 'Devoluciones', color: 'rgba(16, 185, 129, 0.1)', textColor: 'var(--success)' },
    { id: 'tratamiento', label: 'Tratamiento', color: 'rgba(168, 85, 247, 0.1)', textColor: '#a855f7' },
    { id: 'economia-circular', label: 'Economía Circular', color: 'rgba(59, 130, 246, 0.1)', textColor: '#3b82f6' },
    { id: 'pallets', label: 'Control de Pallets', color: 'rgba(236, 72, 153, 0.1)', textColor: '#ec4899' },
    { id: 'espacios-verdes', label: 'Espacios Verdes', color: 'rgba(34, 197, 94, 0.1)', textColor: '#22c55e' }
];

const getInitials = (name) => {
    if (!name) return 'OP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
};

const GestionOperadores = () => {
    const navigate = useNavigate();
    const [operadores, setOperadores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedOperador, setSelectedOperador] = useState(null);
    
    // Form fields state
    const [formData, setFormData] = useState({
        apellidoNombre: '',
        legajo: '',
        activo: true,
        formularios: []
    });
    
    // Validation / Submit errors
    const [errorMsg, setErrorMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchOperadores();
    }, []);

    const fetchOperadores = async () => {
        setLoading(true);
        try {
            const response = await SHIGMAService.getOperadores();
            setOperadores(response.data);
        } catch (error) {
            console.error('Error al cargar operadores:', error);
            alert('Error al recuperar operadores desde el servidor.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const filteredOperadores = operadores.filter(op => 
        op.apellidoNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.legajo.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openAddModal = () => {
        setSelectedOperador(null);
        setFormData({
            apellidoNombre: '',
            legajo: '',
            activo: true,
            formularios: []
        });
        setErrorMsg('');
        setIsFormModalOpen(true);
    };

    const openEditModal = (operador) => {
        setSelectedOperador(operador);
        setFormData({
            apellidoNombre: operador.apellidoNombre,
            legajo: operador.legajo,
            activo: !!operador.activo,
            formularios: [...operador.formularios]
        });
        setErrorMsg('');
        setIsFormModalOpen(true);
    };

    const openDeleteModal = (operador) => {
        setSelectedOperador(operador);
        setIsDeleteModalOpen(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleActiveToggle = () => {
        setFormData(prev => ({
            ...prev,
            activo: !prev.activo
        }));
    };

    const handleFormCheckboxToggle = (formId) => {
        setFormData(prev => {
            const updatedFormularios = prev.formularios.includes(formId)
                ? prev.formularios.filter(f => f !== formId)
                : [...prev.formularios, formId];
            return {
                ...prev,
                formularios: updatedFormularios
            };
        });
    };

    const handleFormSubmit = async (e) => {
        if (e) e.preventDefault();
        
        if (!formData.apellidoNombre.trim() || !formData.legajo.trim()) {
            setErrorMsg('Apellido y Nombre y Legajo son obligatorios.');
            return;
        }

        setSubmitting(true);
        setErrorMsg('');
        try {
            if (selectedOperador) {
                // Modificar existente
                await SHIGMAService.updateOperador(selectedOperador.id, formData);
            } else {
                // Crear nuevo
                await SHIGMAService.createOperador(formData);
            }
            setIsFormModalOpen(false);
            fetchOperadores();
        } catch (error) {
            console.error('Error al guardar el operador:', error);
            const serverError = error.response?.data?.error || 'Error al comunicarse con la base de datos.';
            setErrorMsg(serverError);
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedOperador) return;
        
        try {
            await SHIGMAService.deleteOperador(selectedOperador.id);
            setIsDeleteModalOpen(false);
            fetchOperadores();
        } catch (error) {
            console.error('Error al eliminar operador:', error);
            alert('Error del servidor al eliminar al operador.');
        }
    };

    return (
        <div className="card-anim" style={{ width: '100%' }}>
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
                    <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Users size={32} /> Gestión de Operadores<span style={{ color: 'var(--dy-red)' }}>.</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                        Maestro de inspectores y operarios autorizados por formulario de carga en SHIGMA.
                    </p>
                </div>
            </div>

            {/* Toolbar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '24px',
                flexWrap: 'wrap'
            }}>
                <div style={{
                    position: 'relative',
                    maxWidth: '400px',
                    width: '100%'
                }}>
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o legajo..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        style={{
                            width: '100%',
                            padding: '12px 16px 12px 48px',
                            borderRadius: 'var(--radius-pill)',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--surface)',
                            outline: 'none',
                            fontSize: '0.95rem'
                        }}
                    />
                    <Search size={20} style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)'
                    }} />
                </div>

                <Button 
                    variant="primary" 
                    onClick={openAddModal}
                    style={{ background: 'var(--dy-blue)', color: '#fff', padding: '12px 24px' }}
                >
                    <UserPlus size={18} /> Agregar Operador
                </Button>
            </div>

            {/* Main Area */}
            {loading ? (
                <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{
                            display: 'inline-block',
                            width: '40px',
                            height: '40px',
                            border: '4px solid var(--border)',
                            borderTopColor: 'var(--dy-blue)',
                            borderRadius: '50%',
                            animation: 'rotate 1s linear infinite',
                            marginBottom: '16px'
                        }} />
                        <p style={{ fontWeight: '600' }}>Cargando maestros de operadores...</p>
                    </div>
                </Card>
            ) : filteredOperadores.length === 0 ? (
                <Card style={{ padding: '48px', textAlign: 'center', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <Users size={64} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>No se encontraron operadores</h3>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '400px', marginBottom: '24px' }}>
                        {searchQuery ? 'Prueba ajustando los filtros de búsqueda o ingresa un nuevo operario.' : 'Comienza agregando un operario al sistema utilizando el botón superior.'}
                    </p>
                    {searchQuery && (
                        <Button variant="outline" onClick={() => setSearchQuery('')}>Restablecer búsqueda</Button>
                    )}
                </Card>
            ) : (
                <Card style={{ padding: '0', overflow: 'hidden' }}>
                    <table className="results-table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: '24px' }}>Operador</th>
                                <th>Legajo</th>
                                <th>Módulos Habilitados</th>
                                <th>Estado</th>
                                <th style={{ textAlign: 'center', paddingRight: '24px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOperadores.map(op => {
                                const initials = getInitials(op.apellidoNombre);
                                return (
                                    <tr key={op.id} style={{ cursor: 'default' }}>
                                        {/* Name / Avatar */}
                                        <td style={{ paddingLeft: '24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    background: op.activo ? 'var(--dy-blue)' : 'var(--border)',
                                                    color: op.activo ? '#fff' : 'var(--text-muted)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: '700',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    {initials}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '700', color: 'var(--text)' }}>
                                                        {op.apellidoNombre}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Legajo */}
                                        <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>
                                            {op.legajo}
                                        </td>

                                        {/* Forms / Tags */}
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                {op.formularios.length === 0 ? (
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                        Sin asignaciones
                                                    </span>
                                                ) : (
                                                    op.formularios.map(formType => {
                                                        const conf = FORM_TYPES.find(f => f.id === formType);
                                                        const label = conf ? conf.label : formType;
                                                        const color = conf ? conf.color : 'rgba(0,0,0,0.05)';
                                                        const textColor = conf ? conf.textColor : 'var(--text)';
                                                        return (
                                                            <span key={formType} style={{
                                                                fontSize: '0.7rem',
                                                                fontWeight: '700',
                                                                padding: '4px 10px',
                                                                borderRadius: '8px',
                                                                background: color,
                                                                color: textColor,
                                                                border: `1px solid ${textColor}20`
                                                            }}>
                                                                {label}
                                                            </span>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td>
                                            {op.activo ? (
                                                <span className="badge badge-success">
                                                    <CheckCircle size={12} /> Activo
                                                </span>
                                            ) : (
                                                <span className="badge badge-error" style={{ background: 'rgba(100, 116, 139, 0.1)', color: 'var(--text-muted)' }}>
                                                    <XCircle size={12} /> Inactivo
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td style={{ textAlign: 'center', paddingRight: '24px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                <button 
                                                    title="Editar Operador"
                                                    onClick={() => openEditModal(op)}
                                                    style={{
                                                        border: '1px solid var(--border)',
                                                        background: 'var(--surface)',
                                                        color: 'var(--text-muted)',
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = 'var(--dy-blue)';
                                                        e.currentTarget.style.color = 'var(--dy-blue)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = 'var(--border)';
                                                        e.currentTarget.style.color = 'var(--text-muted)';
                                                    }}
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button 
                                                    title="Eliminar Operador"
                                                    onClick={() => openDeleteModal(op)}
                                                    style={{
                                                        border: '1px solid var(--border)',
                                                        background: 'var(--surface)',
                                                        color: 'var(--text-muted)',
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = 'var(--dy-red)';
                                                        e.currentTarget.style.color = 'var(--dy-red)';
                                                        e.currentTarget.style.background = 'rgba(228, 5, 33, 0.04)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = 'var(--border)';
                                                        e.currentTarget.style.color = 'var(--text-muted)';
                                                        e.currentTarget.style.background = 'var(--surface)';
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Card>
            )}

            {/* Add / Edit Modal */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={selectedOperador ? 'Editar Operador' : 'Agregar Operador'}
                showFooter={true}
                maxWidth="600px"
                confirmLabel={submitting ? 'Guardando...' : 'Guardar Cambios'}
                cancelLabel="Cancelar"
                onConfirm={handleFormSubmit}
            >
                <form onSubmit={handleFormSubmit} style={{ pointerEvents: submitting ? 'none' : 'auto' }}>
                    {errorMsg && (
                        <div style={{
                            padding: '12px 16px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--error)',
                            border: '1px solid var(--error)',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: '600'
                        }}>
                            <AlertTriangle size={16} /> {errorMsg}
                        </div>
                    )}

                    <div className="form-grid">
                        <Input 
                            label="Apellido y Nombre *"
                            type="text"
                            name="apellidoNombre"
                            placeholder="Ej: Pérez Juan Carlos"
                            value={formData.apellidoNombre}
                            onChange={handleFormChange}
                            required
                        />

                        <Input 
                            label="Legajo *"
                            type="text"
                            name="legajo"
                            placeholder="Ej: LEG-0482"
                            value={formData.legajo}
                            onChange={handleFormChange}
                            required
                            disabled={!!selectedOperador} // El legajo es identificador único, no editar
                        />
                    </div>

                    <Switch 
                        label="Estado de Actividad"
                        checked={formData.activo}
                        onChange={handleActiveToggle}
                        activeLabel="Operador Activo (Habilitado para selección)"
                        inactiveLabel="Operador Inactivo (Ocultado en formularios)"
                    />

                    {/* Checkbox selector for forms */}
                    <div style={{ marginTop: '24px' }}>
                        <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '12px' }}>
                            Asignar Habilitación por Módulo
                        </label>
                        
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
                            gap: '12px' 
                        }}>
                            {FORM_TYPES.map(form => {
                                const isChecked = formData.formularios.includes(form.id);
                                return (
                                    <div 
                                        key={form.id}
                                        onClick={() => handleFormCheckboxToggle(form.id)}
                                        style={{
                                            padding: '14px 16px',
                                            borderRadius: 'var(--radius)',
                                            border: isChecked ? `2px solid ${form.textColor}` : '1px solid var(--border)',
                                            backgroundColor: isChecked ? form.color : 'var(--surface)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            transition: 'all 0.2s ease',
                                            boxShadow: isChecked ? 'var(--shadow-sm)' : 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isChecked) e.currentTarget.style.borderColor = 'var(--text-muted)';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isChecked) e.currentTarget.style.borderColor = 'var(--border)';
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ 
                                                fontSize: '0.9rem', 
                                                fontWeight: isChecked ? '700' : '600', 
                                                color: isChecked ? form.textColor : 'var(--text)' 
                                            }}>
                                                {form.label}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                id: {form.id}
                                            </span>
                                        </div>
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '6px',
                                            border: isChecked ? `none` : '2px solid var(--border)',
                                            backgroundColor: isChecked ? form.textColor : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            transition: 'all 0.15s'
                                        }}>
                                            {isChecked && <Check size={16} strokeWidth={3} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="¿Eliminar Operador?"
                showFooter={true}
                type="error"
                confirmLabel="Eliminar Definitivamente"
                cancelLabel="Cancelar"
                onConfirm={handleConfirmDelete}
            >
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <div style={{ color: 'var(--error)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                        <AlertTriangle size={48} />
                    </div>
                    <p style={{ fontSize: '1.05rem', color: 'var(--text)', marginBottom: '8px' }}>
                        ¿Está seguro que desea eliminar a <strong>{selectedOperador?.apellidoNombre}</strong>?
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
                        Esta acción removerá el maestro del operador y todas sus asignaciones en los formularios. Los registros históricos donde intervino este operador no serán alterados.
                    </p>
                </div>
            </Modal>
        </div>
    );
};

export default GestionOperadores;
