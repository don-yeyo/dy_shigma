export const getLocalISOString = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
};

export const getFormattedDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const getFormattedTime = (date) => {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
};

export const getDateConstraints = () => {
    const today = new Date();
    const maxPastDays = parseInt(import.meta.env.VITE_MAX_PAST_DAYS_REGISTRATION || '5', 10);
    const maxFutureDays = parseInt(import.meta.env.VITE_MAX_FUTURE_DAYS_REGISTRATION || '3', 10);
    
    const minDate = new Date();
    minDate.setDate(today.getDate() - maxPastDays);
    
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + maxFutureDays);
    
    return {
        todayStr: getFormattedDate(today),
        nowTimeStr: getFormattedTime(today),
        minDateStr: getFormattedDate(minDate),
        maxDateStr: getFormattedDate(maxDate)
    };
};

export const validateRecordDate = (dateStr) => {
    if (!dateStr) return 'La fecha y hora de carga es obligatoria.';
    
    const selectedDate = new Date(dateStr);
    const now = new Date();
    
    // N días en el pasado (desde variable de entorno, por defecto 5)
    const maxPastDays = parseInt(import.meta.env.VITE_MAX_PAST_DAYS_REGISTRATION || '5', 10);
    const maxFutureDays = parseInt(import.meta.env.VITE_MAX_FUTURE_DAYS_REGISTRATION || '3', 10);
    
    const minPastDate = new Date();
    minPastDate.setDate(now.getDate() - maxPastDays);
    minPastDate.setHours(0, 0, 0, 0); // Inicio del día
    
    const maxFutureDate = new Date();
    maxFutureDate.setDate(now.getDate() + maxFutureDays);
    maxFutureDate.setHours(23, 59, 59, 999); // Fin del día +N en el futuro
    
    if (selectedDate < minPastDate) {
        return `La fecha no puede ser anterior a ${maxPastDays} días en el pasado.`;
    }
    if (selectedDate > maxFutureDate) {
        return `La fecha no puede ser superior a ${maxFutureDays} días en el futuro.`;
    }
    return null;
};
