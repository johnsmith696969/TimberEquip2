import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface MultiSelectOption {
  value: string;
  count: number;
}

interface Props {
  label: string;
  placeholder: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  searchable?: boolean;
}

export function MultiSelectDropdown({
  label,
  placeholder,
  options,
  selected,
  onChange,
  searchable,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const showSearch = searchable ?? options.length > 8;

  useEffect(() => {
    if (open && showSearch) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
    if (!open) setQuery('');
  }, [open, showSearch]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const selectedSet = new Set(selected);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredOptions = normalizedQuery
    ? options.filter((o) => o.value.toLowerCase().includes(normalizedQuery))
    : options;

  // Sort: selected first, then by count desc, then alpha
  const sortedOptions = [...filteredOptions].sort((a, b) => {
    const aSelected = selectedSet.has(a.value) ? 1 : 0;
    const bSelected = selectedSet.has(b.value) ? 1 : 0;
    if (aSelected !== bSelected) return bSelected - aSelected;
    if (a.count !== b.count) return b.count - a.count;
    return a.value.localeCompare(b.value);
  });

  const toggle = (value: string) => {
    if (selectedSet.has(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectAll = () => {
    const allValues = filteredOptions.map((o) => o.value);
    const merged = new Set([...selected, ...allValues]);
    onChange(Array.from(merged));
  };

  const clearAll = () => {
    if (normalizedQuery) {
      const filteredValues = new Set(filteredOptions.map((o) => o.value));
      onChange(selected.filter((v) => !filteredValues.has(v)));
    } else {
      onChange([]);
    }
  };

  const summaryText =
    selected.length === 0
      ? placeholder
      : selected.length <= 2
        ? selected.join(', ')
        : `${selected.length} selected`;

  const modal = createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-sm border border-line bg-bg shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">{label}</h3>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1">
                  {selected.length} of {options.length} selected
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-ink">
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            {showSearch && (
              <div className="border-b border-line px-6 py-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Search ${label.toLowerCase()}...`}
                    className="input-industrial w-full pl-9 py-2.5"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Select All / Clear row */}
            <div className="flex items-center justify-between border-b border-line px-6 py-2.5">
              <button
                type="button"
                onClick={selectAll}
                className="text-[9px] font-black uppercase tracking-widest text-accent hover:underline"
              >
                Select All{normalizedQuery ? ' Visible' : ''}
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="text-[9px] font-black uppercase tracking-widest text-muted hover:text-ink"
              >
                Clear{normalizedQuery ? ' Visible' : ' All'}
              </button>
            </div>

            {/* Option list */}
            <div className="overflow-y-auto flex-1">
              {sortedOptions.length === 0 ? (
                <div className="px-6 py-10 text-center text-[10px] font-bold uppercase tracking-widest text-muted">
                  No options match &ldquo;{query}&rdquo;
                </div>
              ) : (
                sortedOptions.map((option) => {
                  const isChecked = selectedSet.has(option.value);
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 px-6 py-3 cursor-pointer border-b border-line/50 hover:bg-surface/60 transition-colors ${isChecked ? 'bg-surface/40' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(option.value)}
                        className="accent-accent flex-shrink-0 w-4 h-4"
                      />
                      <span className="text-xs font-medium text-ink truncate flex-1">
                        {option.value}
                      </span>
                      <span className="text-[10px] font-bold text-muted tabular-nums flex-shrink-0">
                        {option.count}
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-line px-6 py-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-industrial btn-accent w-full py-3 text-[10px]"
              >
                Done{selected.length > 0 ? ` (${selected.length})` : ''}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="select-industrial w-full text-left flex items-center justify-between gap-2"
      >
        <span className={`truncate ${selected.length === 0 ? 'text-muted' : 'text-ink'}`}>
          {summaryText}
        </span>
        <ChevronDown size={14} className="flex-shrink-0 text-muted" />
      </button>
      {modal}
    </div>
  );
}
