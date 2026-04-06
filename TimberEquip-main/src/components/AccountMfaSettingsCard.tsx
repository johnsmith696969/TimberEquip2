import React, { useEffect, useRef, useState } from 'react';
import { Shield } from 'lucide-react';
import type { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../firebase';
import { userService } from '../services/userService';
import {
  completeSmsMfaEnrollment,
  createVisibleRecaptchaVerifier,
  ensureAuthRecaptchaConfig,
  listSmsMfaFactors,
  resetRecaptchaVerifier,
  startSmsMfaEnrollment,
  type SmsMfaFactorSummary,
  unenrollSmsMfaFactor,
} from '../services/mfaService';
import type { UserProfile } from '../types';

const REQUIRE_EMAIL_VERIFICATION = String(import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim() === 'mobile-app-equipment-sales';

function withAsyncTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

function getMfaErrorMessage(error: unknown, fallback: string) {
  const code = error && typeof error === 'object' && 'code' in error ? String((error as { code?: unknown }).code || '') : '';
  if (code === 'auth/requires-recent-login') {
    return 'Sign out and sign back in before changing SMS multi-factor authentication.';
  }
  if (code === 'auth/invalid-phone-number') {
    return 'Enter a valid mobile number in international format, like +15551234567.';
  }
  if (code === 'auth/invalid-verification-code') {
    return 'That verification code is not valid. Request a new code and try again.';
  }
  if (code === 'auth/code-expired') {
    return 'That verification code expired. Request a new code and try again.';
  }
  if (code === 'auth/quota-exceeded') {
    return 'SMS verification quota has been reached for now. Try again later or use a Firebase test number.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many verification attempts were made. Wait a moment and try again.';
  }
  return error instanceof Error ? error.message : fallback;
}

type AccountMfaSettingsCardProps = {
  user: UserProfile | null;
  onProfilePatch?: (updates: Partial<UserProfile>) => void;
  confirmRemove?: (factor: SmsMfaFactorSummary) => Promise<boolean>;
  recaptchaContainerId?: string;
};

export function AccountMfaSettingsCard({
  user,
  onProfilePatch,
  confirmRemove,
  recaptchaContainerId = 'account-mfa-recaptcha',
}: AccountMfaSettingsCardProps) {
  const mfaRecaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const [smsMfaFactors, setSmsMfaFactors] = useState<SmsMfaFactorSummary[]>([]);
  const [mfaPhoneNumber, setMfaPhoneNumber] = useState('');
  const [mfaDisplayName, setMfaDisplayName] = useState('');
  const [mfaVerificationCode, setMfaVerificationCode] = useState('');
  const [mfaVerificationId, setMfaVerificationId] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaNotice, setMfaNotice] = useState('');
  const [isSendingMfaCode, setIsSendingMfaCode] = useState(false);
  const [isEnrollingMfa, setIsEnrollingMfa] = useState(false);
  const [removingMfaFactorUid, setRemovingMfaFactorUid] = useState('');

  useEffect(() => {
    if (!user || auth.currentUser?.uid !== user.uid) {
      setSmsMfaFactors([]);
      setMfaPhoneNumber('');
      setMfaDisplayName('');
      setMfaVerificationCode('');
      setMfaVerificationId('');
      return;
    }

    setSmsMfaFactors(listSmsMfaFactors(auth.currentUser));
    setMfaPhoneNumber(user.phoneNumber || '');
    setMfaDisplayName(user.displayName || '');
  }, [user]);

  useEffect(() => () => {
    resetRecaptchaVerifier(mfaRecaptchaRef.current);
    mfaRecaptchaRef.current = null;
  }, []);

  const syncMfaProfileState = async (factors: SmsMfaFactorSummary[]) => {
    if (!user?.uid) return;

    const primaryFactor = factors[0] || null;
    const updates: Partial<UserProfile> = {
      mfaEnabled: factors.length > 0,
      mfaMethod: factors.length > 0 ? 'sms' : null,
      mfaPhoneNumber: primaryFactor?.phoneNumber || null,
      mfaDisplayName: primaryFactor?.displayName || null,
      mfaEnrolledAt: primaryFactor?.enrollmentTime || null,
    };

    await withAsyncTimeout(
      userService.updateProfile(user.uid, updates),
      15000,
      'SMS multi-factor updated in authentication, but the profile document is taking too long to save. Refresh in a moment and try again.'
    );
    onProfilePatch?.(updates);
  };

  const resetMfaRecaptcha = () => {
    resetRecaptchaVerifier(mfaRecaptchaRef.current);
    mfaRecaptchaRef.current = null;
  };

  const getMfaRecaptcha = async () => {
    resetMfaRecaptcha();
    await ensureAuthRecaptchaConfig();
    const verifier = createVisibleRecaptchaVerifier(recaptchaContainerId);
    mfaRecaptchaRef.current = verifier;
    await verifier.render();
    return verifier;
  };

  const handleSendMfaCode = async () => {
    const authUser = auth.currentUser;
    if (!user?.uid || !authUser || authUser.uid !== user.uid) {
      setMfaError('Sign in again before enabling SMS multi-factor authentication.');
      return;
    }

    if (REQUIRE_EMAIL_VERIFICATION && !user.emailVerified) {
      setMfaError('Verify your email before enabling SMS multi-factor authentication.');
      return;
    }

    const normalizedPhoneNumber = mfaPhoneNumber.trim();
    if (!normalizedPhoneNumber) {
      setMfaError('Enter the mobile number that should receive SMS verification codes.');
      return;
    }

    setIsSendingMfaCode(true);
    setMfaError('');
    setMfaNotice('');

    try {
      const verifier = await getMfaRecaptcha();
      setMfaNotice('Complete the reCAPTCHA challenge below. TimberEquip will send the SMS code as soon as the security check is passed.');
      const verificationId = await startSmsMfaEnrollment(authUser, normalizedPhoneNumber, verifier);
      setMfaVerificationId(verificationId);
      setMfaVerificationCode('');
      setMfaNotice(`Verification code sent to ${normalizedPhoneNumber} for TimberEquip.com. Enter the code below to finish enrollment.`);
    } catch (error) {
      resetMfaRecaptcha();
      setMfaError(getMfaErrorMessage(error, 'Unable to start SMS multi-factor enrollment right now.'));
    } finally {
      setIsSendingMfaCode(false);
    }
  };

  const handleCompleteMfaEnrollment = async () => {
    const authUser = auth.currentUser;
    if (!user?.uid || !authUser || authUser.uid !== user.uid) {
      setMfaError('Sign in again before finishing SMS multi-factor enrollment.');
      return;
    }

    if (!mfaVerificationId) {
      setMfaError('Request a verification code before entering the SMS code.');
      return;
    }

    const normalizedCode = mfaVerificationCode.trim();
    if (!normalizedCode) {
      setMfaError('Enter the SMS verification code to finish enrollment.');
      return;
    }

    setIsEnrollingMfa(true);
    setMfaError('');
    setMfaNotice('');

    try {
      const factors = await completeSmsMfaEnrollment(authUser, mfaVerificationId, normalizedCode, mfaDisplayName.trim() || undefined);
      setSmsMfaFactors(factors);
      await syncMfaProfileState(factors);
      setMfaVerificationId('');
      setMfaVerificationCode('');
      setMfaNotice('SMS multi-factor authentication is now enabled for this account.');
      resetMfaRecaptcha();
    } catch (error) {
      setMfaError(getMfaErrorMessage(error, 'Unable to finish SMS multi-factor enrollment right now.'));
    } finally {
      setIsEnrollingMfa(false);
    }
  };

  const handleRemoveMfaFactor = async (factorUid: string) => {
    const authUser = auth.currentUser;
    if (!user?.uid || !authUser || authUser.uid !== user.uid) {
      setMfaError('Sign in again before removing SMS multi-factor authentication.');
      return;
    }

    const factor = smsMfaFactors.find((entry) => entry.uid === factorUid);
    if (confirmRemove && factor) {
      const confirmed = await confirmRemove(factor);
      if (!confirmed) return;
    }

    setRemovingMfaFactorUid(factorUid);
    setMfaError('');
    setMfaNotice('');

    try {
      const factors = await unenrollSmsMfaFactor(authUser, factorUid);
      setSmsMfaFactors(factors);
      await syncMfaProfileState(factors);
      setMfaNotice(factors.length > 0 ? 'SMS multi-factor settings updated.' : 'SMS multi-factor authentication has been removed.');
    } catch (error) {
      setMfaError(getMfaErrorMessage(error, 'Unable to remove SMS multi-factor authentication right now.'));
    } finally {
      setRemovingMfaFactorUid('');
    }
  };

  const statusEnabled = smsMfaFactors.length > 0;

  return (
    <div className="rounded-sm border border-line bg-bg p-6 space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-surface border border-line rounded-sm text-muted">
            <Shield size={18} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-tight text-ink">Two-Factor Authentication</h4>
            <p className="mt-1 text-[10px] font-bold text-muted uppercase tracking-widest">
              {statusEnabled ? 'SMS multi-factor authentication is active.' : 'Add an extra layer of security to your account.'}
            </p>
          </div>
        </div>
        <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusEnabled ? 'bg-data/10 text-data' : 'bg-line text-muted'}`}>
          {statusEnabled ? 'Enabled' : 'Not Enrolled'}
        </span>
      </div>

      {smsMfaFactors.length > 0 ? (
        <div className="space-y-3">
          {smsMfaFactors.map((factor) => (
            <div key={factor.uid} className="flex flex-col gap-3 rounded-sm border border-line bg-surface p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted">Enrolled Mobile</p>
                <p className="mt-1 text-sm font-black uppercase tracking-wide break-words">{factor.phoneNumber || 'SMS number on file'}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted">
                  {factor.displayName || 'Primary device'}
                  {factor.enrollmentTime ? ` • enrolled ${new Date(factor.enrollmentTime).toLocaleString()}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleRemoveMfaFactor(factor.uid)}
                disabled={removingMfaFactorUid === factor.uid}
                className="btn-industrial py-2 px-4 text-[10px] disabled:opacity-60"
              >
                {removingMfaFactorUid === factor.uid ? 'Removing...' : 'Remove SMS MFA'}
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {smsMfaFactors.length === 0 || mfaVerificationId ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor={`${recaptchaContainerId}-phone`} className="label-micro">Mobile Number For SMS Codes</label>
              <input
                id={`${recaptchaContainerId}-phone`}
                type="tel"
                className="input-industrial w-full"
                placeholder="+15551234567"
                value={mfaPhoneNumber}
                onChange={(e) => setMfaPhoneNumber(e.target.value)}
              />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                Use full international format. Example: +15551234567
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor={`${recaptchaContainerId}-label`} className="label-micro">Device Label</label>
              <input
                id={`${recaptchaContainerId}-label`}
                type="text"
                className="input-industrial w-full"
                placeholder="Primary mobile"
                value={mfaDisplayName}
                onChange={(e) => setMfaDisplayName(e.target.value)}
              />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                Optional label shown when this SMS factor is enrolled.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleSendMfaCode()}
              disabled={isSendingMfaCode || isEnrollingMfa}
              className="btn-industrial btn-accent py-3 px-6 disabled:opacity-60"
            >
              {isSendingMfaCode ? 'Waiting For Security Check...' : mfaVerificationId ? 'Resend Code' : 'Send Verification Code'}
            </button>
            {mfaVerificationId ? (
              <button
                type="button"
                onClick={() => {
                  setMfaVerificationId('');
                  setMfaVerificationCode('');
                  setMfaError('');
                  setMfaNotice('SMS enrollment was canceled before completion.');
                  resetMfaRecaptcha();
                }}
                className="btn-industrial py-3 px-6"
              >
                Cancel Enrollment
              </button>
            ) : null}
          </div>

          <div id={recaptchaContainerId} className="min-h-[78px]" />

          {mfaVerificationId ? (
            <div className="rounded-sm border border-line bg-surface p-4 space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest">Confirm SMS Code</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Enter the verification code sent to {mfaPhoneNumber.trim() || 'your mobile number'} to finish enrollment.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  className="input-industrial w-full"
                  placeholder="123456"
                  value={mfaVerificationCode}
                  onChange={(e) => setMfaVerificationCode(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => void handleCompleteMfaEnrollment()}
                  disabled={isEnrollingMfa}
                  className="btn-industrial btn-accent py-3 px-6 disabled:opacity-60"
                >
                  {isEnrollingMfa ? 'Verifying...' : 'Enable SMS MFA'}
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {mfaError ? <p className="text-[10px] font-black uppercase tracking-widest text-accent">{mfaError}</p> : null}
      {mfaNotice ? <p className="text-[10px] font-black uppercase tracking-widest text-data">{mfaNotice}</p> : null}
    </div>
  );
}
