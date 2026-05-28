import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "./msal";
import { InteractionStatus } from "@azure/msal-browser";
import { SystemService, setUserEmail } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const { instance, accounts, inProgress } = useMsal();
    const isMsAuthenticated = useIsAuthenticated();
    
    const [googleUser, setGoogleUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);
    const [validatedEmail, setValidatedEmail] = useState(null);

    // Ref para evitar re-ejecución del efecto en React Strict Mode (dev)
    const mockAuthDone = useRef(false);

    // Cargar usuario de Google si existe en localStorage
    useEffect(() => {
        const storedGoogleUser = localStorage.getItem('google_user');
        if (storedGoogleUser) {
            try {
                const parsed = JSON.parse(storedGoogleUser);
                setGoogleUser(parsed);
            } catch (e) {
                localStorage.removeItem('google_user');
            }
        }
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            // ── BYPASS PARA DESARROLLO LOCAL (MOCK AUTH) ──────────────────────
            if (import.meta.env.DEV && import.meta.env.VITE_MOCK_AUTH === 'true') {
                // Guardia: evita re-ejecución por React Strict Mode o re-renders
                if (mockAuthDone.current) return;
                mockAuthDone.current = true;

                const mockEmail = import.meta.env.VITE_MOCK_AUTH_EMAIL;
                const mockName  = import.meta.env.VITE_MOCK_AUTH_NAME || 'Usuario Mock';

                // ⚡ Setear el header en Axios ANTES de cualquier llamada async
                // para que cualquier componente que monte después ya lo tenga disponible
                setUserEmail(mockEmail);
                console.log(`⚠️ MODO MOCK ACTIVADO: Entrando como ${mockEmail}`);

                // Consultar la BD para obtener el rol y módulos reales
                try {
                    const response = await SystemService.validateEmail(mockEmail);
                    const data = response.data;
                    setIsAuthenticated(true);
                    setUser({
                        name:     data.nombre || mockName,
                        email:    mockEmail,
                        provider: 'mock',
                        avatar:   null,
                        rol:      data.rol    || 'sysadmin',
                        modulos:  data.modulos || []
                    });
                } catch {
                    // Si falla la BD en dev, entramos igual como sysadmin de emergencia
                    setIsAuthenticated(true);
                    setUser({
                        name:     mockName,
                        email:    mockEmail,
                        provider: 'mock',
                        avatar:   null,
                        rol:      'sysadmin',
                        modulos:  []
                    });
                }
                setLoading(false);
                return;
            }

            // ── AUTENTICACIÓN REAL (Microsoft / Google) ───────────────────────
            let pendingUser = null;
            if (isMsAuthenticated && accounts.length > 0) {
                pendingUser = {
                    name:     accounts[0].name,
                    email:    accounts[0].username,
                    provider: 'microsoft',
                    avatar:   null
                };
            } else if (googleUser) {
                pendingUser = {
                    name:     googleUser.name,
                    email:    googleUser.email,
                    provider: 'google',
                    avatar:   googleUser.picture
                };
            }

            if (pendingUser) {
                // Guardia: ya fue validado en este ciclo
                if (validatedEmail === pendingUser.email) {
                    if (inProgress === InteractionStatus.None) setLoading(false);
                    return;
                }

                try {
                    const response = await SystemService.validateEmail(pendingUser.email);
                    const data = response.data;

                    if (data && data.authorized) {
                        const enrichedUser = {
                            ...pendingUser,
                            name:    data.nombre || pendingUser.name,
                            rol:     data.rol,
                            modulos: data.modulos || []
                        };
                        // Setear header en Axios para todas las requests posteriores
                        setUserEmail(pendingUser.email);
                        setIsAuthenticated(true);
                        setUser(enrichedUser);
                        setAuthError(null);
                    } else {
                        setUserEmail(null);
                        setIsAuthenticated(false);
                        setUser(null);
                        setAuthError(`La cuenta ${pendingUser.email} no está autorizada para acceder a este sistema.`);
                    }
                } catch (error) {
                    console.error('Error validando email:', error);
                    setUserEmail(null);
                    setIsAuthenticated(false);
                    setUser(null);
                    setAuthError('Error de conexión al validar permisos. Intentá de nuevo.');
                }
                setValidatedEmail(pendingUser.email);
                setLoading(false);
            } else {
                setUserEmail(null);
                setIsAuthenticated(false);
                setUser(null);
                setAuthError(null);
                setValidatedEmail(null);
                if (inProgress === InteractionStatus.None) setLoading(false);
            }
        };

        checkAuth();
    // isAuthenticated se omite del dep array a propósito:
    // - En mock mode, mockAuthDone.current actúa de guardia.
    // - En modo real, validatedEmail actúa de guardia de re-validación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMsAuthenticated, accounts, googleUser, inProgress, validatedEmail]);

    const login = () => {
        setAuthError(null);
        if (inProgress === InteractionStatus.None) {
            instance.loginRedirect(loginRequest).catch(e => {
                console.error('[MSAL] Error en loginRedirect:', e);
            });
        }
    };

    const loginGoogle = (decoded) => {
        setAuthError(null);
        setGoogleUser(decoded);
        localStorage.setItem('google_user', JSON.stringify(decoded));
    };

    const logout = () => {
        // Limpiar header de Axios
        setUserEmail(null);
        mockAuthDone.current = false;

        if (user?.provider === 'microsoft' || (validatedEmail && isMsAuthenticated)) {
            instance.logoutRedirect({
                postLogoutRedirectUri: window.location.origin,
            }).catch(e => console.error(e));
        } else {
            setGoogleUser(null);
            localStorage.removeItem('google_user');
            window.location.reload();
        }
    };

    /**
     * Verifica si el usuario tiene alguno de los roles indicados.
     * hasRole('sysadmin')               → true solo para sysadmin
     * hasRole('sysadmin', 'supervisor') → true para ambos roles
     */
    const hasRole = (...roles) => {
        if (!user?.rol) return false;
        return roles.includes(user.rol);
    };

    /**
     * Verifica si el usuario tiene acceso a un módulo.
     * sysadmin siempre tiene acceso a todo.
     */
    const hasModulo = (modulo) => {
        if (!user) return false;
        if (user.rol === 'sysadmin') return true;
        return (user.modulos || []).includes(modulo);
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            loading: loading || inProgress !== InteractionStatus.None,
            inProgress,
            authError,
            login,
            loginGoogle,
            logout,
            hasRole,
            hasModulo
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
