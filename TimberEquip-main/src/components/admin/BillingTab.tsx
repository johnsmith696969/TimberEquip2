import React, { useState, useCallback } from 'react';
import {
  TrendingUp, Clock, AlertCircle, Users, Shield, Download,
  RefreshCw, Loader2,
} from 'lucide-react';
import { billingService, Invoice, Subscription, BillingAuditLog, AccountAuditLog, SellerProgramAgreementAcceptance, isSubscriptionTrulyActive, type AdminBillingBootstrapResponse, type AdminDealerPerformanceReportResponse } from '../../services/billingService';

// ── Shared formatting utilities ─────────────────────────────────────────────

function toMillis(value: unknown): number {
  if (!value) return 0;
  if (typeof value === 'string') return new Date(value).getTime() || 0;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  const ts = value as { seconds?: number; toDate?: () => Date };
  if (typeof ts.toDate === 'function') return ts.toDate().getTime();
  if (typeof ts.seconds === 'number') return ts.seconds * 1000;
  return 0;
}

function formatTimestamp(value: unknown): string {
  const ms = toMillis(value);
  if (!ms) return 'Unknown';
  return new Date(ms).toLocaleString();
}

function formatLifecycleLabel(value: string): string {
  return String(value || '')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase()) || 'Unknown';
}

