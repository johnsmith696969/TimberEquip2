import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Plus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface TagSelectorModalProps {
  label: string;
  placeholder: string;
  selected: string[];
  onChange: (selected: string[]) => void;
  suggestions?: string[];
  searchPlaceholder?: string;
  addButtonLabel?: string;
}

function normalizeTagValue(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function TagSelectorModal({
  label,
  placeholder,
  selected,
  onChange,
  suggestions = [],
  searchPlaceholder,
  addButtonLabel = 'Add',
}: TagSelectorModalProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const selectedSet = useMemo(() => new Set(selected.map((entry) => entry.toLowerCase())), [selected]);
  const normalizedQuery = normalizeTagValue(query);

  const visibleSuggestions = useMemo(() => {
    const unique = Array.from(new Set(suggestions.map(normalizeTagValue).filter(Boolean)));
    if (!normalizedQuery) return unique;
    return unique.filter((option) => option.toLowerCase().includes(normalizedQuery.toLowerCase()));
  }, [normalizedQuery, suggestions]);

  const addTag = (rawValue: string) => {
    const normalized = normalizeTagValue(rawValue);
    if (!normalized) return;
    if (selectedSet.has(normalized.toLowerCase())) {
      setQuery('');
      return;
    }
    onChange([...selected, normalized].sort((left, right) => left.localeCompare(right)));
    setQuery('');
  };

  const removeTag = (value: string) => {
    onChange(selected.filter((entry) => entry !== value));
  };

  const summaryText =
    selected.length === 0
      ? placeholder
      : selected.length <= 2
        ? selected.join(', ')
        : `${selected.length} selected`;

  const canAddCustom =
    normalizedQuery.length > 0 &&
    !selectedSet.has(normalizedQuery.toLowerCase()) &&
    !visibleSuggestions.some((option) => option.toLowerCase() === normalizedQuery.toLowerCase());

  const modal = createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-sm border border-line bg-bg shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">{label}</h3>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-muted">
                  {selected.length} selected
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-muted hover:text-ink">
                <X size={20} />
              </button>
            </div>

            <div className="border-b border-line px-6 py-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addTag(query);
                      }
                    }}
                    placeholder={searchPlaceholder || `Search or add ${label.toLowerCase()}...`}
                    className="input-industrial w-full py-2.5 pr-10"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => addTag(query)}
                  disabled={!normalizedQuery}
                  className="btn-industrial btn-accent inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap px-4 py-2.5 text-[9px] disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[152px]"
                >
                  <Plus size={12} />
                  {addButtonLabel}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-6">
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted">Selected</h4>
                    {selected.length ? (
                      <button
                        type="button"
                        onClick={() => onChange([])}
                        className="text-[9px] font-black uppercase tracking-widest text-muted hover:text-ink"
                      >
                        Clear all
                      </button>
                    ) : null}
                  </div>
                  {selected.length ? (
                    <div className="flex flex-wrap gap-2">
                      {selected.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => removeTag(value)}
                          className="inline-flex items-center gap-2 rounded-sm border border-line bg-surface px-3 py-2 text-[10px] font-black uppercase tracking-widest text-ink hover:border-accent hover:text-accent"
                        >
                          <span className="normal-case font-semibold tracking-normal">{value}</span>
                          <X size={12} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">No {label.toLowerCase()} selected yet.</p>
                  )}
                </section>

                <section>
                  <h4 className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted">Suggestions</h4>
                  <div className="space-y-2">
                    {canAddCustom ? (
                      <button
                        type="button"
                        onClick={() => addTag(normalizedQuery)}
                        className="flex w-full items-center justify-between rounded-sm border border-dashed border-accent/60 bg-accent/5 px-4 py-3 text-left hover:bg-accent/10"
                      >
                        <span className="text-sm font-semibold text-ink">{`Add "${normalizedQuery}"`}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-accent">Custom</span>
                      </button>
                    ) : null}
                    {visibleSuggestions.length ? (
                      visibleSuggestions.map((option) => {
                        const active = selectedSet.has(option.toLowerCase());
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => (active ? removeTag(option) : addTag(option))}
                            className={`flex w-full items-center justify-between rounded-sm border px-4 py-3 text-left transition-colors ${
                              active
                                ? 'border-accent bg-accent/5 text-accent'
                                : 'border-line bg-bg hover:border-accent hover:bg-surface/50'
                            }`}
                          >
                            <span className="text-sm font-semibold text-ink">{option}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest">
                              {active ? 'Selected' : 'Add'}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted">No suggestions match your search. Add a custom county above.</p>
                    )}
                  </div>
                </section>
              </div>
            </div>

            <div className="border-t border-line px-6 py-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-industrial btn-accent w-full py-3 text-[10px]"
              >
                Done{selected.length ? ` (${selected.length})` : ''}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="select-industrial flex w-full items-center justify-between gap-2 text-left"
      >
        <span className={`truncate ${selected.length === 0 ? 'text-muted' : 'text-ink'}`}>{summaryText}</span>
        <ChevronDown size={14} className="flex-shrink-0 text-muted" />
      </button>
      {modal}
    </div>
  );
}
