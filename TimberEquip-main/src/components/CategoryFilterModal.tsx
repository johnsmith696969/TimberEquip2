import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center pt-[10vh] px-4 animate-[fadeIn_150ms_ease-out]" onClick={onClose}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
      <div
        className="relative bg-bg border border-line rounded-sm shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col animate-[slideUp_150ms_ease-out]"
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
            type="text"
            placeholder="Filter categories..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-industrial w-full"
            autoFocus
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
      </div>
    </div>
  );
}
