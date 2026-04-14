import { API_BASE } from '../constants/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Lock, Mail, Plus, Shield, Trash2, Unlock, UserPlus, Users } from 'lucide-react';
import { auth } from '../firebase';

export type ManagedAccountRole = 'dealer_manager' | 'dealer_staff' | 'member';

interface ManagedUser {
  uid: string;
  displayName: string;
  email: string;
  role: ManagedAccountRole;
  accountStatus: 'active' | 'pending' | 'locked';
  createdAt?: string;
  emailVerified?: boolean;
}

interface ManagedRolesTabProps {
  ownerUid: string;
  isAdmin: boolean;
  seatLimit: number;
}

const ROLE_LABELS: Record<ManagedAccountRole, string> = {
  dealer_manager: 'Manager',
  dealer_staff: 'Staff',
  member: 'Viewer',
};

const ROLE_DESCRIPTIONS: Record<ManagedAccountRole, string> = {
  dealer_manager: 'Can manage listings, settings, and other staff. Cannot change account owner settings.',
  dealer_staff: 'Can create and edit listings. Cannot change storefront settings.',
  member: 'View-only access to the storefront dashboard.',
};

const ASSIGNABLE_ROLES: ManagedAccountRole[] = ['dealer_manager', 'dealer_staff', 'member'];

