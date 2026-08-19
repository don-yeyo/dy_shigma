-- ============================================================
-- SHIGMA MÓDULO DE SEGURIDAD, HIGIENE Y MEDIOAMBIENTE
-- Script de Migración: Creación de tabla areas y modificación de residuos_comunes
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Asegurarnos que el sector "Panificados" exista para la planta Pellegrini (id_lugar = 3)
INSERT INTO `sectores` (`nombre`, `id_lugar`)
SELECT 'Panificados', 3
WHERE NOT EXISTS (
    SELECT 1 FROM `sectores` WHERE `nombre` = 'Panificados' AND `id_lugar` = 3
);

-- 2. Creación de la tabla areas
CREATE TABLE IF NOT EXISTS `areas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `id_sector` int NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_areas_sector` FOREIGN KEY (`id_sector`) 
    REFERENCES `sectores` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. Inserción de las áreas para el sector "Panificados" de Pellegrini
-- Buscamos el ID del sector recién insertado/existente
SET @sector_panificados_id = (SELECT `id` FROM `sectores` WHERE `nombre` = 'Panificados' AND `id_lugar` = 3 LIMIT 1);

INSERT INTO `areas` (`nombre`, `id_sector`)
SELECT 'Expedición', @sector_panificados_id
WHERE NOT EXISTS (SELECT 1 FROM `areas` WHERE `nombre` = 'Expedición' AND `id_sector` = @sector_panificados_id);

INSERT INTO `areas` (`nombre`, `id_sector`)
SELECT 'Materia Prima', @sector_panificados_id
WHERE NOT EXISTS (SELECT 1 FROM `areas` WHERE `nombre` = 'Materia Prima' AND `id_sector` = @sector_panificados_id);

INSERT INTO `areas` (`nombre`, `id_sector`)
SELECT 'Producción', @sector_panificados_id
WHERE NOT EXISTS (SELECT 1 FROM `areas` WHERE `nombre` = 'Producción' AND `id_sector` = @sector_panificados_id);

INSERT INTO `areas` (`nombre`, `id_sector`)
SELECT 'Sanidad', @sector_panificados_id
WHERE NOT EXISTS (SELECT 1 FROM `areas` WHERE `nombre` = 'Sanidad' AND `id_sector` = @sector_panificados_id);

-- 4. Modificación de la tabla residuos_comunes (RINE)
-- Agregamos la columna area_id si no existe
DELIMITER $$
CREATE PROCEDURE add_area_id_if_not_exists()
BEGIN
  IF NOT EXISTS (
      SELECT * FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'residuos_comunes' 
        AND COLUMN_NAME = 'area_id'
  ) THEN
      ALTER TABLE `residuos_comunes` ADD COLUMN `area_id` int DEFAULT NULL;
      ALTER TABLE `residuos_comunes` ADD CONSTRAINT `fk_residuos_comunes_area` 
        FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$
DELIMITER ;

CALL add_area_id_if_not_exists();
DROP PROCEDURE add_area_id_if_not_exists;

SET FOREIGN_KEY_CHECKS = 1;
