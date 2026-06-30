const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/db');

(async () => {
    try {
        console.log('Iniciando migración para agregar columna remito_retorno...');
        
        // Verificar si la columna ya existe
        const [columns] = await db.query("SHOW COLUMNS FROM pallets LIKE 'remito_retorno'");
        if (columns.length > 0) {
            console.log("La columna 'remito_retorno' ya existe en la tabla 'pallets'.");
        } else {
            await db.query('ALTER TABLE pallets ADD COLUMN remito_retorno varchar(30) DEFAULT NULL AFTER remito;');
            console.log("Columna 'remito_retorno' agregada con éxito.");
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Error en migración:', err.message);
        process.exit(1);
    }
})();
