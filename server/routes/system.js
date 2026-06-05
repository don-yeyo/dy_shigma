const express = require('express');
const router = express.Router();
const { getVersion, validateEmail, getDbStatus } = require('../controllers/systemController');

router.get('/version', getVersion);
router.get('/validate-email', validateEmail);
router.get('/db-status', getDbStatus);

module.exports = router;

