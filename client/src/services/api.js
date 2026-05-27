import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'),
});

export const FinnegansService = {
    buscarEnvios: (filtro) =>
        api.get('/finnegans/envios', { params: filtro }),
    getHojasRuta: (envioId) =>
        api.get(`/finnegans/envios/${envioId}/hojas-ruta`),
    getDetalleHojaRuta: (hojaRutaId) =>
        api.get(`/finnegans/hojas-ruta/${hojaRutaId}`),
    buscarPorRango: (dias) =>
        api.get('/finnegans/hojas-ruta/rango', { params: { dias } }),
    getRemitos: (hojaRutaId, fecha) => 
        api.get(`/finnegans/hojas-ruta/${hojaRutaId}/remitos`, { params: { fecha } }),
    getDetalleRemitoCOT: (remitoId) =>
        api.get(`/finnegans/remitos/${remitoId}/detalle-cot`),
    getTransportistas: () =>
        api.get('/finnegans/transportistas'),
};

export const COTService = {
    regenerar: (data) =>
        api.post('/cot/regenerar', data),
    preview: (data) =>
        api.post('/cot/preview', data),
};

export const SystemService = {
    getVersion: (v) =>
        api.get(`/system/version${v ? `?v=${v}` : ''}`),
    validateEmail: (email) =>
        api.get(`/system/validate-email`, { params: { email } }),
};

export const SHIGMAService = {
    getStats: (fechaDesde, fechaHasta) =>
        api.get('/shigma/stats', { params: { fechaDesde, fechaHasta, _cb: Date.now() } }),
    getAllRecords: () =>
        api.get('/shigma/records'),
    getRecordsByForm: (formType) =>
        api.get(`/shigma/records/${formType}`),
    createRecord: (formType, data) =>
        api.post(`/shigma/records/${formType}`, data),
    
    // Bateas API
    getBateasStatus: () =>
        api.get('/shigma/bateas'),
    restartBatea: (bateaId, data) =>
        api.post(`/shigma/bateas/${bateaId}/restart`, data),
    getBateaSalidas: () =>
        api.get('/shigma/bateas/salidas'),
    
    // Operadores API
    getOperadoresByForm: (formType) =>
        api.get(`/shigma/operadores/${formType}`),
    getOperadores: () =>
        api.get('/shigma/operadores'),
    createOperador: (data) =>
        api.post('/shigma/operadores', data),
    updateOperador: (id, data) =>
        api.put(`/shigma/operadores/${id}`, data),
    deleteOperador: (id) =>
        api.delete(`/shigma/operadores/${id}`),
};

export default api;

