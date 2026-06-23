-- ============================================================
-- SHIGMA — Migración: Relación Usuarios-Operadores y Columna de Operador en RINE
-- Ejecutar sobre la base de datos de SHIGMA.
-- ============================================================

SET NAMES utf8mb4;

-- 1. Crear tabla de relación entre usuarios y operadores habilitados para ajustes
CREATE TABLE IF NOT EXISTS `usuarios_operadores` (
  `usuario_id` INT NOT NULL,
  `operador_id` INT NOT NULL,
  PRIMARY KEY (`usuario_id`, `operador_id`),
  CONSTRAINT `fk_uo_usuario` FOREIGN KEY (`usuario_id`)
    REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_uo_operador` FOREIGN KEY (`operador_id`)
    REFERENCES `operadores` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Asegurar columna operador en residuos_comunes
ALTER TABLE `residuos_comunes` ADD COLUMN `operador` VARCHAR(100) DEFAULT '';

SELECT 'Migración de usuarios_operadores completada exitosamente.' AS resultado;

