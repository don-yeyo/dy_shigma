const db = require('../config/db');

// Bateas preestablecidas con sus capacidades en Kilos
const BATEAS = [
    { id: 'batea_1_org', nombre: 'Batea 1 de Orgánicos', tipo: 'Orgánicos', capacidad: 1000 },
    { id: 'batea_2_org', nombre: 'Batea 2 de Orgánicos', tipo: 'Orgánicos', capacidad: 1200 },
    { id: 'batea_1_inorg', nombre: 'Batea 1 de Inorgánicos', tipo: 'Inorgánicos', capacidad: 2000 },
    { id: 'batea_2_inorg', nombre: 'Batea 2 de Inorgánicos', tipo: 'Inorgánicos', capacidad: 2500 }
];

// Mapeo de tipos de formulario a tablas en base de datos (Plurales, Minúsculas y Snake Case)
const formTables = {
    'residuos-comunes': 'residuos_comunes',
    'residuos-especiales': 'residuos_especiales',
    'devoluciones': 'devoluciones',
    'tratamiento': 'tratamientos',
    'economia-circular': 'economia_circular',
    'pallets': 'pallets',
    'espacios-verdes': 'espacios_verdes'
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

// Nombres legibles por formulario
const formNames = {
    'residuos-comunes': 'Residuos No Especiales (RINE)',
    'residuos-especiales': 'Residuos Especiales',
    'devoluciones': 'Devoluciones',
    'tratamiento': 'Tratamiento de Residuos',
    'economia-circular': 'Economía Circular',
    'pallets': 'Movimiento de Pallets',
    'espacios-verdes': 'Registro de Espacios Verdes'
};

// ============================================================
// Funciones Auxiliares de Mapeo (camelCase <-> snake_case)
// ============================================================

// Convierte de camelCase (Frontend) a snake_case (Base de Datos)
const toSnakeCaseObj = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(toSnakeCaseObj);

    const snake = {};
    Object.entries(obj).forEach(([key, val]) => {
        const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        snake[snakeKey] = val;
    });
    return snake;
};

// Convierte de snake_case (Base de Datos) a camelCase (Frontend)
const toCamelCaseObj = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(toCamelCaseObj);

    const camel = {};
    Object.entries(obj).forEach(([key, val]) => {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        
        // Auto-parsear JSON para campos específicos
        if ((key === 'record_ids' || key === 'materiales_recuperados') && typeof val === 'string') {
            try {
                camel[camelKey] = JSON.parse(val);
                return;
            } catch (e) {}
        }
        
        camel[camelKey] = val;
    });
    return camel;
};

// ============================================================
// Controlador SHIGMA
// ============================================================

