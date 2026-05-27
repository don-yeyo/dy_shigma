const express = require('express');
const router = express.Router();
const { getVersion, validateEmail } = require('../controllers/systemController');

router.get('/version', getVersion);
router.get('/validate-email', validateEmail);

module.exports = router;
