// ToastContext — Global toast provider
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ visible: false, message: '', variant: 'success' });
  const timeoutRef = useRef(null);

  const showToast = useCallback((message, variant = 'success', duration = 2000) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast({ visible: true, message, variant });
    timeoutRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, duration + 400);
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        message={toast.message}
        variant={toast.variant}
        visible={toast.visible}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
