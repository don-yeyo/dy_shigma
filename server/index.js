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

app.use('/api/finnegans', finnegansRoutes);
app.use('/api/cot', cotRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/shigma', shigmaRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'SHIGMA API - Seguridad, Higiene y Medioambiente - Don Yeyo S.A.' });
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
