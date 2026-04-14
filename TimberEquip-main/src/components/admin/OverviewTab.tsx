import React from 'react';
import {
  Download, MapPin, Database, RefreshCw,
  CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react';
import type { Listing, CallLog } from '../../types';
import type { PgAnalyticsResponse } from '../../services/adminUserService';
import type { DashboardTab } from './adminTypes';

interface StatItem {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  note: string;
}

interface OverviewTabProps {
  stats: StatItem[];
  recentListings: Listing[];
  recentCalls: CallLog[];
  formatPrice: (price: number, currency: string, decimals: number) => string;
  openNativeMap: (location: string) => void;
  hasFullAdminDashboardScope: boolean;
  pgAnalytics: PgAnalyticsResponse | null;
  pgAnalyticsLoading: boolean;
  pgAnalyticsError: string;
  onFetchPgAnalytics: () => void;
  selectAdminTab: (tab: DashboardTab) => void;
  onExportCSV: () => void;
}

export function OverviewTab({
  stats,
  recentListings,
  recentCalls,
  formatPrice,
  openNativeMap,
  hasFullAdminDashboardScope,
  pgAnalytics,
  pgAnalyticsLoading,
  pgAnalyticsError,
  onFetchPgAnalytics,
  selectAdminTab,
  onExportCSV,
}: OverviewTabProps) {
  return (
    <div className="space-y-12">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onExportCSV}
          className="flex items-center gap-1.5 btn-industrial px-3 py-1.5 text-[9px] font-black uppercase tracking-widest"
        >
          <Download size={11} /> Export Overview CSV
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-surface border border-line p-8 rounded-sm shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 bg-bg border border-line rounded-sm ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
            <span className="label-micro block mb-1">{stat.label}</span>
            <span className="text-3xl font-black tracking-tighter text-ink">{stat.value}</span>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-muted">{stat.note}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-bg border border-line rounded-sm shadow-sm overflow-hidden">
          <div className="p-6 border-b border-line flex justify-between items-center bg-surface/50">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Recent Inventory</h3>
            <button onClick={() => selectAdminTab('listings')} className="text-[10px] font-bold text-muted uppercase hover:text-ink">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface/30 text-[10px] font-black uppercase tracking-widest text-muted border-b border-line">
                  <th className="px-6 py-4">Equipment</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4 text-right">Map</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentListings.map(listing => (
                  <tr key={listing.id} className="hover:bg-surface/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-surface rounded-sm overflow-hidden border border-line">
                          <img src={listing.images[0]} alt={listing.title || 'Listing thumbnail'} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase tracking-tight text-ink">{listing.title}</span>
                          <span className="text-[9px] font-bold text-muted uppercase">{listing.location}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-black tracking-tighter text-ink">{formatPrice(listing.price, listing.currency || 'USD', 0)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openNativeMap(listing.location)} aria-label="Open location in map" className="p-2 text-accent hover:text-accent/80">
                        <MapPin size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-bg border border-line rounded-sm shadow-sm overflow-hidden">
          <div className="p-6 border-b border-line flex justify-between items-center bg-surface/50">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Recent Calls</h3>
            <button onClick={() => selectAdminTab('calls')} className="text-[10px] font-bold text-muted uppercase hover:text-ink">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface/30 text-[10px] font-black uppercase tracking-widest text-muted border-b border-line">
                  <th className="px-6 py-4">Caller</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentCalls.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-[10px] font-black uppercase tracking-widest text-muted">
                      No calls available yet. Calls will appear here when visitors reach out by phone.
                    </td>
                  </tr>
                )}
                {recentCalls.map(call => (
                  <tr key={call.id} className="hover:bg-surface/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-tight text-ink">{call.callerName}</span>
                        <span className="text-[9px] font-bold text-muted uppercase">{call.callerPhone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-ink">{call.duration}s</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${call.status === 'Completed' ? 'text-data' : 'text-accent'}`}>
                        {call.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {hasFullAdminDashboardScope && (
        <div className="bg-bg border border-line rounded-sm shadow-sm overflow-hidden">
          <div className="p-6 border-b border-line flex justify-between items-center bg-surface/50">
            <div className="flex items-center gap-3">
              <Database size={16} className="text-accent" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">PostgreSQL Data Connect</h3>
            </div>
            <div className="flex items-center gap-3">
              {pgAnalytics && (
                <span className={`text-[9px] font-black uppercase tracking-widest ${pgAnalytics.status === 'healthy' ? 'text-data' : 'text-accent'}`}>
                  {pgAnalytics.status}
                </span>
              )}
              <button
                onClick={onFetchPgAnalytics}
                disabled={pgAnalyticsLoading}
                className="text-[10px] font-bold text-muted uppercase hover:text-ink disabled:opacity-50"
              >
                {pgAnalyticsLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              </button>
            </div>
          </div>
          <div className="p-6">
            {pgAnalyticsError && (
              <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-4">
                {pgAnalyticsError}
              </div>
            )}
            {pgAnalyticsLoading && !pgAnalytics && (
              <div className="text-center py-8">
                <Loader2 size={20} className="animate-spin mx-auto text-muted" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted mt-3">Querying PostgreSQL...</p>
              </div>
            )}
            {pgAnalytics && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Connectors', value: Object.keys(pgAnalytics.connectors).length, healthy: Object.values(pgAnalytics.connectors).every(Boolean) },
                    { label: 'PG Listings', value: pgAnalytics.summary.totalListingsInPg },
                    { label: 'Anomalies', value: pgAnalytics.summary.openAnomalies },
                    { label: 'Storefronts', value: pgAnalytics.summary.activeStorefronts },
                    { label: 'New Inquiries', value: pgAnalytics.summary.newInquiries },
                    { label: 'Dealer Feeds', value: pgAnalytics.summary.activeDealerFeeds },
                  ].map((metric) => (
                    <div key={metric.label} className="text-center">
                      <div className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">{metric.label}</div>
                      <div className={`text-xl font-black tracking-tighter ${'healthy' in metric ? (metric.healthy ? 'text-data' : 'text-accent') : 'text-ink'}`}>
                        {metric.value ?? '—'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {Object.entries(pgAnalytics.connectors).map(([name, healthy]) => (
                    <div key={name} className={`px-3 py-2 text-center border rounded-sm ${healthy ? 'border-data/30 bg-data/5' : 'border-accent/30 bg-accent/5'}`}>
                      <div className={`text-[9px] font-black uppercase tracking-widest ${healthy ? 'text-data' : 'text-accent'}`}>
                        {healthy ? <CheckCircle2 size={10} className="inline mr-1" /> : <AlertCircle size={10} className="inline mr-1" />}
                        {name}
                      </div>
                    </div>
                  ))}
                </div>
                {Object.keys(pgAnalytics.summary.listingsByState).length > 0 && (
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">Listings by Lifecycle State</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(pgAnalytics.summary.listingsByState)
                        .sort(([, a], [, b]) => b - a)
                        .map(([state, count]) => (
                          <span key={state} className="px-3 py-1 bg-surface border border-line rounded-sm text-[10px] font-bold uppercase tracking-wider text-ink">
                            {state}: <span className="font-black">{count}</span>
                          </span>
                        ))}
                    </div>
                  </div>
                )}
                <div className="text-[9px] font-bold text-muted uppercase tracking-widest">
                  Last queried: {new Date(pgAnalytics.timestamp).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
