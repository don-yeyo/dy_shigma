-- ============================================================
-- SHIGMA — Migración: Tabla pallets y Triggers de Auditoría
-- Ejecutar sobre la base de datos de SHIGMA en MySQL.
-- ============================================================

SET NAMES utf8mb4;

-- 1. Eliminar triggers antiguos de pallets si existen
DROP TRIGGER IF EXISTS `trg_pallets_ins`;
DROP TRIGGER IF EXISTS `trg_pallets_upd`;
DROP TRIGGER IF EXISTS `trg_pallets_del`;

-- 2. Eliminar la tabla pallets antigua si existe
DROP TABLE IF EXISTS `pallets`;

-- 3. Crear la nueva tabla pallets transaccional
CREATE TABLE `pallets` (
  `id` varchar(30) NOT NULL,
  `tipo_registro` enum('Descartes', 'Reparación Interna', 'Reparación Externa', 'Ingreso de Nuevos', 'Entrega Interna', 'Entrega Externa') NOT NULL,
  `cantidad` int NOT NULL,
  `destino` varchar(100) DEFAULT NULL,
  `remito` varchar(30) DEFAULT NULL,
  `proveedor` varchar(100) DEFAULT NULL,
  `planta` varchar(100) DEFAULT NULL,
  `sector` varchar(100) DEFAULT NULL,
  `operario_entrega` varchar(150) DEFAULT NULL,
  `operario_recibe` varchar(150) DEFAULT NULL,
  `estado` varchar(30) DEFAULT NULL,
  `fecha_devolucion` datetime DEFAULT NULL,
  `usuario_devolucion` varchar(100) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
  `usuario` varchar(100) DEFAULT '',
  `ediciones` int NOT NULL DEFAULT 0,
  `usuario_edicion` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pallets_tipo_registro` (`tipo_registro`),
  KEY `idx_pallets_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. Crear los nuevos triggers de auditoría para pallets
DELIMITER $$

CREATE TRIGGER `trg_pallets_ins` AFTER INSERT ON `pallets` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('pallets', NEW.id, NEW.usuario, COALESCE(NEW.operario_entrega, NEW.operario_recibe, ''), 'create', CONCAT('Registro de pallets: ', NEW.tipo_registro), 'Movimiento de Pallets');
END$$

CREATE TRIGGER `trg_pallets_upd` AFTER UPDATE ON `pallets` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('pallets', NEW.id, NEW.usuario, COALESCE(NEW.operario_entrega, NEW.operario_recibe, ''), 'update', CONCAT('Actualización de pallets: ', NEW.tipo_registro), 'Movimiento de Pallets');
END$$

CREATE TRIGGER `trg_pallets_del` AFTER DELETE ON `pallets` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('pallets', OLD.id, OLD.usuario, COALESCE(OLD.operario_entrega, OLD.operario_recibe, ''), 'delete', CONCAT('Eliminación de pallets: ', OLD.tipo_registro), 'Movimiento de Pallets');
END$$

DELIMITER ;

SELECT 'Migración de la tabla pallets y triggers completada exitosamente.' AS resultado;