const shigmaController = {
    // Obtener todos los registros combinados (para el historial)
    getAllRecords: async (req, res) => {
        try {
            const queries = Object.entries(formTables).map(async ([formType, tableName]) => {
                const [rows] = await db.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
                return rows.map(r => {
                    const camelRecord = toCamelCaseObj(r);
                    return {
                        ...camelRecord,
                        formType,
                        formLabel: formNames[formType] || formType
                    };
                });
            });

            const results = await Promise.all(queries);
            const combined = results.flat();

            // Ordenar por fecha descendente
            combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            res.json(combined);
        } catch (error) {
            console.error('Error en getAllRecords:', error);
            res.status(500).json({ error: 'Error al recuperar todos los registros desde la base de datos.' });
        }
    },

    // Obtener registros de un formulario específico
    getRecordsByForm: async (req, res) => {
        try {
            const { formType } = req.params;
            const tableName = formTables[formType];
            if (!tableName) {
                return res.status(400).json({ error: 'Tipo de formulario inválido.' });
            }

            const [rows] = await db.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
            
            // Mapear campos snake_case a camelCase para el frontend
            const mapped = rows.map(r => toCamelCaseObj(r));

            res.json(mapped);
        } catch (error) {
            console.error(`Error en getRecordsByForm para ${req.params.formType}:`, error);
            res.status(500).json({ error: 'Error al recuperar registros de la base de datos.' });
        }
    },

    // Crear un nuevo registro
    createRecord: async (req, res) => {
        try {
            const { formType } = req.params;
            const recordData = req.body;

            const tableName = formTables[formType];
            const prefix = formPrefixes[formType];

            if (!tableName || !prefix) {
                return res.status(400).json({ error: 'Tipo de formulario inválido.' });
            }

            // Generar ID secuencial premium
            const [[{ count }]] = await db.query(`SELECT COUNT(*) AS count FROM ${tableName}`);
            const nextIndex = count + 1;
            const paddedIndex = String(nextIndex).padStart(4, '0');
            const customId = `SHG-${prefix}-${paddedIndex}`;

            // Preparar el payload del registro
            const insertData = {
                ...recordData,
                usuario: recordData.usuario || 'Gabriel Tonelli'
            };

            // Si no se envía fecha/hora de carga, la eliminamos para que MySQL use el DEFAULT CURRENT_TIMESTAMP local (GMT-3)
            if (!insertData.createdAt) {
                delete insertData.createdAt;
            }

            // Convertir a snake_case para la base de datos
            const dbPayload = toSnakeCaseObj(insertData);

            // Construcción e Inserción Dinámica
            const keys = ['id'];
            const values = [customId];

            Object.entries(dbPayload).forEach(([key, val]) => {
                if (key === 'id') return;
                keys.push(key);
                // Serializar objetos JSON (como materiales_recuperados)
                if (val !== null && typeof val === 'object') {
                    values.push(JSON.stringify(val));
                } else {
                    values.push(val);
                }
            });

            const placeholders = keys.map(() => '?').join(', ');
            const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;

            await db.query(sql, values);

            // Recuperar el registro guardado con el timestamp definitivo de la base de datos
            const [insertedRows] = await db.query(`SELECT * FROM ${tableName} WHERE id = ?`, [customId]);
            const savedRecord = toCamelCaseObj(insertedRows[0]);

            res.status(201).json({ message: 'Registro creado con éxito', record: savedRecord });
        } catch (error) {
            console.error('Error en createRecord:', error);
            res.status(500).json({ error: 'Error interno del servidor al guardar el registro.' });
        }
    },

    // Obtener el estado actual de las bateas
    getBateasStatus: async (req, res) => {
        try {
            // Consultar agrupaciones directo en RINE
            const [rows] = await db.query(`
                SELECT destino, SUM(peso) AS peso_acumulado, COUNT(*) AS records_count
                FROM residuos_comunes
                WHERE batea_salida_id IS NULL
                GROUP BY destino
            `);

            // Mapear el estado basándonos en la lista estática BATEAS
            const status = BATEAS.map(batea => {
                const dbBatea = rows.find(r => r.destino === batea.nombre);
                const pesoAcumulado = dbBatea ? parseFloat(dbBatea.peso_acumulado || 0) : 0;
                const recordsCount = dbBatea ? parseInt(dbBatea.records_count || 0) : 0;
                const porcentaje = Math.min(100, Math.round((pesoAcumulado / batea.capacidad) * 100 * 10) / 10);

                return {
                    ...batea,
                    pesoAcumulado: Math.round(pesoAcumulado * 100) / 100,
                    porcentaje,
                    recordsCount
                };
            });

            res.json(status);
        } catch (error) {
            console.error('Error en getBateasStatus:', error);
            res.status(500).json({ error: 'Error al obtener el estado de las bateas.' });
        }
    },

    // Reiniciar y vaciar una batea de forma transaccional segura
    restartBatea: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { bateaId } = req.params;
            const { fecha, hora, nroManifiesto, pesoBalanza, usuario } = req.body;

            if (!fecha || !hora || !nroManifiesto || !pesoBalanza) {
                return res.status(400).json({ error: 'Faltan campos obligatorios: fecha, hora, nroManifiesto y pesoBalanza son obligatorios.' });
            }

            const batea = BATEAS.find(b => b.id === bateaId);
            if (!batea) {
                return res.status(404).json({ error: 'Batea no encontrada.' });
            }

            // Seleccionar y bloquear RINE sin vaciar
            const [activeRecords] = await connection.query(
                `SELECT id, peso FROM residuos_comunes WHERE destino = ? AND batea_salida_id IS NULL FOR UPDATE`,
                [batea.nombre]
            );

            if (activeRecords.length === 0) {
                await connection.rollback();
                return res.status(400).json({ error: 'No hay residuos cargados en esta batea para vaciar.' });
            }

            const pesoAcumulado = activeRecords.reduce((sum, r) => sum + parseFloat(r.peso || 0), 0);
            const recordIds = activeRecords.map(r => r.id);

            // Generar ID de salida secuencial
            const [[{ count }]] = await connection.query(`SELECT COUNT(*) AS count FROM bateas_salidas`);
            const nextIndex = count + 1;
            const paddedIndex = String(nextIndex).padStart(4, '0');
            const customSalidaId = `SHG-BSAL-${paddedIndex}`;

            // Registrar vaciado
            const insertSql = `
                INSERT INTO bateas_salidas (id, batea_id, batea_nombre, fecha, hora, nro_manifiesto, peso_balanza, peso_acumulado, record_ids, status, usuario)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?)
            `;
            await connection.query(insertSql, [
                customSalidaId,
                bateaId,
                batea.nombre,
                fecha,
                hora,
                nroManifiesto,
                parseFloat(pesoBalanza),
                pesoAcumulado,
                JSON.stringify(recordIds),
                usuario || 'Gabriel Tonelli'
            ]);

            // Vincular RINE relacionados
            await connection.query(
                `UPDATE residuos_comunes SET batea_salida_id = ? WHERE destino = ? AND batea_salida_id IS NULL`,
                [customSalidaId, batea.nombre]
            );

            await connection.commit();

            // Retornar el registro insertado mapeado
            const [insertedSalida] = await db.query(`SELECT * FROM bateas_salidas WHERE id = ?`, [customSalidaId]);
            const outputSalida = toCamelCaseObj(insertedSalida[0]);

            res.status(201).json({
                message: 'Batea vaciada con éxito',
                salida: outputSalida
            });
        } catch (error) {
            await connection.rollback();
            console.error('Error en restartBatea:', error);
            res.status(500).json({ error: 'Error al reiniciar la batea en la base de datos.' });
        } finally {
            connection.release();
        }
    },

    // Listar las salidas de batea registradas en el historial
    getBateaSalidas: async (req, res) => {
        try {
            const [rows] = await db.query(`SELECT * FROM bateas_salidas ORDER BY created_at DESC`);
            
            // Mapear a camelCase para el cliente
            const mapped = rows.map(r => toCamelCaseObj(r));

            res.json(mapped);
        } catch (error) {
            console.error('Error en getBateaSalidas:', error);
            res.status(500).json({ error: 'Error al listar las salidas de batea.' });
        }
    },

    // Obtener métricas agrupadas de rendimiento para el Dashboard
    getDashboardStats: async (req, res) => {
        try {
            const { fechaDesde, fechaHasta } = req.query;
            let whereClause = '';
            const queryParams = [];

            if (fechaDesde && fechaHasta) {
                whereClause = ' WHERE created_at >= ? AND created_at <= ?';
                queryParams.push(`${fechaDesde} 00:00:00`, `${fechaHasta} 23:59:59`);
            } else if (fechaDesde) {
                whereClause = ' WHERE created_at >= ?';
                queryParams.push(`${fechaDesde} 00:00:00`);
            } else if (fechaHasta) {
                whereClause = ' WHERE created_at <= ?';
                queryParams.push(`${fechaHasta} 23:59:59`);
            }

            // Consultas optimizadas paralelas en MySQL con copia segura de parámetros
            const [
                [[{ totalKgComunes }]],
                [[{ totalKgEspeciales }]],
                [[{ totalPalletsReparados, totalPalletsDescartados }]],
                [[{ totalLitrosAgua, totalPlantaciones }]],
                [[{ totalDevoluciones }]],
                [[{ totalAhorroCircular, totalCO2Reducido }]],
                [rcRows],
                [ultimosTratamientos]
            ] = await Promise.all([
                db.query(`SELECT COALESCE(SUM(peso), 0) AS totalKgComunes FROM residuos_comunes${whereClause}`, [...queryParams]),
                db.query(`SELECT COALESCE(SUM(cantidad), 0) AS totalKgEspeciales FROM residuos_especiales${whereClause}`, [...queryParams]),
                db.query(`SELECT COALESCE(SUM(cantidad_reparados), 0) AS totalPalletsReparados, COALESCE(SUM(cantidad_descartados), 0) AS totalPalletsDescartados FROM pallets${whereClause}`, [...queryParams]),
                db.query(`SELECT COALESCE(SUM(consumo_agua), 0) AS totalLitrosAgua, COALESCE(SUM(plantas_agregadas), 0) AS totalPlantaciones FROM espacios_verdes${whereClause}`, [...queryParams]),
                db.query(`SELECT COUNT(*) AS totalDevoluciones FROM devoluciones${whereClause}`, [...queryParams]),
                db.query(`SELECT COALESCE(SUM(ahorro_estimado), 0) AS totalAhorroCircular, COALESCE(SUM(co2_evitado), 0) AS totalCO2Reducido FROM economia_circular${whereClause}`, [...queryParams]),
                db.query(`SELECT tipo_residuo, peso, clasificacion_inorganico, materiales_recuperados FROM residuos_comunes${whereClause}`, [...queryParams]),
                db.query(`SELECT * FROM tratamientos ORDER BY created_at DESC LIMIT 5`)
            ]);

            // Reusar lógica de agregación por materiales (RINE)
            let cartonKg = 0;
            let plasticoKg = 0;
            let vidrioKg = 0;
            let metalKg = 0;
            let organicoKg = 0;

            rcRows.forEach(r => {
                const peso = parseFloat(r.peso || 0);
                if (r.tipo_residuo === 'Cartón') cartonKg += peso;
                else if (r.tipo_residuo === 'Plástico') plasticoKg += peso;
                else if (r.tipo_residuo === 'Vidrio') vidrioKg += peso;
                else if (r.tipo_residuo === 'Metal') metalKg += peso;
                else if (r.tipo_residuo === 'Orgánico' || r.tipo_residuo === 'Orgánicos') organicoKg += peso;

                // Desglose de materiales recuperables
                if (r.tipo_residuo === 'Inorgánicos Generales' && r.clasificacion_inorganico === 'Recuperable' && r.materiales_recuperados) {
                    let mats = r.materiales_recuperados;
                    if (mats && typeof mats === 'string') {
                        try { mats = JSON.parse(mats); } catch (e) { mats = null; }
                    }
                    if (mats && typeof mats === 'object') {
                        Object.entries(mats).forEach(([mat, data]) => {
                            if (data.unidad === 'Kilos') {
                                const val = parseFloat(data.cantidad || 0);
                                if (mat === 'Cartón') cartonKg += val;
                                else if (mat === 'Metal') metalKg += val;
                                else if (mat === 'Cajones') plasticoKg += val;
                                else if (mat === 'Conos de Film Streech') plasticoKg += val;
                                else if (mat === 'Otros') metalKg += val;
                            }
                        });
                    }
                }
                
                if (r.tipo_residuo === `Inorgánicos marca ${process.env.COMPANY_NAME_SHORT || 'Don Yeyo'}`) {
                    plasticoKg += peso;
                }
            });

            const materialBreakdown = {
                Carton: Math.round(cartonKg * 10) / 10,
                Plastico: Math.round(plasticoKg * 10) / 10,
                Vidrio: Math.round(vidrioKg * 10) / 10,
                Metal: Math.round(metalKg * 10) / 10,
                Organico: Math.round(organicoKg * 10) / 10
            };

            // Mapear tratamientos a camelCase
            const mappedTratamientos = ultimosTratamientos.map(t => toCamelCaseObj(t));

            res.json({
                totalKgComunes: parseFloat(totalKgComunes),
                totalKgEspeciales: parseFloat(totalKgEspeciales),
                totalPalletsReparados: parseInt(totalPalletsReparados),
                totalPalletsDescartados: parseInt(totalPalletsDescartados),
                totalLitrosAgua: parseFloat(totalLitrosAgua),
                totalPlantaciones: parseInt(totalPlantaciones),
                totalDevoluciones: parseInt(totalDevoluciones),
                totalAhorroCircular: parseFloat(totalAhorroCircular),
                totalCO2Reducido: parseFloat(totalCO2Reducido),
                materialBreakdown,
                ultimosTratamientos: mappedTratamientos
            });
        } catch (error) {
            console.error('Error en getDashboardStats:', error);
            res.status(500).json({ error: 'Error al calcular estadísticas del dashboard.' });
        }
    },

    // Obtener operadores activos asignados a un tipo de formulario específico
    getOperadoresByForm: async (req, res) => {
        try {
            const { formType } = req.params;
            
            const [rows] = await db.query(`
                SELECT o.id, o.apellido_nombre, o.legajo
                FROM operadores o
                JOIN operadores_formularios op_form ON o.id = op_form.operador_id
                WHERE op_form.formulario_tipo = ? AND o.activo = 1
                ORDER BY o.apellido_nombre ASC
            `, [formType]);

            const mapped = rows.map(r => toCamelCaseObj(r));

            res.json(mapped);
        } catch (error) {
            console.error(`Error en getOperadoresByForm para ${req.params.formType}:`, error);
            res.status(500).json({ error: 'Error al obtener operadores desde la base de datos.' });
        }
    },

    // Obtener todos los operadores con sus asignaciones (para la pantalla de administración)
    getAllOperadores: async (req, res) => {
        try {
            const [rows] = await db.query(`
                SELECT o.id, o.apellido_nombre, o.legajo, o.activo, 
                       GROUP_CONCAT(op_form.formulario_tipo) AS formularios
                FROM operadores o
                LEFT JOIN operadores_formularios op_form ON o.id = op_form.operador_id
                GROUP BY o.id
                ORDER BY o.apellido_nombre ASC
            `);

            const mapped = rows.map(r => {
                const camel = toCamelCaseObj(r);
                camel.formularios = r.formularios ? r.formularios.split(',') : [];
                camel.activo = !!r.activo;
                return camel;
            });

            res.json(mapped);
        } catch (error) {
            console.error('Error en getAllOperadores:', error);
            res.status(500).json({ error: 'Error al recuperar todos los operadores.' });
        }
    },

    // Crear un nuevo operador con sus asignaciones de forma transaccional
    createOperador: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { apellidoNombre, legajo, activo, formularios } = req.body;
            if (!apellidoNombre || !legajo) {
                await connection.rollback();
                return res.status(400).json({ error: 'El nombre y el legajo son campos obligatorios.' });
            }

            // Validar legajo único
            const [existing] = await connection.query('SELECT id FROM operadores WHERE legajo = ?', [legajo]);
            if (existing.length > 0) {
                await connection.rollback();
                return res.status(400).json({ error: `El legajo '${legajo}' ya se encuentra registrado.` });
            }

            const activoVal = activo !== undefined ? (activo ? 1 : 0) : 1;

            const [result] = await connection.query(
                'INSERT INTO operadores (apellido_nombre, legajo, activo) VALUES (?, ?, ?)',
                [apellidoNombre, legajo, activoVal]
            );
            const operadorId = result.insertId;

            if (formularios && Array.isArray(formularios) && formularios.length > 0) {
                const insertValues = formularios.map(formType => [operadorId, formType]);
                await connection.query(
                    'INSERT INTO operadores_formularios (operador_id, formulario_tipo) VALUES ?',
                    [insertValues]
                );
            }

            await connection.commit();

            res.status(201).json({
                message: 'Operador creado con éxito.',
                operador: {
                    id: operadorId,
                    apellidoNombre,
                    legajo,
                    activo: !!activoVal,
                    formularios: formularios || []
                }
            });
        } catch (error) {
            await connection.rollback();
            console.error('Error en createOperador:', error);
            res.status(500).json({ error: 'Error al crear el operador en la base de datos.' });
        } finally {
            connection.release();
        }
    },

    // Actualizar un operador y sus asignaciones transaccionalmente
    updateOperador: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { id } = req.params;
            const { apellidoNombre, legajo, activo, formularios } = req.body;

            if (!apellidoNombre || !legajo) {
                await connection.rollback();
                return res.status(400).json({ error: 'El nombre y el legajo son campos obligatorios.' });
            }

            // Validar legajo duplicado por otro operador
            const [existing] = await connection.query('SELECT id FROM operadores WHERE legajo = ? AND id != ?', [legajo, id]);
            if (existing.length > 0) {
                await connection.rollback();
                return res.status(400).json({ error: `El legajo '${legajo}' ya está siendo utilizado por otro operador.` });
            }

            const activoVal = activo !== undefined ? (activo ? 1 : 0) : 1;

            await connection.query(
                'UPDATE operadores SET apellido_nombre = ?, legajo = ?, activo = ? WHERE id = ?',
                [apellidoNombre, legajo, activoVal, id]
            );

            // Eliminar asignaciones viejas e insertar nuevas
            await connection.query('DELETE FROM operadores_formularios WHERE operador_id = ?', [id]);

            if (formularios && Array.isArray(formularios) && formularios.length > 0) {
                const insertValues = formularios.map(formType => [id, formType]);
                await connection.query(
                    'INSERT INTO operadores_formularios (operador_id, formulario_tipo) VALUES ?',
                    [insertValues]
                );
            }

            await connection.commit();

            res.json({
                message: 'Operador actualizado con éxito.',
                operador: {
                    id: parseInt(id),
                    apellidoNombre,
                    legajo,
                    activo: !!activoVal,
                    formularios: formularios || []
                }
            });
        } catch (error) {
            await connection.rollback();
            console.error('Error en updateOperador:', error);
            res.status(500).json({ error: 'Error al actualizar el operador en la base de datos.' });
        } finally {
            connection.release();
        }
    },

    // Eliminar un operador de la base de datos (con ON DELETE CASCADE)
    deleteOperador: async (req, res) => {
        try {
            const { id } = req.params;

            const [result] = await db.query('DELETE FROM operadores WHERE id = ?', [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Operador no encontrado.' });
            }

            res.json({ message: 'Operador eliminado con éxito.' });
        } catch (error) {
            console.error('Error en deleteOperador:', error);
            res.status(500).json({ error: 'Error al eliminar el operador de la base de datos.' });
        }
    }
};

module.exports = shigmaController;
