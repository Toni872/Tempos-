import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, X } from '@phosphor-icons/react';

const FeedbackContext = createContext(null);

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showFeedback = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <FeedbackContext.Provider value={{ showFeedback }}>
      {children}

      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`
                pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border
                ${toast.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}
              `}
            >
              {toast.type === 'success'
                ? <CheckCircle size={20} weight="fill" />
                : <XCircle size={20} weight="fill" />
              }
              <span className="text-sm font-bold">{toast.message}</span>
              <button
                onClick={() => dismissToast(toast.id)}
                className="ml-2 p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used within FeedbackProvider');
  return ctx;
}
