-- ====================================================================
-- SHIGMA - Script de Reinicio de Registros Transaccionales
-- Preserva: Usuarios, Permisos, Operadores, Lugares, Sectores, Áreas y Bateas.
-- Reinicia: Formularios, Registros de Residuos, Movimientos, Salidas y Auditoría.
-- ====================================================================

-- 1. Desactivar temporalmente la verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------------------
-- A. Vaciado de Registros de Formularios y Movimientos
-- --------------------------------------------------------------------

-- Residuos Industriales No Especiales (RINE / Comunes / Orgánicos / Inorgánicos)
TRUNCATE TABLE `residuos_comunes`;

-- Residuos Peligrosos / Especiales
TRUNCATE TABLE `residuos_especiales`;

-- Devoluciones y Mermas
TRUNCATE TABLE `devoluciones`;

-- Tratamientos de Residuos
TRUNCATE TABLE `tratamientos`;

-- Registros de Economía Circular y Huella de Carbono
TRUNCATE TABLE `economia_circular`;

-- Movimientos y Control de Pallets (Descartes, Reparaciones, Recepciones, Entregas)
TRUNCATE TABLE `pallets`;

-- Tareas y Mantenimiento de Espacios Verdes
TRUNCATE TABLE `espacios_verdes`;

-- --------------------------------------------------------------------
-- B. Vaciado de Salidas, Despachos y Manifiestos
-- --------------------------------------------------------------------

-- Salidas / Manifiestos de Vaciado de Bateas
TRUNCATE TABLE `bateas_salidas`;

-- Salidas / Despachos del Depósito de Recuperables
TRUNCATE TABLE `depositos_salidas`;

-- --------------------------------------------------------------------
-- C. Vaciado de Bitácora y Auditoría
-- --------------------------------------------------------------------

-- Registro histórico de auditoría de eventos
TRUNCATE TABLE `auditoria`;

-- 2. Reactivar la verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- FIN DEL SCRIPT
-- ====================================================================
