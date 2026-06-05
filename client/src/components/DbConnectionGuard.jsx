import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Database, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { SystemService } from '../services/api';
import Modal from './Modal';

const DbConnectionGuard = () => {
    const [isDbDisconnected, setIsDbDisconnected] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const isCheckingRef = useRef(false);
    const wasDisconnectedRef = useRef(false);

    const checkConnection = useCallback(async () => {
        if (isCheckingRef.current) return;
        isCheckingRef.current = true;
        setIsChecking(true);

        try {
            const res = await SystemService.getDbStatus();
            if (res.data && res.data.status === 'ok') {
                if (wasDisconnectedRef.current) {
                    window.location.reload();
                    return;
                }
                setIsDbDisconnected(false);
            } else {
                setIsDbDisconnected(true);
                wasDisconnectedRef.current = true;
            }
        } catch (error) {
            console.error('[DbConnectionGuard] Database status check failed:', error);
            setIsDbDisconnected(true);
            wasDisconnectedRef.current = true;
        } finally {
            setIsChecking(false);
            isCheckingRef.current = false;
        }
    }, []);


    useEffect(() => {
        // Inicial
        checkConnection();

        // Polling para monitoreo constante usando variable de entorno
        const intervalSeconds = parseInt(import.meta.env.VITE_DB_CONNECTION_CHECK_INTERVAL) || 90;
        const interval = setInterval(() => {
            checkConnection();
        }, intervalSeconds * 1000);


        // Escuchar eventos globales de fallo de conexión (por ejemplo, gatillados por Axios)
        const handleDbError = () => {
            setIsDbDisconnected(true);
            wasDisconnectedRef.current = true;
        };


        const handleAxiosError = (e) => {
            // Si cualquier llamada a la API da error de conexión o 500, validamos de inmediato el estado de la base de datos
            const status = e.detail?.status;
            const errorMsg = e.detail?.message || '';

            if (status === 500 || !status || errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('database')) {
                checkConnection();
            }
        };

        window.addEventListener('db-connection-failed', handleDbError);
        window.addEventListener('api-request-failed', handleAxiosError);

        return () => {
            clearInterval(interval);
            window.removeEventListener('db-connection-failed', handleDbError);
            window.removeEventListener('api-request-failed', handleAxiosError);
        };
    }, [checkConnection]);

    const handleRetry = async () => {
        setRetryCount(prev => prev + 1);
        await checkConnection();
    };

    if (!isDbDisconnected) return null;

    return (
        <Modal
            isOpen={true}
            onClose={() => { }}
            showCancel={false}
            showFooter={false}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--dy-red)' }}>
                    <AlertTriangle size={24} className="animate-pulse" />
                    <span>Conexión interrumpida</span>
                </div>
            }
            maxWidth="480px"
        >
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 24px auto',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--dy-red)'
                }}>
                    <Database size={40} />
                    <div style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        background: 'var(--dy-red)',
                        color: '#fff',
                        borderRadius: '50%',
                        padding: '4px',
                        border: '2px solid var(--surface)'
                    }}>
                        <WifiOff size={16} />
                    </div>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '12px', color: 'var(--header-text)' }}>
                    Sin conexión con la Base de Datos
                </h3>

                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '24px' }}>
                    No se ha podido establecer comunicación con la base de datos del sistema.
                    Por favor, verificá tu conexión de red o contactate con soporte técnico si el problema persiste.
                </p>

                <div className="card-anim" style={{
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    marginBottom: '24px',
                    fontSize: '0.85rem',
                    textAlign: 'left',
                    color: 'var(--text-muted)'
                }}>
                    <strong>Detalles del estado:</strong>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                        <span>Servicio SHIGMA:</span>
                        <span style={{ color: 'var(--dy-red)', fontWeight: 'bold' }}>Offline / Desconectado</span>
                    </div>
                    {retryCount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                            <span>Intentos de reconexión:</span>
                            <span>{retryCount}</span>
                        </div>
                    )}
                </div>

                <button
                    className="btn btn-primary"
                    disabled={isChecking}
                    onClick={handleRetry}
                    style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontWeight: 'bold',
                        background: 'var(--dy-red)',
                        color: '#fff',
                        border: 'none',
                        cursor: isChecking ? 'not-allowed' : 'pointer',
                        opacity: isChecking ? 0.7 : 1,
                        transition: 'opacity 0.2s'
                    }}
                >
                    <RefreshCw size={18} className={isChecking ? 'animate-spin' : ''} />
                    {isChecking ? 'Verificando...' : 'Reintentar Conexión'}
                </button>
            </div>
        </Modal>
    );
};

export default DbConnectionGuard;
