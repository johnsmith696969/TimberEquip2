import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, LoaderCircle, MailX } from 'lucide-react';

type UnsubscribeState = {
  email: string;
  displayName?: string;
  scope?: string;
  emailNotificationsEnabled: boolean;
};

export function Unsubscribe() {
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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-12 md:px-8">
      <div className="rounded-sm border border-line bg-surface p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-sm border border-accent/30 bg-accent/10 p-3 text-accent">
            <MailX size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Email Preferences</p>
            <h1 className="text-3xl font-black uppercase tracking-tight text-ink">Unsubscribe From Optional Emails</h1>
          </div>
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
          Use this page to stop optional saved-search alerts and monthly performance emails. TimberEquip may still send required
          security, billing, listing-status, and account-service messages.
        </p>

        {loading ? (
          <div className="mt-8 flex items-center gap-3 rounded-sm border border-line bg-bg px-4 py-4 text-sm font-bold text-muted">
            <LoaderCircle size={16} className="animate-spin" />
            Validating your unsubscribe link...
          </div>
        ) : null}

        {!loading && error ? (
          <div className="mt-8 flex items-start gap-3 rounded-sm border border-accent/30 bg-accent/10 px-4 py-4 text-sm font-bold text-accent">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {!loading && state ? (
          <div className="mt-8 rounded-sm border border-line bg-bg p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">Subscriber</p>
                <p className="mt-2 text-lg font-black tracking-tight text-ink">{state.displayName || 'TimberEquip subscriber'}</p>
                <p className="mt-1 text-sm text-muted">{state.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">Optional Email Status</p>
                <p className="mt-2 text-lg font-black tracking-tight text-ink">
                  {state.emailNotificationsEnabled ? 'Subscribed' : 'Already Unsubscribed'}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Scope: {state.scope === 'optional' ? 'Saved-search alerts and monthly updates' : state.scope}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleUnsubscribe()}
                disabled={submitting || !state.emailNotificationsEnabled}
                className="btn-industrial btn-accent px-5 py-3 text-[10px] disabled:opacity-60"
              >
                {submitting ? 'Updating Preference...' : state.emailNotificationsEnabled ? 'Stop Optional Emails' : 'Optional Emails Disabled'}
              </button>
              <Link to="/" className="btn-industrial px-5 py-3 text-[10px]">
                Return Home
              </Link>
            </div>

            {completed || !state.emailNotificationsEnabled ? (
              <div className="mt-6 flex items-start gap-3 rounded-sm border border-data/30 bg-data/10 px-4 py-4 text-sm font-bold text-data">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                <span>
                  Optional TimberEquip emails are turned off for {state.email}. Required security, billing, and listing-service emails may still be sent.
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default Unsubscribe;
