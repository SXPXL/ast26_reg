import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, RotateCcw, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ message, type = 'info', duration = 4000, onUndo = null }) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type, onUndo };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const success = useCallback((msg, duration) => addToast({ message: msg, type: 'success', duration }), [addToast]);
  const error = useCallback((msg, duration) => addToast({ message: msg, type: 'error', duration }), [addToast]);
  const info = useCallback((msg, duration) => addToast({ message: msg, type: 'info', duration }), [addToast]);
  const undo = useCallback((msg, onUndoCallback, duration = 6000) => {
    return addToast({ message: msg, type: 'undo', duration, onUndo: onUndoCallback });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info, undo }}>
      {children}
      {/* Toast Overlay Container */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '420px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isUndo = toast.type === 'undo';

          let borderColor = 'rgba(212, 175, 55, 0.4)';
          let iconColor = 'var(--gold-bright)';
          let bgColor = 'rgba(15, 15, 22, 0.92)';

          if (isSuccess) {
            borderColor = 'rgba(16, 185, 129, 0.5)';
            iconColor = '#34D399';
          } else if (isError) {
            borderColor = 'rgba(239, 68, 68, 0.5)';
            iconColor = '#F87171';
          } else if (isUndo) {
            borderColor = 'rgba(212, 175, 55, 0.6)';
            iconColor = '#F5D77F';
          }

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '12px 18px',
                borderRadius: '14px',
                background: bgColor,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid ${borderColor}`,
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(212, 175, 55, 0.1)',
                color: 'var(--text-white)',
                fontSize: '0.88rem',
                fontWeight: '500',
                animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isSuccess && <CheckCircle2 size={18} color={iconColor} />}
                {isError && <AlertCircle size={18} color={iconColor} />}
                {isUndo && <CheckCircle2 size={18} color={iconColor} />}
                {!isSuccess && !isError && !isUndo && <Info size={18} color={iconColor} />}
                <span>{toast.message}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isUndo && toast.onUndo && (
                  <button
                    onClick={() => {
                      toast.onUndo();
                      removeToast(toast.id);
                    }}
                    style={{
                      background: 'rgba(212, 175, 55, 0.18)',
                      border: '1px solid rgba(212, 175, 55, 0.4)',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      color: 'var(--gold-bright)',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(212, 175, 55, 0.35)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(212, 175, 55, 0.18)')}
                  >
                    <RotateCcw size={12} />
                    <span>Undo</span>
                  </button>
                )}

                <button
                  onClick={() => removeToast(toast.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
