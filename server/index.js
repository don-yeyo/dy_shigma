const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
process.on('uncaughtException', (err) => {
    console.error('[CRITICAL] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de contingencia para entornos serverless (como Netlify Functions)
app.use((req, res, next) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        const event = req.event || (req.apiGateway && req.apiGateway.event);
        if (event && event.body) {
            try {
                let rawBody = event.body;
                
                // Si viene como buffer serializado de AWS / Netlify: { type: 'Buffer', data: [...] }
                if (rawBody && typeof rawBody === 'object' && rawBody.type === 'Buffer' && Array.isArray(rawBody.data)) {
                    rawBody = Buffer.from(rawBody.data).toString('utf8');
                } else if (Buffer.isBuffer(rawBody)) {
                    rawBody = rawBody.toString('utf8');
                } else if (event.isBase64Encoded && typeof rawBody === 'string') {
                    rawBody = Buffer.from(rawBody, 'base64').toString('utf8');
                }
                
                if (typeof rawBody === 'string') {
                    req.body = JSON.parse(rawBody);
                } else if (typeof rawBody === 'object') {
                    req.body = rawBody;
                }
            } catch (err) {
                console.error('[SERVERLESS BODY PARSE ERROR]:', err);
            }
        }
    }
    next();
});

// rate-limit: Protección Anti-DOS (Máximo 1000 reqs / IP cada 15 min)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: 'Demasiadas solicitudes desde esta IP, por favor intenta en 15 minutos.' }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

// Límite de carga útil HTTP de 2MB
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Aplicar rate-limit a todas las rutas de la API
app.use('/api', limiter);

// Routes
const finnegansRoutes = require('./routes/finnegans');
const cotRoutes = require('./routes/cot');
const systemRoutes = require('./routes/system');
const shigmaRoutes = require('./routes/shigma');
const usersRoutes = require('./routes/users');

app.use('/api/finnegans', finnegansRoutes);
app.use('/api/cot', cotRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/shigma', shigmaRoutes);
app.use('/api/users', usersRoutes);

app.get('/', (req, res) => {
    res.json({ message: `SHIGMA API - Seguridad, Higiene y Medioambiente - ${process.env.COMPANY_NAME || 'SHIGMA'}` });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor.' });
});

// Iniciar el servidor
const server = app.listen(PORT, () => {
    console.log(`[SHIGMA] v1.0.0 - Server running on port ${PORT}`);
    console.log(`Server listening state: ${server.listening}`);
});

server.on('error', (err) => {
    console.error('Server error event:', err);
});

server.on('close', () => {
    console.log('Server close event triggered!');
});

module.exports = app;
