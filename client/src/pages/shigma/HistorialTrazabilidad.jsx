import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    History, ArrowLeft, Search, Filter, Calendar, FileText, ChevronDown, ChevronUp,
    Download, Pencil, Check, X, Loader2, AlertCircle, Trash2
} from 'lucide-react';
import { Card, Input, Select } from '../../components/FormElements';
import { Button } from '../../components/Button';
import Modal from '../../components/Modal';
import { SHIGMAService } from '../../services/api';
import { useAuth } from '../../config/AuthContext';
import * as XLSX from 'xlsx';
import { getDateConstraints } from '../../utils/dateUtils';

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

    const [operadores, setOperadores] = useState([]);
    const [editAjusteModal, setEditAjusteModal] = useState({
        isOpen: false,
        record: null,
        material: '',
        cantidadDiferencia: '',
        operador: '',
        observaciones: ''
    });
    const [savingAjuste, setSavingAjuste] = useState(false);
    const [devolucionModal, setDevolucionModal] = useState({
        isOpen: false,
        record: null,
        operarioRecibe: '',
        fechaDevolucion: '',
        horaDevolucion: ''
    });
    const [savingDevolucion, setSavingDevolucion] = useState(false);

    const openDevolucionModal = (record) => {
        const { todayStr, nowTimeStr } = getDateConstraints();
        setDevolucionModal({
            isOpen: true,
            record,
            operarioRecibe: record.operarioRecibe || '',
            fechaDevolucion: todayStr,
            horaDevolucion: nowTimeStr
        });
    };

    const fetchOperadores = async () => {
        try {
            const response = await SHIGMAService.getDepositoOperadores();
            setOperadores(response.data);
        } catch (error) {
            console.error('Error fetching operadores:', error);
        }
    };

    const handleEditAjusteSubmit = async (e) => {
        if (e) e.preventDefault();
        const diff = parseFloat(editAjusteModal.cantidadDiferencia);
        if (isNaN(diff) || diff === 0) {
            alert('Por favor, ingrese una cantidad de ajuste válida distinta de cero.');
            return;
        }
        if (!editAjusteModal.operador) {
            alert('Por favor, seleccione un operador.');
            return;
        }

        setSavingAjuste(true);
        try {
            const materialesRecuperados = {
                [editAjusteModal.material]: {
                    amount: diff,
                    cantidad: diff,
                    unidad: 'kg'
                }
            };

            await SHIGMAService.updateRecord('residuos-comunes', editAjusteModal.record.id, {
                peso: diff,
                observaciones: editAjusteModal.observaciones,
                materialesRecuperados,
                operador: editAjusteModal.operador
            });

            setEditAjusteModal(prev => ({ ...prev, isOpen: false, record: null }));

            setDeleteStatusModal({
                isOpen: true,
                title: 'Ajuste Modificado',
                message: `El ajuste de stock para ${editAjusteModal.material} fue modificado con éxito.`,
                type: 'success'
            });
            fetchRecords(currentPage);
        } catch (error) {
            console.error('Error updating ajuste:', error);
            alert(error.response?.data?.error || 'Error al modificar el ajuste.');
        } finally {
            setSavingAjuste(false);
        }
    };

    const handleDevolucionSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!devolucionModal.operarioRecibe) {
            alert('Por favor, seleccione el operario que recibe.');
            return;
        }

        setSavingDevolucion(true);
        try {
            const combinedFechaHora = `${devolucionModal.fechaDevolucion}T${devolucionModal.horaDevolucion}`;

            await SHIGMAService.updateRecord('pallets', devolucionModal.record.id, {
                ...devolucionModal.record,
                estado: 'Devuelto',
                operarioRecibe: devolucionModal.operarioRecibe,
                fechaDevolucion: combinedFechaHora,
                usuarioDevolucion: user?.nombre || 'Inspector'
            });

            setDevolucionModal(prev => ({ ...prev, isOpen: false, record: null }));

            setDeleteStatusModal({
                isOpen: true,
                title: 'Devolución Registrada',
                message: `La devolución del registro ${devolucionModal.record.id} fue procesada con éxito y el estado pasó a "Devuelto".`,
                type: 'success'
            });
            fetchRecords(currentPage);
        } catch (error) {
            console.error('Error registering devolucion:', error);
            alert(error.response?.data?.error || 'Error al registrar la devolución.');
        } finally {
            setSavingDevolucion(false);
        }
    };

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
        if (record.formType === 'vaciado-bateas' || record.formType === 'despacho-deposito') return false;
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

    useEffect(() => {
        fetchOperadores();
    }, []);

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
        { id: 'espacios-verdes', label: 'Espacios Verdes' },
        { id: 'vaciado-bateas', label: 'Vaciado de Bateas' },
        { id: 'despacho-deposito', label: 'Despacho de Depósito' }
    ];

    const filteredFormTypes = formTypes.filter(ft => {
        if (ft.id === 'all') return true;
        if (user && user.rol !== 'registrador') return true;
        return hasModulo(ft.id);
    });

    // Exportar a Excel (Pide rango: Todo o Desde una fecha)
    const handleExportExcel = async () => {
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

            // Preparar las filas estructuradas para Excel
            const excelRows = exportRecords.map(r => {
                const date = new Date(r.createdAt || r.fecha).toLocaleDateString('es-AR');
                const sector = r.sector || r.sectorOrigen || r.clienteOrigen || r.espacioVerde || r.bateaNombre || 'N/A';

                // Generar un desglose amigable del detalle de registro
                let detalleAmigable = '';
                if (r.formType === 'residuos-comunes') {
                    detalleAmigable = `Planta: ${r.lugar || 'N/A'}, Residuo: ${r.tipoResiduo}, Peso: ${r.peso} kg, Destino: ${r.destino}`;
                    if (r.materialesRecuperados) {
                        const mats = Object.entries(r.materialesRecuperados)
                            .map(([m, d]) => `${m}: ${d.cantidad} ${d.unidad}`)
                            .join(', ');
                        detalleAmigable += ` (Recuperados - ${mats})`;
                    }
                } else if (r.formType === 'residuos-especiales') {
                    detalleAmigable = `Tipo: ${r.tipoResiduoEspecial}, Peligro: ${r.categoriaPeligro}, Cantidad: ${r.cantidad} ${r.unidad}, Envase: ${r.tipoEnvase}`;
                } else if (r.formType === 'devoluciones') {
                    detalleAmigable = `Sector: ${r.sector}, Kilos: ${r.kilos} kg`;
                } else if (r.formType === 'tratamiento') {
                    detalleAmigable = `Proceso: ${r.procesoTratamiento}, Material: ${r.materialEntrada}, Cantidad: ${r.cantidadProcesada} kg, Subproducto: ${r.subproductoObtenido}`;
                } else if (r.formType === 'economia-circular') {
                    detalleAmigable = `Material: ${r.materialRevalorizado}, Reinserción: ${r.destinoReinsercion}, Cantidad: ${r.cantidad} ${r.unidad}, CO₂ Mitigado: ${r.co2Evitado} kg`;
                } else if (r.formType === 'pallets') {
                    let detailsList = [];
                    detailsList.push(`Tipo: ${r.tipoRegistro}`);
                    detailsList.push(`Cant: ${r.cantidad} uds`);
                    if (r.destino) detailsList.push(`Destino: ${r.destino}`);
                    if (r.remito) detailsList.push(`Remito: ${r.remito}`);
                    if (r.proveedor) detailsList.push(`Prov: ${r.proveedor}`);
                    if (r.planta) detailsList.push(`Planta: ${r.planta}`);
                    if (r.sector) detailsList.push(`Sector: ${r.sector}`);
                    if (r.estado) detailsList.push(`Estado: ${r.estado}`);
                    detalleAmigable = detailsList.join(', ');
                } else if (r.formType === 'espacios-verdes') {
                    detalleAmigable = `Tarea: ${r.tareaRealizada}, Agua: ${r.consumoAgua} L, Plantas: ${r.plantasAgregadas} (${r.especieAgregada || 'N/A'})`;
                } else if (r.formType === 'vaciado-bateas') {
                    detalleAmigable = `Batea: ${r.bateaNombre}, Manifiesto: ${r.nroManifiesto}, Peso Balanza: ${r.pesoBalanza} kg, Peso Acumulado: ${r.pesoAcumulado} kg, Estado: ${r.status || 'pendiente'}`;
                } else {
                    detalleAmigable = JSON.stringify(r);
                }

                return {
                    'ID Registro': r.id,
                    'Fecha': date,
                    'Tipo de Registro': r.formLabel,
                    'Sector / Origen': sector,
                    'Responsable / Inspector': r.responsable || r.usuario,
                    'Detalle del Registro': detalleAmigable
                };
            });

            // Crear libro de trabajo (Workbook) y hoja de cálculo (Worksheet)
            const worksheet = XLSX.utils.json_to_sheet(excelRows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Auditoría SHIGMA");

            // Auto-ajustar ancho de las columnas
            const colWidths = Object.keys(excelRows[0] || {}).map(key => {
                const maxLength = Math.max(
                    key.length,
                    ...excelRows.map(row => String(row[key] || '').length)
                );
                return { wch: Math.min(maxLength + 3, 50) }; // límite de 50 de ancho para que no se extienda infinitamente el detalle
            });
            worksheet['!cols'] = colWidths;

            // Descargar el archivo .xlsx
            XLSX.writeFile(workbook, `auditoria_shigma_${new Date().toISOString().slice(0, 10)}.xlsx`);

        } catch (err) {
            console.error('Error exporting Excel:', err);
            setDeleteStatusModal({
                isOpen: true,
                title: 'Error de Exportación',
                message: 'Ocurrió un error al intentar descargar los registros en formato Excel.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const renderDetailGrid = (record) => {
        // Renderizar dinámicamente según el tipo de formulario
        const details = [];
        const isAjuste = record.formType === 'residuos-comunes' && record.responsable === 'Ajuste de Stock';

        if (isAjuste) {
            let material = 'Desconocido';
            let cantidad = record.peso || 0;
            if (record.materialesRecuperados) {
                const entries = Object.entries(record.materialesRecuperados);
                if (entries.length > 0) {
                    material = entries[0][0];
                    cantidad = entries[0][1].cantidad || entries[0][1].amount || cantidad;
                }
            }
            const cantidadFormateada = cantidad > 0 ? `+${cantidad} kg` : `${cantidad} kg`;

            details.push({ label: 'Tipo de Operación', value: 'Ajuste Manual de Stock RINE' });
            details.push({ label: 'Material Ajustado', value: material });
            details.push({ label: 'Cantidad del Ajuste', value: cantidadFormateada });
            details.push({ label: 'Operador', value: record.operador || 'No asignado' });
            details.push({ label: 'Registrado por', value: record.usuario || 'N/A' });
        } else if (record.formType === 'residuos-comunes') {
            details.push({ label: 'Planta Generadora', value: record.lugar || 'N/A' });
            details.push({ label: 'Sector', value: record.sector || 'N/A' });
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
            details.push({ label: 'Sector de Origen', value: record.sector });
            details.push({ label: 'Kilos', value: `${record.kilos} kg` });
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
            details.push({ label: 'Tipo de Registro', value: record.tipoRegistro });
            details.push({ label: 'Cantidad', value: `${record.cantidad} uds` });
            if (record.destino) details.push({ label: 'Destino', value: record.destino });
            if (record.remito) details.push({ label: 'Remito', value: record.remito });
            if (record.proveedor) details.push({ label: 'Proveedor', value: record.proveedor });
            if (record.planta) details.push({ label: 'Planta', value: record.planta });
            if (record.sector) details.push({ label: 'Sector', value: record.sector });

            if (record.operarioEntrega) {
                details.push({ label: 'Operario que Entrega (Salida)', value: record.operarioEntrega });
                const fechaSalidaStr = new Date(record.createdAt || record.fecha).toLocaleString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                details.push({ label: 'Fecha de Salida', value: `${fechaSalidaStr} hs` });
            }

            if (record.estado) {
                const estadoLegible = record.estado === 'Devuelto' ? 'Devuelto (Completado)' : 'Retirado (Pendiente)';
                details.push({ label: 'Estado', value: estadoLegible });

                if (record.estado === 'Devuelto') {
                    if (record.operarioRecibe) {
                        details.push({ label: 'Operario que Recibe (Retorno)', value: record.operarioRecibe });
                    }
                    if (record.fechaDevolucion) {
                        const devDate = new Date(record.fechaDevolucion).toLocaleString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        details.push({ label: 'Fecha de Retorno', value: `${devDate} hs` });
                    }
                    if (record.usuarioDevolucion) {
                        details.push({ label: 'Recepción grabada por', value: record.usuarioDevolucion });
                    }
                }
            } else {
                if (record.operarioRecibe) details.push({ label: 'Operario que Recibe', value: record.operarioRecibe });
            }
        } else if (record.formType === 'espacios-verdes') {
            details.push({ label: 'Zona Ambiental', value: record.espacioVerde });
            details.push({ label: 'Tarea Realizada', value: record.tareaRealizada });
            details.push({ label: 'Consumo de Agua', value: `${record.consumoAgua} Litros` });
            details.push({ label: 'Plantaciones', value: `${record.plantasAgregadas} uds (${record.especieAgregada || 'Sin especie'})` });
            details.push({ label: 'Estado Salud', value: record.estadoSalud });
            details.push({ label: 'Equipo Ejecutor', value: record.responsableTarea });
        } else if (record.formType === 'vaciado-bateas') {
            details.push({ label: 'Batea Vacía', value: record.bateaNombre || 'N/A' });
            details.push({ label: 'Nro Manifiesto', value: record.nroManifiesto || 'N/A' });
            details.push({ label: 'Peso Balanza', value: `${record.pesoBalanza} kg` });
            details.push({ label: 'Peso Acumulado (RINE)', value: `${record.pesoAcumulado} kg` });
            details.push({ label: 'Lotes Vinculados', value: `${record.recordIds ? record.recordIds.length : 0} lotes` });
            details.push({ label: 'Estado', value: record.status ? record.status.toUpperCase() : 'PENDIENTE' });
        } else if (record.formType === 'despacho-deposito') {
            details.push({ label: 'Material Despachado', value: record.material === 'Cajones' ? 'Cajones Rotos' : record.material });
            details.push({ label: 'Proveedor / Destino', value: record.proveedor || 'N/A' });
            details.push({ label: 'Nro Manifiesto', value: record.nroManifiesto || 'N/A' });
            details.push({ label: 'Peso Balanza', value: `${record.pesoBalanza} kg` });
            details.push({ label: 'Peso Calculado (RINE)', value: `${record.pesoAcumulado} kg` });
            details.push({ label: 'Lotes Vinculados', value: `${record.recordIds ? record.recordIds.length : 0} lotes` });
            details.push({ label: 'Estado', value: record.status ? record.status.toUpperCase() : 'PENDIENTE' });
            if (record.nroCertificado) {
                details.push({ label: 'Certificado Disp. Final', value: record.nroCertificado });
            }
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
                                if (isAjuste) {
                                    let material = '';
                                    let cantidad = record.peso || 0;
                                    if (record.materialesRecuperados) {
                                        const entries = Object.entries(record.materialesRecuperados);
                                        if (entries.length > 0) {
                                            material = entries[0][0];
                                            cantidad = entries[0][1].cantidad || entries[0][1].amount || cantidad;
                                        }
                                    }
                                    setEditAjusteModal({
                                        isOpen: true,
                                        record,
                                        material,
                                        cantidadDiferencia: String(cantidad),
                                        operador: record.operador || '',
                                        observaciones: record.observaciones || ''
                                    });
                                } else {
                                    navigate(`/${record.formType}?edit=${record.id}`);
                                }
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
                    {record.formType === 'pallets' &&
                        (record.tipoRegistro === 'Reparación Interna' || record.tipoRegistro === 'Reparación Externa') &&
                        record.estado === 'Retirado' && (
                            <Button
                                variant="primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openDevolucionModal(record);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: '#14b8a6',
                                    color: '#fff'
                                }}
                            >
                                <Check size={16} /> Registrar Devolución
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
                        <Download size={18} /> Exportar Excel
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
                        if (record.responsable === 'Ajuste de Stock') { tagColor = 'var(--dy-red)'; bgTag = 'rgba(228, 5, 33, 0.08)'; }
                        else if (record.formType === 'residuos-comunes') { tagColor = 'var(--success)'; bgTag = 'rgba(16, 185, 129, 0.08)'; }
                        else if (record.formType === 'residuos-especiales') { tagColor = 'var(--warning)'; bgTag = 'rgba(245, 158, 11, 0.08)'; }
                        else if (record.formType === 'devoluciones') { tagColor = '#3b82f6'; bgTag = 'rgba(59, 130, 246, 0.08)'; }
                        else if (record.formType === 'tratamiento') { tagColor = '#a855f7'; bgTag = 'rgba(168, 85, 247, 0.08)'; }
                        else if (record.formType === 'economia-circular') { tagColor = 'var(--dy-red)'; bgTag = 'rgba(228, 5, 33, 0.08)'; }
                        else if (record.formType === 'pallets') { tagColor = '#14b8a6'; bgTag = 'rgba(20, 184, 166, 0.08)'; }
                        else if (record.formType === 'espacios-verdes') { tagColor = '#84cc16'; bgTag = 'rgba(132, 204, 22, 0.08)'; }
                        else if (record.formType === 'vaciado-bateas') { tagColor = '#f43f5e'; bgTag = 'rgba(244, 63, 94, 0.08)'; }
                        else if (record.formType === 'despacho-deposito') { tagColor = '#06b6d4'; bgTag = 'rgba(6, 182, 212, 0.08)'; }

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
                                                {record.responsable === 'Ajuste de Stock' ? 'Ajuste de Depósito' : record.formLabel}
                                            </span>
                                            {record.formType === 'pallets' && record.estado && (
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: '800',
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                    color: record.estado === 'Devuelto' ? 'var(--success)' : '#f59e0b',
                                                    background: record.estado === 'Devuelto' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {record.estado === 'Devuelto' ? 'Devuelto (Completado)' : 'Retirado (Pendiente)'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="dy-accordion-subtitle" style={{ marginTop: '8px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Calendar size={14} /> {dateString}
                                            </span>
                                            <span style={{ margin: '0 8px' }}>•</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <FileText size={14} /> {record.responsable === 'Ajuste de Stock' ? 'Operador' : 'Inspector'}: {record.responsable === 'Ajuste de Stock' ? (record.operador || 'No asignado') : (record.responsable || record.usuario)}
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
                                                record.kilos ? `${record.kilos} kg` :
                                                    record.pesoBalanza ? `${record.pesoBalanza} kg (Balanza)` :
                                                        record.formType === 'pallets' && record.cantidad ? `${record.cantidad} pallets` :
                                                            record.cantidad ? `${record.cantidad} ${record.unidad || 'uds'}` :
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

            {/* Export Excel Configuration Modal */}
            {exportModal.isOpen && (
                <Modal
                    isOpen={exportModal.isOpen}
                    onClose={() => setExportModal(prev => ({ ...prev, isOpen: false }))}
                    title="Exportar a Excel"
                    showFooter={false}
                >
                    <div style={{ padding: '8px 0' }}>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: '1.5' }}>
                            Configure el rango de fechas para la exportación del historial completo a formato Excel (.xlsx) de auditoría. Se aplicarán los filtros activos de tipo de formulario y búsqueda.
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
                                onClick={handleExportExcel}
                                style={{ background: 'var(--success)', color: '#fff' }}
                            >
                                <Download size={18} style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }} /> Exportar a Excel
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
            {/* Modal de Registro de Devolución de Pallets */}
            {devolucionModal.isOpen && (
                <Modal
                    isOpen={devolucionModal.isOpen}
                    onClose={() => setDevolucionModal(prev => ({ ...prev, isOpen: false, record: null }))}
                    title="Registrar Devolución de Pallets"
                    showFooter={false}
                >
                    <form onSubmit={handleDevolucionSubmit} style={{ padding: '4px 0' }}>
                        <div style={{
                            background: 'var(--surface-hover)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '16px',
                            fontSize: '0.9rem',
                            color: 'var(--text-muted)'
                        }}>
                            <strong>Registro ID:</strong> {devolucionModal.record?.id} <br />
                            <strong>Tipo de Movimiento:</strong> {devolucionModal.record?.tipoRegistro} <br />
                            <strong>Cantidad:</strong> {devolucionModal.record?.cantidad} unidades <br />
                            {devolucionModal.record?.proveedor && <><strong>Proveedor:</strong> {devolucionModal.record.proveedor} <br /></>}
                            <strong>Operario que Entrega:</strong> {devolucionModal.record?.operarioEntrega || 'No asignado'}
                        </div>

                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                                    Fecha Devolución *
                                </label>
                                <input
                                    type="date"
                                    value={devolucionModal.fechaDevolucion}
                                    onChange={(e) => setDevolucionModal(prev => ({ ...prev, fechaDevolucion: e.target.value }))}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid var(--border)',
                                        backgroundColor: 'var(--surface)',
                                        color: 'var(--text)',
                                        fontSize: '0.9rem',
                                        outline: 'none'
                                    }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                                    Hora Devolución *
                                </label>
                                <input
                                    type="time"
                                    value={devolucionModal.horaDevolucion}
                                    onChange={(e) => setDevolucionModal(prev => ({ ...prev, horaDevolucion: e.target.value }))}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid var(--border)',
                                        backgroundColor: 'var(--surface)',
                                        color: 'var(--text)',
                                        fontSize: '0.9rem',
                                        outline: 'none'
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        <Select
                            label="Operario que Recibe *"
                            name="operarioRecibe"
                            value={devolucionModal.operarioRecibe}
                            onChange={(e) => setDevolucionModal(prev => ({ ...prev, operarioRecibe: e.target.value }))}
                            required
                            includePlaceholder={true}
                            options={operadores.map(op => ({
                                id: op.apellidoNombre,
                                label: `${op.apellidoNombre} (${op.legajo})`
                            }))}
                        />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDevolucionModal(prev => ({ ...prev, isOpen: false, record: null }))}
                                disabled={savingDevolucion}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                className={savingDevolucion ? 'btn-loading' : ''}
                                disabled={savingDevolucion}
                                style={{ background: '#14b8a6', color: '#fff' }}
                            >
                                {savingDevolucion ? 'Registrando...' : 'Registrar Recepción'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal de Modificación de Ajuste de Stock */}
            {editAjusteModal.isOpen && (
                <Modal
                    isOpen={editAjusteModal.isOpen}
                    onClose={() => setEditAjusteModal(prev => ({ ...prev, isOpen: false, record: null }))}
                    title={
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span>Ajuste {editAjusteModal.material}</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                                Cant. ajustada: <span style={{ color: '#888888', fontWeight: '500' }}>{parseFloat(editAjusteModal.cantidadDiferencia) > 0 ? `+${editAjusteModal.cantidadDiferencia}` : editAjusteModal.cantidadDiferencia} kg</span>
                            </span>
                        </div>
                    }
                    showFooter={false}
                >
                    <form onSubmit={handleEditAjusteSubmit} style={{ padding: '4px 0' }}>
                        <div style={{
                            background: 'var(--surface-hover)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '16px',
                            fontSize: '0.9rem',
                            color: 'var(--text-muted)'
                        }}>
                            <strong>Registro ID:</strong> {editAjusteModal.record?.id} <br />
                            <strong>Material:</strong> {editAjusteModal.material}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <Input
                                label="Cantidad de Ajuste (kg) *"
                                type="number"
                                step="any"
                                allowNegative={true}
                                placeholder="Ej: 150 o -75"
                                value={editAjusteModal.cantidadDiferencia}
                                onChange={(e) => setEditAjusteModal(prev => ({ ...prev, cantidadDiferencia: e.target.value }))}
                                required
                            />

                            <Select
                                label="Operador *"
                                name="operador"
                                value={editAjusteModal.operador}
                                onChange={(e) => setEditAjusteModal(prev => ({ ...prev, operador: e.target.value }))}
                                required
                                includePlaceholder={true}
                                options={operadores.map(op => ({
                                    id: op.apellidoNombre,
                                    label: `${op.apellidoNombre} (${op.legajo})`
                                }))}
                            />
                        </div>

                        <Input
                            label="Observaciones / Motivo *"
                            type="text"
                            placeholder="Ej: Corrección por inventario visual"
                            value={editAjusteModal.observaciones}
                            onChange={(e) => setEditAjusteModal(prev => ({ ...prev, observaciones: e.target.value }))}
                            required
                        />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditAjusteModal(prev => ({ ...prev, isOpen: false, record: null }))}
                                disabled={savingAjuste}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                className={savingAjuste ? 'btn-loading' : ''}
                                disabled={savingAjuste}
                                style={{ background: 'var(--dy-red)' }}
                            >
                                {savingAjuste ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

        </div>
    );
};

export default HistorialTrazabilidad;
