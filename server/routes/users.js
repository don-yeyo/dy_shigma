const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/auth');
const {
    getUsuarios,
    getUsuarioById,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    updateModulos
} = require('../controllers/usersController');

// Todas las rutas de usuarios son exclusivas para sysadmin
const onlySysadmin = requireRole('sysadmin');

router.get('/',            onlySysadmin, getUsuarios);
router.get('/:id',         onlySysadmin, getUsuarioById);
router.post('/',           onlySysadmin, createUsuario);
router.put('/:id',         onlySysadmin, updateUsuario);
router.delete('/:id',      onlySysadmin, deleteUsuario);
router.put('/:id/modulos', onlySysadmin, updateModulos);

module.exports = router;
