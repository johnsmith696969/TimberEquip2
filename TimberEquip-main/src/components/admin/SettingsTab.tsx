import React from 'react';
import { User, Bell, ShieldAlert, CreditCard, FileText } from 'lucide-react';
import { AccountMfaSettingsCard } from '../AccountMfaSettingsCard';
import type { UserProfile } from '../../types';
import type { DashboardTab } from './adminTypes';

interface SettingsTabProps {
  authUser: UserProfile | null;
  profileName: string;
  roleLabel: string;
  adminSettingsForm: {
    displayName: string;
    email: string;
    phoneNumber: string;
    company: string;
    emailNotificationsEnabled: boolean;
  };
  adminSettingsError: string;
  savingAdminSettings: boolean;
  savingAdminPreferenceKey: string;
  sendingAdminPasswordReset: boolean;
  sendingTestReport: string | null;
  testReportResult: { type: 'success' | 'error'; message: string } | null;
  patchCurrentUserProfile: (patch: Record<string, unknown>) => void;
  confirm: (opts: { title: string; message: string; confirmLabel?: string; variant?: 'danger' | 'warning' | 'info' }) => Promise<boolean>;
  selectAdminTab: (tab: DashboardTab) => void;
  onSettingsInputChange: (key: string, value: string | boolean) => void;
  onSaveSettings: () => Promise<void>;
  onToggleEmailNotifications: () => Promise<void>;
  onSendPasswordReset: () => Promise<void>;
  onSendTestReport: (reportType: 'platform') => Promise<void>;
}

export function SettingsTab({
  authUser,
  profileName,
  roleLabel,
  adminSettingsForm,
  adminSettingsError,
  savingAdminSettings,
  savingAdminPreferenceKey,
  sendingAdminPasswordReset,
  sendingTestReport,
  testReportResult,
  patchCurrentUserProfile,
  confirm,
  selectAdminTab,
  onSettingsInputChange,
  onSaveSettings,
  onToggleEmailNotifications,
  onSendPasswordReset,
  onSendTestReport,
}: SettingsTabProps) {
  return (
    <div className="max-w-3xl space-y-8">
      <section className="bg-surface border border-line rounded-sm overflow-hidden">
        <div className="p-6 border-b border-line bg-bg">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Profile Settings</h3>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex items-center space-x-6 pb-6 border-b border-line">
            <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/20 shadow-sm flex items-center justify-center text-accent overflow-hidden">
              {authUser?.photoURL ? (
                <img src={authUser.photoURL} alt={profileName} className="w-full h-full object-cover" />
              ) : (
                <User size={32} />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-lg font-black uppercase tracking-tighter text-ink">{profileName}</h4>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{roleLabel}</p>
            </div>
          </div>

          {adminSettingsError ? (
            <div className="rounded-sm border border-accent/30 bg-accent/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-accent">
              {adminSettingsError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="label-micro">Display Name</label>
              <input
                type="text"
                value={adminSettingsForm.displayName}
                onChange={(e) => onSettingsInputChange('displayName', e.target.value)}
                className="input-industrial w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="label-micro">Email Address</label>
              <input
                type="email"
                value={adminSettingsForm.email}
                onChange={(e) => onSettingsInputChange('email', e.target.value)}
                className="input-industrial w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="label-micro">Phone Number</label>
              <input
                type="tel"
                value={adminSettingsForm.phoneNumber}
                onChange={(e) => onSettingsInputChange('phoneNumber', e.target.value)}
                className="input-industrial w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="label-micro">Company Name</label>
              <input
                type="text"
                value={adminSettingsForm.company}
                onChange={(e) => onSettingsInputChange('company', e.target.value)}
                className="input-industrial w-full"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => void onSaveSettings()}
            disabled={savingAdminSettings}
            className="btn-industrial btn-accent py-3 px-8 disabled:opacity-60"
          >
            {savingAdminSettings ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </section>

      <section className="bg-surface border border-line rounded-sm overflow-hidden">
        <div className="p-6 border-b border-line bg-bg">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Security & Preferences</h3>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between py-4 border-b border-line">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-bg border border-line rounded-sm text-muted">
                <Bell size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-tight text-ink">Email Notifications</h4>
                <p className="text-[10px] font-bold text-muted uppercase">Receive optional marketplace alerts and monthly performance summaries</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void onToggleEmailNotifications()}
              disabled={savingAdminPreferenceKey === 'emailNotificationsEnabled'}
              className={`w-10 h-5 rounded-full relative transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${adminSettingsForm.emailNotificationsEnabled ? 'bg-accent' : 'bg-line'}`}
              aria-pressed={adminSettingsForm.emailNotificationsEnabled}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${adminSettingsForm.emailNotificationsEnabled ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          <AccountMfaSettingsCard
            user={authUser}
            onProfilePatch={patchCurrentUserProfile}
            recaptchaContainerId="admin-mfa-recaptcha"
            confirmRemove={(factor) => confirm({
              title: 'Remove SMS MFA',
              message: `Remove SMS multi-factor authentication for ${factor.phoneNumber || 'this mobile number'}?`,
              confirmLabel: 'Remove',
              variant: 'danger',
            })}
          />

          <div className="flex items-center justify-between py-4 border-b border-line">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-bg border border-line rounded-sm text-muted">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-tight text-ink">Password Reset</h4>
                <p className="text-[10px] font-bold text-muted uppercase">Send a secure password reset email to your signed-in admin address</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void onSendPasswordReset()}
              disabled={sendingAdminPasswordReset}
              className="btn-industrial py-2 px-4 text-[10px] disabled:opacity-60"
            >
              {sendingAdminPasswordReset ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>

          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-bg border border-line rounded-sm text-muted">
                <CreditCard size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-tight text-ink">Payment Methods</h4>
                <p className="text-[10px] font-bold text-muted uppercase">Open billing tools and subscription activity</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => selectAdminTab('billing')}
              className="btn-industrial py-2 px-4 text-[10px]"
            >
              Open Billing
            </button>
          </div>
        </div>
      </section>

      <section className="bg-surface border border-line rounded-sm overflow-hidden">
        <div className="p-6 border-b border-line bg-bg">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Monthly Reports</h3>
          <p className="text-[10px] font-bold text-muted uppercase mt-1">Send test reports to verify email delivery and report contents</p>
        </div>
        <div className="p-8 space-y-4">
          {testReportResult && (
            <div className={`rounded-sm border px-4 py-3 text-[10px] font-black uppercase tracking-widest ${testReportResult.type === 'success' ? 'border-data/30 bg-data/10 text-data' : 'border-accent/30 bg-accent/10 text-accent'}`}>
              {testReportResult.message}
            </div>
          )}
          <div className="flex items-center justify-between py-4 border-b border-line">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-bg border border-line rounded-sm text-muted">
                <FileText size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-tight text-ink">Platform Report</h4>
                <p className="text-[10px] font-bold text-muted uppercase">Sends to your admin email — includes listings, inquiries, calls, subscriptions</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void onSendTestReport('platform')}
              disabled={sendingTestReport === 'platform'}
              className="btn-industrial py-2 px-4 text-[10px] disabled:opacity-60"
            >
              {sendingTestReport === 'platform' ? 'Sending...' : 'Send Test Report'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
