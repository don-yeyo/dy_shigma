import React, { useState, useEffect, useCallback } from 'react';
import { UsersService } from '../services/api';
import { useAuth } from '../config/AuthContext';
import {
    UserPlus, Pencil, UserX, UserCheck, ShieldCheck, Shield, User,
    X, Check, Loader2, AlertCircle, RefreshCw
} from 'lucide-react';

// ─── Constantes ──────────────────────────────────────────────────────────────

const MODULO_LABELS = {
    'residuos-comunes': 'Residuos No Especiales (RINE)',
    'gestion-bateas': 'Gestión de Bateas',
    'residuos-especiales': 'Residuos Especiales',
    'devoluciones': 'Devoluciones',
    'tratamiento': 'Tratamiento de Residuos',
    'economia-circular': 'Economía Circular',
    'pallets': 'Gestión de Pallets',
    'espacios-verdes': 'Espacios Verdes',
    'historial': 'Historial de Registros',
    'gestion-operadores': 'Gestión de Operadores',
};

const ROL_CONFIG = {
    sysadmin: { label: 'Administrador', color: 'var(--dy-red)', bg: 'rgba(228,5,33,0.1)', Icon: ShieldCheck },
    supervisor: { label: 'Supervisor', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', Icon: Shield },
    registrador: { label: 'Registrador', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', Icon: User },
};

const EMPTY_FORM = { email: '', nombre: '', rol: 'registrador', modulos: [] };

// ─── Sub-componentes ──────────────────────────────────────────────────────────

const RolBadge = ({ rol }) => {
    const cfg = ROL_CONFIG[rol] || {};
    const Icon = cfg.Icon || User;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px',
            borderRadius: '999px', background: cfg.bg, color: cfg.color,
            textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap'
        }}>
            <Icon size={11} />
            {cfg.label}
        </span>
    );
};

const Toast = ({ msg, type, onClose }) => {
    useEffect(() => {
        const t = setTimeout(onClose, 3500);
        return () => clearTimeout(t);
    }, [onClose]);
    return (
        <div style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
            padding: '14px 20px', borderRadius: '12px', maxWidth: '360px',
            background: type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
            border: `1px solid ${type === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)'}`,
            color: type === 'error' ? '#ef4444' : '#22c55e',
            backdropFilter: 'blur(12px)', boxShadow: 'var(--shadow-lg)',
            display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600
        }}>
            {type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
            {msg}
        </div>
    );
};

// ─── Modal de Crear / Editar Usuario ─────────────────────────────────────────

