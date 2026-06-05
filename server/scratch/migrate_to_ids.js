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
        console.log("1. Adding 'lugar_id' and 'sector_id' columns to 'residuos_comunes'...");
        try {
            await connection.query(`
                ALTER TABLE \`residuos_comunes\` 
                ADD COLUMN \`lugar_id\` INT DEFAULT NULL AFTER \`id\`,
                ADD COLUMN \`sector_id\` INT DEFAULT NULL AFTER \`lugar_id\`
            `);
            console.log("Columns added successfully.");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("Columns already exist.");
            } else {
                throw err;
            }
        }

        console.log("2. Migrating old plant codes ('ER', 'HY', 'PE') to IDs...");
        
        // Elguea Roman (Lugar ID 1, default Sector ID 1: 'Producción ER')
        const [r1] = await connection.query(`
            UPDATE \`residuos_comunes\`
            SET \`lugar_id\` = 1, \`sector_id\` = 1
            WHERE \`sector\` = 'ER' OR \`lugar\` = 'Elguea Roman'
        `);
        console.log(`Migrated ${r1.affectedRows} records to Elguea Roman.`);

        // Hipólito Yrigoyen (Lugar ID 2, default Sector ID 4: 'Producción HY')
        const [r2] = await connection.query(`
            UPDATE \`residuos_comunes\`
            SET \`lugar_id\` = 2, \`sector_id\` = 4
            WHERE \`sector\` = 'HY' OR \`lugar\` = 'Hipólito Yrigoyen'
        `);
        console.log(`Migrated ${r2.affectedRows} records to Hipólito Yrigoyen.`);

        // Pellegrini (Lugar ID 3, default Sector ID 7: 'Producción PE')
        const [r3] = await connection.query(`
            UPDATE \`residuos_comunes\`
            SET \`lugar_id\` = 3, \`sector_id\` = 7
            WHERE \`sector\` = 'PE' OR \`lugar\` = 'Pellegrini'
        `);
        console.log(`Migrated ${r3.affectedRows} records to Pellegrini.`);

        // Si queda algún registro huérfano, asignamos Elguea Roman por defecto para evitar fallos de NOT NULL
        const [r4] = await connection.query(`
            UPDATE \`residuos_comunes\`
            SET \`lugar_id\` = 1, \`sector_id\` = 1
            WHERE \`lugar_id\` IS NULL OR \`sector_id\` IS NULL
        `);
        if (r4.affectedRows > 0) {
            console.log(`Migrated ${r4.affectedRows} orphan records to Elguea Roman.`);
        }

        console.log("3. Dropping old string columns 'lugar' and 'sector'...");
        try {
            await connection.query(`
                ALTER TABLE \`residuos_comunes\`
                DROP COLUMN \`lugar\`,
                DROP COLUMN \`sector\`
            `);
            console.log("Old columns dropped.");
        } catch (err) {
            console.log("Old columns might have been dropped already or error:", err.message);
        }

        console.log("4. Setting columns as NOT NULL...");
        await connection.query(`
            ALTER TABLE \`residuos_comunes\`
            MODIFY COLUMN \`lugar_id\` INT NOT NULL,
            MODIFY COLUMN \`sector_id\` INT NOT NULL
        `);

        console.log("5. Creating foreign key constraints...");
        try {
            await connection.query(`
                ALTER TABLE \`residuos_comunes\`
                ADD CONSTRAINT \`fk_residuos_comunes_lugar\` FOREIGN KEY (\`lugar_id\`) REFERENCES \`lugares\` (\`id\`),
                ADD CONSTRAINT \`fk_residuos_comunes_sector\` FOREIGN KEY (\`sector_id\`) REFERENCES \`sectores\` (\`id\`)
            `);
            console.log("Foreign key constraints added successfully.");
        } catch (err) {
            console.log("Foreign keys might already exist or error:", err.message);
        }

        console.log("Migration completed successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await connection.end();
    }
}

main();
