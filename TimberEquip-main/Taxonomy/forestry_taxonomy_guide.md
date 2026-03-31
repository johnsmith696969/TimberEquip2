# Forestry taxonomy implementation package

This package is built from your uploaded taxonomy file and is meant to be handed directly to Codex/Claude for a React implementation.

## What this package does

It gives you one canonical taxonomy source for these dependent selectors:

1. Category
2. Subcategory
3. Manufacturer
4. Model

The important behavior is:

- Subcategory options come only from the selected category.
- Manufacturer options come only from the selected category + subcategory.
- Model options come only from the selected category + subcategory + manufacturer.
- Child fields reset when a parent changes and the current value becomes invalid.

## Counts in the implementation layer

- Categories: 8
- Category → subcategory branches: 54
- Manufacturer branches: 430
- Models after exact duplicate removal inside a branch: 3944

## Critical form contract

Use these exact field names in your React forms:

- `category`
- `subcategory`
- `manufacturer`
- `model`

Store the exact display labels from the taxonomy for compatibility with existing source data.

Do **not** treat subcategories as globally unique. These labels repeat across different categories:

{
  "Feller Bunchers": [
    "Land Clearing Equipment",
    "Logging Equipment"
  ],
  "Chippers": [
    "Logging Equipment",
    "Tree Service Equipment"
  ],
  "Bucket Trucks": [
    "Tree Service Equipment",
    "Trucks"
  ],
  "Lifts": [
    "Tree Service Equipment",
    "Trucks"
  ]
}

That means your selectors and validation must always scope by the full parent chain.

## Recommended React behavior

```ts
const subcategoryOptions = getSubcategoryOptions(form.category);
const manufacturerOptions = getManufacturerOptions(form.category, form.subcategory);
const modelOptions = getModelOptions(form.category, form.subcategory, form.manufacturer);

// Whenever a parent changes:
setForm((prev) => normalizeSelection({
  ...prev,
  category: nextCategory, // or subcategory / manufacturer
}));
```

## Files in this package

- `forestry_taxonomy.react.ts` → drop-in TypeScript module with helpers and validation.
- `forestry_taxonomy.manifest.json` → machine-readable spec with the normalized taxonomy.
- `forestry_taxonomy_guide.md` → this guide.

## Source-label preservation

The TypeScript and JSON outputs preserve exact labels from the source taxonomy for:

- category
- subcategory
- manufacturer
- model

The only normalization applied is removal of exact duplicate model entries inside the same branch so your UI does not show repeated options.