function csvEscape(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function downloadCsv(filenamePrefix: string, headers: string[], rows: string[][]): void {
  const csv = [headers.join(','), ...rows.map((row) => row.map(csvEscape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Props ───────────────────────────────────────────────────────────────────

export interface BillingTabProps {
  hasFullAdminDashboardScope: boolean;
  adminRole?: string;
  onFeedback: (feedback: { tone: 'success' | 'warning' | 'error'; message: string }) => void;
}

// ── Component ───────────────────────────────────────────────────────────────

export function BillingTab({ hasFullAdminDashboardScope, adminRole, onFeedback }: BillingTabProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [billingLogs, setBillingLogs] = useState<BillingAuditLog[]>([]);
  const [accountAuditLogs, setAccountAuditLogs] = useState<AccountAuditLog[]>([]);
  const [sellerAgreementAcceptances, setSellerAgreementAcceptances] = useState<SellerProgramAgreementAcceptance[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingLoaded, setBillingLoaded] = useState(false);
  const [billingLoadError, setBillingLoadError] = useState('');
  const [exportingBillingCsv, setExportingBillingCsv] = useState(false);
  const [exportingDealerPerformanceCsv, setExportingDealerPerformanceCsv] = useState(false);
  const [billingAuditQuery, setBillingAuditQuery] = useState('');
  const [billingAuditActionFilter, setBillingAuditActionFilter] = useState('');
  const [billingAuditUserFilter, setBillingAuditUserFilter] = useState('');
  const [accountAuditDisplayCount, setAccountAuditDisplayCount] = useState(10);
  const [accountAuditSearchQuery, setAccountAuditSearchQuery] = useState('');
  const [accountAuditEventTypeFilter, setAccountAuditEventTypeFilter] = useState('');
  const [accountAuditActorFilter, setAccountAuditActorFilter] = useState('');

  // ── Data loading ───────────────────────────────────────────────────────

  const fetchBillingData = useCallback(async (force = false) => {
    if (billingLoading || (billingLoaded && !force)) return;

    setBillingLoading(true);
    setBillingLoadError('');
    try {
      const payload: AdminBillingBootstrapResponse = await billingService.getAdminBillingBootstrap();
      setInvoices(payload.invoices);
      setSubscriptions(payload.subscriptions);
      setBillingLogs(payload.auditLogs);
      setAccountAuditLogs(payload.accountAuditLogs);
      setSellerAgreementAcceptances(payload.sellerAgreementAcceptances);
      setBillingLoaded(true);

      const errorMessages = [
        payload.errors?.invoices,
        payload.errors?.subscriptions,
        payload.errors?.auditLogs,
        payload.errors?.accountAuditLogs,
        payload.errors?.sellerAgreementAcceptances,
      ].filter(Boolean);
      setBillingLoadError(errorMessages.join(' '));
    } catch (billingError) {
      console.warn('Billing data not available:', billingError);
      setBillingLoadError(billingError instanceof Error ? billingError.message : 'Billing data is not available right now.');
    } finally {
      setBillingLoading(false);
    }
  }, [billingLoading, billingLoaded]);

  // Load billing data on first render
  React.useEffect(() => {
    void fetchBillingData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── CSV exports ────────────────────────────────────────────────────────

  const exportBillingCSV = async () => {
    setExportingBillingCsv(true);
    await new Promise(resolve => requestAnimationFrame(resolve));
    try {
      const headers = [
        'section', 'primary_id', 'secondary_id', 'status', 'amount',
        'currency', 'user_uid', 'plan_id', 'details', 'timestamp',
      ];

      const invoiceRows = invoices.map((invoice) => [
        'invoice', invoice.id, invoice.stripeInvoiceId || '', invoice.status,
        String(invoice.amount ?? ''), invoice.currency || '', invoice.userUid || '', '',
        Array.isArray(invoice.items) ? invoice.items.join(' | ') : '',
        formatTimestamp(invoice.paidAt || invoice.createdAt),
      ]);

      const subscriptionRows = subscriptions.map((subscription) => [
        'subscription', subscription.id, subscription.stripeSubscriptionId || '',
        subscription.status, '', '', subscription.userUid || '', subscription.planId || '',
        subscription.cancelAtPeriodEnd ? 'cancel_at_period_end' : '',
        formatTimestamp(subscription.currentPeriodEnd),
      ]);

      const billingAuditRows = billingLogs.map((log) => [
        'billing_audit', log.id, log.invoiceId || '', log.action || '', '', '',
        log.userUid || '', '', log.details || '', formatTimestamp(log.timestamp),
      ]);

      const accountAuditRows = accountAuditLogs.map((log) => [
        'account_audit', log.id, log.actorUid || '', log.eventType || '', '', '',
        log.targetUid || '', '', [log.source, log.reason].filter(Boolean).join(' | '),
        formatTimestamp(log.createdAt),
      ]);

      const acceptanceRows = sellerAgreementAcceptances.map((acceptance) => [
        'seller_acceptance', acceptance.id,
        acceptance.checkoutSessionId || acceptance.stripeSubscriptionId || '',
        acceptance.status || acceptance.checkoutState || '', '', '',
        acceptance.userUid || '', acceptance.planId || '',
        acceptance.statementLabel || '',
        formatTimestamp(acceptance.updatedAt || acceptance.createdAt),
      ]);

      downloadCsv('billing-report', headers, [
        ...invoiceRows, ...subscriptionRows, ...billingAuditRows,
        ...accountAuditRows, ...acceptanceRows,
      ]);
      onFeedback({ tone: 'success', message: 'Billing report exported.' });
    } finally {
      setExportingBillingCsv(false);
    }
  };

  const exportDealerPerformance30DayCSV = async () => {
    setExportingDealerPerformanceCsv(true);
    try {
      const report: AdminDealerPerformanceReportResponse = await billingService.getAdminDealerPerformanceReport(30);
      const headers = [
        'section', 'period_label', 'period_start', 'period_end', 'seller_uid',
        'seller_name', 'seller_email', 'role', 'listing_id', 'listing_title',
        'listings', 'lead_forms', 'calls', 'connected_calls', 'qualified_calls',
        'missed_calls', 'views', 'inquiry_count', 'call_count', 'view_count',
      ];

      const summaryRows = report.sellerSummaries.map((summary) => [
        'seller_summary', report.periodLabel, report.periodStartIso, report.periodEndIso,
        summary.sellerUid, summary.name || '', summary.email || '', summary.role || '',
        '', '', String(summary.listings || 0), String(summary.leadForms || 0),
        String(summary.calls || 0), String(summary.connectedCalls || 0),
        String(summary.qualifiedCalls || 0), String(summary.missedCalls || 0),
        String(summary.totalViews || 0), '', '', '',
      ]);

      const machineRows = report.sellerSummaries.flatMap((summary) =>
        (summary.topMachines || []).map((machine) => [
          'top_machine', report.periodLabel, report.periodStartIso, report.periodEndIso,
          summary.sellerUid, summary.name || '', summary.email || '', summary.role || '',
          machine.listingId || '', machine.title || '', '', '', '', '', '', '', '',
          String(machine.inquiryCount || 0), String(machine.callCount || 0),
          String(machine.viewCount || 0),
        ])
      );

      const totalsRow = [[
        'totals', report.periodLabel, report.periodStartIso, report.periodEndIso,
        '', 'Marketplace Totals', '', '', '', '',
        String(report.totals.listings || 0), String(report.totals.leadForms || 0),
        String(report.totals.calls || 0), String(report.totals.connectedCalls || 0),
        String(report.totals.qualifiedCalls || 0), String(report.totals.missedCalls || 0),
        String(report.totals.totalViews || 0), '', '', '',
      ]];

      downloadCsv('dealer-performance-30-day', headers, [...summaryRows, ...machineRows, ...totalsRow]);
      onFeedback({ tone: 'success', message: '30-day dealer performance report exported.' });
    } catch (error) {
      console.error('Error exporting 30-day dealer performance report:', error);
      onFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to export the 30-day dealer performance report.',
      });
    } finally {
      setExportingDealerPerformanceCsv(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  if (
    billingLoading &&
    invoices.length === 0 &&
    subscriptions.length === 0 &&
    billingLogs.length === 0 &&
    accountAuditLogs.length === 0 &&
    sellerAgreementAcceptances.length === 0
  ) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (
    billingLoadError &&
    invoices.length === 0 &&
    subscriptions.length === 0 &&
    billingLogs.length === 0 &&
    accountAuditLogs.length === 0 &&
    sellerAgreementAcceptances.length === 0
  ) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-sm border border-red-500/20 bg-red-500/10 p-4">
        <div className="flex items-center gap-3">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <span className="text-xs font-bold text-red-500">{billingLoadError}</span>
        </div>
        <button
          type="button"
          onClick={() => void fetchBillingData(true)}
          className="btn-industrial py-1.5 px-4 text-[10px] shrink-0"
        >
          <RefreshCw size={12} className="mr-1.5" /> Retry
        </button>
      </div>
    );
  }

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  const pendingCount = invoices.filter(i => i.status === 'pending').length;
  const failedCount = invoices.filter(i => i.status === 'failed').length;
  const activeSubs = subscriptions.filter(isSubscriptionTrulyActive).length;

  // ── Month-over-month percentage calculations ───────────────────────────
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const curMonthRevenue = paidInvoices.filter(i => toMillis(i.paidAt || i.createdAt) >= currentMonthStart).reduce((s, i) => s + i.amount, 0);
  const prevMonthRevenue = paidInvoices.filter(i => { const ms = toMillis(i.paidAt || i.createdAt); return ms >= prevMonthStart && ms < currentMonthStart; }).reduce((s, i) => s + i.amount, 0);

  const curMonthPending = invoices.filter(i => i.status === 'pending' && toMillis(i.createdAt) >= currentMonthStart).length;
  const prevMonthPending = invoices.filter(i => i.status === 'pending' && (() => { const ms = toMillis(i.createdAt); return ms >= prevMonthStart && ms < currentMonthStart; })()).length;

  const curMonthFailed = invoices.filter(i => i.status === 'failed' && toMillis(i.createdAt) >= currentMonthStart).length;
  const prevMonthFailed = invoices.filter(i => i.status === 'failed' && (() => { const ms = toMillis(i.createdAt); return ms >= prevMonthStart && ms < currentMonthStart; })()).length;

  // For subscriptions we only have current snapshot — show count vs total subscriptions as a health indicator
  // Count canceled/expired subs that ended in current month as recent churn to approximate change
  const recentChurn = subscriptions.filter(s => {
    if (s.status === 'canceled' || !isSubscriptionTrulyActive(s)) {
      const end = toMillis(s.currentPeriodEnd);
      return end >= currentMonthStart;
    }
    return false;
  }).length;
  const prevMonthActiveSubs = activeSubs + recentChurn;

  function computeChange(current: number, previous: number): string {
    if (previous === 0 && current === 0) return '0%';
    if (previous === 0) return current > 0 ? 'New' : '0%';
    const pct = Math.round(((current - previous) / previous) * 100);
    if (pct > 0) return `+${pct}%`;
    if (pct < 0) return `${pct}%`;
    return '0%';
  }

  const revenueChange = computeChange(curMonthRevenue, prevMonthRevenue);
  const pendingChange = computeChange(curMonthPending, prevMonthPending);
  const failedChange = computeChange(curMonthFailed, prevMonthFailed);
  const subsChange = computeChange(activeSubs, prevMonthActiveSubs);
  const uniqueAccountEventTypes = Array.from(new Set(accountAuditLogs.map((log) => log.eventType).filter(Boolean))).sort();
  const uniqueAccountActors = Array.from(new Set(accountAuditLogs.map((log) => log.actorUid).filter((uid): uid is string => Boolean(uid)))).sort();
  const accountAuditQ = accountAuditSearchQuery.toLowerCase();
  const filteredAccountAuditLogs = accountAuditLogs.filter((log) => {
    if (accountAuditEventTypeFilter && (log.eventType || '') !== accountAuditEventTypeFilter) return false;
    if (accountAuditActorFilter && (log.actorUid || '') !== accountAuditActorFilter) return false;
    if (accountAuditQ) {
      if (
        !(log.eventType || '').toLowerCase().includes(accountAuditQ) &&
        !(log.reason || '').toLowerCase().includes(accountAuditQ) &&
        !(log.actorUid || '').toLowerCase().includes(accountAuditQ) &&
        !(log.targetUid || '').toLowerCase().includes(accountAuditQ) &&
        !(log.source || '').toLowerCase().includes(accountAuditQ)
      ) return false;
    }
    return true;
  });
  const visibleAccountAuditLogs = filteredAccountAuditLogs.slice(0, accountAuditDisplayCount);
  const hasMoreAccountAudit = filteredAccountAuditLogs.length > accountAuditDisplayCount;
  const recentSellerAgreementAcceptances = sellerAgreementAcceptances.slice(0, 10);
  const uniqueBillingActions = Array.from(new Set(billingLogs.map((log) => log.action).filter(Boolean))).sort();
  const uniqueBillingUsers = Array.from(new Set(billingLogs.map((log) => log.userUid).filter(Boolean))).sort();
  const filteredBillingLogs = billingLogs.filter((log) => {
    if (billingAuditActionFilter && (log.action || '') !== billingAuditActionFilter) return false;
    if (billingAuditUserFilter && (log.userUid || '') !== billingAuditUserFilter) return false;
    if (billingAuditQuery) {
      const q = billingAuditQuery.toLowerCase();
      if (!(log.action || '').toLowerCase().includes(q) && !(log.details || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 overflow-y-auto max-h-[calc(100vh-180px)]">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Billing & Revenue Dashboard</h2>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => void exportBillingCSV()}
            disabled={exportingBillingCsv}
            aria-busy={exportingBillingCsv}
            className="btn-industrial bg-surface py-2 px-4 text-[10px] flex items-center disabled:opacity-60"
          >
            {exportingBillingCsv
              ? <><Loader2 size={14} className="mr-2 animate-spin" /> Exporting...</>
              : <><Download size={14} className="mr-2" /> Export Billing CSV</>}
          </button>
          {hasFullAdminDashboardScope ? (
            <button
              type="button"
              onClick={() => void exportDealerPerformance30DayCSV()}
              disabled={exportingDealerPerformanceCsv}
              aria-busy={exportingDealerPerformanceCsv}
              className="btn-industrial py-2 px-4 text-[10px] flex items-center disabled:opacity-60"
            >
              {exportingDealerPerformanceCsv
                ? <><Loader2 size={14} className="mr-2 animate-spin" /> Building 30-Day Report...</>
                : <><Download size={14} className="mr-2" /> Export 30-Day Lead Report</>}
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, change: revenueChange, icon: TrendingUp },
          { label: 'Pending Invoices', value: pendingCount.toString(), change: pendingChange, icon: Clock },
          { label: 'Failed Payments', value: failedCount.toString(), change: failedChange, icon: AlertCircle },
          { label: 'Active Subscriptions', value: activeSubs.toString(), change: subsChange, icon: Users }
        ].map((stat, i) => (
          <div key={i} className="bg-surface border border-line p-6 flex justify-between items-center">
            <div>
              <span className="label-micro text-muted mb-1">{stat.label}</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black tracking-tighter">{stat.value}</span>
                <span className={`text-[10px] font-bold ${stat.change.startsWith('+') || stat.change === 'New' ? 'text-data' : stat.change.startsWith('-') ? 'text-accent' : 'text-muted'}`}>{stat.change}</span>
              </div>
            </div>
            <stat.icon className="text-accent/40" size={24} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface border border-line overflow-hidden">
          <div className="p-6 border-b border-line flex justify-between items-center bg-bg/50">
            <h3 className="text-xs font-black uppercase tracking-widest">Recent Invoices</h3>
            <span className="text-[10px] font-black text-muted uppercase">{invoices.length} total</span>
          </div>
          <div className="max-h-[400px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-surface">
                <tr className="bg-bg/30 border-b border-line">
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Invoice ID</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Amount</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Status</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {invoices.slice(0, 10).map((inv, i) => (
                  <tr key={i} className="hover:bg-bg/20 transition-colors">
                    <td className="p-4 text-xs font-black tracking-tight">{inv.stripeInvoiceId || inv.id}</td>
                    <td className="p-4 text-xs font-black">${inv.amount.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-sm ${
                        inv.status === 'paid' ? 'bg-data/10 text-data' :
                        inv.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                        inv.status === 'failed' ? 'bg-accent/10 text-accent' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-muted">
                      {inv.createdAt?.toDate ? inv.createdAt.toDate().toLocaleDateString() : new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-surface border border-line overflow-hidden">
          <div className="p-6 border-b border-line flex justify-between items-center bg-bg/50">
            <h3 className="text-xs font-black uppercase tracking-widest">Active Subscriptions</h3>
            <span className="text-[10px] font-black text-muted uppercase">{subscriptions.length} total</span>
          </div>
          <div className="max-h-[400px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-surface">
                <tr className="bg-bg/30 border-b border-line">
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">User UID</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Plan</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Status</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Period End</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {subscriptions.map((sub, i) => (
                  <tr key={i} className="hover:bg-bg/20 transition-colors">
                    <td className="p-4 text-xs font-bold truncate max-w-[100px]">{sub.userUid}</td>
                    <td className="p-4 text-xs font-black uppercase">{sub.planId}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-sm ${
                        isSubscriptionTrulyActive(sub) ? 'bg-data/10 text-data' :
                        sub.status === 'canceled' ? 'bg-yellow-500/10 text-yellow-500' :
                        sub.status === 'past_due' ? 'bg-orange-500/10 text-orange-500' :
                        sub.status === 'trialing' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-accent/10 text-accent'
                      }`}>
                        {isSubscriptionTrulyActive(sub) ? 'Active' :
                         sub.status === 'active' ? 'Expired' :
                         sub.status === 'canceled' ? 'Canceled' :
                         sub.status === 'past_due' ? 'Past Due' :
                         sub.status === 'trialing' ? 'Trial' :
                         sub.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-muted">
                      {sub.currentPeriodEnd?.toDate ? sub.currentPeriodEnd.toDate().toLocaleDateString() : new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-line p-8 rounded-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Shield className="text-accent" size={24} />
            <h3 className="text-lg font-black uppercase tracking-tighter text-ink">Billing Audit Trail</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search audit logs..."
                value={billingAuditQuery}
                onChange={(e) => setBillingAuditQuery(e.target.value)}
                className="bg-bg border border-line text-ink text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm placeholder:text-muted focus:outline-none focus:border-accent w-52"
              />
              <select
                value={billingAuditActionFilter}
                onChange={(e) => setBillingAuditActionFilter(e.target.value)}
                className="bg-bg border border-line text-ink text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm focus:outline-none focus:border-accent"
              >
                <option value="">All Actions</option>
                {uniqueBillingActions.map((action) => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
              <select
                value={billingAuditUserFilter}
                onChange={(e) => setBillingAuditUserFilter(e.target.value)}
                className="bg-bg border border-line text-ink text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm focus:outline-none focus:border-accent max-w-[160px]"
              >
                <option value="">All Users</option>
                {uniqueBillingUsers.map((uid) => (
                  <option key={uid} value={uid}>{uid}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                const rows = filteredBillingLogs.map((log) => {
                  const ts = log.timestamp?.toDate ? log.timestamp.toDate().toISOString() : new Date(log.timestamp).toISOString();
                  return [ts, log.action, log.details].join(',');
                });
                const csv = ['Timestamp,Action,Details', ...rows].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `billing-audit-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="text-[9px] font-black uppercase tracking-widest text-accent hover:underline flex items-center gap-1"
            >
              <Download size={10} /> Export
            </button>
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto space-y-0">
          {billingLoadError ? (
            <div className="flex items-center gap-3 rounded-sm border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-xs font-bold text-yellow-600">
              <AlertCircle size={14} className="shrink-0" />
              <span>{billingLoadError}</span>
            </div>
          ) : null}

          {filteredBillingLogs.length === 0 && !billingLoadError ? (
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest py-4 text-center">
              {(billingAuditQuery || billingAuditActionFilter || billingAuditUserFilter) ? 'No audit logs match your filters' : 'No audit logs recorded'}
            </p>
          ) : filteredBillingLogs.map((log, i) => (
            <div key={i} className="flex justify-between items-center py-3 border-b border-line last:border-0">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-accent uppercase tracking-widest">{log.action}</span>
                <span className="text-[11px] text-muted mt-1">{log.details}</span>
              </div>
              <span className="text-[9px] font-bold text-muted/50 flex-shrink-0 ml-4">
                {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-surface border border-line rounded-sm overflow-hidden">
          <div className="p-6 border-b border-line bg-bg/50 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-ink">Account Governance Audit</h3>
              <p className="mt-2 text-[11px] text-muted">
                Role changes, entitlement syncs, subscription-linked changes, and operator-side account actions.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search audit..."
                  value={accountAuditSearchQuery}
                  onChange={(e) => { setAccountAuditSearchQuery(e.target.value); setAccountAuditDisplayCount(10); }}
                  className="bg-bg border border-line text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 placeholder:text-muted focus:outline-none focus:border-accent w-44"
                />
                <select
                  value={accountAuditEventTypeFilter}
                  onChange={(e) => { setAccountAuditEventTypeFilter(e.target.value); setAccountAuditDisplayCount(10); }}
                  className="bg-bg border border-line text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 text-ink focus:outline-none focus:border-accent"
                >
                  <option value="">All Events</option>
                  {uniqueAccountEventTypes.map((eventType) => (
                    <option key={eventType} value={eventType}>{formatLifecycleLabel(eventType)}</option>
                  ))}
                </select>
                <select
                  value={accountAuditActorFilter}
                  onChange={(e) => { setAccountAuditActorFilter(e.target.value); setAccountAuditDisplayCount(10); }}
                  className="bg-bg border border-line text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 text-ink focus:outline-none focus:border-accent max-w-[160px]"
                >
                  <option value="">All Actors</option>
                  {uniqueAccountActors.map((actor) => (
                    <option key={actor} value={actor}>{actor}</option>
                  ))}
                </select>
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                {filteredAccountAuditLogs.length} of {accountAuditLogs.length}
              </div>
            </div>
          </div>
          <div className="max-h-[500px] overflow-y-auto divide-y divide-line">
            {visibleAccountAuditLogs.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                  {(accountAuditSearchQuery || accountAuditEventTypeFilter || accountAuditActorFilter) ? 'No audit events match your filters' : 'No account audit events loaded'}
                </p>
              </div>
            ) : visibleAccountAuditLogs.map((log) => (
              <div key={log.id} className="px-6 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-sm border border-accent/30 bg-accent/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-accent">
                        {formatLifecycleLabel(log.eventType)}
                      </span>
                      {log.source ? (
                        <span className="rounded-sm border border-line bg-bg px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-muted">
                          {formatLifecycleLabel(log.source)}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[11px] font-bold text-ink">
                      {log.reason || 'No operator reason captured for this account event.'}
                    </div>
                    <div className="flex flex-wrap gap-4 text-[10px] font-semibold uppercase tracking-widest text-muted">
                      <span>Actor: {log.actorUid || 'System'}</span>
                      <span>Target: {log.targetUid || 'Unknown'}</span>
                    </div>
                    {log.metadata && Object.keys(log.metadata).length > 0 ? (
                      <div className="rounded-sm border border-line bg-bg px-3 py-2 text-[10px] text-muted">
                        {Object.entries(log.metadata)
                          .map(([key, value]) => `${formatLifecycleLabel(key)}: ${String(value)}`)
                          .join(' • ')}
                      </div>
                    ) : null}
                    {(log.previousState || log.nextState) ? (
                      <div className="flex flex-wrap gap-4">
                        {log.previousState && Object.keys(log.previousState).length > 0 ? (
                          <div className="rounded-sm border border-line bg-bg px-3 py-2 text-[10px] text-muted flex-1 min-w-[200px]">
                            <span className="font-black uppercase tracking-widest text-muted/70 block mb-1">Previous State</span>
                            {Object.entries(log.previousState).map(([key, value]) => (
                              <div key={key}>{formatLifecycleLabel(key)}: {String(value)}</div>
                            ))}
                          </div>
                        ) : null}
                        {log.nextState && Object.keys(log.nextState).length > 0 ? (
                          <div className="rounded-sm border border-line bg-bg px-3 py-2 text-[10px] text-muted flex-1 min-w-[200px]">
                            <span className="font-black uppercase tracking-widest text-muted/70 block mb-1">New State</span>
                            {Object.entries(log.nextState).map(([key, value]) => (
                              <div key={key}>{formatLifecycleLabel(key)}: {String(value)}</div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <div className="text-[9px] font-black uppercase tracking-[0.18em] text-muted">
                    {formatTimestamp(log.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {hasMoreAccountAudit && (
            <div className="p-4 border-t border-line flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                Showing {visibleAccountAuditLogs.length} of {filteredAccountAuditLogs.length}
              </span>
              <button
                type="button"
                onClick={() => setAccountAuditDisplayCount((prev) => prev + 10)}
                className="btn-industrial py-1.5 px-4 text-[10px]"
              >
                View More
              </button>
            </div>
          )}
        </div>

        {adminRole !== 'super_admin' && adminRole !== 'admin' && (<div className="bg-surface border border-line rounded-sm overflow-hidden">
          <div className="p-6 border-b border-line bg-bg/50 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-ink">Seller Legal Acceptances</h3>
              <p className="mt-2 text-[11px] text-muted">
                Agreement acknowledgements captured during seller-program enrollment and Stripe checkout initiation.
              </p>
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">
              {recentSellerAgreementAcceptances.length} loaded
            </div>
          </div>
          <div className="divide-y divide-line">
            {recentSellerAgreementAcceptances.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">No seller agreement acceptances loaded</p>
              </div>
            ) : recentSellerAgreementAcceptances.map((acceptance) => {
              const acceptedCount = [
                acceptance.acceptedTerms,
                acceptance.acceptedPrivacy,
                acceptance.acceptedRecurringBilling,
                acceptance.acceptedVisibilityPolicy,
                acceptance.acceptedAuthority,
              ].filter(Boolean).length;

              return (
                <div key={acceptance.id} className="px-6 py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-sm border border-data/30 bg-data/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-data">
                          {formatLifecycleLabel(acceptance.planId)}
                        </span>
                        {acceptance.status ? (
                          <span className="rounded-sm border border-line bg-bg px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-muted">
                            {formatLifecycleLabel(acceptance.status)}
                          </span>
                        ) : null}
                        {acceptance.checkoutState ? (
                          <span className="rounded-sm border border-line bg-bg px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-muted">
                            Checkout: {formatLifecycleLabel(acceptance.checkoutState)}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[11px] font-bold text-ink">
                        {acceptance.statementLabel || 'Seller program statement'}
                      </div>
                      <div className="flex flex-wrap gap-4 text-[10px] font-semibold uppercase tracking-widest text-muted">
                        <span>User: {acceptance.userUid || 'Unknown'}</span>
                        <span>Version: {acceptance.agreementVersion || 'Current'}</span>
                        <span>Acknowledgements: {acceptedCount}/5</span>
                      </div>
                      {acceptance.checkoutSessionId || acceptance.stripeSubscriptionId ? (
                        <div className="rounded-sm border border-line bg-bg px-3 py-2 text-[10px] text-muted">
                          {[
                            acceptance.checkoutSessionId ? `Checkout: ${acceptance.checkoutSessionId}` : '',
                            acceptance.stripeSubscriptionId ? `Subscription: ${acceptance.stripeSubscriptionId}` : '',
                          ].filter(Boolean).join(' • ')}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-right text-[9px] font-black uppercase tracking-[0.18em] text-muted">
                      <div>{formatTimestamp(acceptance.updatedAt || acceptance.createdAt)}</div>
                      {acceptance.source ? <div className="mt-2">{formatLifecycleLabel(acceptance.source)}</div> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>)}
      </div>
    </div>
  );
}
