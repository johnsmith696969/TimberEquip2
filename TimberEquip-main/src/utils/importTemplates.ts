import { CATEGORY_SCHEMAS } from '../constants/categorySpecs';

const MACHINE_IMPORT_BASE_COLUMNS = [
  'externalId',
  'title',
  'category',
  'subcategory',
  'manufacturer',
  'make',
  'model',
  'year',
  'price',
  'currency',
  'hours',
  'condition',
  'location',
  'description',
  'stockNumber',
  'serialNumber',
  'dealerSourceUrl',
  'imageUrls',
  'imageTitles',
  'videoUrls',
] as const;

const MACHINE_IMPORT_SAMPLE_ROW: string[] = [
  'JD748-001',
  '2019 John Deere 748L-II Grapple Skidder',
  'Logging Equipment',
  'Skidders',
  'John Deere',
  'John Deere',
  '748L-II',
  '2019',
  '185000',
  'USD',
  '6200',
  'Used - Good',
  'Duluth, MN',
  'Well-maintained grapple skidder with fresh service records.',
  'JD748-001',
  'SERIAL-748L2',
  'https://dealer.example.com/inventory/jd748-001',
  'https://cdn.example.com/JD748-001__front.jpg|https://cdn.example.com/JD748-001__rear.jpg',
  'Front grapple view|Rear tire view',
  'https://cdn.example.com/JD748-001__walkaround.mp4',
];

const IMAGE_MANIFEST_HEADERS = [
  'listingLookupKey',
  'matchField',
  'primaryImageUrl',
  'imageUrls',
  'imageFileNames',
  'imageTitles',
  'videoUrls',
  'videoFileNames',
] as const;

const IMAGE_MANIFEST_SAMPLE_ROW: string[] = [
  'JD748-001',
  'stockNumber',
  'https://cdn.example.com/JD748-001__front.jpg',
  'https://cdn.example.com/JD748-001__front.jpg|https://cdn.example.com/JD748-001__rear.jpg',
  'JD748-001__front.jpg|JD748-001__rear.jpg',
  'Front grapple view|Rear tire view',
  'https://cdn.example.com/JD748-001__walkaround.mp4',
  'JD748-001__walkaround.mp4',
];

const IMAGE_FILE_SUFFIX_PATTERN = /(front|rear|left|right|cab|interior|engine|boom|grapple|loader|video|walkaround|thumb|detail|\d{1,3})$/i;

export type ImportTemplateSheet = {
  name: string;
  headers: string[];
  rows: string[][];
};

export type UploadedImportAsset = {
  fileName: string;
  downloadUrl: string;
  kind: 'image' | 'video';
};

function escapeCsvCell(value: string): string {
  const normalized = String(value ?? '');
  if (!/[",\n]/.test(normalized)) {
    return normalized;
  }

  return `"${normalized.replace(/"/g, '""')}"`;
}

function buildCsvContent(headers: string[], rows: string[][]): string {
  return [headers, ...rows]
    .map((row) => row.map((entry) => escapeCsvCell(entry)).join(','))
    .join('\n');
}

function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.click();
  window.URL.revokeObjectURL(url);
}

function toTitleCase(input: string): string {
  return input
    .split(/\s+/u)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');
}

export function getImportTemplateSpecKeys(): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const schema of Object.values(CATEGORY_SCHEMAS)) {
    for (const field of schema.specs) {
      if (seen.has(field.key)) continue;
      seen.add(field.key);
      ordered.push(field.key);
    }
  }

  return ordered;
}

export function getMachineImportHeaders(): string[] {
  return [
    ...MACHINE_IMPORT_BASE_COLUMNS,
    ...getImportTemplateSpecKeys().map((key) => `specs.${key}`),
  ];
}

export function getMachineImportSampleRow(): string[] {
  const specDefaults = new Map<string, string>([
    ['engine', 'John Deere 6.8L Final Tier 4'],
    ['horsepower', '220'],
    ['grappleType', 'Dual arch grapple'],
    ['grappleOpeningIn', '120'],
    ['tireSize', '30.5L-32'],
  ]);

  return [
    ...MACHINE_IMPORT_SAMPLE_ROW,
    ...getImportTemplateSpecKeys().map((key) => specDefaults.get(key) || ''),
  ];
}

export function getMachineImportTemplateSheets(): ImportTemplateSheet[] {
  const specReferenceRows = Object.entries(CATEGORY_SCHEMAS).flatMap(([category, schema]) =>
    schema.specs.map((field) => [
      category,
      field.key,
      field.label,
      field.type,
      field.required ? 'yes' : 'no',
      field.unit || '',
      field.description || '',
    ])
  );

  return [
    {
      name: 'machine_import_template',
      headers: getMachineImportHeaders(),
      rows: [getMachineImportSampleRow()],
    },
    {
      name: 'image_manifest_template',
      headers: [...IMAGE_MANIFEST_HEADERS],
      rows: [IMAGE_MANIFEST_SAMPLE_ROW],
    },
    {
      name: 'spec_field_reference',
      headers: ['category', 'fieldKey', 'label', 'type', 'required', 'unit', 'description'],
      rows: specReferenceRows,
    },
  ];
}

