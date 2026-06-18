require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../config/db');

async function run() {
    try {
        console.log('Iniciando migración para agregar material y proveedor a depositos_salidas...');

        // 1. Agregar columna material si no existe
        const [matCols] = await db.query("SHOW COLUMNS FROM depositos_salidas LIKE 'material'");
        if (matCols.length === 0) {
            await db.query("ALTER TABLE depositos_salidas ADD COLUMN material VARCHAR(100) NOT NULL AFTER id");
            console.log('Columna "material" agregada a depositos_salidas.');
        } else {
            console.log('La columna "material" ya existe.');
        }

        // 2. Agregar columna proveedor si no existe
        const [provCols] = await db.query("SHOW COLUMNS FROM depositos_salidas LIKE 'proveedor'");
        if (provCols.length === 0) {
            await db.query("ALTER TABLE depositos_salidas ADD COLUMN proveedor VARCHAR(255) NOT NULL AFTER material");
            console.log('Columna "proveedor" agregada a depositos_salidas.');
        } else {
            console.log('La columna "proveedor" ya existe.');
        }

        console.log('Migración completada exitosamente.');
        process.exit(0);
    } catch (err) {
        console.error('Error durante la migración:', err);
        process.exit(1);
    }
}

run();
