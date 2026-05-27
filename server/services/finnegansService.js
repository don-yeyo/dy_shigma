const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * FinnegansService — Port a Node.js del servicio Python existente.
 * Maneja autenticación OAuth y consultas a la API de Finnegans ERP.
 * Todos los endpoints son configurables por variable de entorno.
 */
class FinnegansService {
    constructor() {
        this.clientId = process.env.FINNEGANS_CLIENT_ID;
        this.clientSecret = process.env.FINNEGANS_CLIENT_SECRET;
        this.tokenUrl = process.env.FINNEGANS_TOKEN_URL || 'https://api.teamplace.finneg.com/api/oauth/token';
        this.apiBase = process.env.FINNEGANS_API_BASE || 'https://api.finneg.com/api';
        this.empresaCod = process.env.FINNEGANS_EMPRESA_COD || 'EMPRE01';
        this.timeout = (parseInt(process.env.FINNEGANS_TIMEOUT) || 60) * 1000;
        this.enviosReport = process.env.FINNEGANS_ENVIOS_REPORT || 'ANAHOJADERUTADY';
        this.hojasRutaReport = process.env.FINNEGANS_HOJAS_RUTA_REPORT || 'ANAHOJADERUTADY';

        this._accessToken = null;
        this._tokenExpiry = null;
    }

    /**
     * Helper para imprimir el equivalente a cURL de la petición (para debug).
     */
    _logCurl(url, params = {}, method = 'GET') {
        const query = new URLSearchParams(params).toString();
        const fullUrl = query ? `${url}?${query}` : url;
        const logContent = `\n[${new Date().toISOString()}] --- FINNEGANS cURL DEBUG ---\ncurl -X ${method} "${fullUrl}"\n----------------------------\n`;
        
        console.log(logContent);
        
        /* Comentado para evitar colgar el server por IO
        try {
            fs.appendFileSync(path.join(__dirname, '../debug.log'), logContent);
        } catch (e) {
            console.error('Error escribiendo en debug.log:', e.message);
        }
        */
    }

