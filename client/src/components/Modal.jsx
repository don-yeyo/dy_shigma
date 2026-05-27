import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, message, children, onConfirm, type = 'info', confirmLabel = 'Continuar', cancelLabel = 'Cancelar', showCancel = true, maxWidth }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        onClose();
    };

    return createPortal(
        <div className="modal-overlay" onClick={showCancel ? onClose : undefined}>
            <div
                className={`modal-content ${type}`}
                style={{
                    maxWidth: maxWidth || '500px',
                    width: '100%',
                    margin: '20px'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    {showCancel && (
                        <button className="modal-close-btn" onClick={onClose}>&times;</button>
                    )}
                </div>
                <div className="modal-body">
                    {children ? children : (typeof message === 'string' ? <p>{message}</p> : message)}
                </div>
                <div className="modal-footer">
                    {showCancel && (
                        <button className="btn-secondary" onClick={onClose}>{cancelLabel}</button>
                    )}
                    <button className={`btn-primary ${type === 'error' ? 'btn-error' : type === 'warning' ? 'btn-warning' : ''}`} onClick={handleConfirm}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
