import React from 'react';
import { Download } from 'lucide-react';
import { InquiryList } from './InquiryList';
import type { Listing, Inquiry, Account } from '../../types';

interface InquiriesTabProps {
  inquiries: Inquiry[];
  filteredInquiries: Inquiry[];
  archivedCount: number;
  showArchived: boolean;
  onToggleArchived: () => void;
  accounts: Account[];
  listings: Listing[];
  onAddNote: (id: string, text: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onUnarchive: (id: string) => Promise<void>;
  onExportCSV: () => void;
}

export function InquiriesTab({
  filteredInquiries,
  archivedCount,
  showArchived,
  onToggleArchived,
  accounts,
  listings,
  onAddNote,
  onArchive,
  onUnarchive,
  onExportCSV,
}: InquiriesTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-surface p-6 border border-line rounded-sm">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Active Leads & Inquiries</h3>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-accent uppercase">{filteredInquiries.filter(i => i.status === 'New').length} New</span>
          <span className="text-[10px] font-black text-data uppercase">{filteredInquiries.filter(i => i.status === 'Won').length} Won</span>
          <span className="text-[10px] font-black text-muted uppercase">{filteredInquiries.filter(i => !i.assignedToUid).length} Unassigned</span>
          {archivedCount > 0 && (
            <button
              type="button"
              onClick={onToggleArchived}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-sm border transition-colors ${showArchived ? 'border-accent/30 bg-accent/10 text-accent' : 'border-line bg-surface text-muted hover:text-ink'}`}
            >
              {showArchived ? 'Hide Archived' : `Show Archived (${archivedCount})`}
            </button>
          )}
          <button
            type="button"
            onClick={onExportCSV}
            className="flex items-center gap-1.5 btn-industrial px-3 py-1.5 text-[9px] font-black uppercase tracking-widest"
          >
            <Download size={11} /> Export CSV
          </button>
        </div>
      </div>
      <InquiryList
        inquiries={filteredInquiries}
        accounts={accounts}
        listings={listings}
        onAddNote={onAddNote}
        onArchive={onArchive}
        onUnarchive={onUnarchive}
      />
    </div>
  );
}
