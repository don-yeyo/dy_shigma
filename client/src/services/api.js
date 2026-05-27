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
    getStats: () =>
        api.get('/shigma/stats'),
    getAllRecords: () =>
        api.get('/shigma/records'),
    getRecordsByForm: (formType) =>
        api.get(`/shigma/records/${formType}`),
    createRecord: (formType, data) =>
        api.post(`/shigma/records/${formType}`, data),
};

export default api;

