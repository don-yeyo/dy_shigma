const pool = require('../config/db');

/**
 * Middleware de autorización por rol.
 * Verifica el header X-User-Email contra la tabla `usuarios` en la BD.
 *
 * Uso: router.get('/ruta', requireRole('sysadmin'), handler)
 *      router.get('/ruta', requireRole('sysadmin', 'supervisor'), handler)
 *
 * Agrega req.currentUser = { id, email, nombre, rol, modulos[] } si es válido.
 */
const requireRole = (...allowedRoles) => {
    return async (req, res, next) => {
        const email = (req.headers['x-user-email'] || '').trim().toLowerCase();

        if (!email) {
            return res.status(401).json({ error: 'No autenticado. Falta el header X-User-Email.' });
        }

        try {
            const [rows] = await pool.query(
                `SELECT u.id, u.email, u.nombre, u.rol, u.activo,
                        GROUP_CONCAT(um.modulo ORDER BY um.modulo SEPARATOR ',') AS modulos_str
                 FROM usuarios u
                 LEFT JOIN usuarios_modulos um ON um.usuario_id = u.id
                 WHERE u.email = ?
                 GROUP BY u.id`,
                [email]
            );

            let currentUser = null;

            if (rows.length > 0 && rows[0].activo) {
                const u = rows[0];
                currentUser = {
                    id: u.id,
                    email: u.email,
                    nombre: u.nombre,
                    rol: u.rol,
                    modulos: u.modulos_str ? u.modulos_str.split(',') : []
                };
            } else if (rows.length === 0) {
                // Permitir acceso de emergencia si el email está listado en ADMIN_EMAILS
                const adminEmailsStr = process.env.ADMIN_EMAILS || process.env.AUTHORIZED_EMAILS || '';
                const adminEmails = adminEmailsStr
                    .split(',')
                    .map(e => e.trim().toLowerCase())
                    .filter(e => e);

                if (adminEmails.includes(email)) {
                    currentUser = {
                        id: null,
                        email,
                        nombre: 'Admin Bootstrap',
                        rol: 'sysadmin',
                        modulos: []
                    };
                } else {
                    // Si no está en ADMIN_EMAILS, también permitimos bootstrap total si la tabla está vacía
                    const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM usuarios');
                    if (parseInt(count, 10) === 0) {
                        currentUser = {
                            id: null,
                            email,
                            nombre: 'Admin Bootstrap',
                            rol: 'sysadmin',
                            modulos: []
                        };
                    }
                }
            }

            if (!currentUser) {
                return res.status(401).json({ error: 'Usuario no autorizado o desactivado.' });
            }

            if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.rol)) {
                return res.status(403).json({
                    error: `Acceso denegado. Se requiere rol: ${allowedRoles.join(' o ')}.`
                });
            }

            req.currentUser = currentUser;
            next();

        } catch (error) {
            // Si la tabla `usuarios` aún no fue creada, usamos modo bootstrap de emergencia
            if (error.code === 'ER_NO_SUCH_TABLE') {
                const adminEmailsStr = process.env.ADMIN_EMAILS || process.env.AUTHORIZED_EMAILS || '';
                const adminEmails = adminEmailsStr
                    .split(',')
                    .map(e => e.trim().toLowerCase())
                    .filter(e => e);

                if (adminEmails.length === 0 || adminEmails.includes(email)) {
                    if (allowedRoles.length === 0 || allowedRoles.includes('sysadmin')) {
                        req.currentUser = {
                            id: null,
                            email,
                            nombre: 'Admin Bootstrap',
                            rol: 'sysadmin',
                            modulos: []
                        };
                        console.warn('[requireRole] Tabla usuarios inexistente — modo bootstrap activo para:', email);
                        return next();
                    }
                }
                return res.status(403).json({ error: 'Tabla de usuarios no inicializada. Ejecute shigma_setup.sql.' });
            }

            console.error('[requireRole] Error al verificar rol:', error.message);
            return res.status(500).json({ error: 'Error interno al verificar permisos.' });
        }
    };
};

module.exports = { requireRole };