export function downloadMachineImportTemplateCsv(filenamePrefix = 'machine-import-template'): void {
  downloadTextFile(
    `${filenamePrefix}.csv`,
    buildCsvContent(getMachineImportHeaders(), [getMachineImportSampleRow()]),
    'text/csv;charset=utf-8'
  );
}

export function downloadImageManifestTemplateCsv(filenamePrefix = 'machine-image-manifest-template'): void {
  downloadTextFile(
    `${filenamePrefix}.csv`,
    buildCsvContent([...IMAGE_MANIFEST_HEADERS], [IMAGE_MANIFEST_SAMPLE_ROW]),
    'text/csv;charset=utf-8'
  );
}

export async function downloadWorkbook(filenamePrefix: string, sheets: ImportTemplateSheet[]): Promise<void> {
  const xlsx = await import('xlsx');
  const workbook = xlsx.utils.book_new();

  for (const sheet of sheets) {
    const worksheet = xlsx.utils.aoa_to_sheet([sheet.headers, ...sheet.rows]);
    xlsx.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31));
  }

  xlsx.writeFile(workbook, `${filenamePrefix}.xlsx`, { compression: true });
}

export async function downloadMachineImportTemplateXlsx(filenamePrefix = 'machine-import-template'): Promise<void> {
  await downloadWorkbook(filenamePrefix, getMachineImportTemplateSheets());
}

export async function downloadImageManifestTemplateXlsx(filenamePrefix = 'machine-image-manifest-template'): Promise<void> {
  await downloadWorkbook(filenamePrefix, [
    {
      name: 'image_manifest_template',
      headers: [...IMAGE_MANIFEST_HEADERS],
      rows: [IMAGE_MANIFEST_SAMPLE_ROW],
    },
  ]);
}

function stripExtension(fileName: string): string {
  return String(fileName || '').replace(/\.[^.]+$/u, '');
}

export function deriveListingLookupKeyFromFileName(fileName: string): string {
  const baseName = stripExtension(fileName).trim();
  if (!baseName) return 'UNMATCHED';

  if (baseName.includes('__')) {
    return baseName.split('__')[0].trim() || baseName;
  }

  const suffixMatch = baseName.match(/^(.*?)(?:[-_]\s*)([^-_]+)$/u);
  if (suffixMatch && IMAGE_FILE_SUFFIX_PATTERN.test(suffixMatch[2] || '')) {
    return suffixMatch[1].trim() || baseName;
  }

  return baseName;
}

function deriveAssetTitle(fileName: string, listingLookupKey: string, kind: 'image' | 'video'): string {
  const baseName = stripExtension(fileName).trim();
  const strippedKey = baseName
    .replace(new RegExp(`^${listingLookupKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:__|[-_])?`, 'iu'), '')
    .replace(/[_-]+/gu, ' ')
    .trim();

  if (!strippedKey) {
    return kind === 'video' ? 'Walkaround video' : '';
  }

  return toTitleCase(strippedKey);
}

export function buildUploadedAssetManifestRows(assets: UploadedImportAsset[]): string[][] {
  const grouped = new Map<
    string,
    {
      images: UploadedImportAsset[];
      videos: UploadedImportAsset[];
      imageTitles: string[];
    }
  >();

  for (const asset of assets) {
    const listingLookupKey = deriveListingLookupKeyFromFileName(asset.fileName);
    const existing = grouped.get(listingLookupKey) || {
      images: [],
      videos: [],
      imageTitles: [],
    };

    if (asset.kind === 'video') {
      existing.videos.push(asset);
    } else {
      existing.images.push(asset);
      existing.imageTitles.push(deriveAssetTitle(asset.fileName, listingLookupKey, 'image'));
    }

    grouped.set(listingLookupKey, existing);
  }

  return Array.from(grouped.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([listingLookupKey, value]) => {
      const imageUrls = value.images.map((entry) => entry.downloadUrl);
      const imageFileNames = value.images.map((entry) => entry.fileName);
      const videoUrls = value.videos.map((entry) => entry.downloadUrl);
      const videoFileNames = value.videos.map((entry) => entry.fileName);

      return [
        listingLookupKey,
        'stockNumber',
        imageUrls[0] || '',
        imageUrls.join('|'),
        imageFileNames.join('|'),
        value.imageTitles.filter(Boolean).join('|'),
        videoUrls.join('|'),
        videoFileNames.join('|'),
      ];
    });
}

export function downloadGeneratedAssetManifestCsv(
  rows: string[][],
  filenamePrefix = 'uploaded-machine-media-manifest'
): void {
  downloadTextFile(
    `${filenamePrefix}.csv`,
    buildCsvContent([...IMAGE_MANIFEST_HEADERS], rows),
    'text/csv;charset=utf-8'
  );
}

export async function downloadGeneratedAssetManifestXlsx(
  rows: string[][],
  filenamePrefix = 'uploaded-machine-media-manifest'
): Promise<void> {
  await downloadWorkbook(filenamePrefix, [
    {
      name: 'uploaded_media_manifest',
      headers: [...IMAGE_MANIFEST_HEADERS],
      rows,
    },
  ]);
}
