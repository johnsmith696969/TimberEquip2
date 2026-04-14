import { useState, useCallback, useRef } from 'react';
import type { ConfirmDialogProps } from '../components/ConfirmDialog';

interface ConfirmOptions {
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface AlertOptions {
  title: string;
  message: string | React.ReactNode;
  variant?: 'danger' | 'warning' | 'info';
}

/**
 * Hook that provides imperative `confirm()` and `alert()` helpers.
 * Returns `dialogProps` that must be spread onto `<ConfirmDialog>`.
 */
export function useConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ title: '', message: '' });
  const [alertOnly, setAlertOnly] = useState(false);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setAlertOnly(false);
      setOptions(opts);
      setOpen(true);
    });
  }, []);

  const alert = useCallback((opts: AlertOptions): Promise<void> => {
    return new Promise<void>((resolve) => {
      resolveRef.current = () => resolve();
      setAlertOnly(true);
      setOptions({ ...opts, confirmLabel: 'OK' });
      setOpen(true);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setOpen(false);
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setOpen(false);
  }, []);

  const dialogProps: ConfirmDialogProps & { alertOnly?: boolean } = {
    open,
    title: options.title,
    message: options.message,
    confirmLabel: options.confirmLabel,
    cancelLabel: options.cancelLabel,
    variant: options.variant,
    alertOnly,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  };

  return { confirm, alert, dialogProps } as const;
}
