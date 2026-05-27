const FinnegansService = require('../services/finnegansService');
const finnegans = new FinnegansService();

/**
 * Buscar hojas de ruta en un rango de días.
 * GET /api/finnegans/hojas-ruta/rango?dias=5
 */
const buscarHojasRutaRango = async (req, res) => {
    console.log('[DEBUG] Recibida petición de rango de hojas de ruta');
    try {
        const dias = parseInt(req.query.dias) || 5;
        console.log(`[DEBUG] Buscando hojas para los últimos ${dias} días...`);
        const resultados = await finnegans.buscarHojasRutaRango(dias);
        console.log('[DEBUG] Búsqueda finalizada, enviando respuesta.');
        res.json(resultados);
    } catch (error) {
        console.error('[Finnegans] Error buscando hojas por rango:', error.message);
        res.status(500).json({ error: 'Error buscando hojas de ruta.' });
    }
};

/**
 * Obtener remitos de una hoja de ruta.
 * GET /api/finnegans/hojas-ruta/:id/remitos
 */
const getRemitosHojaRuta = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha } = req.query;
        const remitos = await finnegans.getRemitosHojaRuta(id, fecha);
        res.json(remitos);
    } catch (error) {
        console.error('[Finnegans] Error obteniendo remitos de HR:', error.message);
        res.status(500).json({ error: 'Error obteniendo remitos vinculados.' });
    }
};

/**
 * Buscar envíos en Finnegans.
 */
const buscarEnvios = async (req, res) => {
    try {
        const { numero, fechaDesde, fechaHasta } = req.query;
        const resultados = await finnegans.buscarEnvios({ numero, fechaDesde, fechaHasta });
        res.json(resultados);
    } catch (error) {
        console.error('[Finnegans] Error buscando envíos:', error.message);
        res.status(500).json({ error: 'Error consultando envíos.' });
    }
};

/**
 * Obtener hojas de ruta de un envío.
 * GET /api/finnegans/envios/:id/hojas-ruta
 */
const getHojasRuta = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'ID de envío requerido.' });
        }

        const hojasRuta = await finnegans.getHojasDeRuta(id);
        res.json(hojasRuta);
    } catch (error) {
        console.error('[Finnegans] Error obteniendo hojas de ruta:', error.message);
        res.status(500).json({
            error: 'Error obteniendo hojas de ruta.',
            detalle: error.message
        });
    }
};

/**
 * Obtener detalle de una hoja de ruta.
 * GET /api/finnegans/hojas-ruta/:id
 */
const getDetalleHojaRuta = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'ID de hoja de ruta requerido.' });
        }

        const detalle = await finnegans.getDetalleHojaRuta(id);
        res.json(detalle);
    } catch (error) {
        console.error('[Finnegans] Error obteniendo detalle de hoja de ruta:', error.message);
        res.status(500).json({
            error: 'Error obteniendo detalle de hoja de ruta.',
            detalle: error.message
        });
    }
};

/**
 * Obtener detalle de remito para COT.
 * GET /api/finnegans/remitos/:id/detalle-cot
 */
const getDetalleRemitoCOT = async (req, res) => {
    const { id } = req.params;
    console.log(`[COT] Solicitando detalle extendido para remito ID: ${id}`);
    try {
        const detalle = await finnegans.getDetalleRemitoCOT(id);
        console.log(`[COT] Detalle obtenido correctamente para ID: ${id}`);
        res.json(detalle);
    } catch (error) {
        console.error(`[Finnegans] Error obteniendo detalle de remito ${id}:`, error.message);
        if (error.response) {
            console.error('[Finnegans] Respuesta de error de la API:', error.response.data);
        }
        res.status(500).json({ 
            error: 'Error obteniendo detalle de remito de Finnegans.',
            detalle: error.message 
        });
    }
};

/**
 * Obtener lista de transportistas habilitados.
 * GET /api/finnegans/transportistas
 */
const getTransportistas = async (req, res) => {
    try {
        const transportistas = await finnegans.getTransportistas();
        res.json(transportistas);
    } catch (error) {
        console.error('[Finnegans] Error obteniendo transportistas:', error.message);
        res.status(500).json({ error: 'Error obteniendo lista de transportistas.' });
    }
};

module.exports = {
    buscarEnvios,
    getHojasRuta,
    getDetalleHojaRuta,
    buscarHojasRutaRango,
    getRemitosHojaRuta,
    getDetalleRemitoCOT,
    getTransportistas
};
