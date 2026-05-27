export const getLocalISOString = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
};

export const validateRecordDate = (dateStr) => {
    if (!dateStr) return 'La fecha y hora de carga es obligatoria.';
    
    const selectedDate = new Date(dateStr);
    const now = new Date();
    
    // N días en el pasado (desde variable de entorno, por defecto 5)
    const maxPastDays = parseInt(import.meta.env.VITE_MAX_PAST_DAYS_REGISTRATION || '5', 10);
    
    const minPastDate = new Date();
    minPastDate.setDate(now.getDate() - maxPastDays);
    minPastDate.setHours(0, 0, 0, 0); // Inicio del día
    
    const maxFutureDate = new Date();
    maxFutureDate.setDate(now.getDate() + 3);
    maxFutureDate.setHours(23, 59, 59, 999); // Fin del día +3 en el futuro
    
    if (selectedDate < minPastDate) {
        return `La fecha no puede ser anterior a ${maxPastDays} días en el pasado.`;
    }
    if (selectedDate > maxFutureDate) {
        return 'La fecha no puede ser superior a 3 días en el futuro.';
    }
    return null;
};
