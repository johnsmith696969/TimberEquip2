import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, LoaderCircle, MailX, ShieldCheck } from 'lucide-react';
import { Seo } from '../components/Seo';
import { NOINDEX_ROBOTS } from '../utils/listingPath';
import { useTheme } from '../components/ThemeContext';

type UnsubscribeState = {
  email: string;
  displayName?: string;
  scope?: string;
  emailNotificationsEnabled: boolean;
};

export function Unsubscribe() {
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [state, setState] = useState<UnsubscribeState | null>(null);
  const [completed, setCompleted] = useState(false);

  const requestPayload = useMemo(
    () => ({
      uid: searchParams.get('uid') || '',
      email: searchParams.get('email') || '',
      scope: searchParams.get('scope') || 'optional',
      token: searchParams.get('token') || '',
    }),
    [searchParams]
  );
  const isDark = theme === 'dark';

  useEffect(() => {
    let isActive = true;

    const loadState = async () => {
      if (!requestPayload.uid || !requestPayload.email || !requestPayload.token) {
        setError('This unsubscribe link is incomplete. Please use the link from your email.');
        setLoading(false);
        return;
      }

      try {
        const query = new URLSearchParams(requestPayload);
        const response = await fetch(`/api/email-preferences/unsubscribe?${query.toString()}`);
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.error || 'Unable to validate this unsubscribe link.');
        }

        if (!isActive) return;
        setState({
          email: String(payload.email || requestPayload.email),
          displayName: String(payload.displayName || ''),
          scope: String(payload.scope || requestPayload.scope),
          emailNotificationsEnabled: payload.emailNotificationsEnabled !== false,
        });
      } catch (nextError) {
        if (!isActive) return;
        setError(nextError instanceof Error ? nextError.message : 'Unable to load the unsubscribe page.');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadState();

    return () => {
      isActive = false;
    };
  }, [requestPayload]);

  const handleUnsubscribe = async () => {
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/email-preferences/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to update your email preference.');
      }

      setCompleted(true);
      setState((current) => current ? { ...current, emailNotificationsEnabled: false } : current);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to update your email preference.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-16">
      <Seo
        title="Unsubscribe | Forestry Equipment Sales"
        description="Manage your email notification preferences for Forestry Equipment Sales."
        robots={NOINDEX_ROBOTS}
      />
      <section className={`overflow-hidden rounded-[28px] border ${isDark ? 'border-white/10 bg-zinc-950 text-white shadow-[0_30px_120px_rgba(0,0,0,0.45)]' : 'border-line bg-white text-ink shadow-[0_24px_90px_rgba(15,23,42,0.12)]'}`}>
        <div className={`relative border-b px-6 py-8 md:px-10 md:py-10 ${isDark ? 'border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(22,163,74,0.22),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]' : 'border-line bg-[radial-gradient(circle_at_top_left,rgba(22,163,74,0.18),transparent_38%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,1))]'}`}>
          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-accent">Email Preferences</p>
              <h1 className={`mt-3 text-4xl font-black uppercase tracking-[-0.04em] md:text-5xl ${isDark ? 'text-white' : 'text-ink'}`}>
                Unsubscribe From Optional Emails
              </h1>
              <p className={`mt-4 max-w-2xl text-sm leading-relaxed md:text-base ${isDark ? 'text-zinc-300' : 'text-muted'}`}>
                Turn off optional saved-search alerts and performance emails while keeping the required billing, listing-status, security, and account-service messages you still need.
              </p>
            </div>
            <div className={`flex h-16 w-16 items-center justify-center rounded-[20px] border ${isDark ? 'border-accent/30 bg-accent/10' : 'border-accent/20 bg-accent/10'} text-accent`}>
              <MailX size={28} />
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-6 md:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)] md:px-10 md:py-10">
          <div className={`rounded-[22px] border p-6 md:p-7 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-line bg-bg'}`}>
            {loading ? (
              <div className={`flex items-center gap-3 rounded-[18px] border px-4 py-4 text-sm font-bold ${isDark ? 'border-white/10 bg-white/[0.03] text-zinc-300' : 'border-line bg-white text-muted'}`}>
                <LoaderCircle size={16} className="animate-spin text-accent" />
                Validating your unsubscribe link…
              </div>
            ) : null}

            {!loading && error ? (
              <div className={`flex items-start gap-3 rounded-[18px] border px-4 py-4 text-sm font-semibold ${isDark ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            {!loading && state ? (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className={`rounded-[18px] border px-4 py-4 ${isDark ? 'border-white/10 bg-black/20' : 'border-line bg-white'}`}>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Subscriber</p>
                    <p className={`mt-2 text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-ink'}`}>
                      {state.displayName || 'Forestry Equipment Sales subscriber'}
                    </p>
                    <p className={`mt-1 text-sm ${isDark ? 'text-zinc-300' : 'text-muted'}`}>{state.email}</p>
                  </div>

                  <div className={`rounded-[18px] border px-4 py-4 ${isDark ? 'border-white/10 bg-black/20' : 'border-line bg-white'}`}>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Optional Email Status</p>
                    <p className={`mt-2 text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-ink'}`}>
                      {state.emailNotificationsEnabled ? 'Subscribed' : 'Already Unsubscribed'}
                    </p>
                    <p className={`mt-1 text-sm ${isDark ? 'text-zinc-300' : 'text-muted'}`}>
                      Scope: {state.scope === 'optional' ? 'Saved-search alerts and monthly updates' : state.scope}
                    </p>
                  </div>
                </div>

                <div className={`rounded-[18px] border px-4 py-4 ${isDark ? 'border-white/10 bg-black/20' : 'border-line bg-white'}`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">What Stays On</p>
                  <p className={`mt-2 text-sm leading-relaxed ${isDark ? 'text-zinc-300' : 'text-muted'}`}>
                    Required security, billing, listing-service, and account-support emails can still be sent even after optional emails are turned off.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleUnsubscribe()}
                    disabled={submitting || !state.emailNotificationsEnabled}
                    className="btn-industrial btn-accent px-5 py-3 text-[10px] disabled:opacity-60"
                  >
                    {submitting ? 'Updating Preference…' : state.emailNotificationsEnabled ? 'Stop Optional Emails' : 'Optional Emails Disabled'}
                  </button>
                  <Link to="/" className="btn-industrial px-5 py-3 text-[10px]">
                    Return Home
                  </Link>
                </div>

                {completed || !state.emailNotificationsEnabled ? (
                  <div className={`flex items-start gap-3 rounded-[18px] border px-4 py-4 text-sm font-semibold ${isDark ? 'border-accent/25 bg-accent/10 text-zinc-100' : 'border-accent/20 bg-accent/5 text-ink'}`}>
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent" />
                    <span>
                      Optional Forestry Equipment Sales emails are turned off for {state.email}. Required security, billing, and listing-service emails may still be sent.
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <aside className={`rounded-[22px] border p-6 md:p-7 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-line bg-bg'}`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-[16px] border ${isDark ? 'border-accent/25 bg-accent/10' : 'border-accent/15 bg-accent/10'} text-accent`}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Preference Notes</p>
                <p className={`mt-1 text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-ink'}`}>Your Inbox, Your Call</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className={`rounded-[18px] border px-4 py-4 ${isDark ? 'border-white/10 bg-black/20' : 'border-line bg-white'}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-accent">Saved Searches</p>
                <p className={`mt-2 text-sm leading-relaxed ${isDark ? 'text-zinc-300' : 'text-muted'}`}>
                  This preference controls optional saved-search alerts and monthly performance summaries, not critical account notifications.
                </p>
              </div>

              <div className={`rounded-[18px] border px-4 py-4 ${isDark ? 'border-white/10 bg-black/20' : 'border-line bg-white'}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-accent">Changed Your Mind?</p>
                <p className={`mt-2 text-sm leading-relaxed ${isDark ? 'text-zinc-300' : 'text-muted'}`}>
                  Sign back in later and update your communication preferences from your account if you want optional emails turned back on.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default Unsubscribe;
