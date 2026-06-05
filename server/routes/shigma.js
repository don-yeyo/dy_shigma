const express = require('express');
const router = express.Router();
const shigmaController = require('../controllers/shigmaController');
const { requireRole } = require('../middleware/auth');

// Requerir autenticación y poblar req.currentUser para todas las operaciones SHIGMA
router.use(requireRole());

// Obtener todas las estadísticas agrupadas para el dashboard
router.get('/stats', shigmaController.getDashboardStats);

// Obtener todos los registros combinados para auditoría / historial
router.get('/records', shigmaController.getAllRecords);

// Obtener registros de un formulario específico
router.get('/records/:formType', shigmaController.getRecordsByForm);

// Crear un registro en un formulario específico
router.post('/records/:formType', shigmaController.createRecord);

// Modificar un registro existente (con validaciones de permisos)
router.put('/records/:formType/:id', shigmaController.updateRecord);

// Eliminar un registro existente (con validaciones de permisos)
router.delete('/records/:formType/:id', shigmaController.deleteRecord);

// Obtener operadores asignados a un formulario específico
router.get('/operadores/:formType', shigmaController.getOperadoresByForm);

// Rutas de administración de operadores (CRUD)
router.get('/operadores', shigmaController.getAllOperadores);
router.post('/operadores', shigmaController.createOperador);
router.put('/operadores/:id', shigmaController.updateOperador);
router.delete('/operadores/:id', shigmaController.deleteOperador);

// Rutas de Bateas
router.get('/bateas', shigmaController.getBateasStatus);
router.post('/bateas/:bateaId/restart', shigmaController.restartBatea);
router.put('/bateas/:bateaId/capacity', shigmaController.updateBateaCapacity);
router.get('/bateas/salidas', shigmaController.getBateaSalidas);
router.post('/bateas/salidas/:salidaId/confirm', requireRole('sysadmin', 'supervisor'), shigmaController.confirmBateaSalida);

// Rutas de Lugares y Sectores
router.get('/lugares', shigmaController.getLugares);
router.get('/sectores', shigmaController.getSectores);


module.exports = router;
