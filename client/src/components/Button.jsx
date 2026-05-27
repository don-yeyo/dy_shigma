import React from 'react';

export const Button = ({ children, variant = 'primary', size = 'md', className = '', style = {}, loading = false, disabled = false, ...props }) => {
    const baseClass = 'btn';
    const variantClass = `btn-${variant}`;
    const sizeClass = `btn-${size}`;

    return (
        <button
            className={`${baseClass} ${variantClass} ${sizeClass} ${className} ${loading ? 'btn-loading' : ''}`}
            style={{ ...style, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg className="spinner" viewBox="0 0 50 50" style={{ width: '18px', height: '18px' }}>
                    <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                </svg>
            )}
            {children}
        </button>
    );
};
