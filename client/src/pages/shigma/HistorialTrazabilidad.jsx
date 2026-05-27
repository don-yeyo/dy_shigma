import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, ArrowLeft, Search, Filter, Calendar, FileText, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { Card } from '../../components/FormElements';
import { Button } from '../../components/Button';
import { SHIGMAService } from '../../services/api';

const HistorialTrazabilidad = () => {
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterFormType, setFilterFormType] = useState('all');
    const [expandedRecordId, setExpandedRecordId] = useState(null);

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const response = await SHIGMAService.getAllRecords();
                setRecords(response.data);
            } catch (error) {
                console.error('Error fetching records:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecords();
    }, []);


    const toggleExpand = (id) => {
        setExpandedRecordId(expandedRecordId === id ? null : id);
    };

    // Filtrar registros
    const filteredRecords = records.filter(record => {
        const matchesSearch = 
            record.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (record.responsable && record.responsable.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (record.sector && record.sector.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (record.tipoResiduo && record.tipoResiduo.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (record.tipoResiduoEspecial && record.tipoResiduoEspecial.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (record.productoDevuelto && record.productoDevuelto.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (record.clienteOrigen && record.clienteOrigen.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (record.materialRevalorizado && record.materialRevalorizado.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesType = filterFormType === 'all' || record.formType === filterFormType;

        return matchesSearch && matchesType;
    });

    const formTypes = [
        { id: 'all', label: 'Todos los Formularios' },
        { id: 'residuos-comunes', label: 'Residuos Comunes' },
        { id: 'residuos-especiales', label: 'Residuos Especiales' },
        { id: 'devoluciones', label: 'Devoluciones' },
        { id: 'tratamiento', label: 'Tratamiento' },
        { id: 'economia-circular', label: 'Economía Circular' },
        { id: 'pallets', label: 'Gestión de Pallets' },
        { id: 'espacios-verdes', label: 'Espacios Verdes' }
    ];

    // Exportar a CSV (Funcionalidad Premium)
    const exportToCSV = () => {
        if (filteredRecords.length === 0) return;

        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Encabezados básicos
        csvContent += "ID,Fecha,Tipo de Registro,Sector/Origen,Responsable,Datos Detalle\n";

        filteredRecords.forEach(r => {
            const date = new Date(r.createdAt || r.fecha).toLocaleDateString();
            const sector = r.sector || r.sectorOrigen || r.clienteOrigen || r.espacioVerde || 'N/A';
            const detailText = JSON.stringify(r).replace(/"/g, '""');
            
            const line = `"${r.id}","${date}","${r.formLabel}","${sector}","${r.responsable || r.usuario}","${detailText}"\n`;
            csvContent += line;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `auditoria_shigma_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderDetailGrid = (record) => {
        // Renderizar dinámicamente según el tipo de formulario
        const details = [];

        if (record.formType === 'residuos-comunes') {
            details.push({ label: 'Sector Generador', value: record.sector });
            details.push({ label: 'Tipo de Residuo', value: record.tipoResiduo });
            details.push({ label: 'Peso del Lote', value: `${record.peso} kg` });
            details.push({ label: 'Destino / Depósito', value: record.destino });
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
                            Historial y Auditoría SHIGMA<span style={{ color: 'var(--dy-red)' }}>.</span>
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                            Trazabilidad histórica completa de registros ambientales, residuos y reciclados de fábrica.
                        </p>
                    </div>
                </div>

                {filteredRecords.length > 0 && (
                    <Button 
                        variant="outline" 
                        onClick={exportToCSV}
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
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
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
                        onChange={(e) => setFilterFormType(e.target.value)}
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
                        {formTypes.map(ft => (
                            <option key={ft.id} value={ft.id}>{ft.label}</option>
                        ))}
                    </select>
                </div>
            </Card>

            {/* Results Count */}
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: '600', paddingLeft: '8px' }}>
                Mostrando {filteredRecords.length} de {records.length} registros totales.
            </p>

            {/* Records List (Accordion Layout) */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <div className="card loading-card" style={{ display: 'inline-block' }}>Cargando historial de trazabilidad...</div>
                </div>
            ) : filteredRecords.length === 0 ? (
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
                    {filteredRecords.map(record => {
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
        </div>
    );
};

export default HistorialTrazabilidad;