    /**
     * Obtiene un access token OAuth2 (client_credentials).
     * Cachea el token para reutilizarlo hasta que expire.
     */
    async _getAccessToken() {
        // Reutilizar token si aún es válido (margen de 60s)
        if (this._accessToken && this._tokenExpiry && Date.now() < this._tokenExpiry - 60000) {
            return this._accessToken;
        }

        const params = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: this.clientId,
            client_secret: this.clientSecret
        });

        console.log(`[Finnegans] Solicitando nuevo Access Token a: ${this.tokenUrl}`);
        const response = await axios.get(`${this.tokenUrl}?${params.toString()}`, {
            timeout: this.timeout
        });

        // Finnegans devuelve el token como texto plano
        this._accessToken = response.data.toString().trim();
        console.log('[Finnegans] Token obtenido exitosamente.');
        // Token válido por 1 hora (default Finnegans)
        this._tokenExpiry = Date.now() + 3600000;
        return this._accessToken;
    }

    /**
     * Ejecuta un reporte de Finnegans con los parámetros dados.
     * @param {string} reportName - Nombre del reporte en Finnegans
     * @param {Object} params - Parámetros del reporte (PARAMxxx)
     * @returns {Array} Resultados del reporte
     */
    async executeReport(reportName, params = {}) {
        const token = await this._getAccessToken();
        const url = `${this.apiBase}/reports/${reportName}`;

        const queryParams = {
            ACCESS_TOKEN: token,
            ...params
        };

        console.log(`[Finnegans] Ejecutando reporte: ${reportName}`);
        this._logCurl(url, queryParams);

        const response = await axios.get(url, {
            params: queryParams,
            timeout: this.timeout
        });

        return response.data;
    }

    /**
     * Busca envíos/hojas en Finnegans.
     */
    async buscarEnvios(filtro = {}) {
        const params = {};

        if (filtro.numero) {
            params.PARAMNumeroEnvio = filtro.numero;
        }
        if (filtro.fechaDesde) {
            params.FechaDesde = filtro.fechaDesde; 
        }
        if (filtro.fechaHasta) {
            params.FechaHasta = filtro.fechaHasta;
        }
        if (this.empresaCod) {
            params.PARAMWEBREPORT_Empresa = this.empresaCod;
        }

        return this.executeReport(this.enviosReport, params);
    }

    /**
     * Busca Hojas de Ruta en un rango de días hacia atrás.
     * @param {number} dias - Cantidad de días hacia atrás desde hoy
     * @returns {Array} Lista de Hojas de Ruta
     */
    async buscarHojasRutaRango(dias = 5) {
        const today = new Date();
        const pastDate = new Date();
        pastDate.setDate(today.getDate() - dias);

        const fechaDesde = pastDate.toISOString().split('T')[0];
        const fechaHasta = today.toISOString().split('T')[0];
        console.log(`[Finnegans] Buscando en rango: ${fechaDesde} hasta ${fechaHasta}`);

        return this.buscarEnvios({ fechaDesde, fechaHasta });
    }

    /**
     * Obtiene los remitos vinculados a una Hoja de Ruta.
     * @param {string|number} hojaRutaId - ID o Comprobante de la HR
     * @returns {Array} Lista de remitos con detalle (Cliente, Pedido, etc.)
     */
    async getRemitosHojaRuta(hojaRutaId, fechaHoja) {
        // Nuevo reporte solicitado por el usuario
        const report = 'USR_Despachos_x_HDRDY';
        
        let fechaHasta = '';
        let fechaDesde = '';

        if (fechaHoja && typeof fechaHoja === 'string') {
            try {
                // La fecha viene habitualmente como DD-MM-YYYY
                let parts = fechaHoja.includes('-') ? fechaHoja.split('-') : fechaHoja.split('/');
                if (parts.length === 3) {
                    // Normalizar a YYYY-MM-DD para el objeto Date
                    let normalized = parts[2].length === 4 ? `${parts[2]}-${parts[1]}-${parts[0]}` : fechaHoja;
                    const dateObj = new Date(normalized);
                    if (!isNaN(dateObj.getTime())) {
                        fechaHasta = dateObj.toISOString().split('T')[0];
                        // 10 días para atrás para fechaDesde
                        const past = new Date(dateObj);
                        past.setDate(dateObj.getDate() - 10);
                        fechaDesde = past.toISOString().split('T')[0];
                    }
                }
            } catch (err) {
                console.warn('[Finnegans] Error calculando rango de fechas:', err.message);
            }
        }

        // Fallback si el parseo falla
        if (!fechaHasta) {
            fechaHasta = new Date().toISOString().split('T')[0];
            const past = new Date();
            past.setDate(past.getDate() - 10);
            fechaDesde = past.toISOString().split('T')[0];
        }

        const params = {
            ID_Hoja_de_ruta: hojaRutaId,
            fechaDesde: fechaDesde,
            fechaHasta: fechaHasta
        };

        try {
            console.log(`[Finnegans] Consultando remitos con ${report} para ID ${hojaRutaId} (${fechaDesde} a ${fechaHasta})...`);
            const data = await this.executeReport(report, params);
            
            if (!Array.isArray(data)) return [];

            return data.map(d => ({
                id: d.TRANSACCIONID || d.IDENTIFICACIONEXTERNA || d.NROINTERNO,
                cliente: d.ORGANIZACION || d.CLIENTE || 'Cliente Don Yeyo',
                pedidoTipo: d.TRANSACCIONSUBTIPOCODIGO || 'REMVTA',
                pedidoNro: d.IDENTIFICACIONEXTERNA || d.COMPROBANTE,
                comprobante: d.IDENTIFICACIONEXTERNA || d.COMPROBANTE,
                fecha: d.FECHA,
                despacho: d.IDENTIFICACIONEXTERNA || d.COMPROBANTE,
                cae: d.OBTUVOCAE === 'SI'
            }));

        } catch (e) {
            console.error(`[Finnegans] Error en getRemitosHojaRuta:`, e.message);
            return [];
        }
    }

    /**
     * Obtiene las hojas de ruta asociadas a un envío.
     * @param {string|number} envioId - ID o número del envío
     * @returns {Array} Lista de hojas de ruta
     */
    async getHojasDeRuta(envioId) {
        const params = {
            PARAMEnvioId: envioId,
            PARAMWEBREPORT_Empresa: this.empresaCod
        };

        return this.executeReport(this.hojasRutaReport, params);
    }

    /**
     * Obtiene el detalle completo de una hoja de ruta.
     * @param {string|number} hojaRutaId - ID de la hoja de ruta
     * @returns {Object} Detalle de la hoja de ruta
     */
    async getDetalleHojaRuta(hojaRutaId) {
        const token = await this._getAccessToken();
        const url = `${this.apiBase}/transaccion/${hojaRutaId}`;

        const queryParams = { ACCESS_TOKEN: token };
        this._logCurl(url, queryParams);

        const response = await axios.get(url, {
            params: queryParams,
            timeout: this.timeout
        });

        return response.data;
    }

    /**
     * Consulta genérica a la API de Finnegans.
     * Útil para endpoints no cubiertos por los métodos específicos.
     * @param {string} endpoint - Path relativo al apiBase
     * @param {Object} params - Query params adicionales
     * @returns {any} Respuesta de la API
     */
    async query(endpoint, params = {}) {
        const token = await this._getAccessToken();
        const url = `${this.apiBase}/${endpoint}`;

        const queryParams = { ACCESS_TOKEN: token, ...params };
        this._logCurl(url, queryParams);

        const response = await axios.get(url, {
            params: queryParams,
            timeout: this.timeout
        });

        return response.data;
    }
    /**
     * Obtiene el detalle de un remito para la generación masiva de COT.
     * @param {string|number} transaccionId - ID del remito
     * @returns {Array} Detalle del remito (productos, direcciones, etc.)
     */
    async getDetalleRemitoCOT(transaccionId) {
        const report = 'USR_ViewApiCOTMasivo';
        const params = {
            PARAMWEBREPORT_TransaccionID: transaccionId
        };
        return this.executeReport(report, params);
    }

    /**
     * Obtiene la lista de transportistas habilitados.
     * Proceso:
     * 1. Listar proveedores activos.
     * 2. Obtener detalle de cada uno para verificar 'EsTransportista'.
     * 3. Limpiar CUIT (quitar guiones).
     */
    async getTransportistas() {
        try {
            console.log('[Finnegans] Iniciando búsqueda simplificada de proveedores...');
            
            // 1. Obtener lista completa de proveedores
            const proveedores = await this.query('proveedor/list');
            if (!Array.isArray(proveedores)) return [];

            console.log(`[Finnegans] Se obtuvieron ${proveedores.length} proveedores en total.`);

            // 2. Filtrar activos y mapear campos
            const transportistas = proveedores
                .filter(p => p.activo === true)
                .map(p => ({
                    codigo: p.codigo,
                    nombre: p.nombre,
                    razonSocial: p.nombre,
                    email: '',
                    cuit: String(p.codigo || '').replace(/-/g, '').trim()
                }))
                .sort((a, b) => a.nombre.localeCompare(b.nombre));

            // 3. Añadir Transporte Propio al inicio
            transportistas.unshift({
                codigo: 'PROPIO',
                nombre: 'TRANSPORTE PROPIO',
                razonSocial: 'TRANSPORTE PROPIO',
                email: '',
                cuit: (process.env.ARBA_CUIT_EMPRESA || '').replace(/-/g, '').trim()
            });

            console.log('=========================================');
            console.log(`[Finnegans] LISTA DE PROVEEDORES GENERADA (${transportistas.length}):`);
            console.log(JSON.stringify(transportistas.slice(0, 10), null, 2));
            console.log('... (truncado para la terminal) ...');
            console.log('=========================================');

            return transportistas;
        } catch (error) {
            console.error('[Finnegans] Error en getTransportistas:', error.message);
            throw error;
        }
    }
}

module.exports = FinnegansService;
