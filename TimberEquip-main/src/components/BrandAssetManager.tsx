import React, { useState, useEffect } from 'react';
import { Trash2, Copy, ExternalLink, Loader } from 'lucide-react';
import { ImageVideoUploader, UploadedFile } from './ImageVideoUploader';
import { storageService } from '../services/storageService';

interface BrandAsset {
  type: 'logo' | 'favicon' | 'social';
  name: string;
  url: string;
  uploadedAt: Date;
}

interface BrandAssetManagerProps {
  onAssetUpdate?: (assets: BrandAsset[]) => void;
}

export function BrandAssetManager({ onAssetUpdate }: BrandAssetManagerProps) {
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleUploadComplete = (uploadedFiles: UploadedFile[]) => {
    const newAssets: BrandAsset[] = uploadedFiles.map((file) => {
      const type = file.name.includes('favicon')
        ? 'favicon'
        : file.name.includes('social')
          ? 'social'
          : 'logo';

      return {
        type: type as 'logo' | 'favicon' | 'social',
        name: file.name,
        url: file.url,
        uploadedAt: file.uploadedAt,
      };
    });

    setBrandAssets((prev) => [...prev, ...newAssets]);
    onAssetUpdate?.([...brandAssets, ...newAssets]);
  };

  const handleDeleteAsset = async (url: string) => {
    try {
      setIsLoading(true);
      await storageService.deleteFile(url);
      setBrandAssets((prev) => prev.filter((asset) => asset.url !== url));
      onAssetUpdate?.(brandAssets.filter((asset) => asset.url !== url));
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete asset';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  };

  const assetsByType = {
    logo: brandAssets.filter((a) => a.type === 'logo'),
    favicon: brandAssets.filter((a) => a.type === 'favicon'),
    social: brandAssets.filter((a) => a.type === 'social'),
  };

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-ink mb-4">
          Upload Brand Assets
        </h3>
        <ImageVideoUploader
          uploadType="icons"
          maxFiles={20}
          listingId="brand"
          onUploadComplete={handleUploadComplete}
          onError={setError}
          className="mb-4"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-500">{error}</p>
        </div>
      )}

      {/* Logo Assets */}
      {assetsByType.logo.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted mb-4 border-b border-line pb-2">
            Logos ({assetsByType.logo.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {assetsByType.logo.map((asset) => (
              <div key={asset.url}>
                <AssetCard
                  asset={asset}
                  onDelete={handleDeleteAsset}
                  onCopy={copyToClipboard}
                  isCopied={copied === asset.url}
                  isLoading={isLoading}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Favicon Assets */}
      {assetsByType.favicon.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted mb-4 border-b border-line pb-2">
            Favicons ({assetsByType.favicon.length})
          </h4>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            {assetsByType.favicon.map((asset) => (
              <div key={asset.url}>
                <AssetCard
                  asset={asset}
                  onDelete={handleDeleteAsset}
                  onCopy={copyToClipboard}
                  isCopied={copied === asset.url}
                  isLoading={isLoading}
                  isThumbnail
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social Media Assets */}
      {assetsByType.social.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted mb-4 border-b border-line pb-2">
            Social Media Assets ({assetsByType.social.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {assetsByType.social.map((asset) => (
              <div key={asset.url}>
                <AssetCard
                  asset={asset}
                  onDelete={handleDeleteAsset}
                  onCopy={copyToClipboard}
                  isCopied={copied === asset.url}
                  isLoading={isLoading}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {brandAssets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xs text-muted uppercase tracking-widest font-bold">
            No brand assets uploaded yet
          </p>
        </div>
      )}
    </div>
  );
}

interface AssetCardProps {
  asset: BrandAsset;
  onDelete: (url: string) => void;
  onCopy: (url: string) => void;
  isCopied: boolean;
  isLoading: boolean;
  isThumbnail?: boolean;
}

function AssetCard({
  asset,
  onDelete,
  onCopy,
  isCopied,
  isLoading,
  isThumbnail = false,
}: AssetCardProps) {
  return (
    <div className="bg-surface border border-line rounded-lg overflow-hidden group">
      <div className={`relative overflow-hidden bg-bg flex items-center justify-center ${isThumbnail ? 'h-20' : 'h-32'}`}>
        <img
          src={asset.url}
          alt={asset.name}
          className="w-full h-full object-contain p-2"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={() => onCopy(asset.url)}
            title={isCopied ? 'Copied!' : 'Copy URL'}
            className="p-1.5 bg-bg rounded text-ink hover:bg-accent hover:text-white transition-colors"
            disabled={isLoading}
          >
            <Copy size={14} />
          </button>
          <a
            href={asset.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new tab"
            className="p-1.5 bg-bg rounded text-ink hover:bg-accent hover:text-white transition-colors"
          >
            <ExternalLink size={14} />
          </a>
          <button
            onClick={() => onDelete(asset.url)}
            title="Delete asset"
            className="p-1.5 bg-bg rounded text-ink hover:bg-red-500 hover:text-white transition-colors"
            disabled={isLoading}
          >
            {isLoading ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>
      <div className="p-2">
        <p className="text-[10px] font-bold truncate text-ink">{asset.name}</p>
        <p className="text-[9px] text-muted truncate">{asset.type}</p>
        {isCopied && (
          <p className="text-[9px] text-emerald-500 font-bold mt-1">✓ Copied!</p>
        )}
      </div>
    </div>
  );
}
