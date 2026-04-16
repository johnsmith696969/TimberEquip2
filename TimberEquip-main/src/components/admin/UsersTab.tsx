import React from 'react';
import {
  Download, RefreshCw, AlertCircle, Edit,
  Shield, ShieldAlert, Trash2, CheckCircle2, Users, X,
} from 'lucide-react';
import { auth } from '../../firebase';
import { API_BASE } from '../../constants/api';
import type { Account, UserRole } from '../../types';

interface UsersTabProps {
  accounts: Account[];
  filteredAccounts: Account[];
  usersLoadError: string;
  usersLoading: boolean;
  userSearchQuery: string;
  onUserSearchQueryChange: (query: string) => void;
  isFullAdmin: boolean;
  newManagedAccount: {
    displayName: string;
    email: string;
    role: UserRole;
    company: string;
    phoneNumber: string;
  };
  onNewManagedAccountChange: (account: UsersTabProps['newManagedAccount']) => void;
  creatingAccount: boolean;
  managedSeatError: string;
  assignableRoleOptions: ReadonlyArray<{ value: UserRole; label: string }>;
  onExportCSV: () => void;
  onRefresh: () => void;
  showInviteModal: boolean;
  onShowInviteModal: (show: boolean) => void;
  inviteForm: { displayName: string; email: string; role: string };
  onInviteFormChange: (updater: (prev: UsersTabProps['inviteForm']) => UsersTabProps['inviteForm']) => void;
  inviteSending: boolean;
  onInviteUser: () => Promise<void>;
  onCreateManagedAccount: (e: React.FormEvent) => Promise<void>;
  onSendPasswordReset: (account: Account) => Promise<void>;
  onLockUser: (account: Account) => Promise<void>;
  onUnlockUser: (account: Account) => Promise<void>;
  onApproveUser: (account: Account) => Promise<void>;
  onDeleteUser: (account: Account) => Promise<void>;
  onOpenUserEditor: (account: Account) => void;
  getAdminRoleDisplayLabel: (role: UserRole) => string;
  isUserActionPending: (uid: string, action: string) => boolean;
  onSetAccounts: (updater: (prev: Account[]) => Account[]) => void;
}

