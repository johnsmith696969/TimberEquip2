import React from 'react';
import { Shield, AlertCircle, Edit, ShieldAlert } from 'lucide-react';
import type { Account, UserRole } from '../../types';
import { normalizeEditableUserRole } from '../../utils/userRoles';

interface AccountsTabProps {
  accounts: Account[];
  filteredAccounts: Account[];
  userSearchQuery: string;
  onUserSearchQueryChange: (query: string) => void;
  userDisplayCount: number;
  onUserDisplayCountChange: (updater: (prev: number) => number) => void;
  newManagedAccount: {
    displayName: string;
    email: string;
    role: UserRole;
    company: string;
    phoneNumber: string;
  };
  onNewManagedAccountChange: (account: AccountsTabProps['newManagedAccount']) => void;
  creatingAccount: boolean;
  managedSeatError: string;
  assignableRoleOptions: ReadonlyArray<{ value: UserRole; label: string }>;
  canAssignSuperAdmin: boolean;
  onCreateManagedAccount: (e: React.FormEvent) => Promise<void>;
  onChangeUserRole: (uid: string, role: UserRole) => Promise<void>;
  onSuspendUser: (uid: string) => Promise<void>;
  onOpenUserEditor: (account: Account) => void;
  isUserActionPending: (uid: string, action: string) => boolean;
}