const UserModal = ({ initialData, modulosDisponibles, onSave, onClose, isCreating }) => {
    const [form, setForm] = useState(initialData || EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const toggleModulo = (mod) => {
        setForm(f => ({
            ...f,
            modulos: f.modulos.includes(mod)
                ? f.modulos.filter(m => m !== mod)
                : [...f.modulos, mod]
        }));
    };

    const selectAllModulos = () => setForm(f => ({ ...f, modulos: modulosDisponibles }));
    const clearModulos = () => setForm(f => ({ ...f, modulos: [] }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!form.email.trim() || !form.nombre.trim()) {
            setError('Email y nombre son requeridos.');
            return;
        }
        setSaving(true);
        try {
            await onSave(form);
        } catch (err) {
            setError(err?.response?.data?.error || 'Error al guardar el usuario.');
        } finally {
            setSaving(false);
        }
    };

    const isSysadmin = form.rol === 'sysadmin';

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px'
        }}>
            <div className="card" style={{
                width: '100%', maxWidth: '540px', maxHeight: '90vh',
                overflowY: 'auto', padding: '28px'
            }}>
                {/* Header del modal */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--header-text)', margin: 0 }}>
                        {isCreating ? 'Nuevo Usuario' : 'Editar Usuario'}
                    </h2>
                    <button className="mode-toggle" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Email */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Email *
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            disabled={!isCreating}
                            placeholder="usuario@empresa.com"
                            style={{
                                width: '100%', padding: '10px 14px',
                                border: '1px solid var(--border)', borderRadius: '10px',
                                background: isCreating ? 'var(--surface)' : 'var(--surface-2)',
                                color: 'var(--text)', fontSize: '0.9rem',
                                opacity: isCreating ? 1 : 0.6, cursor: isCreating ? 'text' : 'not-allowed'
                            }}
                        />
                    </div>

                    {/* Nombre */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Nombre completo *
                        </label>
                        <input
                            type="text"
                            value={form.nombre}
                            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                            placeholder="Apellido Nombre"
                            style={{
                                width: '100%', padding: '10px 14px',
                                border: '1px solid var(--border)', borderRadius: '10px',
                                background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem'
                            }}
                        />
                    </div>

                    {/* Rol */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Rol
                        </label>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {Object.entries(ROL_CONFIG).map(([rol, cfg]) => {
                                const Icon = cfg.Icon;
                                const selected = form.rol === rol;
                                return (
                                    <button
                                        key={rol}
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, rol }))}
                                        style={{
                                            padding: '8px 16px', borderRadius: '10px',
                                            border: selected ? `2px solid ${cfg.color}` : '1px solid var(--border)',
                                            background: selected ? cfg.bg : 'transparent',
                                            color: selected ? cfg.color : 'var(--text-muted)',
                                            fontWeight: selected ? 700 : 500, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            fontSize: '0.85rem', transition: 'all 0.15s'
                                        }}
                                    >
                                        <Icon size={14} /> {cfg.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Módulos — solo si no es sysadmin */}
                    {!isSysadmin && (
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Módulos habilitados
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button type="button" onClick={selectAllModulos}
                                        style={{ fontSize: '0.72rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                        Seleccionar todos
                                    </button>
                                    <button type="button" onClick={clearModulos}
                                        style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        Limpiar
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {modulosDisponibles.map(mod => {
                                    const checked = form.modulos.includes(mod);
                                    return (
                                        <label
                                            key={mod}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                padding: '8px 12px', borderRadius: '10px', cursor: 'pointer',
                                                background: checked ? 'rgba(34,197,94,0.08)' : 'var(--surface)',
                                                border: checked ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border)',
                                                transition: 'all 0.15s', fontSize: '0.82rem', color: 'var(--text)',
                                                fontWeight: checked ? 600 : 400
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleModulo(mod)}
                                                style={{ accentColor: '#22c55e', width: '15px', height: '15px' }}
                                            />
                                            {MODULO_LABELS[mod] || mod}
                                        </label>
                                    );
                                })}
                            </div>
                            {isSysadmin && (
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
                                    El sysadmin tiene acceso a todos los módulos automáticamente.
                                </p>
                            )}
                        </div>
                    )}

                    {isSysadmin && (
                        <div style={{
                            padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
                            background: 'rgba(228,5,33,0.07)', border: '1px solid rgba(228,5,33,0.2)',
                            fontSize: '0.82rem', color: 'var(--dy-red)', fontWeight: 500
                        }}>
                            Los administradores tienen acceso completo a todos los módulos y funciones del sistema.
                        </div>
                    )}

                    {error && (
                        <div style={{
                            padding: '10px 14px', borderRadius: '10px', marginBottom: '16px',
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                            color: '#ef4444', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center'
                        }}>
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} className="btn btn-outline" style={{ padding: '10px 20px' }}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving}
                            style={{
                                padding: '10px 24px', borderRadius: '10px', border: 'none',
                                background: 'var(--dy-red)', color: '#fff', fontWeight: 700,
                                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                                display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem'
                            }}>
                            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
                            {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Componente Principal ─────────────────────────────────────────────────────

const GestionUsuarios = () => {
    const { user: currentUser } = useAuth();

    const [usuarios, setUsuarios] = useState([]);
    const [modulosDisponibles, setModulosDisponibles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [modalState, setModalState] = useState({ open: false, data: null, isCreating: false });
    const [filtroRol, setFiltroRol] = useState('');
    const [filtroActivo, setFiltroActivo] = useState('todos');

    const showToast = (msg, type = 'ok') => setToast({ msg, type });

    const fetchUsuarios = useCallback(async () => {
        setLoading(true);
        try {
            const res = await UsersService.getUsuarios();
            setUsuarios(res.data.usuarios);
            setModulosDisponibles(res.data.modulos_disponibles);
        } catch (err) {
            showToast('Error al cargar usuarios.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

    const openCreate = () => setModalState({ open: true, data: EMPTY_FORM, isCreating: true });

    const openEdit = (u) => setModalState({
        open: true,
        isCreating: false,
        data: { email: u.email, nombre: u.nombre, rol: u.rol, modulos: u.modulos }
    });

    const closeModal = () => setModalState({ open: false, data: null, isCreating: false });

    const handleSave = async (form) => {
        if (modalState.isCreating) {
            await UsersService.createUsuario(form);
            showToast(`Usuario ${form.nombre} creado exitosamente.`);
        } else {
            // Buscar el usuario que se está editando
            const target = usuarios.find(u => u.email === form.email);
            if (target) {
                await UsersService.updateUsuario(target.id, { nombre: form.nombre, rol: form.rol });
                await UsersService.updateModulos(target.id, form.modulos);
            }
            showToast(`Usuario actualizado.`);
        }
        closeModal();
        fetchUsuarios();
    };

    const handleToggleActivo = async (u) => {
        try {
            if (u.activo) {
                await UsersService.deleteUsuario(u.id);
                showToast(`${u.nombre} fue desactivado.`);
            } else {
                await UsersService.updateUsuario(u.id, { activo: true });
                showToast(`${u.nombre} fue reactivado.`);
            }
            fetchUsuarios();
        } catch (err) {
            showToast(err?.response?.data?.error || 'Error al cambiar estado del usuario.', 'error');
        }
    };

    // Filtrado
    const usuariosFiltrados = usuarios.filter(u => {
        if (filtroRol && u.rol !== filtroRol) return false;
        if (filtroActivo === 'activos' && !u.activo) return false;
        if (filtroActivo === 'inactivos' && u.activo) return false;
        return true;
    });

    const counts = {
        sysadmin: usuarios.filter(u => u.rol === 'sysadmin').length,
        supervisor: usuarios.filter(u => u.rol === 'supervisor').length,
        registrador: usuarios.filter(u => u.rol === 'registrador').length,
        total: usuarios.length,
        activos: usuarios.filter(u => u.activo).length,
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>

            {/* Toast */}
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* Modal */}
            {modalState.open && (
                <UserModal
                    initialData={modalState.data}
                    modulosDisponibles={modulosDisponibles}
                    onSave={handleSave}
                    onClose={closeModal}
                    isCreating={modalState.isCreating}
                />
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--header-text)', margin: 0 }}>
                        Gestión de Usuarios
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.9rem' }}>
                        Administrá usuarios, roles y módulos del sistema SHIGMA.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 20px', borderRadius: '12px', border: 'none',
                        background: 'var(--dy-red)', color: '#fff', fontWeight: 700,
                        cursor: 'pointer', fontSize: '0.9rem', transition: 'opacity 0.2s'
                    }}
                >
                    <UserPlus size={18} /> Nuevo Usuario
                </button>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                {[
                    { label: 'Total', value: counts.total, color: 'var(--text)' },
                    { label: 'Activos', value: counts.activos, color: '#22c55e' },
                    { label: 'Administradores', value: counts.sysadmin, color: 'var(--dy-red)' },
                    { label: 'Supervisores', value: counts.supervisor, color: '#3b82f6' },
                    { label: 'Registradores', value: counts.registrador, color: '#a78bfa' },
                ].map(kpi => (
                    <div key={kpi.label} className="card" style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <p style={{ fontSize: '1.8rem', fontWeight: 900, color: kpi.color, margin: 0 }}>{kpi.value}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0', fontWeight: 600 }}>{kpi.label}</p>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                    value={filtroRol}
                    onChange={e => setFiltroRol(e.target.value)}
                    style={{
                        padding: '8px 14px', borderRadius: '10px',
                        border: '1px solid var(--border)', background: 'var(--surface)',
                        color: 'var(--text)', fontSize: '0.85rem', cursor: 'pointer'
                    }}
                >
                    <option value="">Todos los roles</option>
                    {Object.entries(ROL_CONFIG).map(([r, cfg]) => (
                        <option key={r} value={r}>{cfg.label}</option>
                    ))}
                </select>

                <select
                    value={filtroActivo}
                    onChange={e => setFiltroActivo(e.target.value)}
                    style={{
                        padding: '8px 14px', borderRadius: '10px',
                        border: '1px solid var(--border)', background: 'var(--surface)',
                        color: 'var(--text)', fontSize: '0.85rem', cursor: 'pointer'
                    }}
                >
                    <option value="todos">Todos los estados</option>
                    <option value="activos">Solo activos</option>
                    <option value="inactivos">Solo inactivos</option>
                </select>

                <button onClick={fetchUsuarios} title="Recargar"
                    style={{
                        padding: '8px 12px', borderRadius: '10px',
                        border: '1px solid var(--border)', background: 'var(--surface)',
                        color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center'
                    }}>
                    <RefreshCw size={15} />
                </button>

                <p style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {usuariosFiltrados.length} usuario{usuariosFiltrados.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Tabla */}
            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '12px', color: 'var(--text-muted)' }}>
                        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                        Cargando usuarios...
                    </div>
                ) : usuariosFiltrados.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                        <UserPlus size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                        <p style={{ fontWeight: 600 }}>No hay usuarios que coincidan con los filtros.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    {['Usuario', 'Email', 'Rol', 'Módulos', 'Estado', 'Acciones'].map(h => (
                                        <th key={h} style={{
                                            padding: '14px 16px', textAlign: 'left',
                                            fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)',
                                            textTransform: 'uppercase', letterSpacing: '0.8px',
                                            background: 'var(--surface-2)'
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {usuariosFiltrados.map((u, idx) => {
                                    const isMe = u.email === currentUser?.email;
                                    return (
                                        <tr key={u.id} style={{
                                            borderBottom: '1px solid var(--border)',
                                            background: idx % 2 === 0 ? 'transparent' : 'var(--surface-2)',
                                            opacity: u.activo ? 1 : 0.5,
                                            transition: 'background 0.15s'
                                        }}>
                                            <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem' }}>
                                                {u.nombre}
                                                {isMe && (
                                                    <span style={{ marginLeft: '8px', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                                        (vos)
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                {u.email}
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <RolBadge rol={u.rol} />
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                {u.rol === 'sysadmin' ? (
                                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Todos</span>
                                                ) : u.modulos.length === 0 ? (
                                                    <span style={{ fontSize: '0.78rem', color: '#ef4444' }}>Sin módulos</span>
                                                ) : (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                        {u.modulos.slice(0, 3).map(m => (
                                                            <span key={m} style={{
                                                                fontSize: '0.68rem', padding: '2px 7px',
                                                                borderRadius: '6px', background: 'var(--surface)',
                                                                border: '1px solid var(--border)', color: 'var(--text-muted)'
                                                            }}>
                                                                {MODULO_LABELS[m] || m}
                                                            </span>
                                                        ))}
                                                        {u.modulos.length > 3 && (
                                                            <span style={{
                                                                fontSize: '0.68rem', padding: '2px 7px',
                                                                borderRadius: '6px', background: 'var(--surface)',
                                                                border: '1px solid var(--border)', color: 'var(--text-muted)'
                                                            }}>
                                                                +{u.modulos.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                    fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px',
                                                    borderRadius: '999px',
                                                    background: u.activo ? 'rgba(34,197,94,0.1)' : 'rgba(156,163,175,0.1)',
                                                    color: u.activo ? '#22c55e' : '#9ca3af',
                                                    textTransform: 'uppercase', letterSpacing: '0.5px'
                                                }}>
                                                    {u.activo ? <UserCheck size={11} /> : <UserX size={11} />}
                                                    {u.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => openEdit(u)}
                                                        title="Editar usuario"
                                                        style={{
                                                            padding: '7px', borderRadius: '8px',
                                                            border: '1px solid var(--border)',
                                                            background: 'var(--surface)', color: 'var(--text-muted)',
                                                            cursor: 'pointer', display: 'flex', alignItems: 'center'
                                                        }}
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleActivo(u)}
                                                        disabled={isMe}
                                                        title={u.activo ? 'Desactivar usuario' : 'Reactivar usuario'}
                                                        style={{
                                                            padding: '7px', borderRadius: '8px',
                                                            border: `1px solid ${u.activo ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                                                            background: u.activo ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                                                            color: u.activo ? '#ef4444' : '#22c55e',
                                                            cursor: isMe ? 'not-allowed' : 'pointer',
                                                            opacity: isMe ? 0.4 : 1,
                                                            display: 'flex', alignItems: 'center'
                                                        }}
                                                    >
                                                        {u.activo ? <UserX size={14} /> : <UserCheck size={14} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Info de límites de edición para registradores */}
            <div style={{
                marginTop: '20px', padding: '14px 18px', borderRadius: '12px',
                background: 'var(--surface)', border: '1px solid var(--border)',
                fontSize: '0.82rem', color: 'var(--text-muted)'
            }}>
                <strong style={{ color: 'var(--text)' }}>Restricciones de edición para Registradores:</strong>
                {' '}Los registradores pueden modificar sus registros propios hasta{' '}
                <strong style={{ color: 'var(--text)' }}>
                    {import.meta.env.VITE_REGISTRADOR_MAX_EDIT_DAYS || '7'} días
                </strong>
                {' '}hacia atrás y un máximo de{' '}
                <strong style={{ color: 'var(--text)' }}>
                    {import.meta.env.VITE_REGISTRADOR_MAX_EDITS_PER_RECORD || '3'} veces
                </strong>
                {' '}por registro. Configurado en variables de entorno.
            </div>
        </div>
    );
};

export default GestionUsuarios;
