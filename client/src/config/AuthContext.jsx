import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "./msal";
import { InteractionStatus } from "@azure/msal-browser";
import { SystemService } from '../services/api';

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
            // BYPASS DE AUTENTICACION PARA DESARROLLO LOCAL
            if (import.meta.env.DEV && import.meta.env.VITE_MOCK_AUTH === 'true') {
                const mockEmail = import.meta.env.VITE_MOCK_AUTH_EMAIL;
                const mockName = import.meta.env.VITE_MOCK_AUTH_NAME || "Usuario Mock";

                console.log(`⚠️ MODO MOCK ACTIVADO: Entrando como ${mockEmail}`);
                setIsAuthenticated(true);
                setUser({
                    name: mockName,
                    email: mockEmail,
                    provider: 'mock',
                    avatar: null
                });
                setLoading(false);
                return;
            }

            let pendingUser = null;
            if (isMsAuthenticated && accounts.length > 0) {
                pendingUser = {
                    name: accounts[0].name,
                    email: accounts[0].username,
                    provider: 'microsoft',
                    avatar: null
                };
            } else if (googleUser) {
                pendingUser = {
                    name: googleUser.name,
                    email: googleUser.email,
                    provider: 'google',
                    avatar: googleUser.picture
                };
            }

            if (pendingUser) {
                if (validatedEmail === pendingUser.email) {
                    // Ya validado
                    if (!isAuthenticated && inProgress === InteractionStatus.None) {
                        setLoading(false);
                    }
                    return;
                }

                try {
                    const response = await SystemService.validateEmail(pendingUser.email);
                    if (response.data && response.data.authorized) {
                        setIsAuthenticated(true);
                        setUser(pendingUser);
                        setAuthError(null);
                    } else {
                        setIsAuthenticated(false);
                        setUser(null);
                        setAuthError(`La cuenta ${pendingUser.email} no está autorizada.`);
                    }
                } catch (error) {
                    console.error("Error validando email:", error);
                    setIsAuthenticated(false);
                    setUser(null);
                    setAuthError("Error de conexión al validar permisos.");
                }
                setValidatedEmail(pendingUser.email);
                setLoading(false);
            } else {
                setIsAuthenticated(false);
                setUser(null);
                setAuthError(null);
                setValidatedEmail(null);
                if (inProgress === InteractionStatus.None) {
                    setLoading(false);
                }
            }
        };

        checkAuth();
    }, [isMsAuthenticated, accounts, googleUser, inProgress, validatedEmail, isAuthenticated]);

    const login = () => {
        setAuthError(null);
        if (inProgress === InteractionStatus.None) {
            instance.loginRedirect(loginRequest).catch(e => {
                console.error("[MSAL] Error en loginRedirect:", e);
            });
        }
    };

    const loginGoogle = (decoded) => {
        setAuthError(null);
        setGoogleUser(decoded);
        localStorage.setItem('google_user', JSON.stringify(decoded));
    };

    const logout = () => {
        if (user?.provider === 'microsoft' || (validatedEmail && isMsAuthenticated)) {
            instance.logoutRedirect({
                postLogoutRedirectUri: window.location.origin,
            }).catch(e => {
                console.error(e);
            });
        } else {
            setGoogleUser(null);
            localStorage.removeItem('google_user');
            window.location.reload();
        }
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
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
