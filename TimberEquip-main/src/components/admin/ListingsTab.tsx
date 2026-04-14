import React from 'react';
import {
  AlertCircle, RefreshCw, Download, Filter, Plus,
  ShieldAlert, Activity, Image, FileText,
} from 'lucide-react';
import { VirtualizedListingsTable } from './VirtualizedListingsTable';
import { BulkImportToolkit } from '../BulkImportToolkit';
import type { Listing } from '../../types';
import type { ListingReviewSummary, AdminListingsCursor } from '../../services/equipmentService';
import type { ListingLifecycleAction, ListingLifecycleAuditView } from '../../types';

type ListingReviewFilter = 'all' | 'pending_approval' | 'paid_not_live' | 'rejected' | 'expired' | 'sold' | 'archived' | 'anomalies';

const LISTINGS_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

interface ListingsTabProps {
  authUser: { uid?: string; role?: string } | null;
  listings: Listing[];
  filteredListings: Listing[];
  listingsLoading: boolean;
  listingsLoadError: string;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  showDemoListings: boolean;
  listingPage: number;
  listingsPerPage: number;
  onListingsPerPageChange: (size: number) => void;
  listingHasMore: boolean;
  nextListingCursor: AdminListingsCursor;
  listingCursorHistory: AdminListingsCursor[];
  onLoadListingsPage: (cursor: AdminListingsCursor, page: number, includeDemoListings: boolean, pageSizeOverride?: number) => Promise<void>;
  listingReviewFilter: ListingReviewFilter;
  onListingReviewFilterChange: (filter: ListingReviewFilter) => void;
  listingReviewCounts: Record<ListingReviewFilter, number>;
  listingReviewSummariesLoading: boolean;
  listingReviewSummariesError: string;
  pendingReviewCount: number;
  liveListingCount: number;
  rejectedListingCount: number;
  paidNotLiveCount: number;
  anomalyListingCount: number;
  bulkApprovingListings: boolean;
  // Listing modal
  onEditListing: (listing: Listing) => void;
  onAddListing: () => void;
  onDeleteListing: (id: string) => Promise<void>;
  onBulkDeleteListings: (ids: string[]) => Promise<void>;
  onBulkApproveListings: (listings: Listing[]) => Promise<void>;
  // Lifecycle audit panel
  selectedListingAudit: Listing | null;
  selectedListingAuditId: string;
  listingAuditData: ListingLifecycleAuditView | null;
  listingAuditLoading: boolean;
  listingAuditError: string;
  listingAuditPanelRef: React.RefObject<HTMLDivElement | null>;
  onInspectListing: (listing: Listing) => void;
  onCloseAuditPanel: () => void;
  onAdminLifecycleAction: (listing: Listing, action: ListingLifecycleAction) => Promise<void>;
  isListingLifecyclePending: (listingId: string, action: ListingLifecycleAction) => boolean;
  getAdminLifecycleActions: (listing: Listing) => Array<{ action: ListingLifecycleAction; label: string; tone: 'primary' | 'secondary' | 'danger' }>;
  // Formatters
  formatLifecycleLabel: (value: string) => string;
  getListingBadgeClasses: (value: string, type: 'status' | 'approval' | 'payment' | 'visibility') => string;
  openNativeMap: (location: string) => void;
  onExportListingsCSV: () => void;
  onExportGovernanceAuditCSV: () => void;
  onExportTransitionsCSV: () => void;
}

