const mysql = require('mysql2/promise');

async function main() {
    console.log("DB Config:", {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || 'root',
        database: process.env.DB_NAME || 'shigma',
        port: process.env.DB_PORT || 3306
    });

    try {
        const [rows] = await connection.query('SELECT * FROM usuarios');
        console.log("Usuarios en la BD:");
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error("Error al consultar la BD:", err);
    } finally {
        await connection.end();
    }
}

main();
