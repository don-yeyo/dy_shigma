-- ==============================================================================
-- SHIGMA — Migración: Actualización de la tabla `pallets`
-- Incorpora 'Recepción Externa' y 'Devolución a Proveedor' en el ENUM de `tipo_registro`
-- ==============================================================================

-- 1. Modificar la columna tipo_registro para incluir todos los movimientos vigentes
ALTER TABLE `pallets` 
MODIFY COLUMN `tipo_registro` ENUM(
  'Descartes',
  'Reparación Interna',
  'Reparación Externa',
  'Recepción Externa',
  'Ingreso de Nuevos',
  'Entrega Interna',
  'Entrega Externa',
  'Recepción Interna',
  'Devolución a Proveedor'
) NOT NULL;

-- 2. Verificar que las columnas complementarias de trazabilidad existan
-- (Ejecutar sólo si la base de datos proviene de una versión anterior)
-- ALTER TABLE `pallets` ADD COLUMN `remito_retorno` varchar(30) DEFAULT NULL AFTER `remito`;
-- ALTER TABLE `pallets` ADD COLUMN `categoria` varchar(50) DEFAULT NULL AFTER `cantidad`;
-- ALTER TABLE `pallets` ADD COLUMN `id_grupo` varchar(50) DEFAULT NULL AFTER `categoria`;

-- 3. Consulta de comprobación
SHOW FULL COLUMNS FROM `pallets` WHERE Field = 'tipo_registro';