export function ListingsTab({
  authUser,
  filteredListings,
  listingsLoading,
  listingsLoadError,
  searchQuery,
  onSearchQueryChange,
  showDemoListings,
  listingPage,
  listingsPerPage,
  onListingsPerPageChange,
  listingHasMore,
  nextListingCursor,
  listingCursorHistory,
  onLoadListingsPage,
  listingReviewFilter,
  onListingReviewFilterChange,
  listingReviewCounts,
  listingReviewSummariesLoading,
  listingReviewSummariesError,
  pendingReviewCount,
  liveListingCount,
  rejectedListingCount,
  paidNotLiveCount,
  anomalyListingCount,
  bulkApprovingListings,
  onEditListing,
  onAddListing,
  onDeleteListing,
  onBulkDeleteListings,
  onBulkApproveListings,
  selectedListingAudit,
  listingAuditData,
  listingAuditLoading,
  listingAuditError,
  listingAuditPanelRef,
  onInspectListing,
  onCloseAuditPanel,
  onAdminLifecycleAction,
  isListingLifecyclePending,
  getAdminLifecycleActions,
  formatLifecycleLabel,
  getListingBadgeClasses,
  openNativeMap,
  onExportListingsCSV,
  onExportGovernanceAuditCSV,
  onExportTransitionsCSV,
}: ListingsTabProps) {
  return (
    <div className="space-y-6">
      {listingsLoadError && (
        <div className="flex items-center justify-between gap-4 bg-red-500/10 border border-red-500/20 rounded-sm p-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <span className="text-xs font-bold text-red-500">{listingsLoadError}</span>
          </div>
          <button
            type="button"
            onClick={() => void onLoadListingsPage(null, 1, showDemoListings)}
            className="btn-industrial py-1.5 px-4 text-[10px] shrink-0"
          >
            <RefreshCw size={12} className="mr-1.5" /> Retry
          </button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-6 border border-line rounded-sm">
        <div className="flex items-center gap-2 w-full sm:w-96">
          <input
            type="text"
            placeholder="Search the machine queue by title, ID, seller, make, or model..."
            value={searchQuery}
            onChange={e => onSearchQueryChange(e.target.value)}
            className="input-industrial w-full px-3 text-[10px] font-bold uppercase tracking-widest"
          />
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={onExportListingsCSV} className="btn-industrial py-2 px-4 flex items-center">
            <Download size={14} className="mr-2" />
            Export CSV
          </button>
          <button className="btn-industrial py-2 px-4 flex items-center">
            <Filter size={14} className="mr-2" />
            Filter
          </button>
          <button
            onClick={onAddListing}
            className="btn-industrial btn-accent py-2 px-6 flex items-center"
          >
            <Plus size={14} className="mr-2" />
            Add Machine
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-sm border border-line bg-bg px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing {filteredListings.length} loaded listings on page {listingPage}
        </span>
        <span>
          {listingsLoading ? 'Loading next inventory slice...' : listingHasMore ? 'More listings available' : 'End of loaded inventory'}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-sm border border-amber-500/20 bg-amber-500/10 px-4 py-4">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600">Pending Review</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-amber-600">{pendingReviewCount}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-amber-600">Needs admin or super admin decision</p>
        </div>
        <div className="rounded-sm border border-data/30 bg-data/10 px-4 py-4">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-data">Live Listings</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-ink">{liveListingCount}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-data">Approved, paid, and publicly visible</p>
        </div>
        <div className="rounded-sm border border-red-500/20 bg-red-500/10 px-4 py-4">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500">Rejected Listings</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-red-500">{rejectedListingCount}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-red-500">Require correction before resubmission</p>
        </div>
      </div>

      <div className="rounded-sm border border-line bg-surface px-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink">Operator Review Filters</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted">
              Search the queue above, then review pending approval, paid not live, rejected, expired, sold, archived, and anomaly states here.
            </p>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted">
            {listingReviewSummariesLoading ? 'Refreshing review summaries...' : 'Review summaries synced from governance artifacts'}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Loaded', count: listingReviewCounts.all },
            { key: 'pending_approval', label: 'Pending Approval', count: pendingReviewCount },
            { key: 'paid_not_live', label: 'Paid Not Live', count: paidNotLiveCount },
            { key: 'rejected', label: 'Rejected', count: rejectedListingCount },
            { key: 'expired', label: 'Expired', count: listingReviewCounts.expired },
            { key: 'sold', label: 'Sold', count: listingReviewCounts.sold },
            { key: 'archived', label: 'Archived', count: listingReviewCounts.archived },
            { key: 'anomalies', label: 'Anomalies', count: anomalyListingCount },
          ].map((option) => {
            const isActive = listingReviewFilter === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onListingReviewFilterChange(option.key as ListingReviewFilter)}
                className={`rounded-sm border px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${
                  isActive
                    ? 'border-accent bg-accent text-white'
                    : 'border-line bg-bg text-ink hover:border-accent'
                }`}
              >
                {option.label} ({option.count})
              </button>
            );
          })}
        </div>
        {listingReviewSummariesError ? (
          <div className="mt-4 flex items-center gap-2 rounded-sm border border-yellow-500/20 bg-yellow-500/10 px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-yellow-600">
            <AlertCircle size={14} className="shrink-0" />
            <span>{listingReviewSummariesError}</span>
          </div>
        ) : null}
      </div>

      <div className="rounded-sm border border-line bg-surface">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink">Operator Review Queue</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted">
              Scroll, search, inspect, and bulk-publish loaded inventory before using imports or media mapping below.
            </p>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted">
            {filteredListings.length.toLocaleString()} loaded listing{filteredListings.length === 1 ? '' : 's'}
          </div>
        </div>
        <div className="overflow-x-auto -mx-4 px-4 py-4">
          <VirtualizedListingsTable
            listings={filteredListings}
            onEdit={(listing) => onEditListing(listing)}
            onDelete={onDeleteListing}
            onBulkDelete={onBulkDeleteListings}
            onBulkApprove={onBulkApproveListings}
            bulkApproveLoading={bulkApprovingListings}
            onInspect={(listing) => onInspectListing(listing)}
            openNativeMap={openNativeMap}
          />
        </div>
      </div>

      {selectedListingAudit && (
        <div ref={listingAuditPanelRef} className="rounded-sm border border-line bg-surface shadow-sm scroll-mt-24">
          <div className="flex flex-col gap-4 border-b border-line px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-accent" />
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-accent">Lifecycle Control Panel</span>
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-ink">
                  {selectedListingAudit.title || '(Untitled Listing)'}
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                  {selectedListingAudit.manufacturer || selectedListingAudit.make || 'Unknown Manufacturer'} · {selectedListingAudit.model || 'Unknown Model'} · ID {selectedListingAudit.id}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-sm px-2 py-1 text-[9px] font-black uppercase tracking-widest ${getListingBadgeClasses(String(selectedListingAudit.status || 'pending'), 'status')}`}>
                  Status: {formatLifecycleLabel(String(selectedListingAudit.status || 'pending'))}
                </span>
                <span className={`rounded-sm px-2 py-1 text-[9px] font-black uppercase tracking-widest ${getListingBadgeClasses(String(selectedListingAudit.approvalStatus || 'pending'), 'approval')}`}>
                  Review: {formatLifecycleLabel(String(selectedListingAudit.approvalStatus || 'pending'))}
                </span>
                <span className={`rounded-sm px-2 py-1 text-[9px] font-black uppercase tracking-widest ${getListingBadgeClasses(String(selectedListingAudit.paymentStatus || 'pending'), 'payment')}`}>
                  Payment: {formatLifecycleLabel(String(selectedListingAudit.paymentStatus || 'pending'))}
                </span>
                {listingAuditData?.report?.shadowState?.visibilityState && (
                  <span className={`rounded-sm px-2 py-1 text-[9px] font-black uppercase tracking-widest ${getListingBadgeClasses(String(listingAuditData.report.shadowState.visibilityState), 'visibility')}`}>
                    Visibility: {formatLifecycleLabel(String(listingAuditData.report.shadowState.visibilityState))}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onInspectListing(selectedListingAudit)}
                disabled={listingAuditLoading}
                className="btn-industrial py-2 px-4 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={12} className={`mr-1.5 ${listingAuditLoading ? 'animate-spin' : ''}`} />
                Refresh Audit
              </button>
              <button
                type="button"
                onClick={onExportGovernanceAuditCSV}
                disabled={!listingAuditData}
                className="btn-industrial py-2 px-4 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={12} className="mr-1.5" />
                Export Audit CSV
              </button>
              <button
                type="button"
                onClick={onCloseAuditPanel}
                className="btn-industrial py-2 px-4"
              >
                Close Panel
              </button>
            </div>
          </div>

          <div className="space-y-6 px-6 py-5">
            <div className="flex flex-wrap gap-2">
              {getAdminLifecycleActions(selectedListingAudit).map((option) => (
                <button
                  key={`${selectedListingAudit.id}:${option.action}`}
                  type="button"
                  onClick={() => void onAdminLifecycleAction(selectedListingAudit, option.action)}
                  disabled={isListingLifecyclePending(selectedListingAudit.id, option.action)}
                  className={`rounded-sm px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    option.tone === 'danger'
                      ? 'border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20'
                      : option.tone === 'primary'
                        ? 'border border-accent bg-accent text-white hover:bg-accent/90'
                        : 'border border-line bg-bg text-ink hover:border-accent'
                  }`}
                >
                  {isListingLifecyclePending(selectedListingAudit.id, option.action) ? 'Working...' : option.label}
                </button>
              ))}
            </div>

            {listingAuditError && (
              <div className="flex items-start gap-3 rounded-sm border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-500">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Audit Unavailable</p>
                  <p className="text-xs font-semibold leading-5">{listingAuditError}</p>
                </div>
              </div>
            )}

            {listingAuditLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-sm border border-line bg-bg p-4">
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="text-accent" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Governance Snapshot</h4>
                    </div>
                    {listingAuditData?.report ? (
                      <div className="mt-4 space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {[
                            { label: 'Lifecycle', value: listingAuditData.report.shadowState?.lifecycleState },
                            { label: 'Review', value: listingAuditData.report.shadowState?.reviewState },
                            { label: 'Payment', value: listingAuditData.report.shadowState?.paymentState },
                            { label: 'Inventory', value: listingAuditData.report.shadowState?.inventoryState },
                            { label: 'Visibility', value: listingAuditData.report.shadowState?.visibilityState },
                          ].map((item) => (
                            <div key={item.label} className="rounded-sm border border-line bg-surface px-3 py-3">
                              <p className="text-[9px] font-black uppercase tracking-widest text-muted">{item.label}</p>
                              <p className="mt-1 text-xs font-black uppercase text-ink">{formatLifecycleLabel(String(item.value || 'unknown'))}</p>
                            </div>
                          ))}
                          <div className="rounded-sm border border-line bg-surface px-3 py-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted">Public</p>
                            <p className="mt-1 text-xs font-black uppercase text-ink">{listingAuditData.report.shadowState?.isPublic ? 'Yes' : 'No'}</p>
                          </div>
                        </div>
                        <div className="rounded-sm border border-line bg-surface px-4 py-4">
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted">Summary</p>
                          <p className="mt-2 text-sm font-semibold leading-6 text-ink">{listingAuditData.report.summary}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(listingAuditData.report.anomalyCodes || []).length > 0 ? (
                            listingAuditData.report.anomalyCodes.map((code) => (
                              <span key={code} className="rounded-sm border border-red-500/20 bg-red-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-red-500">
                                {formatLifecycleLabel(code)}
                              </span>
                            ))
                          ) : (
                            <span className="rounded-sm border border-data/30 bg-data/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-data">
                              No anomalies detected
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-xs font-semibold text-muted">No governance snapshot is available for this listing yet.</p>
                    )}
                  </div>

                  <div className="rounded-sm border border-line bg-bg p-4">
                    <div className="flex items-center gap-2">
                      <Image size={14} className="text-accent" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Media Audit</h4>
                    </div>
                    {listingAuditData?.mediaAudit ? (
                      <div className="mt-4 space-y-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-sm border border-line bg-surface px-3 py-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted">Audit Status</p>
                            <p className="mt-1 text-xs font-black uppercase text-ink">{formatLifecycleLabel(String(listingAuditData.mediaAudit.status || 'unknown'))}</p>
                          </div>
                          <div className="rounded-sm border border-line bg-surface px-3 py-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted">Images</p>
                            <p className="mt-1 text-xs font-black uppercase text-ink">{listingAuditData.mediaAudit.imageCount ?? 0}</p>
                          </div>
                          <div className="rounded-sm border border-line bg-surface px-3 py-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted">Primary Image</p>
                            <p className="mt-1 text-xs font-black uppercase text-ink">{listingAuditData.mediaAudit.primaryImagePresent ? 'Present' : 'Missing'}</p>
                          </div>
                        </div>
                        <div className="rounded-sm border border-line bg-surface px-4 py-4">
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted">Summary</p>
                          <p className="mt-2 text-sm font-semibold leading-6 text-ink">{listingAuditData.mediaAudit.summary}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(listingAuditData.mediaAudit.validationErrors || []).length > 0 ? (
                            listingAuditData.mediaAudit.validationErrors.map((errorCode) => (
                              <span key={errorCode} className="rounded-sm border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-amber-600">
                                {formatLifecycleLabel(errorCode)}
                              </span>
                            ))
                          ) : (
                            <span className="rounded-sm border border-data/30 bg-data/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-data">
                              Media passed current checks
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-xs font-semibold text-muted">No media audit has been written for this listing yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-sm border border-line bg-bg p-4">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-accent" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Transition Log</h4>
                    {listingAuditData?.transitions?.length ? (
                      <button
                        type="button"
                        onClick={onExportTransitionsCSV}
                        className="ml-auto flex items-center gap-1.5 btn-industrial px-3 py-1.5 text-[9px] font-black uppercase tracking-widest"
                      >
                        <Download size={11} /> Export CSV
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-4 space-y-3">
                    {listingAuditData?.transitions?.length ? (
                      listingAuditData.transitions.map((transition) => (
                        <div key={transition.id} className="rounded-sm border border-line bg-surface px-4 py-3">
                          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink">
                                {formatLifecycleLabel(transition.transitionType)}
                              </p>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                                Actor {transition.actorUid || 'system'} · {transition.artifactSource || 'unknown source'}
                              </p>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                              {transition.createdAt ? new Date(typeof transition.createdAt === 'string' ? transition.createdAt : '').toLocaleString() || 'Unknown' : 'Unknown time'}
                            </p>
                          </div>
                          <div className="mt-3 grid gap-3 lg:grid-cols-2">
                            <div className="rounded-sm border border-line bg-bg px-3 py-3">
                              <p className="text-[9px] font-black uppercase tracking-widest text-muted">From</p>
                              <p className="mt-1 text-xs font-semibold text-ink">
                                {formatLifecycleLabel(String(transition.fromState?.lifecycleState || 'unknown'))} / {formatLifecycleLabel(String(transition.fromState?.visibilityState || 'unknown'))}
                              </p>
                            </div>
                            <div className="rounded-sm border border-line bg-bg px-3 py-3">
                              <p className="text-[9px] font-black uppercase tracking-widest text-muted">To</p>
                              <p className="mt-1 text-xs font-semibold text-ink">
                                {formatLifecycleLabel(String(transition.toState?.lifecycleState || 'unknown'))} / {formatLifecycleLabel(String(transition.toState?.visibilityState || 'unknown'))}
                              </p>
                            </div>
                          </div>
                          {(transition.anomalyCodes || []).length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {transition.anomalyCodes.map((code) => (
                                <span key={code} className="rounded-sm border border-red-500/20 bg-red-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-red-500">
                                  {formatLifecycleLabel(code)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs font-semibold text-muted">No lifecycle transitions have been recorded yet for this listing.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <BulkImportToolkit
        ownerUid={authUser?.uid}
        workspaceLabel={authUser?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
        listingAllowanceText="Unlimited unpaid listings"
      />

      {listingPage > 1 || listingHasMore ? (() => {
        const maxVisitedPage = listingCursorHistory.length;
        const lastKnownPage = listingHasMore ? maxVisitedPage + 1 : maxVisitedPage;

        const getPageNumbers = (): (number | 'ellipsis')[] => {
          if (lastKnownPage <= 7) {
            return Array.from({ length: lastKnownPage }, (_, i) => i + 1);
          }
          const pages: (number | 'ellipsis')[] = [];
          const near = new Set<number>();
          for (let p = 1; p <= Math.min(2, lastKnownPage); p++) near.add(p);
          for (let p = Math.max(1, lastKnownPage - 1); p <= lastKnownPage; p++) near.add(p);
          for (let p = Math.max(1, listingPage - 1); p <= Math.min(lastKnownPage, listingPage + 1); p++) near.add(p);
          const sorted = [...near].sort((a, b) => a - b);
          for (let i = 0; i < sorted.length; i++) {
            if (i > 0 && sorted[i] - sorted[i - 1] > 1) pages.push('ellipsis');
            pages.push(sorted[i]);
          }
          return pages;
        };

        const pageNumbers = getPageNumbers();

        const navigateToPage = (page: number) => {
          if (page < 1 || page > maxVisitedPage || page === listingPage || listingsLoading) return;
          void onLoadListingsPage(listingCursorHistory[page - 1] ?? null, page, showDemoListings);
        };

        return (
          <div className="flex flex-col gap-3 rounded-sm border border-line bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => navigateToPage(listingPage - 1)}
                disabled={listingPage === 1 || listingsLoading}
                className="btn-industrial py-1.5 px-3 text-[10px] font-black uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              {pageNumbers.map((entry, idx) =>
                entry === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-[10px] font-black text-muted select-none">...</span>
                ) : (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => navigateToPage(entry)}
                    disabled={entry === listingPage || entry > maxVisitedPage || listingsLoading}
                    className={`min-w-[28px] py-1.5 px-2 text-[10px] font-black uppercase tracking-widest rounded-sm border transition-colors ${
                      entry === listingPage
                        ? 'bg-ink text-bg border-ink'
                        : entry > maxVisitedPage
                          ? 'border-line text-muted/40 cursor-not-allowed'
                          : 'border-line text-muted hover:bg-ink/5 hover:text-ink'
                    }`}
                  >
                    {entry}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => void onLoadListingsPage(nextListingCursor, listingPage + 1, showDemoListings)}
                disabled={!listingHasMore || listingsLoading || !nextListingCursor}
                className="btn-industrial py-1.5 px-3 text-[10px] font-black uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>

            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted">
              <span>
                Page {listingPage}{listingHasMore ? '+' : ` of ${maxVisitedPage}`}
                {' \u00b7 '}{filteredListings.length.toLocaleString()} loaded
              </span>
              <label className="flex items-center gap-1.5">
                <span className="whitespace-nowrap">Per page:</span>
                <select
                  value={listingsPerPage}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    onListingsPerPageChange(next);
                  }}
                  className="border border-line rounded-sm bg-bg px-2 py-1 text-[10px] font-black uppercase text-ink cursor-pointer"
                >
                  {LISTINGS_PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        );
      })() : null}
    </div>
  );
}