export function UsersTab({
  accounts,
  filteredAccounts,
  usersLoadError,
  usersLoading,
  userSearchQuery,
  onUserSearchQueryChange,
  isFullAdmin,
  newManagedAccount,
  onNewManagedAccountChange,
  creatingAccount,
  managedSeatError,
  assignableRoleOptions,
  onExportCSV,
  onRefresh,
  showInviteModal,
  onShowInviteModal,
  inviteForm,
  onInviteFormChange,
  inviteSending,
  onInviteUser,
  onCreateManagedAccount,
  onSendPasswordReset,
  onLockUser,
  onUnlockUser,
  onApproveUser,
  onDeleteUser,
  onOpenUserEditor,
  getAdminRoleDisplayLabel,
  isUserActionPending,
  onSetAccounts,
}: UsersTabProps) {
  return (
    <div className="space-y-8">
      {usersLoadError && (
        <div className="flex items-center justify-between gap-4 bg-red-500/10 border border-red-500/20 rounded-sm p-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <span className="text-xs font-bold text-red-500">{usersLoadError}</span>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="btn-industrial py-1.5 px-4 text-[10px] shrink-0"
          >
            <RefreshCw size={12} className="mr-1.5" /> Retry
          </button>
        </div>
      )}

      {usersLoading && (
        <div className="flex items-center justify-center py-16 gap-3">
          <RefreshCw size={16} className="text-muted animate-spin" />
          <span className="text-xs font-black uppercase tracking-widest text-muted">Loading users…</span>
        </div>
      )}

      {!usersLoading && (
      <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: accounts.length },
          { label: 'Active', value: accounts.filter(account => account.status === 'Active').length },
          { label: 'Suspended', value: accounts.filter(account => account.status === 'Suspended').length },
          { label: 'Pending', value: accounts.filter(account => account.status === 'Pending').length },
        ].map((metric) => (
          <div key={metric.label} className="bg-surface border border-line rounded-sm p-5">
            <span className="label-micro block mb-1">{metric.label}</span>
            <span className="text-2xl font-black tracking-tighter text-ink">{metric.value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <input
            type="text"
            value={userSearchQuery}
            onChange={(e) => onUserSearchQueryChange(e.target.value)}
            placeholder="Search users..."
            className="input-industrial w-full px-3 text-[10px] font-bold uppercase tracking-widest"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExportCSV}
            className="btn-industrial py-2 px-4 text-[10px] flex items-center"
          >
            <Download size={12} className="mr-1.5" /> Export CSV
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="btn-industrial btn-outline py-2 px-4 text-[10px] flex items-center"
          >
            <RefreshCw size={12} className="mr-1.5" /> Refresh
          </button>
          <button
            type="button"
            onClick={() => onShowInviteModal(true)}
            className="btn-industrial btn-accent py-2 px-6 text-[10px]"
          >
            Invite User
          </button>
        </div>
      </div>

      {isFullAdmin && (
        <details className="bg-bg border border-line rounded-sm overflow-hidden">
          <summary className="px-6 py-3 bg-surface text-[10px] font-black uppercase tracking-[0.2em] text-ink cursor-pointer hover:bg-surface/70 list-none flex items-center justify-between">
            <span>Add Managed Team Account</span>
            <Users size={14} className="text-muted" />
          </summary>
          <form onSubmit={onCreateManagedAccount} className="p-4 grid grid-cols-1 md:grid-cols-6 gap-3">
            <input value={newManagedAccount.displayName} onChange={(e) => onNewManagedAccountChange({ ...newManagedAccount, displayName: e.target.value })} placeholder="NAME" className="input-industrial md:col-span-2" required />
            <input value={newManagedAccount.email} onChange={(e) => onNewManagedAccountChange({ ...newManagedAccount, email: e.target.value })} placeholder="EMAIL" className="input-industrial md:col-span-2" type="email" required />
            <select value={newManagedAccount.role} onChange={(e) => onNewManagedAccountChange({ ...newManagedAccount, role: e.target.value as UserRole })} className="select-industrial md:col-span-1">
              {assignableRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button type="submit" disabled={creatingAccount} className="btn-industrial btn-accent md:col-span-1 py-2 text-[10px]">
              {creatingAccount ? 'Creating...' : 'Add Role'}
            </button>
          </form>
          {managedSeatError && (
            <div className="mx-4 mb-4 flex items-center gap-2 border border-accent/30 bg-accent/5 rounded-sm px-4 py-3 text-xs font-medium text-accent">
              <AlertCircle size={14} className="shrink-0" />
              <span>{managedSeatError}</span>
            </div>
          )}
        </details>
      )}

      <div className="bg-bg border border-line rounded-sm overflow-hidden shadow-sm">
        <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface border-b border-line">
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">User</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Company</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Role</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Status</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Last Active</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredAccounts.map((user) => (
                <tr key={user.id} className="hover:bg-surface/50 transition-colors align-top">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-ink/10 flex items-center justify-center text-ink font-black text-[11px]">
                        {(user.displayName || user.name || 'U').charAt(0)}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-black uppercase text-ink">{user.displayName || user.name}</span>
                        <span className="text-[9px] font-bold text-muted uppercase break-all">{user.email}</span>
                        <span className="text-[9px] font-bold text-muted uppercase">{user.phoneNumber || user.phone || 'No phone on file'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-[10px] font-bold text-muted uppercase tracking-widest">{user.company || 'N/A'}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2">
                      <span className={`inline-flex w-fit text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${user.role === 'super_admin' || user.role === 'admin' ? 'bg-accent/10 text-accent' : 'bg-line text-muted'}`}>
                        {getAdminRoleDisplayLabel(user.role)}
                      </span>
                      <span className={`inline-flex w-fit text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${user.emailVerified ? 'bg-data/10 text-data' : 'bg-yellow-500/10 text-yellow-600'}`}>
                        {user.emailVerified ? 'Email Verified' : 'Email Unverified'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center">
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${user.status === 'Active' ? 'bg-data animate-pulse' : user.status === 'Pending' ? 'bg-yellow-500' : 'bg-accent'}`}></span>
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{user.status}</span>
                      </div>
                      <span className="text-[9px] font-bold text-muted uppercase tracking-widest">
                        Listings {user.totalListings} • Leads {user.totalLeads}{user.storefrontViews ? ` • Views ${user.storefrontViews}` : ''}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-[10px] font-bold text-muted uppercase tracking-widest">
                    <div className="flex flex-col gap-2">
                      <span>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'No activity'}</span>
                      <span>Joined {user.memberSince ? new Date(user.memberSince).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="grid grid-cols-2 gap-2 min-w-[220px]">
                      <button
                        type="button"
                        onClick={() => onOpenUserEditor(user)}
                        className="btn-industrial py-2 px-3 text-[9px] flex items-center justify-center gap-1"
                      >
                        <Edit size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onSendPasswordReset(user)}
                        disabled={isUserActionPending(user.id, 'reset')}
                        className="btn-industrial py-2 px-3 text-[9px] flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <RefreshCw size={13} className={isUserActionPending(user.id, 'reset') ? 'animate-spin' : ''} /> Reset
                      </button>
                      {user.status === 'Pending' ? (
                        <button
                          type="button"
                          onClick={() => onApproveUser(user)}
                          disabled={isUserActionPending(user.id, 'unlock')}
                          className="btn-industrial py-2 px-3 text-[9px] flex items-center justify-center gap-1 bg-data/10 text-data disabled:opacity-50"
                        >
                          <CheckCircle2 size={13} /> Approve
                        </button>
                      ) : user.status === 'Suspended' ? (
                        <button
                          type="button"
                          onClick={() => onUnlockUser(user)}
                          disabled={isUserActionPending(user.id, 'unlock')}
                          className="btn-industrial py-2 px-3 text-[9px] flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <Shield size={13} /> Unlock
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onLockUser(user)}
                          disabled={isUserActionPending(user.id, 'lock')}
                          className="btn-industrial py-2 px-3 text-[9px] flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <ShieldAlert size={13} /> Lock
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteUser(user)}
                        disabled={isUserActionPending(user.id, 'delete')}
                        className="btn-industrial py-2 px-3 text-[9px] flex items-center justify-center gap-1 text-accent disabled:opacity-50"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[10px] font-black text-muted uppercase tracking-widest">
                    No users matched that search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onShowInviteModal(false)}>
          <div className="bg-surface border border-line rounded-sm p-8 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-black uppercase tracking-widest text-ink mb-6">Invite New User</h3>
            <div className="space-y-4">
              <div>
                <label className="label-micro text-muted block mb-1">Display Name</label>
                <input
                  type="text"
                  value={inviteForm.displayName}
                  onChange={(e) => onInviteFormChange(f => ({ ...f, displayName: e.target.value }))}
                  placeholder="John Smith"
                  className="input-industrial w-full px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="label-micro text-muted block mb-1">Email</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => onInviteFormChange(f => ({ ...f, email: e.target.value }))}
                  placeholder="user@example.com"
                  className="input-industrial w-full px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="label-micro text-muted block mb-1">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => onInviteFormChange(f => ({ ...f, role: e.target.value }))}
                  className="input-industrial w-full px-3 py-2 text-xs"
                >
                  <option value="member">Member</option>
                  <option value="individual_seller">Individual Seller</option>
                  <option value="dealer">Dealer</option>
                  <option value="pro_dealer">Pro Dealer</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => onShowInviteModal(false)}
                className="btn-industrial btn-outline py-2 px-4 text-[10px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void onInviteUser()}
                disabled={inviteSending || !inviteForm.displayName.trim() || !inviteForm.email.trim()}
                className="btn-industrial btn-accent py-2 px-6 text-[10px] disabled:opacity-50"
              >
                {inviteSending ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
