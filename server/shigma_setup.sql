-- ============================================================
-- SHIGMA MÓDULO DE SEGURIDAD, HIGIENE Y MEDIOAMBIENTE
-- Script de Creación y Configuración de Tablas (MySQL 8 / RDS)
-- Convención de Nombramiento: Colecciones en Plural, Todo en Minúsculas y Snake Case.
-- Tabla Singular Especial: auditoria
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 0. Tabla Singular Especial: auditoria (Estructura Provista)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `auditoria` (
  `id` int NOT NULL AUTO_INCREMENT,
  `entidad` varchar(30) NOT NULL,
  `idEntidad` int NOT NULL,
  `usuario` varchar(60) NOT NULL,
  `vigilador` varchar(30) DEFAULT '',
  `fechaHora` datetime DEFAULT CURRENT_TIMESTAMP,
  `operacion` enum('create','delete','update','access') NOT NULL,
  `evento` varchar(255) NOT NULL,
  `modulo` varchar(50) DEFAULT NULL,
  `query` text,
  PRIMARY KEY (`id`),
  KEY `idx_auditoria_entidad` (`entidad`),
  KEY `idx_auditoria_fecha` (`fechaHora` DESC)
) ENGINE=InnoDB AUTO_INCREMENT=9036 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- 1. Tabla de Salidas de Batea (Manifiestos de Vaciado)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bateas_salidas` (
  `id` varchar(30) NOT NULL,
  `batea_id` varchar(50) NOT NULL,
  `batea_nombre` varchar(100) NOT NULL,
  `fecha` varchar(15) NOT NULL,
  `hora` varchar(15) NOT NULL,
  `nro_manifiesto` varchar(100) NOT NULL,
  `peso_balanza` decimal(10, 2) NOT NULL,
  `peso_acumulado` decimal(10, 2) NOT NULL,
  `record_ids` json NOT NULL, -- Lista estructurada de IDs vinculados
  `status` varchar(30) DEFAULT 'pendiente',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `usuario` varchar(100) DEFAULT 'Gabriel Tonelli',
  PRIMARY KEY (`id`),
  KEY `idx_bateas_salidas_batea` (`batea_id`),
  KEY `idx_bateas_salidas_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- 2. Tabla de Residuos Industriales No Especiales (RINE / Comunes)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `residuos_comunes` (
  `id` varchar(30) NOT NULL,
  `sector` varchar(100) NOT NULL,
  `tipo_residuo` varchar(100) NOT NULL,
  `peso` decimal(10, 2) NOT NULL,
  `destino` varchar(150) NOT NULL,
  `responsable` varchar(100) DEFAULT 'Gabriel Tonelli',
  `observaciones` text NULL,
  `clasificacion_inorganico` varchar(50) DEFAULT 'Irrecuperables',
  `materiales_recuperados` json NULL, -- Diccionario de cantidades y unidades
  `batea_salida_id` varchar(30) NULL,  -- Vinculación a salida de batea
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `usuario` varchar(100) DEFAULT 'Gabriel Tonelli',
  PRIMARY KEY (`id`),
  KEY `idx_residuos_comunes_sector` (`sector`),
  KEY `idx_residuos_comunes_tipo` (`tipo_residuo`),
  KEY `idx_residuos_comunes_destino` (`destino`),
  KEY `idx_residuos_comunes_created` (`created_at` DESC),
  CONSTRAINT `fk_residuos_comunes_batea_salida` FOREIGN KEY (`batea_salida_id`) 
    REFERENCES `bateas_salidas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- 3. Tabla de Residuos Especiales
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `residuos_especiales` (
  `id` varchar(30) NOT NULL,
  `tipo_residuo_especial` varchar(150) NOT NULL,
  `categoria_peligro` varchar(50) NOT NULL,
  `cantidad` decimal(10, 2) NOT NULL,
  `unidad` varchar(20) NOT NULL,
  `sector_origen` varchar(100) NOT NULL,
  `tipo_envase` varchar(100) NULL,
  `certificado_acopio` varchar(100) NULL,
  `observaciones` text NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `usuario` varchar(100) DEFAULT 'Gabriel Tonelli',
  PRIMARY KEY (`id`),
  KEY `idx_residuos_especiales_tipo` (`tipo_residuo_especial`),
  KEY `idx_residuos_especiales_categoria` (`categoria_peligro`),
  KEY `idx_residuos_especiales_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- 4. Tabla de Clasificación de Devoluciones
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `devoluciones` (
  `id` varchar(30) NOT NULL,
  `cliente_origen` varchar(150) NOT NULL,
  `producto_devuelto` varchar(200) NOT NULL,
  `cantidad_bultos` int NOT NULL,
  `peso_estimado` decimal(10, 2) DEFAULT 0.00,
  `motivo_devolucion` varchar(150) NOT NULL,
  `inspeccion_calidad` varchar(150) NOT NULL,
  `disposicion_final` varchar(150) NOT NULL,
  `responsable` varchar(100) DEFAULT 'Gabriel Tonelli',
  `observaciones` text NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `usuario` varchar(100) DEFAULT 'Gabriel Tonelli',
  PRIMARY KEY (`id`),
  KEY `idx_devoluciones_cliente` (`cliente_origen`),
  KEY `idx_devoluciones_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- 5. Tabla de Tratamientos de Residuos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tratamientos` (
  `id` varchar(30) NOT NULL,
  `proceso_tratamiento` varchar(150) NOT NULL,
  `material_entrada` varchar(150) NOT NULL,
  `cantidad_procesada` decimal(10, 2) NOT NULL,
  `maquina_utilizada` varchar(150) NOT NULL,
  `subproducto_obtenido` varchar(150) NOT NULL,
  `operador` varchar(100) DEFAULT 'Gabriel Tonelli',
  `observaciones` text NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `usuario` varchar(100) DEFAULT 'Gabriel Tonelli',
  PRIMARY KEY (`id`),
  KEY `idx_tratamientos_proceso` (`proceso_tratamiento`),
  KEY `idx_tratamientos_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- 6. Tabla de Economía Circular
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `economia_circular` (
  `id` varchar(30) NOT NULL,
  `material_revalorizado` varchar(200) NOT NULL,
  `cantidad` decimal(10, 2) NOT NULL,
  `unidad` varchar(20) NOT NULL,
  `destino_reinsercion` varchar(200) NOT NULL,
  `ahorro_estimado` decimal(12, 2) DEFAULT 0.00,
  `co2_evitado` decimal(10, 2) DEFAULT 0.00,
  `observaciones` text NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `usuario` varchar(100) DEFAULT 'Gabriel Tonelli',
  PRIMARY KEY (`id`),
  KEY `idx_economia_circular_material` (`material_revalorizado`),
  KEY `idx_economia_circular_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- 7. Tabla de Control de Pallets
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pallets` (
  `id` varchar(30) NOT NULL,
  `tipo_pallet` varchar(100) NOT NULL,
  `cantidad_ingresados` int NOT NULL,
  `cantidad_reparados` int NOT NULL,
  `cantidad_descartados` int NOT NULL,
  `cantidad_circular` int NOT NULL,
  `responsable_reparacion` varchar(150) NOT NULL,
  `responsable` varchar(100) DEFAULT 'Gabriel Tonelli',
  `observaciones` text NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `usuario` varchar(100) DEFAULT 'Gabriel Tonelli',
  PRIMARY KEY (`id`),
  KEY `idx_pallets_tipo` (`tipo_pallet`),
  KEY `idx_pallets_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- 8. Tabla de Registro de Espacios Verdes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `espacios_verdes` (
  `id` varchar(30) NOT NULL,
  `espacio_verde` varchar(150) NOT NULL,
  `tarea_realizada` varchar(150) NOT NULL,
  `consumo_agua` decimal(10, 2) NOT NULL,
  `plantas_agregadas` int DEFAULT 0,
  `especie_agregada` varchar(150) NULL,
  `estado_salud` varchar(150) NOT NULL,
  `responsable_tarea` varchar(150) NOT NULL,
  `responsable` varchar(100) DEFAULT 'Gabriel Tonelli',
  `observaciones` text NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `usuario` varchar(100) DEFAULT 'Gabriel Tonelli',
  PRIMARY KEY (`id`),
  KEY `idx_espacios_verdes_nombre` (`espacio_verde`),
  KEY `idx_espacios_verdes_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
