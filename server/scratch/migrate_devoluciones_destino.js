const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/db');

(async () => {
    try {
        console.log('Iniciando migración para agregar destino y batea_salida_id a devoluciones...');

        // 1. Agregar columna destino con valor por defecto
        console.log('Agregando columna destino...');
        await db.query(`
            ALTER TABLE \`devoluciones\` 
            ADD COLUMN \`destino\` varchar(150) NOT NULL DEFAULT 'Batea 1 de Orgánicos'
        `).catch(err => {
            if (!err.message.includes('duplicate column') && !err.message.includes('already exists') && err.code !== 'ER_DUP_FIELDNAME') throw err;
            console.log('Columna destino ya existe.');
        });

        // 2. Agregar columna batea_salida_id
        console.log('Agregando columna batea_salida_id...');
        await db.query(`
            ALTER TABLE \`devoluciones\` 
            ADD COLUMN \`batea_salida_id\` varchar(30) NULL
        `).catch(err => {
            if (!err.message.includes('duplicate column') && !err.message.includes('already exists') && err.code !== 'ER_DUP_FIELDNAME') throw err;
            console.log('Columna batea_salida_id ya existe.');
        });

        // 3. Agregar restricción de clave foránea
        console.log('Agregando constraint fk_devoluciones_batea_salida...');
        await db.query(`
            ALTER TABLE \`devoluciones\`
            ADD CONSTRAINT \`fk_devoluciones_batea_salida\` 
            FOREIGN KEY (\`batea_salida_id\`) 
            REFERENCES \`bateas_salidas\` (\`id\`) 
            ON DELETE SET NULL ON UPDATE CASCADE
        `).catch(err => {
            if (!err.message.includes('already exists') && !err.message.includes('Duplicate key name')) throw err;
            console.log('Constraint ya existe.');
        });

        console.log('¡Migración completada con éxito!');
        process.exit(0);
    } catch (e) {
        console.error('Error durante la migración:', e);
        process.exit(1);
    }
})();
