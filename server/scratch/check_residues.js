const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || 'root',
        database: process.env.DB_NAME || 'shigma',
        port: process.env.DB_PORT || 3306
    });

    try {
        const [columns] = await connection.query('DESCRIBE residuos_comunes');
        console.log("COLUMNS of residuos_comunes:");
        console.log(columns.map(c => `${c.Field} (${c.Type})`));

        const [rows] = await connection.query('SELECT id, lugar, sector FROM residuos_comunes LIMIT 10');
        console.log("First 10 rows:");
        console.log(rows);
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

main();
