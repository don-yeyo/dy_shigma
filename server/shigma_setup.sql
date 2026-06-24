-- ============================================================
-- SHIGMA MÓDULO DE SEGURIDAD, HIGIENE Y MEDIOAMBIENTE
-- Script de Creación de Tablas y Triggers de Auditoría Automatizada (MySQL 8 / RDS)
-- Convención de Nombramiento: Colecciones en Plural, Todo en Minúsculas y Snake Case.
-- Tabla Singular Especial: auditoria (Con soporte alfanumérico para idEntidad)
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 0. Tabla Singular Especial: auditoria (Estructura Provista con Ajuste de idEntidad)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `auditoria` (
  `id` int NOT NULL AUTO_INCREMENT,
  `entidad` varchar(30) NOT NULL,
  `idEntidad` varchar(50) NOT NULL, -- Modificado de INT a VARCHAR(50) para soportar códigos alfanuméricos (ej: SHG-RC-0001)
  `usuario` varchar(60) NOT NULL,
  `operador` varchar(30) DEFAULT '',
  `fechaHora` datetime DEFAULT CURRENT_TIMESTAMP(),
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
  `nro_certificado` varchar(30) DEFAULT NULL, -- Número de certificado al confirmar
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
  `usuario` varchar(100) DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `idx_bateas_salidas_batea` (`batea_id`),
  KEY `idx_bateas_salidas_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- 1b. Tabla de Salidas de Depósito (Despachos de Recuperables)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `depositos_salidas` (
  `id` varchar(30) NOT NULL,
  `material` varchar(100) NOT NULL,
  `proveedor` varchar(255) NOT NULL,
  `fecha` varchar(15) NOT NULL,
  `hora` varchar(15) NOT NULL,
  `nro_manifiesto` varchar(100) DEFAULT NULL, -- NO OBLIGATORIO
  `peso_balanza` decimal(10, 2) NOT NULL,
  `peso_acumulado` decimal(10, 2) NOT NULL,
  `record_ids` json NOT NULL, -- Lista estructurada de IDs vinculados
  `status` varchar(30) DEFAULT 'pendiente',
  `nro_certificado` varchar(30) DEFAULT NULL, -- NO OBLIGATORIO
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
  `usuario` varchar(100) DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `idx_depositos_salidas_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- 2. Tabla de Residuos Industriales No Especiales (RINE / Comunes)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `residuos_comunes` (
  `id` varchar(30) NOT NULL,
  `lugar_id` int NOT NULL,
  `sector_id` int DEFAULT NULL,
  `tipo_residuo` varchar(100) NOT NULL,
  `peso` decimal(10, 2) NOT NULL,
  `destino` varchar(150) NOT NULL,
  `responsable` varchar(100) DEFAULT '',
  `observaciones` text NULL,
  `clasificacion_inorganico` varchar(50) DEFAULT 'Irrecuperables',
  `subcategoria_inorganico` varchar(50) DEFAULT NULL, -- Húmedo o Seco para Elguea Roman
  `materiales_recuperados` json NULL, -- Diccionario de cantidades y unidades
  `batea_salida_id` varchar(30) NULL,  -- Vinculación a salida de batea
  `deposito_salida_id` varchar(30) NULL,  -- Vinculación a salida de depósito
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
  `usuario` varchar(100) DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `idx_residuos_comunes_lugar` (`lugar_id`),
  KEY `idx_residuos_comunes_sector` (`sector_id`),
  KEY `idx_residuos_comunes_tipo` (`tipo_residuo`),
  KEY `idx_residuos_comunes_destino` (`destino`),
  KEY `idx_residuos_comunes_created` (`created_at` DESC),
  CONSTRAINT `fk_residuos_comunes_batea_salida` FOREIGN KEY (`batea_salida_id`) 
    REFERENCES `bateas_salidas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_residuos_comunes_deposito_salida` FOREIGN KEY (`deposito_salida_id`) 
    REFERENCES `depositos_salidas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_residuos_comunes_lugar` FOREIGN KEY (`lugar_id`) 
    REFERENCES `lugares` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_residuos_comunes_sector` FOREIGN KEY (`sector_id`) 
    REFERENCES `sectores` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
  `usuario` varchar(100) DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `idx_residuos_especiales_tipo` (`tipo_residuo_especial`),
  KEY `idx_residuos_especiales_categoria` (`categoria_peligro`),
  KEY `idx_residuos_especiales_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. Tabla de Devoluciones
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `devoluciones` (
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
  `operador` varchar(100) DEFAULT '',
  `observaciones` text NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
  `usuario` varchar(100) DEFAULT '',
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
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
  `usuario` varchar(100) DEFAULT '',
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
  `responsable` varchar(100) DEFAULT '',
  `observaciones` text NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
  `usuario` varchar(100) DEFAULT '',
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
  `responsable` varchar(100) DEFAULT '',
  `observaciones` text NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
  `usuario` varchar(100) DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `idx_espacios_verdes_nombre` (`espacio_verde`),
  KEY `idx_espacios_verdes_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- 8b. Tabla de Lugares (Planta Generadora)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lugares` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Semillas por defecto para Lugares
INSERT INTO `lugares` (`id`, `nombre`) VALUES
  (1, 'Elguea Roman'),
  (2, 'Hipólito Yrigoyen'),
  (3, 'Pellegrini')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- ------------------------------------------------------------
-- 8c. Tabla de Sectores
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sectores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `id_lugar` int NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_sectores_lugar` FOREIGN KEY (`id_lugar`) 
    REFERENCES `lugares` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Semillas por defecto para Sectores
INSERT INTO `sectores` (`nombre`, `id_lugar`) VALUES
  -- Elguea Roman (id: 1)
  ('Producción ER', 1),
  ('Depósito ER', 1),
  ('Mantenimiento ER', 1),
  -- Hipólito Yrigoyen (id: 2)
  ('Producción HY', 2),
  ('Administración HY', 2),
  ('Logística HY', 2),
  -- Pellegrini (id: 3)
  ('Producción PE', 3),
  ('Calidad PE', 3),
  ('Espacios Verdes PE', 3)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- ------------------------------------------------------------
-- 9. Tabla de Operadores (Plural, Minúsculas y Snake Case)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `operadores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `apellido_nombre` varchar(150) NOT NULL,
  `legajo` varchar(50) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_operadores_legajo` (`legajo`),
  KEY `idx_operadores_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- 10. Tabla de Asignaciones de Operadores a Formularios
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `operadores_formularios` (
  `operador_id` int NOT NULL,
  `formulario_tipo` varchar(50) NOT NULL,
  PRIMARY KEY (`operador_id`, `formulario_tipo`),
  KEY `idx_operadores_formularios_tipo` (`formulario_tipo`),
  CONSTRAINT `fk_operadores_formularios_operador` FOREIGN KEY (`operador_id`) 
    REFERENCES `operadores` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- 11. Semillas de Prueba de Operadores y Asignaciones
-- ------------------------------------------------------------
INSERT INTO `operadores` (`apellido_nombre`, `legajo`, `activo`) VALUES
  ('Perez Juan', 'LEG-001', 1),
  ('Alvarez Pedro', 'LEG-002', 1),
  ('Garcia Clara', 'LEG-003', 1),
  ('Fernandez Claudio', 'LEG-004', 1),
  ('Diaz Maria', 'LEG-005', 1)
ON DUPLICATE KEY UPDATE `activo` = 1;

INSERT INTO `operadores_formularios` (`operador_id`, `formulario_tipo`) VALUES
  (1, 'residuos-comunes'),     -- Perez Juan a RINE
  (2, 'residuos-comunes'),     -- Alvarez Pedro a RINE
  (2, 'residuos-especiales'),  -- Alvarez Pedro a Especiales
  (3, 'residuos-especiales'),  -- Garcia Clara a Especiales
  (4, 'residuos-especiales')   -- Fernandez Claudio a Especiales
ON DUPLICATE KEY UPDATE `operador_id` = VALUES(`operador_id`);

-- ------------------------------------------------------------
-- 11b. Tabla de Usuarios del Sistema (Roles y Permisos)
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
-- 12. Tabla de Módulos Habilitados por Usuario
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios_modulos` (
  `usuario_id`  INT NOT NULL,
  `modulo`      VARCHAR(80) NOT NULL,
  PRIMARY KEY (`usuario_id`, `modulo`),
  KEY `idx_usuarios_modulos_modulo` (`modulo`),
  CONSTRAINT `fk_um_usuario` FOREIGN KEY (`usuario_id`)
    REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
-- DEFINICIÓN DE TRIGGERS DE AUDITORÍA AUTOMATIZADA
-- ============================================================

DELIMITER $$

-- ------------------------------------------------------------
-- Triggers: residuos_comunes
-- ------------------------------------------------------------
CREATE TRIGGER `trg_residuos_comunes_ins` AFTER INSERT ON `residuos_comunes` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('residuos_comunes', NEW.id, NEW.usuario, NEW.responsable, 'create', 'Nuevo residuo no especial (RINE) registrado', 'Residuos No Especiales (RINE)');
END$$

CREATE TRIGGER `trg_residuos_comunes_upd` AFTER UPDATE ON `residuos_comunes` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('residuos_comunes', NEW.id, NEW.usuario, NEW.responsable, 'update', 'Actualización de datos del lote de RINE', 'Residuos No Especiales (RINE)');
END$$

CREATE TRIGGER `trg_residuos_comunes_del` AFTER DELETE ON `residuos_comunes` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('residuos_comunes', OLD.id, OLD.usuario, OLD.responsable, 'delete', 'Eliminación del registro de RINE', 'Residuos No Especiales (RINE)');
END$$

-- ------------------------------------------------------------
-- Triggers: residuos_especiales
-- ------------------------------------------------------------
CREATE TRIGGER `trg_residuos_especiales_ins` AFTER INSERT ON `residuos_especiales` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('residuos_especiales', NEW.id, NEW.usuario, NEW.sector_origen, 'create', 'Nuevo descarte especial registrado', 'Residuos Especiales');
END$$

CREATE TRIGGER `trg_residuos_especiales_upd` AFTER UPDATE ON `residuos_especiales` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('residuos_especiales', NEW.id, NEW.usuario, NEW.sector_origen, 'update', 'Actualización de residuo especial', 'Residuos Especiales');
END$$

CREATE TRIGGER `trg_residuos_especiales_del` AFTER DELETE ON `residuos_especiales` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('residuos_especiales', OLD.id, OLD.usuario, OLD.sector_origen, 'delete', 'Eliminación de residuo especial', 'Residuos Especiales');
END$$

-- ------------------------------------------------------------
-- Triggers: devoluciones
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Triggers: tratamientos
-- ------------------------------------------------------------
CREATE TRIGGER `trg_tratamientos_ins` AFTER INSERT ON `tratamientos` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('tratamientos', NEW.id, NEW.usuario, NEW.operador, 'create', 'Nuevo proceso de valorización en planta registrado', 'Tratamiento de Residuos');
END$$

CREATE TRIGGER `trg_tratamientos_upd` AFTER UPDATE ON `tratamientos` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('tratamientos', NEW.id, NEW.usuario, NEW.operador, 'update', 'Actualización de datos de tratamiento físico', 'Tratamiento de Residuos');
END$$

CREATE TRIGGER `trg_tratamientos_del` AFTER DELETE ON `tratamientos` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('tratamientos', OLD.id, OLD.usuario, OLD.operador, 'delete', 'Eliminación del registro de tratamiento', 'Tratamiento de Residuos');
END$$

-- ------------------------------------------------------------
-- Triggers: economia_circular
-- ------------------------------------------------------------
CREATE TRIGGER `trg_economia_circular_ins` AFTER INSERT ON `economia_circular` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('economia_circular', NEW.id, NEW.usuario, NEW.destino_reinsercion, 'create', 'Nueva valorización y reinserción circular de material', 'Economía Circular');
END$$

CREATE TRIGGER `trg_economia_circular_upd` AFTER UPDATE ON `economia_circular` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('economia_circular', NEW.id, NEW.usuario, NEW.destino_reinsercion, 'update', 'Actualización de registro de reinserción circular', 'Economía Circular');
END$$

CREATE TRIGGER `trg_economia_circular_del` AFTER DELETE ON `economia_circular` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('economia_circular', OLD.id, OLD.usuario, OLD.destino_reinsercion, 'delete', 'Eliminación de revalorización de economía circular', 'Economía Circular');
END$$

-- ------------------------------------------------------------
-- Triggers: pallets
-- ------------------------------------------------------------
CREATE TRIGGER `trg_pallets_ins` AFTER INSERT ON `pallets` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('pallets', NEW.id, NEW.usuario, NEW.responsable, 'create', 'Nuevo control de ingreso y reparación de pallets', 'Movimiento de Pallets');
END$$

CREATE TRIGGER `trg_pallets_upd` AFTER UPDATE ON `pallets` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('pallets', NEW.id, NEW.usuario, NEW.responsable, 'update', 'Modificación de stock y reparación de pallets', 'Movimiento de Pallets');
END$$

CREATE TRIGGER `trg_pallets_del` AFTER DELETE ON `pallets` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('pallets', OLD.id, OLD.usuario, OLD.responsable, 'delete', 'Eliminación de registro de movimiento de pallets', 'Movimiento de Pallets');
END$$

-- ------------------------------------------------------------
-- Triggers: espacios_verdes
-- ------------------------------------------------------------
CREATE TRIGGER `trg_espacios_verdes_ins` AFTER INSERT ON `espacios_verdes` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('espacios_verdes', NEW.id, NEW.usuario, NEW.responsable_tarea, 'create', 'Nueva tarea ambiental y riego botánico registrado', 'Registro de Espacios Verdes');
END$$

CREATE TRIGGER `trg_espacios_verdes_upd` AFTER UPDATE ON `espacios_verdes` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('espacios_verdes', NEW.id, NEW.usuario, NEW.responsable_tarea, 'update', 'Modificación de tarea ambiental en espacio verde', 'Registro de Espacios Verdes');
END$$

CREATE TRIGGER `trg_espacios_verdes_del` AFTER DELETE ON `espacios_verdes` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('espacios_verdes', OLD.id, OLD.usuario, OLD.responsable_tarea, 'delete', 'Eliminación del registro forestal / espacio verde', 'Registro de Espacios Verdes');
END$$

-- ------------------------------------------------------------
-- Triggers: bateas_salidas
-- ------------------------------------------------------------
CREATE TRIGGER `trg_bateas_salidas_ins` AFTER INSERT ON `bateas_salidas` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('bateas_salidas', NEW.id, NEW.usuario, NEW.batea_nombre, 'create', 'Vaciado de batea y manifiesto de transporte generado', 'Gestión de Bateas');
END$$

CREATE TRIGGER `trg_bateas_salidas_upd` AFTER UPDATE ON `bateas_salidas` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('bateas_salidas', NEW.id, NEW.usuario, NEW.batea_nombre, 'update', 'Actualización de estado de manifiesto de batea', 'Gestión de Bateas');
END$$

CREATE TRIGGER `trg_bateas_salidas_del` AFTER DELETE ON `bateas_salidas` FOR EACH ROW
BEGIN
  INSERT INTO auditoria (entidad, idEntidad, usuario, operador, operacion, evento, modulo)
  VALUES ('bateas_salidas', OLD.id, OLD.usuario, OLD.batea_nombre, 'delete', 'Eliminación del manifiesto de vaciado de batea', 'Gestión de Bateas');
END$$

DELIMITER ;

-- ------------------------------------------------------------
-- 13. Tabla de Configuración de Bateas RINE (Dinámica)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bateas` (
  `id` varchar(50) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `capacidad` decimal(10, 2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Semillas por defecto para Bateas
INSERT INTO `bateas` (`id`, `nombre`, `tipo`, `capacidad`) VALUES
  ('batea_1_org', 'Batea 1 de Orgánicos', 'Orgánicos', 1000.00),
  ('batea_2_org', 'Batea 2 de Orgánicos', 'Orgánicos', 1200.00),
  ('batea_1_inorg', 'Batea 1 de Inorgánicos', 'Inorgánicos', 2000.00),
  ('batea_2_inorg', 'Batea 2 de Inorgánicos', 'Inorgánicos', 2500.00)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`), `tipo` = VALUES(`tipo`);

