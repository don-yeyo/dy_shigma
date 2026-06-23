require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');


(async () => {
    try {
        const sqlPath = path.join(__dirname, 'migracion_usuarios_operadores.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Ejecutar las sentencias por separado
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            console.log('Ejecutando:', statement.substring(0, 50) + '...');
            try {
                await pool.query(statement);
            } catch (err) {
                // Ignorar error de columna duplicada (ER_DUP_FIELDNAME)
                if (err.errno === 1060) {
                    console.log('La columna ya existe. Omitiendo...');
                } else {
                    throw err;
                }
            }
        }

        
        console.log('¡Migración ejecutada con éxito!');
        process.exit(0);
    } catch (err) {
        console.error('Error al ejecutar la migración:', err);
        process.exit(1);
    }
})();
