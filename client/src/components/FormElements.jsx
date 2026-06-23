import React from 'react';

export const Card = ({ children, className = '', style = {}, ...props }) => {
    return (
        <div
            style={{
                padding: '24px',
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--surface)',
                marginBottom: '16px',
                ...style
            }}
            className={`glass ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export const Input = ({ label, containerId, allowNegative = false, ...props }) => {
    const isNumber = props.type === 'number';

    const handleMouseDown = (e) => {
        if (isNumber && document.activeElement !== e.target) {
            e.preventDefault();
            e.target.focus();
            e.target.select();
        }
        if (props.onMouseDown) {
            props.onMouseDown(e);
        }
    };

    const handleFocus = (e) => {
        if (isNumber) {
            e.target.select();
        }
        if (props.onFocus) {
            props.onFocus(e);
        }
    };

    const handleKeyDown = (e) => {
        if (isNumber && !allowNegative && e.key === '-') {
            e.preventDefault();
        }
        if (isNumber && (e.key === 'e' || e.key === 'E')) {
            e.preventDefault();
        }
        if (props.onKeyDown) {
            props.onKeyDown(e);
        }
    };

    const handleChange = (e) => {
        if (isNumber && !allowNegative) {
            let val = e.target.value;
            if (val.includes('-')) {
                val = val.replace(/-/g, '');
                e.target.value = val;
            }
        }
        if (props.onChange) {
            props.onChange(e);
        }
    };

    return (
        <div id={containerId} style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {label && <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500' }}>{label}</label>}
            <input
                style={{ width: '100%', outline: 'none' }}
                {...props}
                onMouseDown={handleMouseDown}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                onChange={handleChange}
            />
        </div>
    );
};

export const Textarea = ({ label, ...props }) => {
    return (
        <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {label && <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500' }}>{label}</label>}
            <textarea
                style={{ width: '100%', outline: 'none', minHeight: '100px', resize: 'vertical' }}
                {...props}
            />
        </div>
    );
};

export const Select = ({ label, options = [], includePlaceholder = false, name, value, onChange, containerId, ...props }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef(null);

    const selectedOption = options.find(opt => String(opt.id || opt.value || opt) === String(value));
    const displayLabel = selectedOption ? (selectedOption.label || selectedOption.nombre || selectedOption) : (includePlaceholder ? '-- Seleccione --' : '');

    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (opt) => {
        const val = opt === '' ? '' : (opt.id || opt.value || opt);
        if (onChange) {
            onChange({ target: { name, value: val } });
        }
        setIsOpen(false);
    };

    return (
        <div id={containerId} ref={containerRef} style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', opacity: props.disabled ? 0.6 : 1, zIndex: isOpen ? 2005 : 1 }}>
            {label && <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500', display: 'block' }}>{label}</label>}

            <div
                onClick={() => !props.disabled && setIsOpen(!isOpen)}
                style={{
                    width: '100%', padding: '12px 16px', minHeight: '46px',
                    backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', color: value ? 'var(--text)' : 'var(--text-muted)',
                    cursor: props.disabled ? 'not-allowed' : 'pointer', fontSize: '1rem',
                    position: 'relative', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', transition: 'all 0.2s ease'
                }}
            >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '20px', fontWeight: value ? '600' : '400' }}>
                    {displayLabel}
                </span>
                {!props.disabled && (
                    <div style={{ transform: `rotate(${isOpen ? '180deg' : '0deg'})`, transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="glass card-anim" style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                    zIndex: 2000, backgroundColor: 'var(--surface)', borderRadius: 'var(--radius)',
                    maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border)',
                    padding: '8px 0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}>
                    {includePlaceholder && (
                        <div onClick={() => handleSelect('')} style={{ padding: '10px 16px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-muted)', transition: 'background 0.2s ease' }}
                            onMouseEnter={(e) => e.target.style.background = 'var(--surface-hover)'}
                            onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                            -- Seleccione --
                        </div>
                    )}
                    {options.map((opt, i) => {
                        const optVal = opt.id || opt.value || opt;
                        const optLabel = opt.label || opt.nombre || opt;
                        const isSelected = String(optVal) === String(value);
                        return (
                            <div key={i} onClick={() => handleSelect(opt)} style={{
                                padding: '10px 16px', cursor: 'pointer', fontSize: '0.9rem',
                                color: isSelected ? 'var(--dy-red)' : 'var(--text)',
                                fontWeight: isSelected ? '700' : '400',
                                background: isSelected ? 'rgba(228, 5, 33, 0.05)' : 'transparent',
                                transition: 'all 0.2s ease'
                            }}
                                onMouseEnter={(e) => e.target.style.background = isSelected ? 'rgba(228, 5, 33, 0.1)' : 'var(--surface-hover)'}
                                onMouseLeave={(e) => e.target.style.background = isSelected ? 'rgba(228, 5, 33, 0.05)' : 'transparent'}>
                                {optLabel}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const Switch = ({ label, name, checked, onChange, activeLabel = 'Activado', inactiveLabel = 'Desactivado', style, ...props }) => {
    return (
        <div style={{ marginBottom: '16px', ...style, opacity: props.disabled ? 0.6 : 1 }}>
            {label && <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500', display: 'block', marginBottom: '8px' }}>{label}</label>}
            <div
                onClick={() => !props.disabled && onChange({ target: { name, value: !checked, type: 'checkbox', checked: !checked } })}
                style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    cursor: props.disabled ? 'not-allowed' : 'pointer', padding: '12px 16px',
                    backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', transition: 'all 0.2s ease'
                }}
            >
                <div style={{
                    width: '40px', height: '20px',
                    backgroundColor: checked ? 'var(--primary)' : 'var(--border)',
                    borderRadius: '10px', position: 'relative', transition: 'all 0.2s ease'
                }}>
                    <div style={{
                        width: '16px', height: '16px', backgroundColor: '#fff',
                        borderRadius: '50%', position: 'absolute', top: '2px',
                        left: checked ? '22px' : '2px', transition: 'all 0.2s ease'
                    }} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: checked ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {checked ? activeLabel : inactiveLabel}
                </span>
            </div>
        </div>
    );
};
