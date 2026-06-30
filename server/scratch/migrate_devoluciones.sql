-- ============================================================
-- SHIGMA — Migración: Tabla devoluciones y Triggers de Auditoría
-- Ejecutar sobre la base de datos de SHIGMA en MySQL.
-- ============================================================

SET NAMES utf8mb4;

-- 1. Eliminar triggers antiguos de devoluciones si existen
DROP TRIGGER IF EXISTS `trg_devoluciones_ins`;
DROP TRIGGER IF EXISTS `trg_devoluciones_upd`;
DROP TRIGGER IF EXISTS `trg_devoluciones_del`;

-- 2. Eliminar la tabla devoluciones antigua si existe
DROP TABLE IF EXISTS `devoluciones`;

-- 3. Crear la nueva tabla devoluciones optimizada
CREATE TABLE `devoluciones` (
  `id` varchar(30) NOT NULL,
  `kilos` decimal(10, 2) NOT NULL,
  `sector` varchar(100) NOT NULL,
  `responsable` varchar(100) DEFAULT '',
  `observaciones` text NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
  `usuario` varchar(100) DEFAULT '',
  `ediciones` int NOT NULL DEFAULT 0,
  `usuario_edicion` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_devoluciones_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. Crear los nuevos triggers de auditoría
DELIMITER $$

CREATE TRIGGER `trg_devoluciones_ins` AFTER INSERT ON `devoluciones` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('devoluciones', NEW.id, NEW.usuario, NEW.responsable, 'create', 'Nueva clasificación de devolución inspeccionada', 'Devoluciones');
END$$

CREATE TRIGGER `trg_devoluciones_upd` AFTER UPDATE ON `devoluciones` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('devoluciones', NEW.id, NEW.usuario, NEW.responsable, 'update', 'Modificación de inspección de devolución', 'Devoluciones');
END$$

CREATE TRIGGER `trg_devoluciones_del` AFTER DELETE ON `devoluciones` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('devoluciones', OLD.id, OLD.usuario, OLD.responsable, 'delete', 'Eliminación del registro de devolución', 'Devoluciones');
END$$

DELIMITER ;

SELECT 'Migración de la tabla devoluciones y triggers completada exitosamente.' AS resultado;
