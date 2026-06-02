import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCcw, X, Smartphone, Monitor, Info } from 'lucide-react';
import { SystemService } from '../services/api';
import Modal from './Modal';

const UpdatePrompt = () => {
    const isVersionCheckEnabled = import.meta.env.VITE_ENABLE_VERSION_CHECK === 'true';
    const [forceUpdate, setForceUpdate] = useState(false);
    const [serverVersion, setServerVersion] = useState(null);
    const isChecking = useRef(false);

    // PWA Logic - Usamos un fallback seguro si swResult es null
    const swResult = useRegisterSW({
        onRegistered(r) {
            if (isVersionCheckEnabled) console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            if (isVersionCheckEnabled) console.log('SW registration error', error);
        },
    });

    const needUpdate = swResult?.needUpdate?.[0] || false;
    const offlineReady = swResult?.offlineReady?.[0] || false;
    const setNeedUpdate = swResult?.needUpdate?.[1] || (() => {});
    const setOfflineReady = swResult?.offlineReady?.[1] || (() => {});
    const updateServiceWorker = swResult?.updateServiceWorker || (() => window.location.reload(true));

    // Obtener versión actual definida por Vite
    const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

    const checkVersion = useCallback(async () => {
        if (!isVersionCheckEnabled || isChecking.current) return;
        isChecking.current = true;
        try {
            // Añadimos cache-buster al check de versión para asegurar que no venga de cache
            const res = await SystemService.getVersion(Date.now());
            const latest = res.data.serverVersion;
            setServerVersion(latest);

            if (latest && latest !== currentVersion) {
                console.log(`Version mismatch: Local=${currentVersion}, Remote=${latest}`);
                setForceUpdate(true);
            } else if (latest === currentVersion) {
                setForceUpdate(false);
            }
        } catch (error) {
            console.error('Error checking version:', error);
        } finally {
            isChecking.current = false;
        }
    }, [currentVersion, isVersionCheckEnabled]);

    useEffect(() => {
        if (!isVersionCheckEnabled) return;
        
        // Chequeo inicial
        checkVersion();

        // Chequeo cuando la app vuelve a primer plano
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkVersion();
            }
        };

        // Chequeo periódico (Polling)
        const intervalSeconds = parseInt(import.meta.env.VITE_VERSION_CHECK_INTERVAL) || 3600;
        const interval = setInterval(() => {
            if (!forceUpdate) {
                checkVersion();
            }
        }, intervalSeconds * 1000);

        window.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(interval);
        };
    }, [checkVersion, forceUpdate, isVersionCheckEnabled]);

    // Si está deshabilitado, no renderizamos nada (ni siquiera el listener de PWA)
    if (!isVersionCheckEnabled) return null;

    const handleUpdate = async () => {
        if (forceUpdate) {
            // "MODO NUCLEAR": Limpiar todo para forzar descarga del nuevo build
            try {
                // 1. Eliminar Caches del Navegador (CacheStorage)
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(name => caches.delete(name)));
                    console.log("Caches cleared");
                }
                
                // 2. Unregister Service Workers
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(registrations.map(r => r.unregister()));
                    console.log("Service Workers cleared");
                }
            } catch (e) {
                console.error("Error clearing files", e);
            }

            // Pequeña pausa para asegurar que se procesen las desregistraciones
            setTimeout(() => {
                // Hard reload con cache bust en la URL principal
                window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
            }, 500);
            
        } else if (typeof updateServiceWorker === 'function') {
            updateServiceWorker(true);
        } else {
            window.location.reload();
        }
    };

    const closePWA = () => {
        setNeedUpdate(false);
        setOfflineReady(false);
    };

    // Detectar plataforma para instrucciones
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;

    // --- RENDER MODAL DE ACTUALIZACIÓN FORZOSA ---
    if (forceUpdate) {
        return (
            <Modal
                isOpen={true}
                onClose={() => {}} 
                showCancel={false}
                title="🚀 Actualización disponible"
                maxWidth="500px"
            >
                <div style={{ textAlign: 'center', padding: '0 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', margin: '15px 0' }}>
                        <div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase' }}>Tu versión</div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#6b7280' }}>{currentVersion}</div>
                        </div>
                        <RefreshCcw size={24} className="text-primary" />
                        <div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase', color: 'var(--primary)' }}>Nueva versión</div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.3rem', color: 'var(--primary)' }}>{serverVersion}</div>
                        </div>
                    </div>

                    <p style={{ fontSize: '0.9rem', marginBottom: '15px', lineHeight: '1.4' }}>
                        Hemos realizado mejoras críticas. Es necesario actualizar para continuar.
                    </p>

                    <div className="card-anim" style={{ textAlign: 'left', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.03)', marginBottom: '20px' }}>
                        <h4 style={{ fontSize: '0.85rem', marginBottom: '8px', fontWeight: 'bold' }}>¿Cómo actualizar?</h4>
                        
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                            {isPWA ? <Smartphone size={18} className="text-accent" /> : <Monitor size={18} className="text-primary" />}
                            <span style={{ fontSize: '0.85rem' }}>
                                <strong>{isPWA ? 'App Instalada:' : 'Navegador:'}</strong> Presioná el botón. Si persiste, cerrá y abrí la app.
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', opacity: 0.7 }}>
                            <Info size={16} />
                            <span style={{ fontSize: '0.75rem' }}>Se refrescará el caché del navegador.</span>
                        </div>
                    </div>

                    <button 
                        className="btn btn-primary"
                        onClick={handleUpdate}
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}
                    >
                        <RefreshCcw size={18} />
                        Actualizar ahora
                    </button>
                </div>
            </Modal>
        );
    }

    // --- RENDER PROMPT DE PWA (Pequeño aviso flotante) ---
    if (!needUpdate && !offlineReady) return null;

    return (
        <div className="update-prompt-overlay">
            <div className="update-prompt-card glass animate-bounce-in">
                <div className="update-prompt-icon">
                    <RefreshCcw size={32} className={needUpdate ? 'animate-spin-slow' : ''} />
                </div>
                <div className="update-prompt-content">
                    <h3>{needUpdate ? '¡Actualización lista!' : 'Modo Offline Activado'}</h3>
                    <p>
                        {needUpdate 
                            ? 'Hay mejoras disponibles que se aplicarán al reiniciar.' 
                            : 'Ya podés usar la app sin conexión a internet.'}
                    </p>
                    <div className="update-prompt-actions">
                        {needUpdate ? (
                            <button 
                                className="btn btn-primary btn-md" 
                                onClick={() => handleUpdate()}
                            >
                                <RefreshCcw size={18} />
                                Recargar
                            </button>
                        ) : (
                            <button className="btn btn-secondary btn-md" onClick={closePWA}>
                                Entendido
                            </button>
                        )}
                        <button className="mode-toggle" onClick={closePWA}>
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdatePrompt;
