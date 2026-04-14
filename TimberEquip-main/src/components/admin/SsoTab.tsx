import React, { useCallback, useEffect, useState } from 'react';
import { Shield, Plus, Trash2, Edit, Key } from 'lucide-react';
import { auth } from '../../firebase';
import { API_BASE } from '../../constants/api';

interface SsoProvider {
  id: string;
  dealerName: string;
  providerType: 'saml' | 'oidc';
  entityId: string;
  ssoUrl: string;
  certificate: string;
  emailDomains: string[];
  enabled: boolean;
}

type ProviderFormData = Omit<SsoProvider, 'id' | 'emailDomains'> & { emailDomains: string };

const emptyForm: ProviderFormData = {
  dealerName: '',
  providerType: 'saml',
  entityId: '',
  ssoUrl: '',
  certificate: '',
  emailDomains: '',
  enabled: true,
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Not authenticated');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export function SsoTab() {
  const [providers, setProviders] = useState<SsoProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProviderFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/sso/providers`, { headers });
      if (!res.ok) throw new Error('Failed to load SSO providers');
      const data = await res.json();
      setProviders(Array.isArray(data) ? data : data.providers ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchProviders(); }, [fetchProviders]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const openAddForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (provider: SsoProvider) => {
    setForm({
      dealerName: provider.dealerName,
      providerType: provider.providerType,
      entityId: provider.entityId,
      ssoUrl: provider.ssoUrl,
      certificate: provider.certificate,
      emailDomains: provider.emailDomains.join(', '),
      enabled: provider.enabled,
    });
    setEditingId(provider.id);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const headers = await getAuthHeaders();
      const body = JSON.stringify({
        ...form,
        emailDomains: form.emailDomains.split(',').map((d) => d.trim()).filter(Boolean),
      });
      const url = editingId ? `${API_BASE}/sso/providers/${editingId}` : `${API_BASE}/sso/providers`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body });
      if (!res.ok) throw new Error('Failed to save provider');
      resetForm();
      await fetchProviders();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/sso/providers/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Failed to delete provider');
      setProviders((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const updateField = <K extends keyof ProviderFormData>(key: K, value: ProviderFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={18} className="text-accent" />
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-ink">SSO Providers</h2>
        </div>
        <button type="button" onClick={openAddForm} className="btn-industrial btn-accent py-2 px-4 text-[10px] flex items-center gap-1.5">
          <Plus size={12} /> Add Provider
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-sm p-4 text-xs font-bold text-red-500">{error}</div>
      )}

      {showForm && (
        <form onSubmit={handleSave} className="bg-surface border border-line rounded-sm p-6 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-ink mb-2">
            {editingId ? 'Edit Provider' : 'New SSO Provider'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="label-micro">Dealer Name</label>
              <input value={form.dealerName} onChange={(e) => updateField('dealerName', e.target.value)} className="input-industrial px-3 py-2 text-xs" required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="label-micro">Provider Type</label>
              <select value={form.providerType} onChange={(e) => updateField('providerType', e.target.value as 'saml' | 'oidc')} className="input-industrial px-3 py-2 text-xs">
                <option value="saml">SAML</option>
                <option value="oidc">OIDC</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="label-micro">{form.providerType === 'saml' ? 'Entity ID' : 'Client ID'}</label>
              <input value={form.entityId} onChange={(e) => updateField('entityId', e.target.value)} className="input-industrial px-3 py-2 text-xs" required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="label-micro">{form.providerType === 'saml' ? 'SSO URL' : 'Issuer URL'}</label>
              <input value={form.ssoUrl} onChange={(e) => updateField('ssoUrl', e.target.value)} className="input-industrial px-3 py-2 text-xs" required />
            </div>
            {form.providerType === 'saml' && (
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="label-micro">Certificate</label>
                <textarea value={form.certificate} onChange={(e) => updateField('certificate', e.target.value)} rows={3} className="input-industrial px-3 py-2 text-xs font-mono" />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="label-micro">Email Domains (comma-separated)</label>
              <input value={form.emailDomains} onChange={(e) => updateField('emailDomains', e.target.value)} placeholder="company.com, corp.com" className="input-industrial px-3 py-2 text-xs" required />
            </div>
            <div className="flex items-center gap-2 self-end pb-1">
              <input type="checkbox" id="sso-enabled" checked={form.enabled} onChange={(e) => updateField('enabled', e.target.checked)} className="w-4 h-4 accent-accent" />
              <label htmlFor="sso-enabled" className="label-micro cursor-pointer">Enabled</label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-industrial btn-accent py-2 px-6 text-[10px] disabled:opacity-50">
              {saving ? 'Saving...' : editingId ? 'Update Provider' : 'Create Provider'}
            </button>
            <button type="button" onClick={resetForm} className="btn-industrial py-2 px-6 text-[10px]">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-[10px] font-black uppercase tracking-widest text-muted">Loading SSO providers...</div>
      ) : providers.length === 0 ? (
        <div className="bg-surface border border-line rounded-sm p-8 text-center">
          <Key size={24} className="mx-auto text-muted mb-3" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted">No SSO providers configured yet</p>
        </div>
      ) : (
        <div className="bg-bg border border-line rounded-sm overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface border-b border-line">
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Dealer</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Type</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Domains</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Status</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {providers.map((p) => (
                <tr key={p.id} className="hover:bg-surface/50 transition-colors">
                  <td className="p-4 text-xs font-black uppercase text-ink">{p.dealerName}</td>
                  <td className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted">{p.providerType.toUpperCase()}</td>
                  <td className="p-4 text-[10px] font-bold text-muted">{p.emailDomains.join(', ')}</td>
                  <td className="p-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${p.enabled ? 'bg-data/10 text-data' : 'bg-red-500/10 text-red-500'}`}>
                      {p.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEditForm(p)} className="btn-industrial py-1.5 px-3 text-[9px] flex items-center gap-1">
                        <Edit size={12} /> Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(p.id)} className="btn-industrial py-1.5 px-3 text-[9px] flex items-center gap-1 text-accent">
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
