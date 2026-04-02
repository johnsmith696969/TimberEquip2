import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, KeyRound, LoaderCircle, ShieldCheck } from 'lucide-react';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { Seo } from '../components/Seo';
import { useTheme } from '../components/ThemeContext';
import { auth } from '../firebase';
import { NOINDEX_ROBOTS } from '../utils/listingPath';

function normalizeContinuePath(input: string | null): string {
  const value = String(input || '').trim();
  if (!value) return '/login';
  if (value.startsWith('/') && !value.startsWith('//')) return value;

  try {
    const parsed = new URL(value);
    if (typeof window !== 'undefined' && parsed.origin === window.location.origin) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return '/login';
  }

  return '/login';
}

function getResetErrorMessage(input: unknown): string {
  const code = input && typeof input === 'object' && 'code' in input ? String((input as { code?: unknown }).code || '') : '';
  if (code === 'auth/expired-action-code' || code === 'auth/invalid-action-code') {
    return 'This password reset link has expired or is no longer valid. Request a fresh reset email and try again.';
  }
  if (code === 'auth/user-disabled') {
    return 'This account is currently disabled. Contact Forestry Equipment Sales support for help.';
  }
  if (code === 'auth/network-request-failed') {
    return 'A network error interrupted the password reset request. Check your connection and try again.';
  }
  if (code === 'auth/weak-password') {
    return 'Choose a stronger password and try again.';
  }
  return input instanceof Error ? input.message : 'Unable to complete this password reset request.';
}

