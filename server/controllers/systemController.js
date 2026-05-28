const pool = require('../config/db');

/**
 * Devuelve la versión actual del backend.
 * GET /api/system/version
 */
const getVersion = (req, res) => {
    const pkg = require('../package.json');
    const clientVersion = req.query.v;

    const response = {
        serverVersion: pkg.version,
        needsUpdate: clientVersion ? pkg.version !== clientVersion : false
    };

    res.json(response);
};

/**
 * Valida si un email está autorizado y devuelve su rol y módulos asignados.
 * Primero busca en la tabla `usuarios` de la BD.
 * Si la tabla está vacía, hace fallback a ADMIN_EMAILS del .env (modo bootstrap).
 *
 * GET /api/system/validate-email?email=algo@dominio.com
 *
 * Respuesta: { authorized: bool, rol: string|null, modulos: string[], nombre: string|null }
 */
const validateEmail = async (req, res) => {
    const email = (req.query.email || '').trim().toLowerCase();

    if (!email) {
        return res.status(400).json({ error: 'Email requerido', authorized: false });
    }

    try {
        // 1. Buscar en la tabla de usuarios de la BD
        const [rows] = await pool.query(
            `SELECT u.id, u.email, u.nombre, u.rol, u.activo,
                    GROUP_CONCAT(um.modulo ORDER BY um.modulo SEPARATOR ',') AS modulos_str
             FROM usuarios u
             LEFT JOIN usuarios_modulos um ON um.usuario_id = u.id
             WHERE u.email = ?
             GROUP BY u.id`,
            [email]
        );

        if (rows.length > 0) {
            const user = rows[0];

            if (!user.activo) {
                return res.json({
                    authorized: false,
                    rol: null,
                    modulos: [],
                    nombre: null,
                    message: 'Usuario desactivado'
                });
            }

            const modulos = user.modulos_str ? user.modulos_str.split(',') : [];

            return res.json({
                authorized: true,
                rol: user.rol,
                modulos,
                nombre: user.nombre
            });
        }

        // 2. Permitir acceso de emergencia si el email está listado en ADMIN_EMAILS
        const adminEmailsStr = process.env.ADMIN_EMAILS || process.env.AUTHORIZED_EMAILS || '';
        const adminEmails = adminEmailsStr
            .split(',')
            .map(e => e.trim().toLowerCase())
            .filter(e => e);

        if (adminEmails.includes(email)) {
            return res.json({
                authorized: true,
                rol: 'sysadmin',
                modulos: [], // sysadmin tiene acceso a todo
                nombre: 'Admin Bootstrap',
                message: 'Acceso de emergencia (ADMIN_EMAILS) — configure usuarios en el panel de administración'
            });
        }

        // 3. Fallback: verificar si hay usuarios en la tabla (modo bootstrap total)
        const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM usuarios');

        if (parseInt(count, 10) === 0) {
            if (adminEmails.length === 0 || adminEmails.includes(email)) {
                return res.json({
                    authorized: true,
                    rol: 'sysadmin',
                    modulos: [], // sysadmin tiene acceso a todo
                    nombre: 'Admin Bootstrap',
                    message: 'Acceso bootstrap — configure usuarios en el panel de administración'
                });
            }
        }

        // 4. Email no encontrado y no es bootstrap
        return res.json({
            authorized: false,
            rol: null,
            modulos: [],
            nombre: null
        });

    } catch (error) {
        console.error('[validateEmail] Error al consultar la BD:', error.message);

        // Fallback de emergencia ante error de BD
        const adminEmailsStr = process.env.ADMIN_EMAILS || process.env.AUTHORIZED_EMAILS || '';
        const adminEmails = adminEmailsStr
            .split(',')
            .map(e => e.trim().toLowerCase())
            .filter(e => e);

        if (adminEmails.includes(email)) {
            return res.json({
                authorized: true,
                rol: 'sysadmin',
                modulos: [],
                nombre: null,
                message: 'Acceso de emergencia — error de BD'
            });
        }

        return res.status(500).json({
            error: 'Error al validar permisos',
            authorized: false
        });
    }
};

module.exports = {
    getVersion,
    validateEmail
};
