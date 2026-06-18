require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../config/db');

async function run() {
    try {
        console.log('Iniciando migración de base de datos para depósito de recuperables...');

        // 1. Crear la tabla depositos_salidas
        await db.query(`
            CREATE TABLE IF NOT EXISTS \`depositos_salidas\` (
              \`id\` varchar(30) NOT NULL,
              \`fecha\` varchar(15) NOT NULL,
              \`hora\` varchar(15) NOT NULL,
              \`nro_manifiesto\` varchar(100) DEFAULT NULL,
              \`peso_balanza\` decimal(10, 2) NOT NULL,
              \`peso_acumulado\` decimal(10, 2) NOT NULL,
              \`record_ids\` json NOT NULL,
              \`status\` varchar(30) DEFAULT 'pendiente',
              \`nro_certificado\` varchar(30) DEFAULT NULL,
              \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP(),
              \`usuario\` varchar(100) DEFAULT '',
              PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);
        console.log('Tabla depositos_salidas asegurada.');

        // 2. Agregar la columna deposito_salida_id a residuos_comunes si no existe
        const [rcCols] = await db.query("SHOW COLUMNS FROM residuos_comunes LIKE 'deposito_salida_id'");
        if (rcCols.length === 0) {
            await db.query("ALTER TABLE residuos_comunes ADD COLUMN deposito_salida_id VARCHAR(30) DEFAULT NULL");
            console.log('Columna deposito_salida_id agregada a residuos_comunes.');
            
            // Agregar foreign key
            await db.query(`
                ALTER TABLE residuos_comunes 
                ADD CONSTRAINT fk_residuos_comunes_deposito_salida 
                FOREIGN KEY (deposito_salida_id) REFERENCES depositos_salidas(id) 
                ON DELETE SET NULL ON UPDATE CASCADE
            `);
            console.log('Foreign key fk_residuos_comunes_deposito_salida agregada.');
        } else {
            console.log('La columna deposito_salida_id ya existe en residuos_comunes.');
        }

        console.log('Migración de depósito completada con éxito.');
        process.exit(0);
    } catch (err) {
        console.error('Error durante la migración de depósito:', err);
        process.exit(1);
    }
}

run();
