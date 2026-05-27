const fs = require('fs');
const path = require('path');

// Obtener ruta de almacenamiento desde variables de entorno o default
const dataDir = path.resolve(process.env.SHIGMA_DATA_PATH || './data');

// Asegurar que exista la carpeta de datos
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Función auxiliar para leer archivo JSON
const readJsonFile = (formType) => {
    const filePath = path.join(dataDir, `${formType}.json`);
    if (!fs.existsSync(filePath)) {
        return [];
    }
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(fileContent || '[]');
    } catch (error) {
        console.error(`Error leyendo archivo ${formType}.json:`, error);
        return [];
    }
};

// Función auxiliar para escribir archivo JSON
const writeJsonFile = (formType, data) => {
    const filePath = path.join(dataDir, `${formType}.json`);
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error(`Error escribiendo archivo ${formType}.json:`, error);
        return false;
    }
};

// Prefijos de IDs por formulario
const formPrefixes = {
    'residuos-comunes': 'RC',
    'residuos-especiales': 'RE',
    'devoluciones': 'DEV',
    'tratamiento': 'TRAT',
    'economia-circular': 'EC',
    'pallets': 'PL',
    'espacios-verdes': 'EV'
};

// Formulario Nombres legibles
const formNames = {
    'residuos-comunes': 'Residuos Comunes',
    'residuos-especiales': 'Residuos Especiales',
    'devoluciones': 'Devoluciones',
    'tratamiento': 'Tratamiento de Residuos',
    'economia-circular': 'Economía Circular',
    'pallets': 'Movimiento de Pallets',
    'espacios-verdes': 'Registro de Espacios Verdes'
};

const shigmaController = {
    // Obtener todos los registros combinados (para el historial)
    getAllRecords: (req, res) => {
        try {
            let combined = [];
            Object.keys(formPrefixes).forEach(formType => {
                const records = readJsonFile(formType);
                const enriched = records.map(r => ({
                    ...r,
                    formType,
                    formLabel: formNames[formType] || formType
                }));
                combined = [...combined, ...enriched];
            });

            // Ordenar por fecha descendente (más nuevos primero)
            combined.sort((a, b) => new Date(b.createdAt || b.fecha) - new Date(a.createdAt || a.fecha));

            res.json(combined);
        } catch (error) {
            console.error('Error en getAllRecords:', error);
            res.status(500).json({ error: 'Error al recuperar todos los registros.' });
        }
    },

    // Obtener registros de un formulario específico
    getRecordsByForm: (req, res) => {
        try {
            const { formType } = req.params;
            if (!formPrefixes[formType]) {
                return res.status(400).json({ error: 'Tipo de formulario inválido.' });
            }

            const records = readJsonFile(formType);
            res.json(records);
        } catch (error) {
            console.error(`Error en getRecordsByForm para ${req.params.formType}:`, error);
            res.status(500).json({ error: 'Error al recuperar registros.' });
        }
    },

    // Crear un nuevo registro
    createRecord: (req, res) => {
        try {
            const { formType } = req.params;
            const recordData = req.body;

            if (!formPrefixes[formType]) {
                return res.status(400).json({ error: 'Tipo de formulario inválido.' });
            }

            const records = readJsonFile(formType);
            
            // Generar un ID incremental premium
            const prefix = formPrefixes[formType];
            const nextIndex = records.length + 1;
            const paddedIndex = String(nextIndex).padStart(4, '0');
            const customId = `SHG-${prefix}-${paddedIndex}`;

            // Crear nuevo registro
            const newRecord = {
                id: customId,
                ...recordData,
                createdAt: new Date().toISOString(),
                // Se asume que el usuario viene de la sesión
                usuario: recordData.usuario || 'Gabriel Tonelli'
            };

            records.push(newRecord);
            const success = writeJsonFile(formType, records);

            if (success) {
                res.status(201).json({ message: 'Registro creado con éxito', record: newRecord });
            } else {
                res.status(500).json({ error: 'Error al persistir el registro.' });
            }
        } catch (error) {
            console.error('Error en createRecord:', error);
            res.status(500).json({ error: 'Error interno del servidor al guardar el registro.' });
        }
    },

    // Obtener métricas dinámicas para el Dashboard
    getDashboardStats: (req, res) => {
        try {
            // Leer todos los formularios
            const rc = readJsonFile('residuos-comunes');
            const re = readJsonFile('residuos-especiales');
            const dev = readJsonFile('devoluciones');
            const trat = readJsonFile('tratamiento');
            const ec = readJsonFile('economia-circular');
            const pl = readJsonFile('pallets');
            const ev = readJsonFile('espacios-verdes');

            // 1. Kg Totales de Residuos Comunes Reciclados
            const totalKgComunes = rc.reduce((sum, r) => sum + parseFloat(r.peso || 0), 0);

            // 2. Kg Totales de Residuos Especiales Acopiados/Retirados
            const totalKgEspeciales = re.reduce((sum, r) => sum + parseFloat(r.cantidad || 0), 0);

            // 3. Pallets Totales Activos / Reparados
            const totalPalletsReparados = pl.reduce((sum, r) => sum + parseInt(r.cantidadReparados || 0), 0);
            const totalPalletsDescartados = pl.reduce((sum, r) => sum + parseInt(r.cantidadDescartados || 0), 0);

            // 4. Espacios Verdes - Litros de agua consumidos
            const totalLitrosAgua = ev.reduce((sum, r) => sum + parseFloat(r.consumoAgua || 0), 0);
            const totalPlantaciones = ev.reduce((sum, r) => sum + parseInt(r.plantasAgregadas || 0), 0);

            // 5. Devoluciones procesadas
            const totalDevoluciones = dev.length;

            // 6. Impacto Economía Circular ($ ahorrados estimado y CO2 reducido)
            const totalAhorroCircular = ec.reduce((sum, r) => sum + parseFloat(r.ahorroEstimado || 0), 0);
            const totalCO2Reducido = ec.reduce((sum, r) => sum + parseFloat(r.co2Evitado || 0), 0);

            // 7. Agrupado por tipo de material común para el gráfico
            const materialBreakdown = {
                Carton: rc.filter(r => r.tipoResiduo === 'Cartón').reduce((sum, r) => sum + parseFloat(r.peso || 0), 0),
                Plastico: rc.filter(r => r.tipoResiduo === 'Plástico').reduce((sum, r) => sum + parseFloat(r.peso || 0), 0),
                Vidrio: rc.filter(r => r.tipoResiduo === 'Vidrio').reduce((sum, r) => sum + parseFloat(r.peso || 0), 0),
                Metal: rc.filter(r => r.tipoResiduo === 'Metal').reduce((sum, r) => sum + parseFloat(r.peso || 0), 0),
                Organico: rc.filter(r => r.tipoResiduo === 'Orgánico').reduce((sum, r) => sum + parseFloat(r.peso || 0), 0)
            };

            // 8. Tareas recientes de tratamiento
            const ultimosTratamientos = trat.slice(-5).reverse();

            res.json({
                totalKgComunes,
                totalKgEspeciales,
                totalPalletsReparados,
                totalPalletsDescartados,
                totalLitrosAgua,
                totalPlantaciones,
                totalDevoluciones,
                totalAhorroCircular,
                totalCO2Reducido,
                materialBreakdown,
                ultimosTratamientos
            });
        } catch (error) {
            console.error('Error en getDashboardStats:', error);
            res.status(500).json({ error: 'Error al calcular estadísticas del dashboard.' });
        }
    }
};

module.exports = shigmaController;
