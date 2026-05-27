const express = require('express');
const router = express.Router();
const shigmaController = require('../controllers/shigmaController');

// Obtener todas las estadísticas agrupadas para el dashboard
router.get('/stats', shigmaController.getDashboardStats);

// Obtener todos los registros combinados para auditoría / historial
router.get('/records', shigmaController.getAllRecords);

// Obtener registros de un formulario específico
router.get('/records/:formType', shigmaController.getRecordsByForm);

// Crear un registro en un formulario específico
router.post('/records/:formType', shigmaController.createRecord);

module.exports = router;