async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = await getAuthToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export function ManagedRolesTab({ ownerUid, isAdmin, seatLimit }: ManagedRolesTabProps) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({ displayName: '', email: '', role: 'dealer_staff' as ManagedAccountRole });
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<{ users: ManagedUser[] }>(
        `${API_BASE}/managed-roles?ownerUid=${encodeURIComponent(ownerUid)}`,
      );
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team members.');
    } finally {
      setLoading(false);
    }
  }, [ownerUid]);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const seatsUsed = users.length;
  const seatsAvailable = Math.max(seatLimit - seatsUsed, 0);

  const handleInvite = async () => {
    if (!inviteForm.displayName.trim() || !inviteForm.email.trim()) {
      setError('Name and email are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      await apiFetch(`${API_BASE}/admin/users/create-managed-account`, {
        method: 'POST',
        body: JSON.stringify({
          displayName: inviteForm.displayName.trim(),
          email: inviteForm.email.trim(),
          role: inviteForm.role,
        }),
      });
      setInviteForm({ displayName: '', email: '', role: 'dealer_staff' });
      setShowInviteForm(false);
      setNotice('Invitation sent successfully.');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (uid: string, newRole: ManagedAccountRole) => {
    setError('');
    setNotice('');
    try {
      await apiFetch(`${API_BASE}/managed-roles/${uid}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      setNotice('Role updated.');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role.');
    }
  };

  const handleToggleLock = async (uid: string, currentStatus: string) => {
    const action = currentStatus === 'locked' ? 'unlock' : 'lock';
    setError('');
    setNotice('');
    try {
      await apiFetch(`${API_BASE}/managed-roles/${uid}/${action}`, { method: 'POST' });
      setNotice(`Account ${action === 'lock' ? 'locked' : 'unlocked'}.`);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} account.`);
    }
  };

  const handleRemove = async (uid: string, displayName: string) => {
    if (!window.confirm(`Remove ${displayName} from your team? This cannot be undone.`)) return;
    setError('');
    setNotice('');
    try {
      await apiFetch(`${API_BASE}/managed-roles/${uid}`, { method: 'DELETE' });
      setNotice('Team member removed.');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove team member.');
    }
  };

  const handleResetPassword = async (uid: string, email: string) => {
    if (!window.confirm(`Send a password reset email to ${email}?`)) return;
    setError('');
    setNotice('');
    try {
      await apiFetch(`${API_BASE}/managed-roles/${uid}/reset-password`, { method: 'POST' });
      setNotice(`Password reset email sent to ${email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email.');
    }
  };

  const statusBadge = useMemo(() => (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-data/10 text-data',
      pending: 'bg-accent/10 text-accent',
      locked: 'bg-accent/20 text-accent',
    };
    return (
      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm ${styles[status] || 'bg-surface text-muted'}`}>
        {status}
      </span>
    );
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <span className="label-micro text-accent block mb-2">Team Management</span>
          <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">Managed Roles</h3>
          <p className="text-[10px] text-muted uppercase tracking-widest mt-2">
            Invite team members and control what they can do. Only the account owner can manage roles.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted">
            {seatsUsed} / {seatLimit} seats used
          </span>
          {seatsAvailable > 0 && (
            <button
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="btn-industrial btn-accent py-2 px-4 flex items-center gap-2"
            >
              <UserPlus size={14} /> Invite
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-[10px] font-black uppercase tracking-widest text-accent">{error}</p>}
      {notice && <p className="text-[10px] font-black uppercase tracking-widest text-data">{notice}</p>}

      {showInviteForm && (
        <div className="bg-surface border border-line p-6 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Plus size={14} /> Invite Team Member
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="label-micro">Name</label>
              <input
                type="text"
                className="input-industrial w-full"
                value={inviteForm.displayName}
                onChange={(e) => setInviteForm((prev) => ({ ...prev, displayName: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1">
              <label className="label-micro">Email</label>
              <input
                type="email"
                className="input-industrial w-full"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="label-micro">Role</label>
              <select
                className="input-industrial w-full"
                value={inviteForm.role}
                onChange={(e) => setInviteForm((prev) => ({ ...prev, role: e.target.value as ManagedAccountRole }))}
              >
                {ASSIGNABLE_ROLES.map((role) => (
                  <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void handleInvite()} disabled={submitting} className="btn-industrial btn-accent py-2 px-6 disabled:opacity-60">
              {submitting ? 'Sending...' : 'Send Invite'}
            </button>
            <button onClick={() => setShowInviteForm(false)} className="btn-industrial py-2 px-6">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Role descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ASSIGNABLE_ROLES.map((role) => (
          <div key={role} className="bg-surface border border-line p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-accent" />
              <span className="text-xs font-black uppercase tracking-widest">{ROLE_LABELS[role]}</span>
            </div>
            <p className="text-[10px] text-muted leading-relaxed">{ROLE_DESCRIPTIONS[role]}</p>
          </div>
        ))}
      </div>

      {/* Team members list */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-xs text-muted uppercase tracking-widest">Loading team members...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 border border-line bg-surface/60">
          <Users size={32} className="mx-auto text-muted mb-4" />
          <p className="text-xs font-black uppercase tracking-widest text-muted">No team members yet</p>
          <p className="text-[10px] text-muted mt-2">Invite your first team member to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((member) => (
            <div key={member.uid} className="bg-surface border border-line p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black uppercase tracking-tight truncate">{member.displayName}</span>
                  {statusBadge(member.accountStatus)}
                </div>
                <p className="text-[10px] text-muted uppercase tracking-widest mt-1 truncate">{member.email}</p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <select
                  className="input-industrial text-xs py-1 px-2"
                  value={member.role}
                  onChange={(e) => void handleRoleChange(member.uid, e.target.value as ManagedAccountRole)}
                  disabled={member.accountStatus === 'locked'}
                >
                  {ASSIGNABLE_ROLES.map((role) => (
                    <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                  ))}
                </select>

                <button
                  onClick={() => void handleToggleLock(member.uid, member.accountStatus)}
                  title={member.accountStatus === 'locked' ? 'Unlock account' : 'Lock account'}
                  className="p-2 hover:bg-surface rounded-sm transition-colors"
                >
                  {member.accountStatus === 'locked' ? <Unlock size={14} className="text-data" /> : <Lock size={14} className="text-muted" />}
                </button>

                {(isAdmin || true) && (
                  <button
                    onClick={() => void handleResetPassword(member.uid, member.email)}
                    title="Send password reset email"
                    className="p-2 hover:bg-surface rounded-sm transition-colors"
                  >
                    <Mail size={14} className="text-muted" />
                  </button>
                )}

                <button
                  onClick={() => void handleRemove(member.uid, member.displayName)}
                  title="Remove team member"
                  className="p-2 hover:bg-accent/10 rounded-sm transition-colors"
                >
                  <Trash2 size={14} className="text-accent" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-surface/40 border border-line p-4 flex items-start gap-3">
        <AlertTriangle size={16} className="text-accent flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted leading-relaxed">
          Only the original account owner can add, remove, or change team member roles. Team members cannot modify the
          owner&apos;s account or elevate their own permissions. Locked accounts are immediately prevented from logging in.
        </p>
      </div>
    </div>
  );
}
