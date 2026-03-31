import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Layers, Package, Plus, Trash2 } from 'lucide-react';
import { type FullEquipmentTaxonomy, taxonomyService } from '../../services/taxonomyService';

const EMPTY_TAXONOMY: FullEquipmentTaxonomy = {};

export function TaxonomyManager() {
  const [taxonomy, setTaxonomy] = useState<FullEquipmentTaxonomy>(EMPTY_TAXONOMY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingAction, setPendingAction] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [selectedCategoryForSubcategory, setSelectedCategoryForSubcategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [selectedCategoryForManufacturer, setSelectedCategoryForManufacturer] = useState('');
  const [selectedSubcategoryForManufacturer, setSelectedSubcategoryForManufacturer] = useState('');
  const [newManufacturer, setNewManufacturer] = useState('');
  const [selectedCategoryForModel, setSelectedCategoryForModel] = useState('');
  const [selectedSubcategoryForModel, setSelectedSubcategoryForModel] = useState('');
  const [selectedManufacturerForModel, setSelectedManufacturerForModel] = useState('');
  const [newModel, setNewModel] = useState('');
  const [removeType, setRemoveType] = useState<'category' | 'subcategory' | 'manufacturer' | 'model'>('category');
  const [removeCategorySelection, setRemoveCategorySelection] = useState('');
  const [removeSubcategorySelection, setRemoveSubcategorySelection] = useState('');
  const [removeManufacturerSelection, setRemoveManufacturerSelection] = useState('');
  const [removeModelSelection, setRemoveModelSelection] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);

  const loadTaxonomy = async () => {
    try {
      setLoading(true);
      setError('');
      const nextTaxonomy = await taxonomyService.getFullTaxonomy();
      setTaxonomy(nextTaxonomy);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load taxonomy tools right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTaxonomy();
  }, []);

  const categoryOptions = useMemo(
    () => Object.keys(taxonomy).sort((left, right) => left.localeCompare(right)),
    [taxonomy]
  );

  useEffect(() => {
    if (!selectedCategoryForSubcategory || !taxonomy[selectedCategoryForSubcategory]) {
      setSelectedCategoryForSubcategory(categoryOptions[0] || '');
    }
    if (!selectedCategoryForManufacturer || !taxonomy[selectedCategoryForManufacturer]) {
      setSelectedCategoryForManufacturer(categoryOptions[0] || '');
    }
    if (!selectedCategoryForModel || !taxonomy[selectedCategoryForModel]) {
      setSelectedCategoryForModel(categoryOptions[0] || '');
    }
  }, [
    categoryOptions,
    selectedCategoryForManufacturer,
    selectedCategoryForModel,
    selectedCategoryForSubcategory,
    taxonomy,
  ]);

  const manufacturerSubcategoryOptions = useMemo(
    () => Object.keys(taxonomy[selectedCategoryForManufacturer] || {}).sort((left, right) => left.localeCompare(right)),
    [selectedCategoryForManufacturer, taxonomy]
  );

  const modelSubcategoryOptions = useMemo(
    () => Object.keys(taxonomy[selectedCategoryForModel] || {}).sort((left, right) => left.localeCompare(right)),
    [selectedCategoryForModel, taxonomy]
  );

  useEffect(() => {
    if (!selectedSubcategoryForManufacturer || !(selectedSubcategoryForManufacturer in (taxonomy[selectedCategoryForManufacturer] || {}))) {
      setSelectedSubcategoryForManufacturer(manufacturerSubcategoryOptions[0] || '');
    }
  }, [manufacturerSubcategoryOptions, selectedCategoryForManufacturer, selectedSubcategoryForManufacturer, taxonomy]);

  useEffect(() => {
    if (!selectedSubcategoryForModel || !(selectedSubcategoryForModel in (taxonomy[selectedCategoryForModel] || {}))) {
      setSelectedSubcategoryForModel(modelSubcategoryOptions[0] || '');
    }
  }, [modelSubcategoryOptions, selectedCategoryForModel, selectedSubcategoryForModel, taxonomy]);

  const modelManufacturerOptions = useMemo(
    () =>
      Object.keys(taxonomy[selectedCategoryForModel]?.[selectedSubcategoryForModel] || {}).sort((left, right) =>
        left.localeCompare(right)
      ),
    [selectedCategoryForModel, selectedSubcategoryForModel, taxonomy]
  );

  useEffect(() => {
    if (!selectedManufacturerForModel || !(selectedManufacturerForModel in (taxonomy[selectedCategoryForModel]?.[selectedSubcategoryForModel] || {}))) {
      setSelectedManufacturerForModel(modelManufacturerOptions[0] || '');
    }
  }, [
    modelManufacturerOptions,
    selectedCategoryForModel,
    selectedManufacturerForModel,
    selectedSubcategoryForModel,
    taxonomy,
  ]);

  const removeSubcategoryOptions = useMemo(
    () => Object.keys(taxonomy[removeCategorySelection] || {}).sort((a, b) => a.localeCompare(b)),
    [removeCategorySelection, taxonomy]
  );

  const removeManufacturerOptions = useMemo(
    () => Object.keys(taxonomy[removeCategorySelection]?.[removeSubcategorySelection] || {}).sort((a, b) => a.localeCompare(b)),
    [removeCategorySelection, removeSubcategorySelection, taxonomy]
  );

  const removeModelOptions = useMemo(
    () => (taxonomy[removeCategorySelection]?.[removeSubcategorySelection]?.[removeManufacturerSelection] || []).slice().sort((a, b) => a.localeCompare(b)),
    [removeCategorySelection, removeSubcategorySelection, removeManufacturerSelection, taxonomy]
  );

  useEffect(() => {
    if (!removeCategorySelection || !taxonomy[removeCategorySelection]) {
      setRemoveCategorySelection(categoryOptions[0] || '');
    }
  }, [categoryOptions, removeCategorySelection, taxonomy]);

  useEffect(() => {
    if (!removeSubcategorySelection || !(removeSubcategorySelection in (taxonomy[removeCategorySelection] || {}))) {
      setRemoveSubcategorySelection(removeSubcategoryOptions[0] || '');
    }
  }, [removeCategorySelection, removeSubcategoryOptions, removeSubcategorySelection, taxonomy]);

  useEffect(() => {
    if (!removeManufacturerSelection || !(removeManufacturerSelection in (taxonomy[removeCategorySelection]?.[removeSubcategorySelection] || {}))) {
      setRemoveManufacturerSelection(removeManufacturerOptions[0] || '');
    }
  }, [removeCategorySelection, removeSubcategorySelection, removeManufacturerOptions, removeManufacturerSelection, taxonomy]);

  useEffect(() => {
    const models = taxonomy[removeCategorySelection]?.[removeSubcategorySelection]?.[removeManufacturerSelection] || [];
    if (!removeModelSelection || !models.includes(removeModelSelection)) {
      setRemoveModelSelection(removeModelOptions[0] || '');
    }
  }, [removeCategorySelection, removeSubcategorySelection, removeManufacturerSelection, removeModelOptions, removeModelSelection, taxonomy]);

  const stats = useMemo(() => {
    const categoryCount = categoryOptions.length;
    const subcategoryCount = categoryOptions.reduce(
      (total, category) => total + Object.keys(taxonomy[category] || {}).length,
      0
    );
    const manufacturerCount = categoryOptions.reduce(
      (total, category) =>
        total +
        Object.values(taxonomy[category] || {}).reduce(
          (subcategoryTotal, manufacturers) => subcategoryTotal + Object.keys(manufacturers || {}).length,
          0
        ),
      0
    );
    const modelCount = categoryOptions.reduce(
      (total, category) =>
        total +
        Object.values(taxonomy[category] || {}).reduce(
          (subcategoryTotal, manufacturers) =>
            subcategoryTotal +
            Object.values(manufacturers || {}).reduce(
              (manufacturerTotal, models) => manufacturerTotal + models.length,
              0
            ),
          0
        ),
      0
    );

    return { categoryCount, subcategoryCount, manufacturerCount, modelCount };
  }, [categoryOptions, taxonomy]);

  const handleAction = async (actionKey: string, action: () => Promise<FullEquipmentTaxonomy>, reset: () => void, successMessage: string) => {
    try {
      setPendingAction(actionKey);
      setError('');
      setSuccess('');
      const nextTaxonomy = await action();
      setTaxonomy(nextTaxonomy);
      reset();
      setSuccess(successMessage);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update taxonomy right now.');
    } finally {
      setPendingAction('');
    }
  };

  return (
    <section className="bg-surface border border-line rounded-sm overflow-hidden">
      <div className="p-6 border-b border-line bg-bg flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Taxonomy Management</h3>
          <p className="mt-2 text-[11px] font-semibold text-muted">
            Add categories, subcategories, manufacturers, and models for new listing workflows.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadTaxonomy()}
          disabled={loading}
          className="btn-industrial py-2 px-4 text-[10px] disabled:opacity-60"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="p-8 space-y-8">
        {error ? (
          <div className="rounded-sm border border-accent/30 bg-accent/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        ) : null}

        {success ? (
          <div className="rounded-sm border border-data/30 bg-data/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-data flex items-center gap-2">
            <CheckCircle2 size={14} />
            <span>{success}</span>
          </div>
        ) : null}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-line rounded-sm p-4 bg-bg">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Categories</p>
            <p className="mt-2 text-3xl font-black tracking-tighter text-ink">{stats.categoryCount}</p>
          </div>
          <div className="border border-line rounded-sm p-4 bg-bg">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Subcategories</p>
            <p className="mt-2 text-3xl font-black tracking-tighter text-ink">{stats.subcategoryCount}</p>
          </div>
          <div className="border border-line rounded-sm p-4 bg-bg">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Manufacturers</p>
            <p className="mt-2 text-3xl font-black tracking-tighter text-ink">{stats.manufacturerCount}</p>
          </div>
          <div className="border border-line rounded-sm p-4 bg-bg">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Models</p>
            <p className="mt-2 text-3xl font-black tracking-tighter text-ink">{stats.modelCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="border border-line rounded-sm p-6 bg-bg space-y-4">
            <div className="flex items-center gap-3">
              <Layers size={18} className="text-accent" />
              <h4 className="text-xs font-black uppercase tracking-[0.16em] text-ink">Add Category</h4>
            </div>
            <div className="space-y-1">
              <label className="label-micro">Category Name</label>
              <input
                type="text"
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                className="input-industrial w-full"
                placeholder="e.g. Biomass Equipment"
              />
            </div>
            <button
              type="button"
              onClick={() =>
                void handleAction(
                  'category',
                  () => taxonomyService.addCategory(newCategory),
                  () => setNewCategory(''),
                  'Category added to runtime taxonomy.'
                )
              }
              disabled={pendingAction === 'category'}
              className="btn-industrial btn-accent py-3 px-5 disabled:opacity-60 flex items-center gap-2"
            >
              <Plus size={14} />
              <span>{pendingAction === 'category' ? 'Saving...' : 'Add Category'}</span>
            </button>
          </div>

          <div className="border border-line rounded-sm p-6 bg-bg space-y-4">
            <div className="flex items-center gap-3">
              <Layers size={18} className="text-accent" />
              <h4 className="text-xs font-black uppercase tracking-[0.16em] text-ink">Add Subcategory</h4>
            </div>
            <div className="space-y-1">
              <label className="label-micro">Category</label>
              <select
                value={selectedCategoryForSubcategory}
                onChange={(event) => setSelectedCategoryForSubcategory(event.target.value)}
                className="input-industrial w-full"
              >
                {categoryOptions.map((category) => (
                  <option key={`subcategory-category-${category}`} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="label-micro">Subcategory Name</label>
              <input
                type="text"
                value={newSubcategory}
                onChange={(event) => setNewSubcategory(event.target.value)}
                className="input-industrial w-full"
                placeholder="e.g. Kilns"
              />
            </div>
            <button
              type="button"
              onClick={() =>
                void handleAction(
                  'subcategory',
                  () => taxonomyService.addSubcategory(selectedCategoryForSubcategory, newSubcategory),
                  () => setNewSubcategory(''),
                  'Subcategory added to runtime taxonomy.'
                )
              }
              disabled={pendingAction === 'subcategory' || categoryOptions.length === 0}
              className="btn-industrial btn-accent py-3 px-5 disabled:opacity-60 flex items-center gap-2"
            >
              <Plus size={14} />
              <span>{pendingAction === 'subcategory' ? 'Saving...' : 'Add Subcategory'}</span>
            </button>
          </div>

          <div className="border border-line rounded-sm p-6 bg-bg space-y-4">
            <div className="flex items-center gap-3">
              <Package size={18} className="text-accent" />
              <h4 className="text-xs font-black uppercase tracking-[0.16em] text-ink">Add Manufacturer</h4>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="label-micro">Category</label>
                <select
                  value={selectedCategoryForManufacturer}
                  onChange={(event) => setSelectedCategoryForManufacturer(event.target.value)}
                  className="input-industrial w-full"
                >
                  {categoryOptions.map((category) => (
                    <option key={`manufacturer-category-${category}`} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="label-micro">Subcategory</label>
                <select
                  value={selectedSubcategoryForManufacturer}
                  onChange={(event) => setSelectedSubcategoryForManufacturer(event.target.value)}
                  className="input-industrial w-full"
                >
                  {manufacturerSubcategoryOptions.map((subcategory) => (
                    <option key={`manufacturer-subcategory-${subcategory}`} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="label-micro">Manufacturer Name</label>
                <input
                  type="text"
                  value={newManufacturer}
                  onChange={(event) => setNewManufacturer(event.target.value)}
                  className="input-industrial w-full"
                  placeholder="e.g. Nyle"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                void handleAction(
                  'manufacturer',
                  () =>
                    taxonomyService.addManufacturer(
                      selectedCategoryForManufacturer,
                      selectedSubcategoryForManufacturer,
                      newManufacturer
                    ),
                  () => setNewManufacturer(''),
                  'Manufacturer added to runtime taxonomy.'
                )
              }
              disabled={pendingAction === 'manufacturer' || manufacturerSubcategoryOptions.length === 0}
              className="btn-industrial btn-accent py-3 px-5 disabled:opacity-60 flex items-center gap-2"
            >
              <Plus size={14} />
              <span>{pendingAction === 'manufacturer' ? 'Saving...' : 'Add Manufacturer'}</span>
            </button>
          </div>

          <div className="border border-line rounded-sm p-6 bg-bg space-y-4">
            <div className="flex items-center gap-3">
              <Package size={18} className="text-accent" />
              <h4 className="text-xs font-black uppercase tracking-[0.16em] text-ink">Add Model</h4>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="label-micro">Category</label>
                <select
                  value={selectedCategoryForModel}
                  onChange={(event) => setSelectedCategoryForModel(event.target.value)}
                  className="input-industrial w-full"
                >
                  {categoryOptions.map((category) => (
                    <option key={`model-category-${category}`} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="label-micro">Subcategory</label>
                <select
                  value={selectedSubcategoryForModel}
                  onChange={(event) => setSelectedSubcategoryForModel(event.target.value)}
                  className="input-industrial w-full"
                >
                  {modelSubcategoryOptions.map((subcategory) => (
                    <option key={`model-subcategory-${subcategory}`} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="label-micro">Manufacturer</label>
                <select
                  value={selectedManufacturerForModel}
                  onChange={(event) => setSelectedManufacturerForModel(event.target.value)}
                  className="input-industrial w-full"
                >
                  {modelManufacturerOptions.map((manufacturer) => (
                    <option key={`model-manufacturer-${manufacturer}`} value={manufacturer}>
                      {manufacturer}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="label-micro">Model Name</label>
                <input
                  type="text"
                  value={newModel}
                  onChange={(event) => setNewModel(event.target.value)}
                  className="input-industrial w-full"
                  placeholder="e.g. DH6"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                void handleAction(
                  'model',
                  () =>
                    taxonomyService.addModel(
                      selectedCategoryForModel,
                      selectedSubcategoryForModel,
                      selectedManufacturerForModel,
                      newModel
                    ),
                  () => setNewModel(''),
                  'Model added to runtime taxonomy.'
                )
              }
              disabled={pendingAction === 'model' || modelManufacturerOptions.length === 0}
              className="btn-industrial btn-accent py-3 px-5 disabled:opacity-60 flex items-center gap-2"
            >
              <Plus size={14} />
              <span>{pendingAction === 'model' ? 'Saving...' : 'Add Model'}</span>
            </button>
          </div>
        </div>

        <div className="border border-accent/20 rounded-sm p-6 bg-accent/5 space-y-4">
          <div className="flex items-center gap-3">
            <Trash2 size={18} className="text-accent" />
            <h4 className="text-xs font-black uppercase tracking-[0.16em] text-ink">Remove Taxonomy Entry</h4>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="label-micro">Remove Type</label>
              <select
                value={removeType}
                onChange={(event) => {
                  setRemoveType(event.target.value as typeof removeType);
                  setConfirmRemove(false);
                }}
                className="input-industrial w-full"
              >
                <option value="category">Category</option>
                <option value="subcategory">Subcategory</option>
                <option value="manufacturer">Manufacturer</option>
                <option value="model">Model</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="label-micro">Category</label>
              <select
                value={removeCategorySelection}
                onChange={(event) => {
                  setRemoveCategorySelection(event.target.value);
                  setConfirmRemove(false);
                }}
                className="input-industrial w-full"
              >
                {categoryOptions.map((category) => (
                  <option key={`remove-cat-${category}`} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {(removeType === 'subcategory' || removeType === 'manufacturer' || removeType === 'model') && (
              <div className="space-y-1">
                <label className="label-micro">Subcategory</label>
                <select
                  value={removeSubcategorySelection}
                  onChange={(event) => {
                    setRemoveSubcategorySelection(event.target.value);
                    setConfirmRemove(false);
                  }}
                  className="input-industrial w-full"
                >
                  {removeSubcategoryOptions.map((sub) => (
                    <option key={`remove-sub-${sub}`} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}

            {(removeType === 'manufacturer' || removeType === 'model') && (
              <div className="space-y-1">
                <label className="label-micro">Manufacturer</label>
                <select
                  value={removeManufacturerSelection}
                  onChange={(event) => {
                    setRemoveManufacturerSelection(event.target.value);
                    setConfirmRemove(false);
                  }}
                  className="input-industrial w-full"
                >
                  {removeManufacturerOptions.map((make) => (
                    <option key={`remove-make-${make}`} value={make}>{make}</option>
                  ))}
                </select>
              </div>
            )}

            {removeType === 'model' && (
              <div className="space-y-1">
                <label className="label-micro">Model</label>
                <select
                  value={removeModelSelection}
                  onChange={(event) => {
                    setRemoveModelSelection(event.target.value);
                    setConfirmRemove(false);
                  }}
                  className="input-industrial w-full"
                >
                  {removeModelOptions.map((model) => (
                    <option key={`remove-model-${model}`} value={model}>{model}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {!confirmRemove ? (
            <button
              type="button"
              onClick={() => setConfirmRemove(true)}
              disabled={
                !removeCategorySelection ||
                (removeType !== 'category' && !removeSubcategorySelection) ||
                ((removeType === 'manufacturer' || removeType === 'model') && !removeManufacturerSelection) ||
                (removeType === 'model' && !removeModelSelection)
              }
              className="btn-industrial border-accent/40 text-accent py-3 px-5 disabled:opacity-60 flex items-center gap-2"
            >
              <Trash2 size={14} />
              <span>Remove {removeType}</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  void handleAction(
                    `remove-${removeType}`,
                    () => {
                      if (removeType === 'category') return taxonomyService.removeCategory(removeCategorySelection);
                      if (removeType === 'subcategory') return taxonomyService.removeSubcategory(removeCategorySelection, removeSubcategorySelection);
                      if (removeType === 'manufacturer') return taxonomyService.removeManufacturer(removeCategorySelection, removeSubcategorySelection, removeManufacturerSelection);
                      return taxonomyService.removeModel(removeCategorySelection, removeSubcategorySelection, removeManufacturerSelection, removeModelSelection);
                    },
                    () => setConfirmRemove(false),
                    `${removeType.charAt(0).toUpperCase() + removeType.slice(1)} removed from taxonomy.`
                  )
                }
                disabled={!!pendingAction}
                className="btn-industrial bg-accent text-white py-3 px-5 disabled:opacity-60 flex items-center gap-2"
              >
                <Trash2 size={14} />
                <span>{pendingAction?.startsWith('remove-') ? 'Removing...' : 'Confirm Remove'}</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmRemove(false)}
                className="btn-industrial py-3 px-5"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
