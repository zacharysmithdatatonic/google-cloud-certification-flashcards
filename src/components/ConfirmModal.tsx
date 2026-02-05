import React, { useEffect, useRef } from 'react';

interface ConfirmModalProps {
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    open,
    title,
    message,
    confirmText = 'Yes',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const confirmBtnRef = useRef<HTMLButtonElement>(null);

    // Focus trap and ESC key
    useEffect(() => {
        if (!open) return;
        const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
            'button, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable?.[0];
        const last = focusable?.[focusable.length - 1];
        if (first) first.focus();

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                onCancel();
            } else if (e.key === 'Tab' && focusable && focusable.length > 0) {
                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last?.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first?.focus();
                    }
                }
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal" ref={modalRef} tabIndex={-1}>
                <h2 className="modal-title">{title}</h2>
                <p className="modal-message">{message}</p>
                <div className="modal-actions">
                    <button
                        className="modal-confirm-btn"
                        onClick={onConfirm}
                        ref={confirmBtnRef}
                    >
                        {confirmText}
                    </button>
                    <button className="modal-cancel-btn" onClick={onCancel}>
                        {cancelText}
                    </button>
                </div>
            </div>
            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.32);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal {
                    background: #fff;
                    border-radius: 8px;
                    box-shadow: 0 1px 3px 0 rgba(60,64,67,0.3), 0 8px 16px 4px rgba(60,64,67,0.15);
                    padding: 1.5rem;
                    min-width: 300px;
                    max-width: 90vw;
                    outline: none;
                    animation: modalIn 0.2s cubic-bezier(0.4,0,0.2,1) both;
                }
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: none; }
                }
                .modal-title {
                    margin: 0 0 0.5rem 0;
                    font-size: 1.125rem;
                    font-weight: 500;
                    color: #202124;
                }
                .modal-message {
                    margin: 0 0 1.5rem 0;
                    color: #5f6368;
                    font-size: 0.875rem;
                    line-height: 1.5;
                }
                .modal-actions {
                    display: flex;
                    gap: 0.5rem;
                    justify-content: flex-end;
                }
                .modal-confirm-btn {
                    background: #1a73e8;
                    color: #fff;
                    border: none;
                    border-radius: 4px;
                    padding: 0.5rem 1rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .modal-confirm-btn:hover {
                    background: #1967d2;
                }
                .modal-cancel-btn {
                    background: transparent;
                    color: #1a73e8;
                    border: 1px solid #dadce0;
                    border-radius: 4px;
                    padding: 0.5rem 1rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .modal-cancel-btn:hover {
                    background: #f1f3f4;
                    border-color: #5f6368;
                }
            `}</style>
        </div>
    );
};
