const express = require('express');
const router = express.Router();
const { regenerarCOT, previewCOT } = require('../controllers/cotController');

// Regenerar COT (enviar a ARBA)
router.post('/regenerar', regenerarCOT);

// Preview del archivo COT (sin enviar)
router.post('/preview', previewCOT);

module.exports = router;
