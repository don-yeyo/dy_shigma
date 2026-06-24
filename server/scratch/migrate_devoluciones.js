const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/db');

(async () => {
    try {
        console.log('Iniciando migración de la tabla devoluciones...');

        // 1. Dropear triggers de auditoría antiguos
        console.log('Eliminando triggers antiguos si existen...');
        await db.query('DROP TRIGGER IF EXISTS `trg_devoluciones_ins`');
        await db.query('DROP TRIGGER IF EXISTS `trg_devoluciones_upd`');
        await db.query('DROP TRIGGER IF EXISTS `trg_devoluciones_del`');

        // 2. Dropear la tabla devoluciones antigua
        console.log('Eliminando tabla devoluciones antigua...');
        await db.query('DROP TABLE IF EXISTS `devoluciones`');

        // 3. Crear la nueva tabla devoluciones optimizada
        console.log('Creando nueva tabla devoluciones...');
        await db.query(`
            CREATE TABLE \`devoluciones\` (
              \`id\` varchar(30) NOT NULL,
              \`kilos\` decimal(10, 2) NOT NULL,
              \`sector\` varchar(100) NOT NULL,
              \`responsable\` varchar(100) DEFAULT '',
              \`observaciones\` text NULL,
              \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP(),
              \`usuario\` varchar(100) DEFAULT '',
              \`ediciones\` int NOT NULL DEFAULT 0,
              \`usuario_edicion\` varchar(100) DEFAULT NULL,
              PRIMARY KEY (\`id\`),
              KEY \`idx_devoluciones_created\` (\`created_at\` DESC)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);

        // 4. Crear los nuevos triggers de auditoría
        console.log('Creando nuevos triggers de auditoría...');
        await db.query(`
            CREATE TRIGGER \`trg_devoluciones_ins\` AFTER INSERT ON \`devoluciones\` FOR EACH ROW
            BEGIN
              INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
              VALUES ('devoluciones', NEW.id, NEW.usuario, NEW.responsable, 'create', 'Nueva clasificación de devolución inspeccionada', 'Devoluciones');
            END
        `);

        await db.query(`
            CREATE TRIGGER \`trg_devoluciones_upd\` AFTER UPDATE ON \`devoluciones\` FOR EACH ROW
            BEGIN
              INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
              VALUES ('devoluciones', NEW.id, NEW.usuario, NEW.responsable, 'update', 'Modificación de inspección de devolución', 'Devoluciones');
            END
        `);

        await db.query(`
            CREATE TRIGGER \`trg_devoluciones_del\` AFTER DELETE ON \`devoluciones\` FOR EACH ROW
            BEGIN
              INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
              VALUES ('devoluciones', OLD.id, OLD.usuario, OLD.responsable, 'delete', 'Eliminación del registro de devolución', 'Devoluciones');
            END
        `);

        console.log('¡Migración completada con éxito!');
        process.exit(0);
    } catch (e) {
        console.error('Error durante la migración:', e);
        process.exit(1);
    }
})();
