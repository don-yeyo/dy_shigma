-- ============================================================
-- SHIGMA — Migración: Sistema de Usuarios, Roles y Módulos
-- Ejecutar este script sobre una base de datos SHIGMA existente.
-- Es seguro: usa IF NOT EXISTS, no modifica tablas existentes.
-- ============================================================

SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- Tabla de Usuarios del Sistema
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id`          INT NOT NULL AUTO_INCREMENT,
  `email`       VARCHAR(150) NOT NULL,
  `nombre`      VARCHAR(150) NOT NULL,
  `rol`         ENUM('sysadmin','supervisor','registrador') NOT NULL DEFAULT 'registrador',
  `activo`      TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  `updated_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  `created_by`  VARCHAR(150) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuarios_email` (`email`),
  KEY `idx_usuarios_rol` (`rol`),
  KEY `idx_usuarios_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- Tabla de Módulos Habilitados por Usuario
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios_modulos` (
  `usuario_id`  INT NOT NULL,
  `modulo`      VARCHAR(80) NOT NULL,
  PRIMARY KEY (`usuario_id`, `modulo`),
  KEY `idx_usuarios_modulos_modulo` (`modulo`),
  CONSTRAINT `fk_um_usuario` FOREIGN KEY (`usuario_id`)
    REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- Verificación final
-- ------------------------------------------------------------
SELECT 'Migración completada: tablas usuarios y usuarios_modulos creadas.' AS resultado;
