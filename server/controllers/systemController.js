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
 * Valida si un email está en la lista de autorizados.
 * GET /api/system/validate-email?email=algo@dominio.com
 */
const validateEmail = (req, res) => {
    const email = req.query.email;
    if (!email) {
        return res.status(400).json({ error: 'Email requerido', authorized: false });
    }

    const authorizedEmailsStr = process.env.AUTHORIZED_EMAILS || '';
    const authorizedEmails = authorizedEmailsStr.split(',').map(e => e.trim().toLowerCase()).filter(e => e);

    // Si no hay lista configurada, asumimos que todos los que pasaron el login del proveedor (ej. Microsoft/Google) están autorizados
    // (Opcional: puedes cambiar esto para denegar por defecto si prefieres mayor seguridad)
    if (authorizedEmails.length === 0) {
        return res.json({ authorized: true, message: 'No hay restricción de emails configurada' });
    }

    const isAuthorized = authorizedEmails.includes(email.toLowerCase());
    
    res.json({ authorized: isAuthorized });
};

module.exports = {
    getVersion,
    validateEmail
};
