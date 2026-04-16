import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { FullEquipmentTaxonomy } from '../utils/equipmentTaxonomy';

interface CategoryFilterModalProps {
  open: boolean;
  onClose: () => void;
  taxonomy: FullEquipmentTaxonomy;
  selectedCategory: string;
  selectedSubcategory: string;
  onSelect: (category: string, subcategory: string) => void;
  facetedCounts?: {
    category?: Map<string, number>;
    subcategory?: Map<string, number>;
  };
}

export function CategoryFilterModal({
  open,
  onClose,
  taxonomy,
  selectedCategory,
  selectedSubcategory,
  onSelect,
  facetedCounts,
}: CategoryFilterModalProps) {
  const [filter, setFilter] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setFilter('');
    }
  }, [open]);

  const categoriesWithSubs = useMemo(() => {
    const entries = Object.entries(taxonomy)
      .map(([category, subcategories]) => ({
        category,
        subcategories: Object.keys(subcategories).sort((a, b) => a.localeCompare(b)),
        count: facetedCounts?.category?.get(category) || 0,
      }))
      .sort((a, b) => a.category.localeCompare(b.category));

    if (!filter.trim()) return entries;

    const q = filter.trim().toLowerCase();
    return entries
      .map((entry) => {
        const categoryMatch = entry.category.toLowerCase().includes(q);
        const matchingSubs = entry.subcategories.filter((sub) =>
          sub.toLowerCase().includes(q)
        );
        if (categoryMatch) return entry;
        if (matchingSubs.length > 0) return { ...entry, subcategories: matchingSubs };
        return null;
      })
      .filter(Boolean) as typeof entries;
  }, [taxonomy, filter, facetedCounts]);

  const modal = createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-sm border border-line bg-bg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <h2 className="text-lg font-black tracking-tighter uppercase">Category</h2>
              <button onClick={onClose} className="p-1 text-muted hover:text-ink transition-colors" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            {/* Filter input */}
            <div className="px-6 py-3 border-b border-line">
              <input
                ref={inputRef}
                type="text"
                placeholder="Filter categories..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input-industrial w-full"
              />
            </div>

            {/* Category list */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* All Categories option */}
              <label className="flex items-center gap-3 py-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={!selectedCategory && !selectedSubcategory}
                  onChange={() => { onSelect('', ''); onClose(); }}
                  className="w-4 h-4 accent-accent flex-shrink-0"
                />
                <span className="text-sm font-black uppercase tracking-widest text-ink">All Categories</span>
              </label>

              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                {categoriesWithSubs.map(({ category, subcategories, count }) => (
                  <div key={category} className="mb-4">
                    {/* Parent category - bold */}
                    <label className="flex items-center gap-3 py-1.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedCategory === category && !selectedSubcategory}
                        onChange={() => {
                          if (selectedCategory === category && !selectedSubcategory) {
                            onSelect('', '');
                          } else {
                            onSelect(category, '');
                          }
                        }}
                        className="w-4 h-4 accent-accent flex-shrink-0"
                      />
                      <span className="text-xs font-black text-ink group-hover:text-accent transition-colors">
                        {category}
                        {count > 0 && <span className="text-muted font-bold ml-1">({count})</span>}
                      </span>
                    </label>

                    {/* Subcategories - regular weight, indented */}
                    {subcategories.map((sub) => {
                      const subCount = facetedCounts?.subcategory?.get(sub) || 0;
                      return (
                        <label key={sub} className="flex items-center gap-3 py-1 pl-7 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={selectedCategory === category && selectedSubcategory === sub}
                            onChange={() => {
                              if (selectedCategory === category && selectedSubcategory === sub) {
                                onSelect(category, '');
                              } else {
                                onSelect(category, sub);
                              }
                            }}
                            className="w-3.5 h-3.5 accent-accent flex-shrink-0"
                          />
                          <span className="text-[11px] font-medium text-muted group-hover:text-ink transition-colors">
                            {sub}
                            {subCount > 0 && <span className="ml-1">({subCount})</span>}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>

              {categoriesWithSubs.length === 0 && (
                <p className="text-sm text-muted text-center py-8">No categories match "{filter}"</p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-line">
              <button
                onClick={onClose}
                className="btn-industrial btn-accent w-full py-3"
              >
                Apply Filter & Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );

  return modal;
}
