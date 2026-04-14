import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase';
import {
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type MultiFactorResolver,
  type RecaptchaVerifier,
} from 'firebase/auth';

import { AlertMessage } from '../components/AlertMessage';
import { SsoLoginButton } from '../components/SsoLoginButton';
import { useAuth } from '../components/AuthContext';
import { verifyRecaptchaAction } from '../services/recaptchaService';
import {
  completeSmsMfaSignIn,
  createVisibleRecaptchaVerifier,
  ensureAuthRecaptchaConfig,
  getPreferredSmsMfaFactor,
  getSmsMultiFactorResolver,
  resetRecaptchaVerifier,
  startSmsMfaSignIn,
  type SmsMfaFactorSummary,
} from '../services/mfaService';
import { appendReturnToParam, getDefaultAccountWorkspacePath } from '../utils/sellerAccess';
import { Seo } from '../components/Seo';
import { NOINDEX_ROBOTS } from '../utils/listingPath';
import { useTheme } from '../components/ThemeContext';

const REQUIRE_EMAIL_VERIFICATION = String(import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim() === 'mobile-app-equipment-sales';

export function Login() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [mfaFactor, setMfaFactor] = useState<SmsMfaFactorSummary | null>(null);
  const [mfaVerificationId, setMfaVerificationId] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaVerifying, setMfaVerifying] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
  const mfaRecaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, sendPasswordReset, sendVerificationEmail, isAuthenticated, user: authUser } = useAuth();
  const stateReason = (location.state as { reason?: string; email?: string } | null)?.reason || '';
  const stateEmail = (location.state as { reason?: string; email?: string } | null)?.email || '';
  const queryRedirectTargetRaw = new URLSearchParams(location.search).get('redirect') || '';
  const queryRedirectTarget = queryRedirectTargetRaw.startsWith('/') && !queryRedirectTargetRaw.startsWith('//') ? queryRedirectTargetRaw : '';
  const redirectTarget = typeof (location.state as { from?: unknown } | null)?.from === 'string'
    ? ((location.state as { from: string }).from || '')
    : queryRedirectTarget;
  const stateReturnToRaw = typeof (location.state as { returnTo?: unknown } | null)?.returnTo === 'string'
    ? String((location.state as { returnTo: string }).returnTo || '').trim()
    : '';
  const stateReturnTo = stateReturnToRaw.startsWith('/') && !stateReturnToRaw.startsWith('//') ? stateReturnToRaw : '';
  const hasResolvedSession = Boolean(isAuthenticated);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const inviteEmail = params.get('email');
    const verifyEmailSent = params.get('verifyEmailSent');

    if (inviteEmail && !email) {
      setEmail(inviteEmail);
    }

    if (verifyEmailSent === '1') {
      setInfoMessage('Verification email sent. Check your inbox and verify before accessing your dashboard.');
    } else if (verifyEmailSent === '0') {
      setInfoMessage('Your account was created, but the verification email could not be sent automatically. Sign in to request another verification email.');
    } else if (stateReason === 'email-verification-required') {
      setInfoMessage('Verify your email before accessing your dashboard or listing equipment.');
      if (stateEmail && !email) {
        setEmail(stateEmail);
      }
    }
  }, [email, location.search, stateEmail, stateReason]);

  useEffect(() => () => {
    resetRecaptchaVerifier(mfaRecaptchaRef.current);
    mfaRecaptchaRef.current = null;
  }, []);

  const postSignInTarget = redirectTarget || getDefaultAccountWorkspacePath(authUser);
  const postSignInHref = postSignInTarget.startsWith('/sell')
    ? appendReturnToParam(postSignInTarget, stateReturnTo)
    : postSignInTarget;
  const registerParams = new URLSearchParams();
  if (redirectTarget) {
    registerParams.set('redirect', redirectTarget);
  }
  if (stateReturnTo) {
    registerParams.set('returnTo', stateReturnTo);
  }
  const registerHref = registerParams.toString() ? `/register?${registerParams.toString()}` : '/register';

  useEffect(() => {
    if (!hasResolvedSession || mfaResolver) {
      return;
    }

    navigate(postSignInHref, { replace: true });

    const fallbackRedirect = window.setTimeout(() => {
      window.location.replace(postSignInHref);
    }, 750);

    return () => window.clearTimeout(fallbackRedirect);
  }, [hasResolvedSession, mfaResolver, navigate, postSignInHref]);

  const resetMfaChallenge = (notice = '') => {
    resetRecaptchaVerifier(mfaRecaptchaRef.current);
    mfaRecaptchaRef.current = null;
    setMfaResolver(null);
    setMfaFactor(null);
    setMfaVerificationId('');
    setMfaCode('');
    setMfaLoading(false);
    setMfaVerifying(false);
    if (notice) {
      setInfoMessage(notice);
    }
  };

  const getMfaErrorMessage = (input: unknown, fallback: string) => {
    const code = input && typeof input === 'object' && 'code' in input ? String((input as { code?: unknown }).code || '') : '';
    if (code === 'auth/invalid-verification-code') {
      return 'That SMS verification code is not valid. Request a new code and try again.';
    }
    if (code === 'auth/code-expired') {
      return 'That SMS verification code expired. Request a new code and try again.';
    }
    if (code === 'auth/quota-exceeded') {
      return 'SMS verification quota has been reached for now. Try again later.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Too many verification attempts were made. Wait a moment and try again.';
    }
    return input instanceof Error ? input.message : fallback;
  };

  const getLoginMfaRecaptcha = async () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      if (document.getElementById('login-mfa-recaptcha')) {
        break;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    }

    if (!document.getElementById('login-mfa-recaptcha')) {
      throw new Error('SMS verification widget could not be mounted. Refresh the page and try again.');
    }

    resetRecaptchaVerifier(mfaRecaptchaRef.current);
    await ensureAuthRecaptchaConfig();
    const verifier = createVisibleRecaptchaVerifier('login-mfa-recaptcha');
    mfaRecaptchaRef.current = verifier;
    await verifier.render();
    return verifier;
  };

  const startLoginMfaChallenge = async (resolver: MultiFactorResolver) => {
    setMfaResolver(resolver);
    setMfaVerificationId('');
    setMfaLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const verifier = await getLoginMfaRecaptcha();
      setInfoMessage('Complete the reCAPTCHA challenge below. Forestry Equipment Sales will send the SMS code as soon as the security check is passed.');
      const preferredFactor = getPreferredSmsMfaFactor(resolver);
      const { verificationId, factor } = await startSmsMfaSignIn(resolver, preferredFactor?.uid, verifier);
      // reCAPTCHA token is consumed — destroy the widget immediately
      // so the user never sees it uncheck itself.
      resetRecaptchaVerifier(mfaRecaptchaRef.current);
      mfaRecaptchaRef.current = null;
      const recaptchaContainer = document.getElementById('login-mfa-recaptcha');
      if (recaptchaContainer) recaptchaContainer.innerHTML = '';
      setMfaFactor(factor);
      setMfaVerificationId(verificationId);
      setInfoMessage(`Verification code sent to ${factor.phoneNumber || 'your enrolled mobile number'} for Forestry Equipment Sales.com. Enter it below to finish signing in.`);
    } catch (mfaError) {
      resetRecaptchaVerifier(mfaRecaptchaRef.current);
      mfaRecaptchaRef.current = null;
      setMfaResolver(null);
      setMfaFactor(null);
      setError(getMfaErrorMessage(mfaError, 'This account requires SMS multi-factor sign-in, but the verification code could not be sent right now.'));
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyMfaCode = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!mfaResolver || !mfaVerificationId) {
      setError('Request an SMS verification code before trying to finish sign-in.');
      return;
    }

    const normalizedCode = mfaCode.trim();
    if (!normalizedCode) {
      setError('Enter the SMS verification code to continue.');
      return;
    }

    setMfaVerifying(true);
    setError('');

    try {
      await completeSmsMfaSignIn(mfaResolver, mfaVerificationId, normalizedCode);
      resetMfaChallenge();
      navigate(postSignInHref, { replace: true });
    } catch (mfaError) {
      setError(getMfaErrorMessage(mfaError, 'Unable to complete SMS multi-factor sign-in right now.'));
    } finally {
      setMfaVerifying(false);
    }
  };

  const handlePasswordReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resetEmail.trim()) return;

    setResetLoading(true);
    setResetError('');

    try {
      const recaptchaPassed = await verifyRecaptchaAction('PASSWORD_RESET');
      if (!recaptchaPassed) {
        setResetError('Security check failed. Please refresh and try again.');
        return;
      }
      await sendPasswordReset(resetEmail.trim());
      setResetSent(true);
    } catch (resetFailure: any) {
      const code = resetFailure?.code || '';
      if (code === 'auth/user-not-found') {
        // Show success to prevent user enumeration
        setResetSent(true);
        return;
      } else if (code === 'auth/invalid-email') {
        setResetError('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setResetError('Too many requests. Please wait a moment and try again.');
      } else if (code === 'auth/network-request-failed') {
        setResetError('Network error while sending reset email. Check your connection and try again.');
      } else {
        setResetError('Failed to send reset email. Please try again.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const recaptchaPassed = await verifyRecaptchaAction('LOGIN');
      if (!recaptchaPassed) {
        setError('Security check failed. Please refresh and try again.');
        setLoading(false);
        return;
      }

      await setPersistence(auth, stayLoggedIn ? browserLocalPersistence : browserSessionPersistence);
      await login(email.trim(), password);
      const currentUser = auth.currentUser;
      if (REQUIRE_EMAIL_VERIFICATION && currentUser && !currentUser.emailVerified) {
        const verificationEmailSent = await sendVerificationEmail();
        await signOut(auth);
        setError(
          verificationEmailSent
            ? 'Please verify your email first. A new verification email has been sent.'
            : 'Please verify your email first. We could not send a verification email right now.'
        );
        setLoading(false);
        return;
      }

      setInfoMessage('Session active. Redirecting to your account...');
    } catch (loginFailure: any) {
      const code = loginFailure?.code || '';
      if (code === 'auth/multi-factor-auth-required') {
        await startLoginMfaChallenge(getSmsMultiFactorResolver(loginFailure));
      } else if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password. Use your Forestry Equipment Sales password or reset it if you need a new one.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please wait a moment and try again.');
      } else if (code.includes('api-key-not-valid')) {
        console.error('[Auth] API key rejected by Firebase:', code);
        setError('Firebase configuration error. Please clear your browser cache and cookies, then try again. If the issue persists, contact support.');
      } else {
        setError('Sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    setInfoMessage('');

    try {
      if (auth.currentUser || isAuthenticated) {
        setInfoMessage('Session active. Redirecting to your account...');
        return;
      }

      await setPersistence(auth, stayLoggedIn ? browserLocalPersistence : browserSessionPersistence);
      await loginWithGoogle();
      const currentUser = auth.currentUser;
      if (REQUIRE_EMAIL_VERIFICATION && currentUser && !currentUser.emailVerified) {
        const verificationEmailSent = await sendVerificationEmail();
        await signOut(auth);
        setError(
          verificationEmailSent
            ? 'Please verify your email first. A new verification email has been sent.'
            : 'Please verify your email first. We could not send a verification email right now.'
        );
        return;
      }

      setInfoMessage('Session active. Redirecting to your account...');
    } catch (googleFailure: any) {
      const code = googleFailure?.code || '';
      if (code === 'auth/multi-factor-auth-required') {
        await startLoginMfaChallenge(getSmsMultiFactorResolver(googleFailure));
      } else if (code.includes('api-key-not-valid')) {
        console.error('[Auth] API key rejected by Firebase during Google sign-in:', code);
        setError('Firebase configuration error. Please clear your browser cache and cookies, then try again. If the issue persists, contact support.');
      } else if (code === 'auth/unauthorized-domain') {
        setError('Google sign-in is not authorized for this domain in Firebase Auth yet.');
      } else if (code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed before completion. Please try again.');
      } else if (code === 'auth/cancelled-popup-request') {
        setError('A Google sign-in request was interrupted. Try again in one window.');
      } else if (code === 'auth/account-exists-with-different-credential') {
        setError('This email already exists with a different sign-in method. Use your password login first.');
      } else {
        console.error('Google sign-in error:', code, googleFailure);
        setError(code ? `Google sign-in failed (${code}). Please try again.` : 'Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const disablePrimaryAuth = loading || googleLoading || !!mfaResolver;

  if (hasResolvedSession && !mfaResolver) {
    return <Navigate replace to={postSignInHref} />;
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
      <Seo
        title="Sign In | Forestry Equipment Sales"
        description="Sign in to your Forestry Equipment Sales account to manage listings, view saved equipment, and access dealer tools."
        robots={NOINDEX_ROBOTS}
      />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-accent/5 skew-x-12 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-1/3 h-full bg-accent/5 -skew-x-12 -translate-x-1/2" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-bg border border-line shadow-2xl relative z-10 overflow-hidden"
      >
        <div className={`p-12 ${theme === 'dark' ? 'bg-bg text-white' : 'bg-surface text-ink border-b border-line'}`}>
          <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-2 block">Member Login</span>
          <h1 className={`text-4xl font-black tracking-tighter uppercase leading-none ${theme === 'dark' ? 'text-white' : 'text-ink'}`}>
            <span className="text-accent">Forestry Equipment</span> Sales
          </h1>
        </div>

        <div className="p-12">
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="flex flex-col space-y-2">
              <label htmlFor="login-email" className="label-micro">Email Address</label>
              <div className="flex items-center bg-surface border-b border-line p-1 focus-within:border-accent transition-colors">
                <div className="p-3 text-muted">
                  <Mail size={18} />
                </div>
                <input
                  id="login-email"
                  required
                  type="email"
                  placeholder="EMAIL@EXAMPLE.COM"
                  autoComplete="email"
                  className="flex-1 bg-transparent border-none py-4 text-sm font-bold focus:ring-0 uppercase tracking-wider"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={disablePrimaryAuth}
                />
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="login-password" className="label-micro">Password</label>
                <button
                  type="button"
                  className="text-[10px] font-bold text-accent uppercase hover:underline"
                  onClick={() => {
                    setShowReset(true);
                    setResetEmail(email);
                    setResetSent(false);
                    setResetError('');
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="flex items-center bg-surface border-b border-line p-1 focus-within:border-accent transition-colors">
                <div className="p-3 text-muted">
                  <Lock size={18} />
                </div>
                <input
                  id="login-password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="************"
                  autoComplete="current-password"
                  className="flex-1 bg-transparent border-none py-4 text-sm font-bold focus:ring-0 tracking-widest"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={disablePrimaryAuth}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="p-3 text-muted hover:text-ink transition-colors"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <input type="checkbox" className="w-4 h-4 border-line rounded-sm accent-accent" id="remember" checked={stayLoggedIn} onChange={(e) => setStayLoggedIn(e.target.checked)} />
              <label htmlFor="remember" className="text-[10px] font-bold text-muted uppercase tracking-widest cursor-pointer">
                Stay Logged In
              </label>
            </div>

            <button
              type="submit"
              disabled={disablePrimaryAuth}
              aria-disabled={disablePrimaryAuth}
              className="btn-industrial btn-accent w-full py-5 text-base flex items-center justify-center"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Login
                  <ArrowRight className="ml-3" size={18} />
                </>
              )}
            </button>
          </form>

          {mfaResolver ? (
            <form onSubmit={handleVerifyMfaCode} className="mt-8 space-y-6 border border-line bg-surface p-6 rounded-sm">
              <div className="space-y-2">
                <span className="label-micro">SMS Multi-Factor Authentication</span>
                <p className="text-sm font-bold text-ink">
                  Enter the verification code sent to {mfaFactor?.phoneNumber || 'your enrolled mobile number'}.
                </p>
                {mfaFactor?.displayName ? (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                    Device label: {mfaFactor.displayName}
                  </p>
                ) : null}
              </div>

              {mfaVerificationId ? (
                <div className="flex items-center space-x-2 text-data text-xs font-bold uppercase tracking-widest py-2">
                  <ShieldCheck size={16} />
                  <span>Security check passed</span>
                </div>
              ) : (
                <div id="login-mfa-recaptcha" className="min-h-[78px]" />
              )}

              <div className="space-y-2">
                <label htmlFor="login-mfa-code" className="label-micro">Verification Code</label>
                <div className="flex items-center bg-surface border-b border-line p-1 focus-within:border-accent transition-colors">
                  <div className="p-3 text-muted">
                    <KeyRound size={18} />
                  </div>
                  <input
                    id="login-mfa-code"
                    required
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    className="flex-1 bg-transparent border-none py-4 text-sm font-bold focus:ring-0 tracking-[0.35em]"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={mfaLoading || mfaVerifying}
                  className="btn-industrial btn-accent flex-1 py-4 flex items-center justify-center"
                >
                  {mfaVerifying ? 'Verifying...' : 'Verify And Continue'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (mfaResolver) {
                      void startLoginMfaChallenge(mfaResolver);
                    }
                  }}
                  disabled={mfaLoading || mfaVerifying}
                  className="btn-industrial flex-1 py-4"
                >
                  {mfaLoading ? 'Sending...' : 'Resend Code'}
                </button>
                <button
                  type="button"
                  onClick={() => resetMfaChallenge('SMS verification canceled. Sign in again when you are ready.')}
                  disabled={mfaLoading || mfaVerifying}
                  className="btn-industrial flex-1 py-4"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          {infoMessage ? (
            <AlertMessage severity="info" className="mt-4">{infoMessage}</AlertMessage>
          ) : null}

          {error ? (
            <AlertMessage severity="error" className="mt-4">{error}</AlertMessage>
          ) : null}

          <div className="mt-6">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-line" />
              </div>
              <span className="relative bg-bg px-4 text-[10px] font-bold text-muted uppercase tracking-widest">Google is optional</span>
            </div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted">
              Use email and password for Forestry Equipment Sales-native accounts. Google sign-in is only for accounts that were started with Google.
            </p>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={disablePrimaryAuth}
              aria-disabled={disablePrimaryAuth}
              className="mt-4 w-full btn-industrial py-4 flex items-center justify-center space-x-3 hover:border-accent/50 transition-colors"
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="text-[11px] font-black uppercase tracking-widest">Sign in with Google</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center text-xs text-muted uppercase tracking-widest my-4">or</div>
          <SsoLoginButton onSuccess={() => setInfoMessage('SSO login successful. Redirecting...')} onError={(msg) => setError(msg)} />

          <div className="mt-8 pt-8 border-t border-line flex flex-col space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">New to Forestry Equipment Sales?</span>
              <Link to={registerHref} className="text-[10px] font-black text-accent uppercase hover:underline">
                Create Account
              </Link>
            </div>

            <div className="bg-surface p-4 border border-line flex items-start space-x-4">
              <ShieldCheck className="text-data flex-shrink-0" size={18} />
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest mb-1">Secure Login</span>
                <p className="text-[9px] font-medium text-muted leading-relaxed">
                  Your data is protected with industry-standard encryption. We never share your personal information with third parties.
                </p>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showReset ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-bg flex flex-col z-20"
            >
              <div className="bg-ink text-white p-12 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-2">Account Recovery</span>
                  <h2 className="text-3xl font-black tracking-tighter uppercase leading-none text-white">
                    Reset <br />
                    <span className="text-accent">Password</span>
                  </h2>
                </div>
                <div className="w-16 h-16 bg-accent flex items-center justify-center rounded-sm">
                  <KeyRound className="text-white" size={28} />
                </div>
              </div>

              <div className="p-12 flex flex-col flex-1">
                {resetSent ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center space-y-6 py-8"
                  >
                    <div className="w-16 h-16 bg-data/10 border border-data/30 flex items-center justify-center rounded-sm">
                      <CheckCircle2 className="text-data" size={32} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight mb-2">Email Sent</h3>
                      <p className="text-sm text-muted font-medium leading-relaxed">
                        A password reset link has been sent to <span className="text-ink font-bold">{resetEmail}</span>. Check your inbox and spam folder.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowReset(false)}
                      className="btn-industrial btn-accent py-4 px-10 mt-4"
                    >
                      Back to Login
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <p className="text-sm text-muted font-medium mb-8 leading-relaxed">
                      Enter the email address for your account and we will send you a link to reset your password.
                    </p>
                    <form onSubmit={handlePasswordReset} className="space-y-6">
                      <div className="flex flex-col space-y-2">
                        <label className="label-micro">Email Address</label>
                        <div className="flex items-center bg-surface border-b border-line p-1 focus-within:border-accent transition-colors">
                          <div className="p-3 text-muted">
                            <Mail size={18} />
                          </div>
                          <input
                            required
                            type="email"
                            placeholder="EMAIL@EXAMPLE.COM"
                            autoComplete="email"
                            className="flex-1 bg-transparent border-none py-4 text-sm font-bold focus:ring-0 uppercase tracking-wider"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      {resetError ? (
                        <AlertMessage severity="error">{resetError}</AlertMessage>
                      ) : null}

                      <button
                        type="submit"
                        disabled={resetLoading}
                        aria-disabled={resetLoading}
                        className="btn-industrial btn-accent w-full py-5 text-base flex items-center justify-center"
                      >
                        {resetLoading ? (
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            Send Reset Link
                            <ArrowRight className="ml-3" size={18} />
                          </>
                        )}
                      </button>
                    </form>

                    <button
                      type="button"
                      onClick={() => setShowReset(false)}
                      className="mt-6 text-[10px] font-bold text-muted uppercase tracking-widest hover:text-ink transition-colors text-center w-full"
                    >
                      Back to Login
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
