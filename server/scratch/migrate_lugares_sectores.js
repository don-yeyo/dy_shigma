const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
    console.log("Connecting to database:", process.env.DB_NAME || 'shigma');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || 'root',
        database: process.env.DB_NAME || 'shigma',
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log("1. Creating table 'lugares'...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`lugares\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`nombre\` varchar(100) NOT NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        console.log("2. Seeding table 'lugares'...");
        await connection.query(`
            INSERT INTO \`lugares\` (\`id\`, \`nombre\`) VALUES
            (1, 'Elguea Roman'),
            (2, 'Hipólito Yrigoyen'),
            (3, 'Pellegrini')
            ON DUPLICATE KEY UPDATE \`nombre\` = VALUES(\`nombre\`);
        `);

        console.log("3. Creating table 'sectores'...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`sectores\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`nombre\` varchar(100) NOT NULL,
                \`id_lugar\` int NOT NULL,
                PRIMARY KEY (\`id\`),
                CONSTRAINT \`fk_sectores_lugar\` FOREIGN KEY (\`id_lugar\`) 
                    REFERENCES \`lugares\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        console.log("4. Seeding table 'sectores'...");
        const sectors = [
            ['Producción ER', 1],
            ['Depósito ER', 1],
            ['Mantenimiento ER', 1],
            ['Producción HY', 2],
            ['Administración HY', 2],
            ['Logística HY', 2],
            ['Producción PE', 3],
            ['Calidad PE', 3],
            ['Espacios Verdes PE', 3]
        ];

        for (const [nombre, id_lugar] of sectors) {
            await connection.query(`
                INSERT INTO \`sectores\` (\`nombre\`, \`id_lugar\`) 
                SELECT ?, ? 
                WHERE NOT EXISTS (
                    SELECT 1 FROM \`sectores\` WHERE \`nombre\` = ? AND \`id_lugar\` = ?
                )
            `, [nombre, id_lugar, nombre, id_lugar]);
        }

        console.log("5. Altering table 'residuos_comunes' to add 'lugar' column...");
        try {
            await connection.query(`
                ALTER TABLE \`residuos_comunes\` 
                ADD COLUMN \`lugar\` varchar(100) DEFAULT NULL AFTER \`id\`
            `);
            console.log("Column 'lugar' added successfully.");
        } catch (alterError) {
            if (alterError.code === 'ER_DUP_FIELDNAME') {
                console.log("Column 'lugar' already exists.");
            } else {
                throw alterError;
            }
        }

        console.log("Migration completed successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await connection.end();
    }
}

main();
