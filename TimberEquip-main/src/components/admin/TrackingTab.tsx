import React from 'react';
import { Download, RefreshCw, AlertCircle } from 'lucide-react';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import type { Listing, Inquiry, Account } from '../../types';
import type { Invoice, Subscription } from '../../services/billingService';
import type { AdminOperationsBootstrapResponse } from '../../services/adminUserService';

interface TrackingTabProps {
  trackingListingsLoading: boolean;
  usersLoading: boolean;
  billingLoading: boolean;
  trackingListingsError: string;
  trackingListingsTruncated: boolean;
  trackingListingsLoaded: boolean;
  trackingListings: Listing[];
  listings: Listing[];
  inquiries: Inquiry[];
  accounts: Account[];
  invoices: Invoice[];
  subscriptions: Subscription[];
  overview: AdminOperationsBootstrapResponse['overview'];
  onExportCSV: () => void;
}

export function TrackingTab({
  trackingListingsLoading,
  usersLoading,
  billingLoading,
  trackingListingsError,
  trackingListingsTruncated,
  trackingListingsLoaded,
  trackingListings,
  listings,
  inquiries,
  accounts,
  invoices,
  subscriptions,
  overview,
  onExportCSV,
}: TrackingTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-surface p-6 border border-line rounded-sm">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Performance Tracking</h3>
        <button
          type="button"
          onClick={onExportCSV}
          className="flex items-center gap-1.5 btn-industrial px-3 py-1.5 text-[9px] font-black uppercase tracking-widest"
        >
          <Download size={11} /> Export CSV
        </button>
      </div>

      {trackingListingsLoading || usersLoading || billingLoading ? (
        <div className="flex items-center justify-center gap-3 rounded-sm border border-line bg-surface px-6 py-10">
          <RefreshCw size={16} className="animate-spin text-accent" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted">
            Building full marketplace analytics from live admin data…
          </span>
        </div>
      ) : null}

      {trackingListingsError ? (
        <div className="flex items-center gap-3 rounded-sm border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-yellow-600">
          <AlertCircle size={16} className="shrink-0" />
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Inventory Analytics Warning</p>
            <p className="text-xs font-semibold leading-5">{trackingListingsError}</p>
          </div>
        </div>
      ) : null}

      {trackingListingsTruncated ? (
        <div className="flex items-center gap-3 rounded-sm border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-amber-700">
          <AlertCircle size={16} className="shrink-0" />
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Partial Inventory Analytics</p>
            <p className="text-xs font-semibold leading-5">
              The analytics view hit the safety cap while loading inventory. Counts shown here are still broader than the paged machine table, but the full marketplace inventory exceeds the current client analytics window.
            </p>
          </div>
        </div>
      ) : null}

      <AnalyticsDashboard
        listings={trackingListingsLoaded ? trackingListings : listings}
        inquiries={inquiries}
        accounts={accounts}
        invoices={invoices}
        subscriptions={subscriptions}
        overviewTotalViews={overview?.metrics?.totalViews}
        overviewActiveSubscriptions={overview?.metrics?.activeSubscriptions}
      />
    </div>
  );
}
