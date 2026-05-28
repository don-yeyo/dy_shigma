import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    History, ArrowLeft, Search, Filter, Calendar, FileText, ChevronDown, ChevronUp,
    Download, Pencil, Check, X, Loader2, AlertCircle, Trash2
} from 'lucide-react';
import { Card } from '../../components/FormElements';
import { Button } from '../../components/Button';
import Modal from '../../components/Modal';
import { SHIGMAService } from '../../services/api';
import { useAuth } from '../../config/AuthContext';

const HistorialTrazabilidad = () => {
    const navigate = useNavigate();
    const { user, hasModulo } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterFormType, setFilterFormType] = useState('all');
    const [expandedRecordId, setExpandedRecordId] = useState(null);

    // Server-side pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [limit, setLimit] = useState(20);

    const [deleteConfirmModal, setDeleteConfirmModal] = useState({
        isOpen: false,
        record: null
    });
    const [deleteStatusModal, setDeleteStatusModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'success'
    });
    const [exportModal, setExportModal] = useState({
        isOpen: false,
        exportType: 'all', // 'all' or 'date'
        sinceDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0] // default 30 days back
    });

    const fetchRecords = async (pageToFetch = 1) => {
        setLoading(true);
        try {
            const response = await SHIGMAService.getAllRecords({
                page: pageToFetch,
                search: searchQuery,
                formType: filterFormType
            });
            const data = response.data;
            setRecords(data.records || []);
            setTotalCount(data.totalCount || 0);
            setTotalPages(data.totalPages || 1);
            setCurrentPage(data.currentPage || pageToFetch);
            setLimit(data.limit || 20);
        } catch (error) {
            console.error('Error fetching records:', error);
        } finally {
            setLoading(false);
        }
    };

    const executeDelete = async (record) => {
        setDeleteConfirmModal({ isOpen: false, record: null });
        try {
            await SHIGMAService.deleteRecord(record.formType, record.id);
            setDeleteStatusModal({
                isOpen: true,
                title: 'Registro Eliminado',
                message: `El registro ${record.id} fue eliminado permanentemente con éxito.`,
                type: 'success'
            });
            fetchRecords(currentPage);
        } catch (err) {
            setDeleteStatusModal({
                isOpen: true,
                title: 'Error de Eliminación',
                message: err?.response?.data?.error || 'No se pudo eliminar el registro debido a un error en el servidor.',
                type: 'error'
            });
        }
    };

    const canModify = (record) => {
        if (!user) return false;
        if (user.rol === 'sysadmin' || user.rol === 'supervisor') return true;
        if (user.rol === 'registrador') {
            const isOwner = record.usuario === user.name;
            const maxEditDays = parseInt(import.meta.env.VITE_REGISTRADOR_MAX_EDIT_DAYS || '7', 10);
            const createdTime = new Date(record.createdAt || record.fecha).getTime();
            const daysDiff = (Date.now() - createdTime) / (1000 * 60 * 60 * 24);
            const withinTime = daysDiff <= maxEditDays;
            const maxEdits = parseInt(import.meta.env.VITE_REGISTRADOR_MAX_EDITS_PER_RECORD || '3', 10);
            const withinEdits = (record.ediciones || 0) < maxEdits;
            return isOwner && withinTime && withinEdits;
        }
        return false;
    };

    const canDelete = (record) => {
        if (!user) return false;
        if (user.rol === 'sysadmin' || user.rol === 'supervisor') return true;
        if (user.rol === 'registrador') {
            const puedeEliminar = import.meta.env.VITE_REGISTRADOR_PUEDE_ELIMINAR === 'true';
            return puedeEliminar && canModify(record);
        }
        return false;
    };

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput);
            setCurrentPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Load records on filter/page changes
    useEffect(() => {
        fetchRecords(currentPage);
    }, [searchQuery, filterFormType, currentPage]);

    const toggleExpand = (id) => {
        setExpandedRecordId(expandedRecordId === id ? null : id);
    };

    const formTypes = [
        { id: 'all', label: 'Todos los Formularios' },
        { id: 'residuos-comunes', label: 'Residuos No Especiales (RINE)' },
        { id: 'residuos-especiales', label: 'Residuos Especiales' },
        { id: 'devoluciones', label: 'Devoluciones' },
        { id: 'tratamiento', label: 'Tratamiento' },
        { id: 'economia-circular', label: 'Economía Circular' },
        { id: 'pallets', label: 'Gestión de Pallets' },
        { id: 'espacios-verdes', label: 'Espacios Verdes' }
    ];

    const filteredFormTypes = formTypes.filter(ft => {
        if (ft.id === 'all') return true;
        if (user && user.rol !== 'registrador') return true;
        return hasModulo(ft.id);
    });

    // Exportar a CSV (Pide rango: Todo o Desde una fecha)
    const handleExportCSV = async () => {
        const exportType = exportModal.exportType;
        const sinceDateVal = exportModal.sinceDate;
        
        setExportModal(prev => ({ ...prev, isOpen: false }));
        setLoading(true);
        try {
            const response = await SHIGMAService.getAllRecords({
                export: true,
                search: searchQuery,
                formType: filterFormType,
                since: exportType === 'date' ? sinceDateVal : ''
            });

            const exportRecords = response.data.records || [];
            if (exportRecords.length === 0) {
                setDeleteStatusModal({
                    isOpen: true,
                    title: 'Exportación Vacía',
                    message: 'No se encontraron registros para exportar con los filtros seleccionados.',
                    type: 'error'
                });
                return;
            }

            let csvContent = "data:text/csv;charset=utf-8,";
            // UTF-8 BOM para soporte correcto de eñes y tildes en Excel
            csvContent = "\uFEFF" + csvContent;

            // Encabezados
            csvContent += "ID,Fecha,Tipo de Registro,Sector/Origen,Responsable,Datos Detalle\n";

            exportRecords.forEach(r => {
                const date = new Date(r.createdAt || r.fecha).toLocaleDateString('es-AR');
                const sector = r.sector || r.sectorOrigen || r.clienteOrigen || r.espacioVerde || 'N/A';
                const detailText = JSON.stringify(r).replace(/"/g, '""');

                const line = `"${r.id}","${date}","${r.formLabel}","${sector}","${r.responsable || r.usuario}","${detailText}"\n`;
                csvContent += line;
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `auditoria_shigma_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Error exporting CSV:', err);
            setDeleteStatusModal({
                isOpen: true,
                title: 'Error de Exportación',
                message: 'Ocurrió un error al intentar descargar los registros del servidor.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const renderDetailGrid = (record) => {
        // Renderizar dinámicamente según el tipo de formulario
        const details = [];

        if (record.formType === 'residuos-comunes') {
            details.push({ label: 'Planta Generadora', value: record.sector === 'ER' ? 'Elguea Roman' : record.sector === 'HY' ? 'Hipólito Yrigoyen' : record.sector === 'PE' ? 'Pellegrini' : record.sector });
            details.push({ label: 'Tipo de Residuo', value: record.tipoResiduo });

            if (record.tipoResiduo === 'Inorgánicos Generales') {
                details.push({ label: 'Clasificación', value: record.clasificacionInorganico || 'Irrecuperables' });

                if (record.clasificacionInorganico === 'Recuperable' && record.materialesRecuperados) {
                    const matsText = Object.entries(record.materialesRecuperados)
                        .map(([mat, data]) => `${mat}: ${data.cantidad} ${data.unidad}`)
                        .join(', ');
                    details.push({ label: 'Materiales Recuperables', value: matsText || 'Ninguno' });
                }
            }

            details.push({ label: 'Peso del Lote', value: `${record.peso} kg` });
            details.push({ label: 'Destino', value: record.destino });
            details.push({
                label: 'Estado de Batea',
                value: record.bateaSalidaId ? `Despachado en Salida ${record.bateaSalidaId} (Pendiente)` : 'En batea activa'
            });
        } else if (record.formType === 'residuos-especiales') {
            details.push({ label: 'Tipo Especial', value: record.tipoResiduoEspecial });
            details.push({ label: 'Categoría Peligro', value: record.categoriaPeligro });
            details.push({ label: 'Cantidad', value: `${record.cantidad} ${record.unidad}` });
            details.push({ label: 'Sector Origen', value: record.sectorOrigen });
            details.push({ label: 'Tipo Envase', value: record.tipoEnvase });
            details.push({ label: 'Certificado Acopio', value: record.certificadoAcopio || 'Ninguno' });
        } else if (record.formType === 'devoluciones') {
            details.push({ label: 'Cliente / Origen', value: record.clienteOrigen });
            details.push({ label: 'Producto Devuelto', value: record.productoDevuelto });
            details.push({ label: 'Cantidad Bultos', value: `${record.cantidadBultos} uds` });
            details.push({ label: 'Peso Estimado', value: record.pesoEstimado ? `${record.pesoEstimado} kg` : 'N/A' });
            details.push({ label: 'Motivo Devolución', value: record.motivoDevolucion });
            details.push({ label: 'Resultado Inspección', value: record.inspeccionCalidad });
            details.push({ label: 'Disposición Final', value: record.disposicionFinal });
        } else if (record.formType === 'tratamiento') {
            details.push({ label: 'Proceso', value: record.procesoTratamiento });
            details.push({ label: 'Material Entrada', value: record.materialEntrada });
            details.push({ label: 'Cantidad Procesada', value: `${record.cantidadProcesada} kg` });
            details.push({ label: 'Máquina', value: record.maquinaUtilizada });
            details.push({ label: 'Subproducto Obtenido', value: record.subproductoObtenido });
            details.push({ label: 'Operador', value: record.operador });
        } else if (record.formType === 'economia-circular') {
            details.push({ label: 'Recurso Revalorizado', value: record.materialRevalorizado });
            details.push({ label: 'Destino Reinserción', value: record.destinoReinsercion });
            details.push({ label: 'Cantidad', value: `${record.cantidad} ${record.unidad}` });
            details.push({ label: 'Ahorro Económico', value: `$${record.ahorroEstimado.toLocaleString()}` });
            details.push({ label: 'CO₂ Mitigado', value: `${record.co2Evitado} kg CO₂ eq.` });
        } else if (record.formType === 'pallets') {
            details.push({ label: 'Tipo Pallet', value: record.tipoPallet });
            details.push({ label: 'Cantidad Ingresados', value: `${record.cantidadIngresados} uds` });
            details.push({ label: 'Cantidad Reparados', value: `${record.cantidadReparados} uds` });
            details.push({ label: 'Cantidad Descartados', value: `${record.cantidadDescartados} uds` });
            details.push({ label: 'Cantidad Economía Circular', value: `${record.cantidadCircular} uds` });
            details.push({ label: 'Taller Encargado', value: record.responsableReparacion });
        } else if (record.formType === 'espacios-verdes') {
            details.push({ label: 'Zona Ambiental', value: record.espacioVerde });
            details.push({ label: 'Tarea Realizada', value: record.tareaRealizada });
            details.push({ label: 'Consumo de Agua', value: `${record.consumoAgua} Litros` });
            details.push({ label: 'Plantaciones', value: `${record.plantasAgregadas} uds (${record.especieAgregada || 'Sin especie'})` });
            details.push({ label: 'Estado Salud', value: record.estadoSalud });
            details.push({ label: 'Equipo Ejecutor', value: record.responsableTarea });
        }

        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginTop: '16px'
            }}>
                {details.map((d, index) => (
                    <div key={index}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>
                            {d.label}
                        </span>
                        <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text)', display: 'block', marginTop: '2px' }}>
                            {d.value}
                        </span>
                    </div>
                ))}
                {record.observaciones && (
                    <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>
                            Observaciones
                        </span>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text)', marginTop: '4px', fontStyle: 'italic', background: 'var(--background)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                            {record.observaciones}
                        </p>
                    </div>
                )}
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                    {canDelete(record) && (
                        <Button
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmModal({
                                    isOpen: true,
                                    record: record
                                });
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                border: '2px solid var(--error)',
                                color: 'var(--error)',
                                background: 'transparent'
                            }}
                        >
                            <Trash2 size={16} /> Eliminar Registro
                        </Button>
                    )}
                    {canModify(record) && (
                        <Button
                            variant="outline"
                            className="btn-modify-record"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/${record.formType}?edit=${record.id}`);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <Pencil size={16} /> Modificar Registro
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="card-anim">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/')}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0 }}
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--primary)' }}>
                            Historial de Registros<span style={{ color: 'var(--dy-red)' }}>.</span>
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                            Trazabilidad histórica completa de registros ambientales, residuos y reciclados de fábrica.
                        </p>
                    </div>
                </div>

                {totalCount > 0 && user && user.rol !== 'registrador' && (
                    <Button
                        variant="outline"
                        onClick={() => setExportModal(prev => ({ ...prev, isOpen: true }))}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '2px solid var(--success)', color: 'var(--success)' }}
                    >
                        <Download size={18} /> Exportar CSV
                    </Button>
                )}
            </div>

            {/* Filters Bar */}
            <Card style={{ padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px' }}>
                {/* Search query input */}
                <div style={{ position: 'relative', flex: 2, minWidth: '250px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por ID, inspector, material, cliente o sector..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 16px 12px 48px',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--background)',
                            outline: 'none',
                            fontSize: '0.95rem'
                        }}
                    />
                </div>

                {/* Form type selector filter */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <select
                        value={filterFormType}
                        onChange={(e) => {
                            setFilterFormType(e.target.value);
                            setCurrentPage(1);
                        }}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--background)',
                            color: 'var(--text)',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        {filteredFormTypes.map(ft => (
                            <option key={ft.id} value={ft.id}>{ft.label}</option>
                        ))}
                    </select>
                </div>
            </Card>

            {/* Results Count */}
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: '600', paddingLeft: '8px' }}>
                Mostrando {records.length} de {totalCount} registros en este filtro.
            </p>

            {/* Records List (Accordion Layout) */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <div className="card loading-card" style={{ display: 'inline-block' }}>Cargando historial de trazabilidad...</div>
                </div>
            ) : records.length === 0 ? (
                <div style={{
                    padding: '60px',
                    textAlign: 'center',
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius)',
                    border: '1px dashed var(--border)',
                    color: 'var(--text-muted)'
                }}>
                    <History size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
                    <h3>No se encontraron registros</h3>
                    <p style={{ marginTop: '4px' }}>Prueba modificando los filtros de búsqueda o ingresa un nuevo pesaje desde el Dashboard.</p>
                </div>
            ) : (
                <div className="dy-accordion-list">
                    {records.map(record => {
                        const isExpanded = expandedRecordId === record.id;
                        const dateString = new Date(record.createdAt || record.fecha).toLocaleString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });

                        // Colores distintivos de etiquetas de tipo de formulario
                        let tagColor = 'var(--text-muted)';
                        let bgTag = 'var(--surface-hover)';
                        if (record.formType === 'residuos-comunes') { tagColor = 'var(--success)'; bgTag = 'rgba(16, 185, 129, 0.08)'; }
                        else if (record.formType === 'residuos-especiales') { tagColor = 'var(--warning)'; bgTag = 'rgba(245, 158, 11, 0.08)'; }
                        else if (record.formType === 'devoluciones') { tagColor = '#3b82f6'; bgTag = 'rgba(59, 130, 246, 0.08)'; }
                        else if (record.formType === 'tratamiento') { tagColor = '#a855f7'; bgTag = 'rgba(168, 85, 247, 0.08)'; }
                        else if (record.formType === 'economia-circular') { tagColor = 'var(--dy-red)'; bgTag = 'rgba(228, 5, 33, 0.08)'; }
                        else if (record.formType === 'pallets') { tagColor = '#14b8a6'; bgTag = 'rgba(20, 184, 166, 0.08)'; }
                        else if (record.formType === 'espacios-verdes') { tagColor = '#84cc16'; bgTag = 'rgba(132, 204, 22, 0.08)'; }

                        return (
                            <div
                                key={record.id}
                                className={`dy-accordion ${isExpanded ? 'expanded' : ''}`}
                                style={{
                                    borderLeft: `5px solid ${isExpanded ? 'var(--dy-red)' : tagColor}`
                                }}
                            >
                                <div className="dy-accordion-header" onClick={() => toggleExpand(record.id)}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)' }}>
                                                {record.id}
                                            </span>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                fontWeight: '800',
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                color: tagColor,
                                                background: bgTag,
                                                textTransform: 'uppercase'
                                            }}>
                                                {record.formLabel}
                                            </span>
                                        </div>
                                        <div className="dy-accordion-subtitle" style={{ marginTop: '8px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Calendar size={14} /> {dateString}
                                            </span>
                                            <span style={{ margin: '0 8px' }}>•</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <FileText size={14} /> Inspector: {record.responsable || record.usuario}
                                            </span>
                                            {record.ediciones > 0 && (
                                                <>
                                                    <span style={{ margin: '0 8px' }}>•</span>
                                                    <span style={{
                                                        color: 'var(--text-muted)',
                                                        fontSize: '0.8rem',
                                                        fontStyle: 'italic',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        (Modificado {record.ediciones} {record.ediciones === 1 ? 'vez.' : 'veces.'}
                                                        {record.usuarioEdicion && ` Ultima por ${record.usuarioEdicion}`}
                                                        {record.updatedAt && ` el ${new Date(record.updatedAt).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} hs`})
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text)' }}>
                                            {record.peso ? `${record.peso} kg` :
                                                record.cantidad ? `${record.cantidad} ${record.unidad}` :
                                                    record.cantidadBultos ? `${record.cantidadBultos} bultos` :
                                                        record.cantidadIngresados ? `${record.cantidadIngresados} pallets` :
                                                            record.consumoAgua ? `${record.consumoAgua} L` : 'Ver Detalles'}
                                        </span>
                                        <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </button>
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div className="dy-accordion-body card-anim">
                                        {renderDetailGrid(record)}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '16px',
                    marginTop: '32px',
                    padding: '16px 0',
                    borderTop: '1px solid var(--border)'
                }}>
                    <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1 || loading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        Anterior
                    </Button>
                    <span style={{
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        color: 'var(--text-muted)'
                    }}>
                        Página <strong style={{ color: 'var(--text)' }}>{currentPage}</strong> de {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || loading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        Siguiente
                    </Button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmModal.isOpen && (
                <Modal
                    isOpen={deleteConfirmModal.isOpen}
                    onClose={() => setDeleteConfirmModal({ isOpen: false, record: null })}
                    title="Confirmar Eliminación"
                    showFooter={false}
                >
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <div style={{ color: 'var(--error)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                            <AlertCircle size={64} style={{ color: 'var(--dy-red)' }} />
                        </div>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '12px', color: 'var(--primary)' }}>
                            ¿Eliminar permanentemente el registro?
                        </h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: '1.5' }}>
                            Está a punto de borrar el registro <strong style={{ color: 'var(--text)' }}>{deleteConfirmModal.record?.id}</strong>. Esta acción no se puede deshacer y se eliminará de forma irreversible del historial de auditoría de la fábrica.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                            <Button
                                variant="outline"
                                onClick={() => setDeleteConfirmModal({ isOpen: false, record: null })}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                style={{ background: 'var(--dy-red)', color: '#fff' }}
                                onClick={() => executeDelete(deleteConfirmModal.record)}
                            >
                                Confirmar y Eliminar
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Delete Status Modal */}
            {deleteStatusModal.isOpen && (
                <Modal
                    isOpen={deleteStatusModal.isOpen}
                    onClose={() => setDeleteStatusModal({ isOpen: false, title: '', message: '', type: 'success' })}
                    title={deleteStatusModal.title}
                    showFooter={false}
                >
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <div style={{
                            color: deleteStatusModal.type === 'success' ? 'var(--success)' : 'var(--error)',
                            marginBottom: '16px',
                            display: 'flex',
                            justifyContent: 'center'
                        }}>
                            <AlertCircle size={64} style={{ color: deleteStatusModal.type === 'success' ? 'var(--success)' : 'var(--dy-red)' }} />
                        </div>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '12px', color: 'var(--primary)' }}>
                            {deleteStatusModal.title === 'Registro Eliminado' ? '¡Operación Exitosa!' : '¡Error en la Operación!'}
                        </h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem' }}>
                            {deleteStatusModal.message}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <Button
                                variant="primary"
                                onClick={() => setDeleteStatusModal({ isOpen: false, title: '', message: '', type: 'success' })}
                            >
                                Entendido
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Export CSV Configuration Modal */}
            {exportModal.isOpen && (
                <Modal
                    isOpen={exportModal.isOpen}
                    onClose={() => setExportModal(prev => ({ ...prev, isOpen: false }))}
                    title="Exportar a CSV"
                    showFooter={false}
                >
                    <div style={{ padding: '8px 0' }}>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: '1.5' }}>
                            Configure el rango de fechas para la exportación del historial completo a formato CSV de auditoría. Se aplicarán los filtros activos de tipo de formulario y búsqueda.
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600' }}>
                                <input
                                    type="radio"
                                    name="exportType"
                                    checked={exportModal.exportType === 'all'}
                                    onChange={() => setExportModal(prev => ({ ...prev, exportType: 'all' }))}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--success)' }}
                                />
                                Exportar todo el historial sin límite de fecha
                            </label>
                            
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600' }}>
                                <input
                                    type="radio"
                                    name="exportType"
                                    checked={exportModal.exportType === 'date'}
                                    onChange={() => setExportModal(prev => ({ ...prev, exportType: 'date' }))}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--success)' }}
                                />
                                Exportar registros a partir de una fecha específica
                            </label>

                            {exportModal.exportType === 'date' && (
                                <div style={{ paddingLeft: '28px', marginTop: '-8px' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '700' }}>
                                        Fecha de Inicio (Desde)
                                    </label>
                                    <input
                                        type="date"
                                        value={exportModal.sinceDate}
                                        max={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setExportModal(prev => ({ ...prev, sinceDate: e.target.value }))}
                                        style={{
                                            padding: '10px 14px',
                                            borderRadius: 'var(--radius)',
                                            border: '1px solid var(--border)',
                                            backgroundColor: 'var(--background)',
                                            color: 'var(--text)',
                                            fontSize: '0.95rem',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                            <Button
                                variant="outline"
                                onClick={() => setExportModal(prev => ({ ...prev, isOpen: false }))}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleExportCSV}
                                style={{ background: 'var(--success)', color: '#fff' }}
                            >
                                <Download size={18} style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }} /> Exportar a CSV
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

        </div>
    );
};

export default HistorialTrazabilidad;
