require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../config/db');

async function run() {
    try {
        console.log('Iniciando migración de base de datos...');
        
        // Agregar columna subcategoria_inorganico a residuos_comunes si no existe
        const [rcCols] = await db.query("SHOW COLUMNS FROM residuos_comunes LIKE 'subcategoria_inorganico'");
        if (rcCols.length === 0) {
            await db.query("ALTER TABLE residuos_comunes ADD COLUMN subcategoria_inorganico VARCHAR(50) DEFAULT NULL");
            console.log('Columna subcategoria_inorganico agregada a residuos_comunes.');
        } else {
            console.log('La columna subcategoria_inorganico ya existe en residuos_comunes.');
        }

        // Permitir sector_id como NULL en residuos_comunes
        await db.query("ALTER TABLE residuos_comunes MODIFY sector_id INT DEFAULT NULL");
        console.log('Restricción de sector_id modificada a DEFAULT NULL en residuos_comunes.');

        // Agregar columna nro_certificado a bateas_salidas si no existe
        const [bsCols] = await db.query("SHOW COLUMNS FROM bateas_salidas LIKE 'nro_certificado'");
        if (bsCols.length === 0) {
            await db.query("ALTER TABLE bateas_salidas ADD COLUMN nro_certificado VARCHAR(30) DEFAULT NULL");
            console.log('Columna nro_certificado agregada a bateas_salidas.');
        } else {
            console.log('La columna nro_certificado ya existe en bateas_salidas.');
        }

        console.log('Migración completada con éxito.');
        process.exit(0);
    } catch (err) {
        console.error('Error durante la migración:', err);
        process.exit(1);
    }
}

run();
