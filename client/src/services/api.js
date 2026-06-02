import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'),
});

/**
 * Establece el email del usuario autenticado como header por defecto en todas
 * las requests de esta instancia de Axios. Se llama desde AuthContext apenas
 * se conoce el email (sincrónicamente, antes de cualquier llamada async).
 * Pasar null para limpiar el header al hacer logout.
 */
export const setUserEmail = (email) => {
    if (email) {
        api.defaults.headers.common['X-User-Email'] = email;
    } else {
        delete api.defaults.headers.common['X-User-Email'];
    }
};

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
    getAllRecords: (params) =>
        api.get('/shigma/records', { params }),
    getRecordsByForm: (formType) =>
        api.get(`/shigma/records/${formType}`),
    createRecord: (formType, data) =>
        api.post(`/shigma/records/${formType}`, data),
    updateRecord: (formType, id, data) =>
        api.put(`/shigma/records/${formType}/${id}`, data),
    deleteRecord: (formType, id) =>
        api.delete(`/shigma/records/${formType}/${id}`),
    
    // Bateas API
    getBateasStatus: () =>
        api.get('/shigma/bateas'),
    restartBatea: (bateaId, data) =>
        api.post(`/shigma/bateas/${bateaId}/restart`, data),
    updateBateaCapacity: (bateaId, capacidad) =>
        api.put(`/shigma/bateas/${bateaId}/capacity`, { capacidad }),
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

/**
 * Servicio de gestión de usuarios (solo accesible para sysadmin).
 */
export const UsersService = {
    // Lista todos los usuarios con módulos y resumen de asignaciones
    getUsuarios: () =>
        api.get('/users'),
    // Detalle de un usuario específico
    getUsuario: (id) =>
        api.get(`/users/${id}`),
    // Crear usuario
    createUsuario: (data) =>
        api.post('/users', data),
    // Editar nombre, rol o estado activo
    updateUsuario: (id, data) =>
        api.put(`/users/${id}`, data),
    // Desactivar (soft delete)
    deleteUsuario: (id) =>
        api.delete(`/users/${id}`),
    // Reemplazar módulos asignados
    updateModulos: (id, modulos) =>
        api.put(`/users/${id}/modulos`, { modulos }),
    // Registradores asignados a un supervisor
    getRegistradoresAsignados: (id) =>
        api.get(`/users/${id}/registradores`),
    // Reemplazar registradores asignados a un supervisor
    updateRegistradoresAsignados: (id, registradores_ids) =>
        api.put(`/users/${id}/registradores`, { registradores_ids }),
    // Lista todos los registradores (para selects)
    getRegistradores: () =>
        api.get('/users/registradores'),
};

export default api;
