import React from 'react';
import {
  TrendingUp, TrendingDown, Package, MessageSquare, Users,
  DollarSign, BarChart2, Activity, Clock, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Listing, Inquiry, Account } from '../../types';
import { Invoice, Subscription } from '../../services/billingService';

interface Props {
  listings: Listing[];
  inquiries: Inquiry[];
  accounts: Account[];
  invoices: Invoice[];
  subscriptions: Subscription[];
}

function pct(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

function daysAgo(dateStr: string | { toDate?: () => Date } | undefined, days: number): boolean {
  if (!dateStr) return false;
  const d = typeof dateStr === 'object' && 'toDate' in dateStr && typeof dateStr.toDate === 'function'
    ? dateStr.toDate()
    : new Date(dateStr as string);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return d.getTime() >= cutoff;
}

export function AnalyticsDashboard({ listings, inquiries, accounts, invoices, subscriptions }: Props) {
  // ── Listing metrics ─────────────────────────────────────────────
  const totalListings     = listings.length;
  const activeListings    = listings.filter(l => l.status === 'active' || !l.status).length;
  const soldListings      = listings.filter(l => l.status === 'sold').length;
  const pendingListings   = listings.filter(l => l.approvalStatus === 'pending').length;
  const newListings30d    = listings.filter(l => daysAgo(l.createdAt, 30)).length;
  const newListings7d     = listings.filter(l => daysAgo(l.createdAt, 7)).length;
  const totalViews        = listings.reduce((s, l) => s + (l.views || 0), 0);
  const totalValue        = listings.reduce((s, l) => s + (l.price || 0), 0);
  const avgPrice          = totalListings > 0 ? Math.round(totalValue / totalListings) : 0;
  const maxPrice          = listings.reduce((max, l) => Math.max(max, l.price || 0), 0);
  const featuredCount     = listings.filter(l => l.featured).length;

  // Category breakdown (top 6)
  const categoryCounts = listings.reduce<Record<string, number>>((acc, l) => {
    const cat = l.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxCatCount = topCategories[0]?.[1] ?? 1;

  // ── Inquiry metrics ─────────────────────────────────────────────
  const totalInquiries   = inquiries.length;
  const newInquiries     = inquiries.filter(i => i.status === 'New').length;
  const wonInquiries     = inquiries.filter(i => i.status === 'Won').length;
  const newInquiries30d  = inquiries.filter(i => daysAgo(i.createdAt as string, 30)).length;

  const inquiryByStatus = ['New', 'Contacted', 'Qualified', 'Won', 'Lost', 'Closed'].map(s => ({
    label: s,
    count: inquiries.filter(i => i.status === s).length,
  }));

  const inquiryByType = ['Inquiry', 'Financing', 'Shipping', 'Call'].map(t => ({
    label: t,
    count: inquiries.filter(i => i.type === t).length,
  }));

  const conversionRate = pct(wonInquiries, totalInquiries);

  // ── Account metrics ─────────────────────────────────────────────
  const totalAccounts   = accounts.length;
  const activeAccounts  = accounts.filter(a => a.status === 'Active').length;
  const dealerAccounts  = accounts.filter(a => ['dealer', 'dealer_manager', 'dealer_staff'].includes(a.role)).length;
  const sellerAccounts  = accounts.filter(a => a.role === 'individual_seller').length;
  const adminAccounts   = accounts.filter(a => ['super_admin', 'admin', 'developer'].includes(a.role)).length;

  // Top sellers by listing count
  const topSellers = accounts
    .filter(a => a.totalListings > 0)
    .sort((a, b) => b.totalListings - a.totalListings)
    .slice(0, 5);

  // ── Billing metrics ─────────────────────────────────────────────
  const totalRevenue    = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const activeSubs      = subscriptions.filter(s => s.status === 'active').length;
  const failedInvoices  = invoices.filter(i => i.status === 'failed').length;

  // ── Helper: mini bar ────────────────────────────────────────────
  const Bar = ({ value, max, color }: { value: number; max: number; color: string }) => (
    <div className="w-full bg-line h-2 rounded-full overflow-hidden">
      <div
        className={`${color} h-full rounded-full transition-all`}
        style={{ width: `${max === 0 ? 0 : Math.round((value / max) * 100)}%` }}
      />
    </div>
  );

  return (
    <div className="space-y-10">

      {/* ── KPI Row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Listings',    value: totalListings,                  icon: Package,       color: 'text-accent',    sub: `${activeListings} active` },
          { label: 'Total Inquiries',   value: totalInquiries,                 icon: MessageSquare, color: 'text-data',      sub: `${newInquiries} new` },
          { label: 'Total Accounts',    value: totalAccounts,                  icon: Users,         color: 'text-secondary', sub: `${activeAccounts} active` },
          { label: 'Total Revenue',     value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-yellow-500', sub: `${activeSubs} active subs` },
        ].map((kpi, i) => (
          <div key={i} className="bg-surface border border-line p-6 rounded-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="label-micro text-muted">{kpi.label}</span>
              <kpi.icon size={18} className={kpi.color} />
            </div>
            <div className={`text-3xl font-black tracking-tighter ${kpi.color}`}>{kpi.value}</div>
            <div className="text-[9px] font-bold text-muted uppercase tracking-widest">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Mid-section: Listings + Inquiries ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Listings status breakdown */}
        <div className="bg-surface border border-line p-6 rounded-sm space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-ink flex items-center gap-2">
            <BarChart2 size={14} /> Listing Status
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Active',   count: activeListings,  color: 'bg-data' },
              { label: 'Sold',     count: soldListings,    color: 'bg-accent' },
              { label: 'Pending',  count: pendingListings, color: 'bg-yellow-500' },
              { label: 'Featured', count: featuredCount,   color: 'bg-secondary' },
            ].map(s => (
              <div key={s.label} className="space-y-1">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                  <span className="text-muted">{s.label}</span>
                  <span className="text-ink">{s.count}</span>
                </div>
                <Bar value={s.count} max={totalListings} color={s.color} />
              </div>
            ))}
          </div>
          <div className="border-t border-line pt-3 grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="text-lg font-black tracking-tighter text-ink">{newListings7d}</div>
              <div className="text-[8px] font-bold text-muted uppercase">New (7d)</div>
            </div>
            <div>
              <div className="text-lg font-black tracking-tighter text-ink">{newListings30d}</div>
              <div className="text-[8px] font-bold text-muted uppercase">New (30d)</div>
            </div>
          </div>
        </div>

        {/* Inquiry pipeline */}
        <div className="bg-surface border border-line p-6 rounded-sm space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-ink flex items-center gap-2">
            <Activity size={14} /> Lead Pipeline
          </h3>
          <div className="space-y-3">
            {inquiryByStatus.map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-[9px] font-bold text-muted uppercase w-20 shrink-0">{s.label}</span>
                <div className="flex-1">
                  <Bar value={s.count} max={totalInquiries || 1} color={
                    s.label === 'Won' ? 'bg-data' :
                    s.label === 'New' ? 'bg-accent' :
                    s.label === 'Lost' ? 'bg-red-500' :
                    'bg-line'
                  } />
                </div>
                <span className="text-[9px] font-black text-ink w-6 text-right">{s.count}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-line pt-3 flex items-center justify-between">
            <div className="text-center">
              <div className="text-lg font-black tracking-tighter text-data">{conversionRate}%</div>
              <div className="text-[8px] font-bold text-muted uppercase">Conversion</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black tracking-tighter text-ink">{newInquiries30d}</div>
              <div className="text-[8px] font-bold text-muted uppercase">New (30d)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black tracking-tighter text-accent">{wonInquiries}</div>
              <div className="text-[8px] font-bold text-muted uppercase">Won</div>
            </div>
          </div>
        </div>

        {/* Inquiry by type */}
        <div className="bg-surface border border-line p-6 rounded-sm space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-ink flex items-center gap-2">
            <MessageSquare size={14} /> Inquiry Types
          </h3>
          <div className="space-y-3">
            {inquiryByType.map(t => (
              <div key={t.label} className="space-y-1">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                  <span className="text-muted">{t.label}</span>
                  <span className="text-ink">{t.count} <span className="text-muted font-bold">({pct(t.count, totalInquiries)}%)</span></span>
                </div>
                <Bar value={t.count} max={totalInquiries || 1} color="bg-accent" />
              </div>
            ))}
          </div>
          <div className="border-t border-line pt-3 space-y-1">
            <div className="flex justify-between text-[9px] font-bold text-muted uppercase">
              <span>Total Views (all listings)</span>
              <span className="text-ink font-black">{totalViews.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Inventory value + Categories ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Category breakdown */}
        <div className="bg-surface border border-line p-6 rounded-sm space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-ink flex items-center gap-2">
            <Package size={14} /> Listings by Category
          </h3>
          {topCategories.length === 0 ? (
            <p className="text-[10px] font-bold text-muted uppercase">No listings</p>
          ) : (
            <div className="space-y-3">
              {topCategories.map(([cat, count]) => (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted">
                    <span className="truncate max-w-[180px]">{cat}</span>
                    <span className="text-ink">{count}</span>
                  </div>
                  <Bar value={count} max={maxCatCount} color="bg-accent" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory value stats */}
        <div className="bg-surface border border-line p-6 rounded-sm space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-ink flex items-center gap-2">
            <DollarSign size={14} /> Inventory Value
          </h3>
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: 'Total Inventory Value', value: `$${totalValue.toLocaleString()}` },
              { label: 'Average Listing Price', value: `$${avgPrice.toLocaleString()}` },
              { label: 'Highest Priced Listing', value: `$${maxPrice.toLocaleString()}` },
              { label: 'Active Subscriptions', value: activeSubs.toString() },
              { label: 'Total Revenue Collected', value: `$${totalRevenue.toLocaleString()}` },
              { label: 'Failed Invoices', value: failedInvoices.toString() },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-[8px] font-bold text-muted uppercase tracking-widest mb-1">{label}</div>
                <div className="text-lg font-black tracking-tighter text-ink">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Accounts + Top Sellers ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Account role distribution */}
        <div className="bg-surface border border-line p-6 rounded-sm space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-ink flex items-center gap-2">
            <Users size={14} /> Account Distribution
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Dealers',     count: dealerAccounts,  color: 'bg-accent' },
              { label: 'Owner-Operators', count: sellerAccounts, color: 'bg-data' },
              { label: 'Admin Team',  count: adminAccounts,   color: 'bg-secondary' },
              { label: 'Other',       count: totalAccounts - dealerAccounts - sellerAccounts - adminAccounts, color: 'bg-line' },
            ].map(s => (
              <div key={s.label} className="space-y-1">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                  <span className="text-muted">{s.label}</span>
                  <span className="text-ink">{s.count}</span>
                </div>
                <Bar value={s.count} max={totalAccounts || 1} color={s.color} />
              </div>
            ))}
          </div>
          <div className="border-t border-line pt-3 flex gap-6">
            <div className="text-center">
              <div className="text-lg font-black tracking-tighter text-data">{activeAccounts}</div>
              <div className="text-[8px] font-bold text-muted uppercase">Active</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black tracking-tighter text-accent">{totalAccounts - activeAccounts}</div>
              <div className="text-[8px] font-bold text-muted uppercase">Inactive</div>
            </div>
          </div>
        </div>

        {/* Top sellers */}
        <div className="bg-surface border border-line p-6 rounded-sm space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-ink flex items-center gap-2">
            <TrendingUp size={14} /> Top Sellers by Listings
          </h3>
          {topSellers.length === 0 ? (
            <p className="text-[10px] font-bold text-muted uppercase">No seller data</p>
          ) : (
            <div className="space-y-3">
              {topSellers.map((seller, i) => (
                <div key={seller.id} className="flex items-center gap-4">
                  <span className="text-[9px] font-black text-muted w-4 text-right">{i + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-ink/10 flex items-center justify-center text-[9px] font-black text-ink">
                    {seller.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black text-ink uppercase truncate">{seller.name}</div>
                    <div className="text-[8px] font-bold text-muted uppercase">{seller.company || seller.role}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-accent">{seller.totalListings}</div>
                    <div className="text-[8px] font-bold text-muted uppercase">listings</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Health indicators ──────────────────────────────────── */}
      <div className="bg-ink text-white p-8 rounded-sm">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-white/60">Platform Health</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            {
              label: 'Listing Approval Rate',
              value: `${pct(listings.filter(l => l.approvalStatus === 'approved').length, totalListings || 1)}%`,
              icon: CheckCircle2,
              good: pct(listings.filter(l => l.approvalStatus === 'approved').length, totalListings || 1) > 80,
            },
            {
              label: 'Lead Conversion',
              value: `${conversionRate}%`,
              icon: TrendingUp,
              good: conversionRate > 10,
            },
            {
              label: 'Failed Payments',
              value: failedInvoices.toString(),
              icon: AlertCircle,
              good: failedInvoices === 0,
            },
            {
              label: 'Active Subscriptions',
              value: activeSubs.toString(),
              icon: Activity,
              good: activeSubs > 0,
            },
          ].map(({ label, value, icon: Icon, good }) => (
            <div key={label} className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon size={14} className={good ? 'text-data' : 'text-accent'} />
                <span className="text-[8px] font-bold uppercase tracking-widest text-white/50">{label}</span>
              </div>
              <div className={`text-2xl font-black tracking-tighter ${good ? 'text-data' : 'text-accent'}`}>{value}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
