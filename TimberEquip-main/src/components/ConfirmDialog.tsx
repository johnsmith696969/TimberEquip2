import React, { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useFocusTrap } from '../hooks/useFocusTrap';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  alertOnly?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ICON_MAP = {
  danger: Trash2,
  warning: AlertTriangle,
  info: ShieldAlert,
};

const ACCENT_MAP = {
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  info: 'bg-accent hover:bg-accent/90 text-white',
};

const ICON_COLOR_MAP = {
  danger: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-accent',
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  alertOnly = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const trapRef = useFocusTrap(open);
  const prefersReducedMotion = useReducedMotion();
  const Icon = ICON_MAP[variant];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    },
    [onCancel],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.15 }}
            className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
            onClick={onCancel}
            aria-hidden="true"
          />
          <motion.div
            ref={trapRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.15 }}
            className="relative w-full max-w-md bg-bg border border-line rounded-sm shadow-2xl overflow-hidden"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className={`shrink-0 mt-0.5 ${ICON_COLOR_MAP[variant]}`}>
                  <Icon size={24} />
                </div>
                <div className="space-y-2">
                  <h2
                    id="confirm-dialog-title"
                    className="text-sm font-black uppercase tracking-tight text-ink"
                  >
                    {title}
                  </h2>
                  <div
                    id="confirm-dialog-message"
                    className="text-xs font-medium text-muted leading-relaxed"
                  >
                    {message}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-line px-6 py-4 bg-surface/50">
              {!alertOnly && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-ink border border-line rounded-sm hover:bg-surface transition-colors"
                >
                  {cancelLabel}
                </button>
              )}
              <button
                type="button"
                onClick={alertOnly ? onCancel : onConfirm}
                className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-sm transition-colors ${ACCENT_MAP[variant]}`}
              >
                {alertOnly ? (confirmLabel || 'OK') : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
