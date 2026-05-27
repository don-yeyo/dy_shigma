const mysql = require('mysql2/promise');
require('dotenv').config();

const TZ = process.env.DB_TIMEZONE || '-03:00';

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    timezone: TZ,           // Cómo interpreta el driver las fechas JS ↔ MySQL
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

// Aplicar el timezone en cada adquisición de conexión para asegurar consistencia
pool.on('acquire', function (connection) {
    connection.query(`SET time_zone = '${TZ}'`, (err) => {
        if (err) console.error('[DB] Error seteando session time_zone:', err.message);
    });
});

// Test de conexión
(async () => {
    try {
        const connection = await pool.getConnection();
        const [[{ now, tz }]] = await connection.query(
            "SELECT NOW() AS now, @@session.time_zone AS tz"
        );
        console.log(`Successfully connected to MySQL database | session time_zone=${tz} | NOW()=${now}`);
        connection.release();
    } catch (err) {
        console.error('Error connecting to the database:', err.message);
    }
})();

module.exports = pool;
