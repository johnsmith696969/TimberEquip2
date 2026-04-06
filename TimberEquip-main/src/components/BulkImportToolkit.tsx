import React, { useMemo, useRef, useState } from 'react';
import { Download, FileSpreadsheet, Images, RefreshCw, Upload } from 'lucide-react';
import { storageService, IMAGE_CONFIG, VIDEO_CONFIG } from '../services/storageService';
import {
  buildUploadedAssetManifestRows,
  downloadGeneratedAssetManifestCsv,
  downloadGeneratedAssetManifestXlsx,
  downloadImageManifestTemplateCsv,
  downloadImageManifestTemplateXlsx,
  downloadMachineImportTemplateCsv,
  downloadMachineImportTemplateXlsx,
  type UploadedImportAsset,
} from '../utils/importTemplates';

type BulkImportToolkitProps = {
  ownerUid?: string | null;
  workspaceLabel: string;
  listingAllowanceText: string;
};

function createBatchId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `batch-${Date.now()}`;
}

const ASSET_ACCEPT = [...IMAGE_CONFIG.ALLOWED_TYPES, ...VIDEO_CONFIG.ALLOWED_TYPES].join(',');

export function BulkImportToolkit({
  ownerUid,
  workspaceLabel,
  listingAllowanceText,
}: BulkImportToolkitProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadedAssets, setUploadedAssets] = useState<UploadedImportAsset[]>([]);
  const [batchId, setBatchId] = useState(createBatchId());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const generatedManifestRows = useMemo(() => buildUploadedAssetManifestRows(uploadedAssets), [uploadedAssets]);

  const handleMachineTemplateDownload = async (format: 'csv' | 'xlsx') => {
    setUploadError('');
    try {
      if (format === 'csv') {
        downloadMachineImportTemplateCsv(`${workspaceLabel.toLowerCase().replace(/\s+/g, '-')}-machine-import-template`);
      } else {
        await downloadMachineImportTemplateXlsx(`${workspaceLabel.toLowerCase().replace(/\s+/g, '-')}-machine-import-template`);
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Unable to download the machine import template.');
    }
  };

  const handleManifestTemplateDownload = async (format: 'csv' | 'xlsx') => {
    setUploadError('');
    try {
      if (format === 'csv') {
        downloadImageManifestTemplateCsv(`${workspaceLabel.toLowerCase().replace(/\s+/g, '-')}-image-manifest-template`);
      } else {
        await downloadImageManifestTemplateXlsx(`${workspaceLabel.toLowerCase().replace(/\s+/g, '-')}-image-manifest-template`);
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Unable to download the image manifest template.');
    }
  };

  const handleGeneratedManifestDownload = async (format: 'csv' | 'xlsx') => {
    setUploadError('');
    try {
      if (format === 'csv') {
        downloadGeneratedAssetManifestCsv(
          generatedManifestRows,
          `${workspaceLabel.toLowerCase().replace(/\s+/g, '-')}-uploaded-media-manifest`
        );
      } else {
        await downloadGeneratedAssetManifestXlsx(
          generatedManifestRows,
          `${workspaceLabel.toLowerCase().replace(/\s+/g, '-')}-uploaded-media-manifest`
        );
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Unable to download the generated asset manifest.');
    }
  };

  const handleAssetUpload = async (files: FileList | null) => {
    if (!ownerUid || !files || files.length === 0) return;

    setIsUploading(true);
    setUploadError('');
    setUploadMessage('');

    const nextAssets: UploadedImportAsset[] = [];

    try {
      const fileList = Array.from(files);
      for (let index = 0; index < fileList.length; index += 1) {
        const file = fileList[index];
        setUploadMessage(`Uploading ${index + 1} of ${fileList.length}: ${file.name}`);
        const uploaded = await storageService.uploadBulkImportAsset(file, ownerUid, batchId);
        nextAssets.push({
          fileName: uploaded.fileName,
          downloadUrl: uploaded.downloadUrl,
          kind: uploaded.kind,
        });
      }

      setUploadedAssets((current) => [...current, ...nextAssets]);
      setUploadMessage(`Uploaded ${nextAssets.length} asset${nextAssets.length === 1 ? '' : 's'} and refreshed the manifest preview.`);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Unable to upload one or more assets.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const resetUploadedAssets = () => {
    setUploadedAssets([]);
    setUploadMessage('');
    setUploadError('');
    setBatchId(createBatchId());
  };

  return (
    <section className="rounded-sm border border-line bg-surface p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <h3 className="text-lg font-black uppercase tracking-tight text-ink">Bulk Import Templates &amp; Media Mapping</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Export a ready-to-fill machine template for {workspaceLabel}, then upload images or videos in bulk and download a
            manifest that maps filenames to listing keys.
          </p>
          <p className="mt-2 text-[11px] font-black uppercase tracking-[0.18em] text-accent">
            Current allowance: {listingAllowanceText}
          </p>
        </div>
        <div className="rounded-sm border border-line bg-bg px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
          Recommended naming: <span className="text-ink">JD748-001__front.jpg</span> or <span className="text-ink">JD748-001__walkaround.mp4</span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <div className="rounded-sm border border-line bg-bg p-4">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-ink">
            <FileSpreadsheet size={14} className="text-accent" /> Machine Template Downloads
          </div>
          <p className="mt-2 text-sm text-muted">
            The template includes core listing fields, media columns, and spec columns using <span className="font-black text-ink">specs.*</span>
            headers that line up with TimberEquip&apos;s importer.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => void handleMachineTemplateDownload('csv')} className="btn-industrial px-4 py-2 text-[10px]">
              <Download size={12} className="mr-2" /> Machine CSV
            </button>
            <button type="button" onClick={() => void handleMachineTemplateDownload('xlsx')} className="btn-industrial px-4 py-2 text-[10px]">
              <Download size={12} className="mr-2" /> Machine XLSX
            </button>
            <button type="button" onClick={() => void handleManifestTemplateDownload('csv')} className="btn-industrial px-4 py-2 text-[10px]">
              <Download size={12} className="mr-2" /> Image Manifest CSV
            </button>
            <button type="button" onClick={() => void handleManifestTemplateDownload('xlsx')} className="btn-industrial px-4 py-2 text-[10px]">
              <Download size={12} className="mr-2" /> Image Manifest XLSX
            </button>
          </div>
        </div>

        <div className="rounded-sm border border-line bg-bg p-4">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-ink">
            <Images size={14} className="text-accent" /> Bulk Asset Uploader
          </div>
          <p className="mt-2 text-sm text-muted">
            Upload all listing photos and walkaround videos in bulk. TimberEquip prepares an import-ready manifest automatically.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept={ASSET_ACCEPT}
              multiple
              onChange={(event) => void handleAssetUpload(event.target.files)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!ownerUid || isUploading}
              className="btn-industrial btn-accent px-4 py-2 text-[10px] disabled:opacity-60"
            >
              {isUploading ? <RefreshCw size={12} className="mr-2 animate-spin" /> : <Upload size={12} className="mr-2" />}
              Upload Images / Videos
            </button>
            <button
              type="button"
              onClick={() => void handleGeneratedManifestDownload('csv')}
              disabled={generatedManifestRows.length === 0}
              className="btn-industrial px-4 py-2 text-[10px] disabled:opacity-50"
            >
              <Download size={12} className="mr-2" /> Uploaded Manifest CSV
            </button>
            <button
              type="button"
              onClick={() => void handleGeneratedManifestDownload('xlsx')}
              disabled={generatedManifestRows.length === 0}
              className="btn-industrial px-4 py-2 text-[10px] disabled:opacity-50"
            >
              <Download size={12} className="mr-2" /> Uploaded Manifest XLSX
            </button>
            <button
              type="button"
              onClick={resetUploadedAssets}
              disabled={uploadedAssets.length === 0 || isUploading}
              className="btn-industrial px-4 py-2 text-[10px] disabled:opacity-50"
            >
              Reset Batch
            </button>
          </div>
        </div>
      </div>

      {uploadError ? (
        <div className="mt-4 rounded-sm border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-bold text-accent">
          {uploadError}
        </div>
      ) : null}

      {uploadMessage ? (
        <div className="mt-4 rounded-sm border border-data/30 bg-data/10 px-4 py-3 text-sm font-bold text-data">
          {uploadMessage}
        </div>
      ) : null}

      <div className="mt-5 rounded-sm border border-line bg-bg p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink">Generated Media Manifest Preview</p>
            <p className="mt-1 text-sm text-muted">
              Each row groups uploaded assets by listing lookup key. Use that same key in the import file&apos;s <span className="font-black text-ink">stockNumber</span> or
              <span className="font-black text-ink"> externalId</span> column.
            </p>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
            {generatedManifestRows.length} grouped row{generatedManifestRows.length === 1 ? '' : 's'}
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-line text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                <th className="px-3 py-2">Lookup Key</th>
                <th className="px-3 py-2">Match Field</th>
                <th className="px-3 py-2">Images</th>
                <th className="px-3 py-2">Videos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {generatedManifestRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-sm text-muted">
                    Upload bulk media to generate a manifest preview. TimberEquip groups files by the prefix before <span className="font-black text-ink">__</span>.
                  </td>
                </tr>
              ) : (
                generatedManifestRows.slice(0, 8).map((row) => (
                  <tr key={row[0]} className="text-sm text-ink">
                    <td className="px-3 py-3 font-black">{row[0]}</td>
                    <td className="px-3 py-3">{row[1]}</td>
                    <td className="px-3 py-3">{row[3] ? row[3].split('|').length : 0}</td>
                    <td className="px-3 py-3">{row[6] ? row[6].split('|').length : 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default BulkImportToolkit;
