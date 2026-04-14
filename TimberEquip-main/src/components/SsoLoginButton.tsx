import React, { useState } from 'react';
import { SAMLAuthProvider, OAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';
import { API_BASE } from '../constants/api';

interface SsoLoginButtonProps {
  onSuccess: () => void;
  onError?: (message: string) => void;
}

export function SsoLoginButton({ onSuccess, onError }: SsoLoginButtonProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${API_BASE}/sso/domain-lookup?email=${encodeURIComponent(trimmed)}`);
      if (!res.ok) throw new Error('Domain lookup failed');

      const data = await res.json();
      if (!data.ssoAvailable) {
        setMessage('SSO is not configured for this email domain');
        setLoading(false);
        return;
      }

      const provider = data.providerType === 'saml'
        ? new SAMLAuthProvider(data.providerId)
        : new OAuthProvider(data.providerId);

      await signInWithPopup(auth, provider);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'SSO sign-in failed';
      setMessage(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor="sso-email" className="label-micro">Enterprise SSO</label>
      <input
        id="sso-email"
        type="email"
        required
        placeholder="WORK@COMPANY.COM"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input-industrial w-full px-3 py-3 text-sm font-bold uppercase tracking-wider"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading}
        className="btn-industrial btn-accent w-full py-4 text-[11px] font-black uppercase tracking-widest flex items-center justify-center"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          'Continue with SSO'
        )}
      </button>
      {message && <p className="text-xs text-muted text-center">{message}</p>}
    </form>
  );
}