export function ResetPassword() {
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const oobCode = String(searchParams.get('oobCode') || '').trim();
  const mode = String(searchParams.get('mode') || 'resetPassword').trim();
  const continuePath = useMemo(() => normalizeContinuePath(searchParams.get('continueUrl')), [searchParams]);
  const isDark = theme === 'dark';

  useEffect(() => {
    let isActive = true;

    const validateCode = async () => {
      if (!oobCode || mode !== 'resetPassword') {
        setError('This password reset link is incomplete or no longer valid. Request a new reset email and try again.');
        setLoading(false);
        return;
      }

      try {
        const nextEmail = await verifyPasswordResetCode(auth, oobCode);
        if (!isActive) return;
        setEmail(nextEmail);
      } catch (nextError) {
        if (!isActive) return;
        setError(getResetErrorMessage(nextError));
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void validateCode();

    return () => {
      isActive = false;
    };
  }, [mode, oobCode]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!oobCode) {
      setError('This password reset link is invalid. Request a new reset email and try again.');
      return;
    }

    if (password.length < 6) {
      setError('Use at least 6 characters for your new password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Your password confirmation does not match.');
      return;
    }

    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setCompleted(true);
      setPassword('');
      setConfirmPassword('');
    } catch (nextError) {
      setError(getResetErrorMessage(nextError));
    } finally {
      setSubmitting(false);
    }
  };

  const panelClass = isDark
    ? 'border-white/10 bg-zinc-950 text-white shadow-[0_30px_120px_rgba(0,0,0,0.45)]'
    : 'border-line bg-white text-ink shadow-[0_24px_90px_rgba(15,23,42,0.12)]';
  const heroClass = isDark
    ? 'border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(22,163,74,0.22),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]'
    : 'border-line bg-[radial-gradient(circle_at_top_left,rgba(22,163,74,0.18),transparent_38%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,1))]';
  const mutedClass = isDark ? 'text-zinc-300' : 'text-muted';
  const secondaryPanelClass = isDark ? 'border-white/10 bg-white/[0.03]' : 'border-line bg-bg';
  const inputClass = isDark
    ? 'w-full rounded-sm border border-white/10 bg-black/30 px-4 py-3 text-sm font-semibold text-white placeholder:text-zinc-500 focus:border-accent focus:outline-none'
    : 'w-full rounded-sm border border-line bg-white px-4 py-3 text-sm font-semibold text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none';

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-16">
      <Seo
        title="Reset Password | Forestry Equipment Sales"
        description="Securely reset your Forestry Equipment Sales account password."
        robots={NOINDEX_ROBOTS}
      />

      <section className={`overflow-hidden rounded-[28px] border ${panelClass}`}>
        <div className={`relative border-b px-6 py-8 md:px-10 md:py-10 ${heroClass}`}>
          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-accent">Account Recovery</p>
              <h1 className={`mt-3 text-4xl font-black uppercase tracking-[-0.04em] md:text-5xl ${isDark ? 'text-white' : 'text-ink'}`}>
                Reset Your Password
              </h1>
              <p className={`mt-4 max-w-2xl text-sm leading-relaxed md:text-base ${mutedClass}`}>
                Use the Forestry Equipment Sales password recovery flow to set a new password and get back into your buyer, seller, or admin workspace.
              </p>
            </div>
            <div className={`flex h-16 w-16 items-center justify-center rounded-[20px] border ${isDark ? 'border-accent/30 bg-accent/10' : 'border-accent/20 bg-accent/10'} text-accent`}>
              <KeyRound size={28} />
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-6 md:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)] md:px-10 md:py-10">
          <div className={`rounded-[22px] border p-6 md:p-7 ${secondaryPanelClass}`}>
            {loading ? (
              <div className={`flex items-center gap-3 rounded-[18px] border px-4 py-4 text-sm font-bold ${secondaryPanelClass}`}>
                <LoaderCircle size={16} className="animate-spin text-accent" />
                <span className={mutedClass}>Validating your password reset link…</span>
              </div>
            ) : null}

            {!loading && error ? (
              <div className={`flex items-start gap-3 rounded-[18px] border px-4 py-4 text-sm font-semibold ${isDark ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-red-500/20 bg-red-500/10 text-red-500'}`}>
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            {!loading && !error && !completed ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Account</p>
                  <p className={`mt-2 text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-ink'}`}>{email}</p>
                  <p className={`mt-2 text-sm leading-relaxed ${mutedClass}`}>
                    Choose a strong password you have not used before. This link is single-use and expires automatically for security.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.16em] text-accent" htmlFor="new-password">
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={inputClass}
                    placeholder="Enter a new password"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.16em] text-accent" htmlFor="confirm-password">
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={inputClass}
                    placeholder="Confirm your new password"
                  />
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-industrial btn-accent px-5 py-3 text-[10px] disabled:opacity-60">
                    {submitting ? 'Saving Password…' : 'Save New Password'}
                  </button>
                  <Link to="/login" className="btn-industrial px-5 py-3 text-[10px]">
                    Back To Login
                  </Link>
                </div>
              </form>
            ) : null}

            {!loading && !error && completed ? (
              <div className={`rounded-[18px] border px-5 py-5 ${isDark ? 'border-accent/25 bg-accent/10' : 'border-accent/20 bg-accent/5'}`}>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-accent" />
                  <div>
                    <p className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-ink'}`}>Password Updated</p>
                    <p className={`mt-2 text-sm leading-relaxed ${mutedClass}`}>
                      Your Forestry Equipment Sales password has been changed successfully. Use your new password the next time you sign in.
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link to={continuePath} className="btn-industrial btn-accent px-5 py-3 text-[10px]">
                    Continue To Sign In
                  </Link>
                  <Link to="/" className="btn-industrial px-5 py-3 text-[10px]">
                    Return Home
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          <aside className={`rounded-[22px] border p-6 md:p-7 ${secondaryPanelClass}`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-[16px] border ${isDark ? 'border-accent/25 bg-accent/10' : 'border-accent/15 bg-accent/10'} text-accent`}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Security Notes</p>
                <p className={`mt-1 text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-ink'}`}>Protected Access</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className={`rounded-[18px] border px-4 py-4 ${secondaryPanelClass}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-accent">One-Time Link</p>
                <p className={`mt-2 text-sm leading-relaxed ${mutedClass}`}>
                  Password reset links are single-use and expire automatically. If this page says the link is invalid, request a fresh email from the sign-in screen.
                </p>
              </div>

              <div className={`rounded-[18px] border px-4 py-4 ${secondaryPanelClass}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-accent">Recommended</p>
                <p className={`mt-2 text-sm leading-relaxed ${mutedClass}`}>
                  Use a unique password for Forestry Equipment Sales, especially for dealer, pro dealer, admin, and super admin accounts.
                </p>
              </div>

              <div className={`rounded-[18px] border px-4 py-4 ${secondaryPanelClass}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-accent">Need Another Email?</p>
                <p className={`mt-2 text-sm leading-relaxed ${mutedClass}`}>
                  Return to the login page and submit a new reset request if this link expires or you opened an older email by mistake.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default ResetPassword;
