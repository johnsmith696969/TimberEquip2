import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useAuth } from './AuthContext';
import { verifyRecaptchaAction } from '../services/recaptchaService';
import { clearPendingFavoriteIntent, getPendingFavoriteIntent } from '../utils/pendingFavorite';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  onSuccess?: () => void;
  message?: string;
}

export function LoginPromptModal({ isOpen, onClose, onDismiss, onSuccess, message }: LoginPromptModalProps) {
  const { login, loginWithGoogle } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pendingFavoriteIntent = getPendingFavoriteIntent();
  const currentPath = `${location.pathname}${location.search}${location.hash}` || '/';
  const authRedirectTarget = (pendingFavoriteIntent?.returnTo || currentPath).startsWith('/')
    ? (pendingFavoriteIntent?.returnTo || currentPath)
    : '/';
  const loginHref = `/login?redirect=${encodeURIComponent(authRedirectTarget)}`;
  const registerHref = `/register?redirect=${encodeURIComponent(authRedirectTarget)}`;

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const recaptchaPassed = await verifyRecaptchaAction('LOGIN_PROMPT');
      if (!recaptchaPassed) {
        setError('Security check failed. Please refresh and try again.');
        setLoading(false);
        return;
      }

      await login(email.trim(), password);
      handleSuccess();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password. Use your Forestry Equipment Sales password or reset it if needed.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please wait a moment and try again.');
      } else {
        setError(err instanceof Error ? err.message.replace('Firebase: ', '').replace(/ \(auth\/.+\)/, '') : 'Sign in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      handleSuccess();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/unauthorized-domain') {
        setError('Google sign-in is not authorized for this domain in Firebase Auth yet.');
      } else if (code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed before completion. Please try again.');
      } else if (code === 'auth/cancelled-popup-request') {
        setError('A Google sign-in request was interrupted. Try again in one window.');
      } else {
        setError(err instanceof Error ? err.message.replace('Firebase: ', '').replace(/ \(auth\/.+\)/, '') : 'Google sign in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const trapRef = useFocusTrap(isOpen);

  const handleClose = () => {
    if (loading) return;
    setEmail('');
    setPassword('');
    setError('');
    clearPendingFavoriteIntent();
    onDismiss?.();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        setEmail(''); setPassword(''); setError('');
        clearPendingFavoriteIntent();
        onDismiss?.();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, loading, onClose, onDismiss]);

  const handleNavigateToAuth = () => {
    if (loading) return;
    setEmail('');
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : undefined}
            className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-prompt-title"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : undefined}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-y-auto rounded-sm border border-line bg-surface p-8 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 id="login-prompt-title" className="text-xl font-black tracking-tighter uppercase">Sign In Required</h2>
                {message && <p className="text-sm text-muted mt-1">{message}</p>}
              </div>
              <button onClick={handleClose} className="text-muted hover:text-ink transition-colors -mt-1 -mr-2 p-1">
                <X size={20} />
              </button>
            </div>

            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-line" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface px-2 text-muted tracking-widest font-bold">email and password</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmail} className="space-y-4">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-bg border border-line rounded-sm px-3 py-2.5 text-sm text-ink placeholder-muted/50 focus:outline-none focus:border-accent transition-colors"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-bg border border-line rounded-sm px-3 py-2.5 text-sm text-ink placeholder-muted/50 focus:outline-none focus:border-accent transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div role="alert" className="flex items-center gap-2 text-accent text-xs font-medium">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
                Protected by reCAPTCHA Enterprise before submission.
              </p>

              <button
                type="submit"
                disabled={loading}
                aria-disabled={loading}
                aria-busy={loading}
                className="w-full btn-industrial btn-accent py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Sign In'}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-line" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface px-2 text-muted tracking-widest font-bold">Google is optional</span>
              </div>
            </div>

            <button
              onClick={handleGoogle}
              disabled={loading}
              aria-disabled={loading}
              aria-busy={loading}
              className="w-full flex items-center justify-center gap-3 border border-line bg-bg hover:bg-ink/5 text-ink font-bold py-3 px-4 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <p className="mt-3 text-[10px] font-medium text-muted">
              Use Google only if your Forestry Equipment Sales account was originally created with Google.
            </p>

            <p className="text-center text-xs text-muted mt-5">
              Don't have an account?{' '}
              <Link to={registerHref} onClick={handleNavigateToAuth} className="text-accent hover:underline font-semibold">
                Create Account
              </Link>
              {' · '}
              <Link to={loginHref} onClick={handleNavigateToAuth} className="text-accent hover:underline font-semibold">
                More options
              </Link>
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
