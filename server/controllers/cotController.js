const ArbaService = require('../services/arbaService');

const arba = new ArbaService();

/**
 * Regenerar COT: genera el archivo y lo presenta a ARBA.
 * POST /api/cot/regenerar
 * Body: { cuitDestinatario, razonSocialDestinatario, domicilioOrigen, domicilioDestino,
 *         cuitTransportista, razonSocialTransportista, patente, patenteAcoplado,
 *         fechaPartida, horaPartida, nroRemito, productos: [{codigo, descripcion, cantidad, unidad}] }
 */
const regenerarCOT = async (req, res) => {
    try {
        let datos = req.body;
        
        // Si recibimos un Buffer (común en Netlify), lo convertimos a objeto
        if (Buffer.isBuffer(datos)) {
            try {
                datos = JSON.parse(datos.toString('utf-8'));
            } catch (e) {
                console.error('[COT] Error parseando Buffer a JSON:', e.message);
            }
        } else if (typeof datos === 'string') {
            try {
                datos = JSON.parse(datos);
            } catch (e) {}
        }

        console.log('[COT] Datos procesados en el servidor:', JSON.stringify(datos, null, 2));

        // Validaciones básicas
        const camposRequeridos = ['cuitTransportista', 'patente', 'fechaPartida'];
        const faltantes = camposRequeridos.filter(c => !datos[c]);
        if (faltantes.length > 0) {
            return res.status(400).json({
                error: `Campos requeridos faltantes: ${faltantes.join(', ')}`,
                recibido: datos // Devolvemos lo que recibimos para debug
            });
        }

        // Generar contenido del archivo COT
        const contenidoArchivo = arba.generarArchivoCOT(datos);
        console.log('[COT] Archivo generado, presentando a ARBA...');

        // Presentar a ARBA
        const resultado = await arba.enviarCOT(contenidoArchivo.contenido, contenidoArchivo.nombreArchivo);

        if (resultado.success) {
            console.log(`[COT] ✓ COT generado exitosamente: ${resultado.nroCOT}`);
        } else {
            console.warn(`[COT] ✗ Error en generación de COT:`, resultado.errores);
        }

        res.json({
            success: resultado.success,
            nroCOT: resultado.nroCOT,
            errores: resultado.errores,
            archivoGenerado: contenidoArchivo
        });
    } catch (error) {
        console.error('[COT] Error regenerando COT:', error.message);
        res.status(500).json({
            error: 'Error regenerando COT.',
            detalle: error.message
        });
    }
};

/**
 * Preview del archivo COT sin enviarlo a ARBA.
 * POST /api/cot/preview
 * Body: mismos datos que regenerarCOT
 */
const previewCOT = async (req, res) => {
    try {
        const datos = req.body;
        const preview = arba.generarArchivoCOT(datos); // previewCOT no existe, usar generarArchivoCOT

        res.json({
            success: true,
            ...preview
        });
    } catch (error) {
        console.error('[COT] Error generando preview:', error.message);
        res.status(500).json({
            error: 'Error generando preview del COT.',
            detalle: error.message
        });
    }
};

module.exports = {
    regenerarCOT,
    previewCOT
};
