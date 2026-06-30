const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/db');

(async () => {
    try {
        // Consultar agrupaciones directo en RINE
        const [rcRows] = await db.query(`
            SELECT destino, SUM(peso) AS peso_acumulado, COUNT(*) AS records_count
            FROM residuos_comunes
            WHERE batea_salida_id IS NULL
            GROUP BY destino
        `);

        // Consultar agrupaciones directo en Devoluciones
        const [devRows] = await db.query(`
            SELECT destino, SUM(kilos) AS peso_acumulado, COUNT(*) AS records_count
            FROM devoluciones
            WHERE batea_salida_id IS NULL
            GROUP BY destino
        `);

        // Combinar los resultados de ambas tablas
        const combinedRows = {};
        rcRows.forEach(r => {
            combinedRows[r.destino] = {
                peso_acumulado: parseFloat(r.peso_acumulado || 0),
                records_count: parseInt(r.records_count || 0)
            };
        });
        devRows.forEach(r => {
            if (combinedRows[r.destino]) {
                combinedRows[r.destino].peso_acumulado += parseFloat(r.peso_acumulado || 0);
                combinedRows[r.destino].records_count += parseInt(r.records_count || 0);
            } else {
                combinedRows[r.destino] = {
                    peso_acumulado: parseFloat(r.peso_acumulado || 0),
                    records_count: parseInt(r.records_count || 0)
                };
            }
        });

        // Consultar bateas configuradas en la base de datos
        const [dbBateas] = await db.query('SELECT * FROM bateas');

        // Mapear el estado basándonos en las bateas de la BD
        const status = dbBateas.map(batea => {
            const dbBatea = combinedRows[batea.nombre];
            const pesoAcumulado = dbBatea ? dbBatea.peso_acumulado : 0;
            const recordsCount = dbBatea ? dbBatea.records_count : 0;
            const porcentaje = Math.min(100, Math.round((pesoAcumulado / parseFloat(batea.capacidad)) * 100 * 10) / 10);

            return {
                id: batea.id,
                nombre: batea.nombre,
                tipo: batea.tipo,
                capacidad: parseFloat(batea.capacidad),
                pesoAcumulado: Math.round(pesoAcumulado * 100) / 100,
                porcentaje,
                recordsCount
            };
        });

        console.log('Status de Bateas:', JSON.stringify(status, null, 2));
        process.exit(0);
    } catch (e) {
        console.error('Error al probar getBateasStatus:', e);
        process.exit(1);
    }
})();