export function AccountsTab({
  accounts,
  filteredAccounts,
  userSearchQuery,
  onUserSearchQueryChange,
  userDisplayCount,
  onUserDisplayCountChange,
  newManagedAccount,
  onNewManagedAccountChange,
  creatingAccount,
  managedSeatError,
  assignableRoleOptions,
  canAssignSuperAdmin,
  onCreateManagedAccount,
  onChangeUserRole,
  onSuspendUser,
  onOpenUserEditor,
  isUserActionPending,
}: AccountsTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-surface border border-line rounded-sm p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Managed Account Seats</div>
          <div className="text-sm font-black uppercase tracking-tight text-ink">Dealer and Pro Dealer packages include up to 3 managed team accounts.</div>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted">
          Existing managed accounts: {accounts.filter((account) => !!account.parentAccountUid).length}
        </div>
      </div>

      <form onSubmit={onCreateManagedAccount} className="bg-bg border border-line rounded-sm p-6 grid grid-cols-1 md:grid-cols-6 gap-3">
        <input value={newManagedAccount.displayName} onChange={(e) => onNewManagedAccountChange({ ...newManagedAccount, displayName: e.target.value })} placeholder="NAME" className="input-industrial md:col-span-2" required />
        <input value={newManagedAccount.email} onChange={(e) => onNewManagedAccountChange({ ...newManagedAccount, email: e.target.value })} placeholder="EMAIL" className="input-industrial md:col-span-2" type="email" required />
        <select value={newManagedAccount.role} onChange={(e) => onNewManagedAccountChange({ ...newManagedAccount, role: e.target.value as UserRole })} className="select-industrial md:col-span-1">
          {assignableRoleOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <button type="submit" disabled={creatingAccount} className="btn-industrial btn-accent md:col-span-1 py-2">
          {creatingAccount ? 'Creating...' : 'Add Role'}
        </button>
      </form>
      {managedSeatError ? (
        <div className="flex items-center gap-2 border border-accent/30 bg-accent/5 rounded-sm px-4 py-3 text-xs font-medium text-accent">
          <AlertCircle size={14} className="shrink-0" />
          <span>{managedSeatError}</span>
        </div>
      ) : null}

      {/* Role Permissions Matrix */}
      <details className="bg-bg border border-line rounded-sm overflow-hidden">
        <summary className="px-6 py-4 bg-surface text-xs font-black uppercase tracking-[0.2em] text-ink cursor-pointer hover:bg-surface/70 list-none flex items-center justify-between">
          <span>Role Capabilities Matrix</span>
          <Shield size={14} className="text-muted" />
        </summary>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left text-[9px] font-black uppercase tracking-widest">
            <thead>
              <tr className="border-b border-line">
                <th className="px-3 py-2 text-muted">Role</th>
                <th className="px-3 py-2 text-muted text-center">Inventory</th>
                <th className="px-3 py-2 text-muted text-center">Content</th>
                <th className="px-3 py-2 text-muted text-center">Users</th>
                <th className="px-3 py-2 text-muted text-center">Billing</th>
                <th className="px-3 py-2 text-muted text-center">Settings</th>
                <th className="px-3 py-2 text-muted text-center">Dev / Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {[
                { role: 'Super Admin',      inv: true,  cont: true,  users: true,  bill: true,  set: true,  dev: true  },
                { role: 'Admin',            inv: true,  cont: true,  users: true,  bill: true,  set: true,  dev: false },
                { role: 'Content Manager',  inv: false, cont: true,  users: false, bill: false, set: false, dev: false },
                { role: 'Editor',           inv: false, cont: true,  users: false, bill: false, set: false, dev: false },
                { role: 'Pro Dealer',       inv: true,  cont: false, users: true,  bill: false, set: false, dev: false },
                { role: 'Dealer',           inv: true,  cont: false, users: false, bill: false, set: false, dev: false },
                { role: 'Owner-Operator',   inv: true,  cont: false, users: false, bill: false, set: false, dev: false },
                { role: 'Member',           inv: false, cont: false, users: false, bill: false, set: false, dev: false },
              ].map(row => (
                <tr key={row.role} className="hover:bg-surface/20">
                  <td className="px-3 py-2 text-ink">{row.role}</td>
                  {[row.inv, row.cont, row.users, row.bill, row.set, row.dev].map((v, i) => (
                    <td key={i} className="px-3 py-2 text-center">
                      <span className={v ? 'text-data' : 'text-line'}>
                        {v ? '✓' : '—'}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[8px] font-bold text-muted uppercase mt-3">* Editor: draft/publish only. Content Manager: full CMS including media & blocks.</p>
        </div>
      </details>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-6 border border-line rounded-sm">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Account Management</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2 w-full sm:w-64">
            <input
              type="text"
              value={userSearchQuery}
              onChange={(e) => onUserSearchQueryChange(e.target.value)}
              placeholder="Search accounts..."
              className="input-industrial w-full px-3 text-[10px] font-bold uppercase tracking-widest"
            />
          </div>
        </div>
      </div>

      <div className="bg-bg border border-line rounded-sm shadow-sm overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface/30 text-[10px] font-black uppercase tracking-widest text-muted border-b border-line">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Activity</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredAccounts.slice(0, userDisplayCount).map(account => {
                const normalizedAccountRole = normalizeEditableUserRole(account.role);
                const accountRoleOptions = canAssignSuperAdmin || normalizedAccountRole !== 'super_admin'
                  ? assignableRoleOptions
                  : [{ value: 'super_admin' as UserRole, label: 'Super Admin' }, ...assignableRoleOptions];
                const isRoleEditable = accountRoleOptions.some((option) => option.value === normalizedAccountRole);

                return (
                  <tr key={account.id} className="hover:bg-surface/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-tight text-ink">{account.name}</span>
                        <span className="text-[9px] font-bold text-muted uppercase">{account.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-ink uppercase">{account.company}</td>
                    <td className="px-6 py-4">
                      <select
                        value={normalizedAccountRole}
                        onChange={e => onChangeUserRole(account.id, e.target.value as UserRole)}
                        className="select-industrial text-[9px] py-1"
                        disabled={!isRoleEditable || isUserActionPending(account.id, 'role')}
                        aria-busy={isUserActionPending(account.id, 'role')}
                      >
                        {accountRoleOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-sm ${
                        account.status === 'Active' ? 'bg-data/10 text-data' : 'bg-accent/10 text-accent'
                      }`}>
                        {account.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-muted uppercase">Listings: {account.totalListings}</span>
                        <span className="text-[9px] font-bold text-muted uppercase">Leads: {account.totalLeads}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button className="p-2 text-muted hover:text-ink" title="Edit" aria-label="Edit user" onClick={() => onOpenUserEditor(account)}><Edit size={14} /></button>
                        <button
                          onClick={() => onSuspendUser(account.id)}
                          className="p-2 text-muted hover:text-accent"
                          title="Suspend user"
                          aria-label="Suspend user"
                        >
                          <ShieldAlert size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[10px] font-black text-muted uppercase tracking-widest">
                    No accounts matched that search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredAccounts.length > userDisplayCount && (
          <div className="border-t border-line px-6 py-3 flex items-center justify-between bg-surface/30">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted">
              Showing {Math.min(userDisplayCount, filteredAccounts.length)} of {filteredAccounts.length} accounts
            </span>
            <button
              type="button"
              onClick={() => onUserDisplayCountChange((prev) => prev + 50)}
              className="text-[9px] font-black uppercase tracking-widest text-accent hover:underline"
            >
              View More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
