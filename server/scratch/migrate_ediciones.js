const mysql = require('mysql2/promise');

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || 'root',
        database: process.env.DB_NAME || 'shigma',
        port: process.env.DB_PORT || 3306
    });

    const tables = [
        'residuos_comunes',
        'residuos_especiales',
        'devoluciones',
        'tratamientos',
        'economia_circular',
        'pallets',
        'espacios_verdes'
    ];

    try {
        console.log("Iniciando migración para agregar columna 'ediciones'...");
        for (const table of tables) {
            try {
                // Verificar si la columna ya existe
                const [cols] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE 'ediciones'`);
                if (cols.length === 0) {
                    await connection.query(`ALTER TABLE ${table} ADD COLUMN ediciones INT NOT NULL DEFAULT 0`);
                    console.log(`✅ Columna 'ediciones' agregada a tabla '${table}'.`);
                } else {
                    console.log(`ℹ️ La columna 'ediciones' ya existe en tabla '${table}'.`);
                }
            } catch (err) {
                console.error(`❌ Error en tabla ${table}:`, err.message);
            }
        }
        console.log("Migración completada con éxito.");
    } catch (err) {
        console.error("Error general:", err);
    } finally {
        await connection.end();
    }
}

main();
