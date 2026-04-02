import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  count: number;
}

interface Props {
  placeholder: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  searchable?: boolean;
  maxHeight?: number;
}

export function MultiSelectDropdown({
  placeholder,
  options,
  selected,
  onChange,
  searchable,
  maxHeight = 280,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  const showSearch = searchable ?? options.length > 10;

  // Position the portal panel below the trigger button
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPanelStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  useLayoutEffect(() => {
    if (open) updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (open && showSearch) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
    if (!open) setQuery('');
  }, [open, showSearch]);

  // Close on click outside (check both trigger and panel)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
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

  const panel = open ? createPortal(
    <div ref={panelRef} style={panelStyle} className="border border-line bg-bg rounded-sm shadow-lg overflow-hidden">
      {showSearch && (
        <div className="p-2 border-b border-line">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="input-industrial w-full pl-7 py-1.5 text-[11px]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              >
                <X size={10} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-3 py-1.5 border-b border-line">
        <button
          type="button"
          onClick={selectAll}
          className="text-[9px] font-bold uppercase tracking-widest text-accent hover:underline"
        >
          Select All
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="text-[9px] font-bold uppercase tracking-widest text-muted hover:text-ink"
        >
          Clear
        </button>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight }}>
        {sortedOptions.length === 0 ? (
          <div className="px-3 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-muted">
            No options found
          </div>
        ) : (
          sortedOptions.map((option) => {
            const isChecked = selectedSet.has(option.value);
            return (
              <label
                key={option.value}
                className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-surface/60 transition-colors ${isChecked ? 'bg-surface/40' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(option.value)}
                  className="accent-accent flex-shrink-0"
                />
                <span className="text-[11px] font-medium text-ink truncate flex-1">
                  {option.value}
                </span>
                <span className="text-[10px] font-bold text-muted tabular-nums flex-shrink-0">
                  ({option.count})
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="select-industrial w-full text-left flex items-center justify-between gap-2"
      >
        <span className={`truncate ${selected.length === 0 ? 'text-muted' : 'text-ink'}`}>
          {summaryText}
        </span>
        <ChevronDown size={14} className={`flex-shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {panel}
    </div>
  );
}
