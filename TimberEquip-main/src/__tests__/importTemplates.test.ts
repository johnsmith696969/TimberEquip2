import { describe, expect, it } from 'vitest';
import {
  buildUploadedAssetManifestRows,
  deriveListingLookupKeyFromFileName,
  getMachineImportHeaders,
} from '../utils/importTemplates';

describe('import template utilities', () => {
  it('includes prefixed spec columns in the machine import template', () => {
    const headers = getMachineImportHeaders();

    expect(headers).toContain('imageUrls');
    expect(headers).toContain('imageTitles');
    expect(headers).toContain('videoUrls');
    expect(headers).toContain('specs.engine');
    expect(headers).toContain('specs.horsepower');
  });

  it('derives listing lookup keys from stock-style filenames', () => {
    expect(deriveListingLookupKeyFromFileName('JD748-001__front.jpg')).toBe('JD748-001');
    expect(deriveListingLookupKeyFromFileName('TC635-002_1.jpg')).toBe('TC635-002');
    expect(deriveListingLookupKeyFromFileName('CAT535-003-walkaround.mp4')).toBe('CAT535-003');
  });

  it('groups uploaded assets into manifest rows by lookup key', () => {
    const rows = buildUploadedAssetManifestRows([
      {
        fileName: 'JD748-001__front.jpg',
        downloadUrl: 'https://cdn.example.com/JD748-001__front.jpg',
        kind: 'image',
      },
      {
        fileName: 'JD748-001__rear.jpg',
        downloadUrl: 'https://cdn.example.com/JD748-001__rear.jpg',
        kind: 'image',
      },
      {
        fileName: 'JD748-001__walkaround.mp4',
        downloadUrl: 'https://cdn.example.com/JD748-001__walkaround.mp4',
        kind: 'video',
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0][0]).toBe('JD748-001');
    expect(rows[0][1]).toBe('stockNumber');
    expect(rows[0][2]).toBe('https://cdn.example.com/JD748-001__front.jpg');
    expect(rows[0][3]).toContain('JD748-001__rear.jpg');
    expect(rows[0][5]).toContain('Front');
    expect(rows[0][6]).toContain('walkaround.mp4');
  });
});
