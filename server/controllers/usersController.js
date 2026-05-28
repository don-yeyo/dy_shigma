const pool = require('../config/db');

// Lista canónica de módulos disponibles en el sistema
const MODULOS_DISPONIBLES = [
    'residuos-comunes',
    'gestion-bateas',
    'residuos-especiales',
    'devoluciones',
    'tratamiento',
    'economia-circular',
    'pallets',
    'espacios-verdes',
    'historial',
    'gestion-operadores'
];

/**
 * GET /api/users
 * Lista todos los usuarios con sus módulos.
 * Solo sysadmin.
 */
const getUsuarios = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                u.id, u.email, u.nombre, u.rol, u.activo,
                u.created_at, u.created_by,
                GROUP_CONCAT(um.modulo ORDER BY um.modulo SEPARATOR ',') AS modulos_str
             FROM usuarios u
             LEFT JOIN usuarios_modulos um ON um.usuario_id = u.id
             GROUP BY u.id
             ORDER BY FIELD(u.rol, 'sysadmin', 'supervisor', 'registrador'), u.nombre`
        );

        const usuarios = rows.map(u => ({
            id: u.id,
            email: u.email,
            nombre: u.nombre,
            rol: u.rol,
            activo: Boolean(u.activo),
            created_at: u.created_at,
            created_by: u.created_by,
            modulos: u.modulos_str ? u.modulos_str.split(',') : []
        }));

        res.json({ usuarios, modulos_disponibles: MODULOS_DISPONIBLES });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.warn('[getUsuarios] Tabla usuarios no existe — retornando lista vacía (modo bootstrap).');
            return res.json({ usuarios: [], modulos_disponibles: MODULOS_DISPONIBLES });
        }
        console.error('[getUsuarios]', error.message);
        res.status(500).json({ error: 'Error al obtener usuarios.' });
    }
};

/**
 * GET /api/users/:id
 * Detalle de un usuario con sus módulos.
 * Solo sysadmin.
 */
const getUsuarioById = async (req, res) => {
    const { id } = req.params;
    try {
        const [[user]] = await pool.query(
            'SELECT id, email, nombre, rol, activo, created_at, created_by FROM usuarios WHERE id = ?',
            [id]
        );
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

        const [modulos] = await pool.query(
            'SELECT modulo FROM usuarios_modulos WHERE usuario_id = ? ORDER BY modulo',
            [id]
        );

        res.json({
            ...user,
            activo: Boolean(user.activo),
            modulos: modulos.map(m => m.modulo)
        });
    } catch (error) {
        console.error('[getUsuarioById]', error.message);
        res.status(500).json({ error: 'Error al obtener el usuario.' });
    }
};

/**
 * POST /api/users
 * Crear un nuevo usuario con sus módulos.
 * Solo sysadmin.
 */
const createUsuario = async (req, res) => {
    const { email, nombre, rol, modulos = [] } = req.body;

    if (!email || !nombre || !rol) {
        return res.status(400).json({ error: 'email, nombre y rol son requeridos.' });
    }
    if (!['sysadmin', 'supervisor', 'registrador'].includes(rol)) {
        return res.status(400).json({ error: 'Rol inválido.' });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [result] = await conn.query(
            'INSERT INTO usuarios (email, nombre, rol, activo, created_by) VALUES (?, ?, ?, 1, ?)',
            [email.toLowerCase().trim(), nombre.trim(), rol, req.currentUser.email]
        );
        const newId = result.insertId;

        if (modulos.length > 0) {
            const values = modulos.map(m => [newId, m]);
            await conn.query('INSERT INTO usuarios_modulos (usuario_id, modulo) VALUES ?', [values]);
        }

        await conn.commit();
        res.status(201).json({ id: newId, message: 'Usuario creado exitosamente.' });
    } catch (error) {
        await conn.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Ya existe un usuario con ese email.' });
        }
        console.error('[createUsuario]', error.message);
        res.status(500).json({ error: 'Error al crear el usuario.' });
    } finally {
        conn.release();
    }
};

/**
 * PUT /api/users/:id
 * Editar un usuario (nombre, rol, activo).
 * Solo sysadmin.
 */
const updateUsuario = async (req, res) => {
    const { id } = req.params;
    const { nombre, rol, activo } = req.body;

    const fields = [];
    const values = [];

    if (nombre !== undefined) { fields.push('nombre = ?'); values.push(nombre.trim()); }
    if (rol !== undefined) {
        if (!['sysadmin', 'supervisor', 'registrador'].includes(rol)) {
            return res.status(400).json({ error: 'Rol inválido.' });
        }
        fields.push('rol = ?'); values.push(rol);
    }
    if (activo !== undefined) { fields.push('activo = ?'); values.push(activo ? 1 : 0); }

    if (fields.length === 0) {
        return res.status(400).json({ error: 'No hay campos para actualizar.' });
    }

    values.push(id);
    try {
        const [result] = await pool.query(
            `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        res.json({ message: 'Usuario actualizado.' });
    } catch (error) {
        console.error('[updateUsuario]', error.message);
        res.status(500).json({ error: 'Error al actualizar el usuario.' });
    }
};

/**
 * DELETE /api/users/:id  (soft delete — desactiva el usuario)
 * Solo sysadmin. No puede desactivarse a sí mismo.
 */
const deleteUsuario = async (req, res) => {
    const { id } = req.params;

    if (req.currentUser.id && String(req.currentUser.id) === String(id)) {
        return res.status(400).json({ error: 'No podés desactivar tu propia cuenta.' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE usuarios SET activo = 0 WHERE id = ?',
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        res.json({ message: 'Usuario desactivado.' });
    } catch (error) {
        console.error('[deleteUsuario]', error.message);
        res.status(500).json({ error: 'Error al desactivar el usuario.' });
    }
};

/**
 * PUT /api/users/:id/modulos
 * Reemplaza los módulos asignados a un usuario.
 * Solo sysadmin.
 */
const updateModulos = async (req, res) => {
    const { id } = req.params;
    const { modulos = [] } = req.body;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query('DELETE FROM usuarios_modulos WHERE usuario_id = ?', [id]);
        if (modulos.length > 0) {
            const values = modulos.map(m => [id, m]);
            await conn.query('INSERT INTO usuarios_modulos (usuario_id, modulo) VALUES ?', [values]);
        }
        await conn.commit();
        res.json({ message: 'Módulos actualizados.', modulos });
    } catch (error) {
        await conn.rollback();
        console.error('[updateModulos]', error.message);
        res.status(500).json({ error: 'Error al actualizar módulos.' });
    } finally {
        conn.release();
    }
};

module.exports = {
    getUsuarios,
    getUsuarioById,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    updateModulos,
    MODULOS_DISPONIBLES
};
