import React from 'react';
import { Card, Switch } from '../components/FormElements';
import { useTheme } from '../config/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const Settings = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="card-anim" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2.4rem', fontWeight: '900', color: 'var(--primary)' }}>
                    Configuración<span style={{ color: 'var(--dy-red)' }}>.</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Personaliza tu experiencia de usuario.</p>
            </header>

            <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px',
                            background: theme === 'light' ? '#fff7ed' : '#1e293b',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: theme === 'light' ? '#f59e0b' : '#94a3b8'
                        }}>
                            {theme === 'light' ? <Sun size={24} /> : <Moon size={24} />}
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Modo de Visualización</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Cambia entre el tema claro y oscuro del sistema.</p>
                        </div>
                    </div>

                    <Switch
                        checked={theme === 'dark'}
                        onChange={toggleTheme}
                        activeLabel="Modo Oscuro"
                        inactiveLabel="Modo Claro"
                    />
                </div>
            </Card>

            <div style={{
                marginTop: '40px', padding: '24px', borderRadius: 'var(--radius)',
                background: theme === 'light' ? 'rgba(13, 44, 92, 0.05)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px dashed var(--border)'
            }}>
                <p style={{ fontSize: '0.9rem', color: theme === 'light' ? 'var(--dy-blue)' : 'var(--text-muted)', textAlign: 'center' }}>
                    Próximamente estaremos añadiendo más opciones de personalización.
                </p>
            </div>
        </div>
    );
};

export default Settings;
