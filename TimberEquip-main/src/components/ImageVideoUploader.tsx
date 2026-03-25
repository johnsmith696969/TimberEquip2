import React, { useRef, useState, useCallback } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader, Image as ImageIcon } from 'lucide-react';
import {
  UploadProgress,
  ProcessedImageVariants,
  storageService,
  IMAGE_CONFIG,
  VIDEO_CONFIG,
  ICON_CONFIG,
} from '../services/storageService';

export interface UploadFile {
  id: string;
  file: File;
  type: 'image' | 'video' | 'icon';
}

export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
  variants?: ProcessedImageVariants;
}

interface ImageVideoUploaderProps {
  onUploadComplete?: (files: UploadedFile[]) => void;
  onError?: (error: string) => void;
  uploadType?: 'images' | 'videos' | 'icons'; // Type of files to accept
  multiple?: boolean;
  maxFiles?: number;
  listingId?: string;
  optimizeForPublishing?: boolean;
  className?: string;
}

export function ImageVideoUploader({
  onUploadComplete,
  onError,
  uploadType = 'images',
  multiple = true,
  maxFiles = 10,
  listingId = 'temp',
  optimizeForPublishing = false,
  className = '',
}: ImageVideoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<{
    [key: string]: UploadProgress;
  }>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const getConfig = useCallback(() => {
    if (uploadType === 'icons') return ICON_CONFIG;
    if (uploadType === 'videos') return VIDEO_CONFIG;
    return IMAGE_CONFIG;
  }, [uploadType]);

  const getAcceptString = useCallback(() => {
    const config = getConfig();
    return config.ALLOWED_TYPES.join(',');
  }, [getConfig]);

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const newErrors: string[] = [];
      const fileArray = Array.from(files);

      if (fileArray.length + uploadedFiles.length > maxFiles) {
        newErrors.push(
          `Maximum ${maxFiles} files allowed. You're trying to upload ${fileArray.length + uploadedFiles.length}.`
        );
      }

      const config = getConfig();
      const validFiles: UploadFile[] = [];

      for (const file of fileArray) {
        const error = storageService.validateFile(file, config);
        if (error) {
          newErrors.push(`${file.name}: ${error}`);
        } else {
          validFiles.push({
            id: `${Date.now()}-${Math.random()}`,
            file,
            type: uploadType === 'videos' ? 'video' : uploadType === 'icons' ? 'icon' : 'image',
          });
        }
      }

      if (newErrors.length > 0) {
        setErrors(newErrors);
        onError?.(newErrors.join('; '));
        return;
      }

      await uploadFiles(validFiles);
    },
    [uploadedFiles.length, maxFiles, getConfig, uploadType, onError]
  );

  const uploadFiles = async (filesToUpload: UploadFile[]) => {
    setIsUploading(true);
    setErrors([]);
    const uploadedUrls: UploadedFile[] = [];

    for (const uploadFile of filesToUpload) {
      try {
        let url: string;
        let variants: ProcessedImageVariants | undefined;

        if (uploadType === 'icons') {
          const iconType = uploadFile.file.name.includes('favicon')
            ? 'favicon'
            : uploadFile.file.name.includes('social')
              ? 'social'
              : 'logo';
          url = await storageService.uploadBrandIcon(uploadFile.file, iconType);
        } else if (uploadType === 'videos' && listingId) {
          url = await storageService.uploadListingVideo(
            uploadFile.file,
            listingId,
            (progress) => {
              setUploadState((prev) => ({
                ...prev,
                [uploadFile.id]: progress,
              }));
            }
          );
        } else {
          if (optimizeForPublishing) {
            variants = await storageService.uploadListingImageWithPublishingVariants(
              uploadFile.file,
              listingId
            );
            url = variants.detailUrl;
          } else {
            url = await storageService.uploadListingImage(
              uploadFile.file,
              listingId,
              (progress) => {
                setUploadState((prev) => ({
                  ...prev,
                  [uploadFile.id]: progress,
                }));
              }
            );
          }
        }

        uploadedUrls.push({
          id: uploadFile.id,
          name: uploadFile.file.name,
          url,
          type: uploadFile.file.type,
          size: uploadFile.file.size,
          uploadedAt: new Date(),
          variants,
        });

        setUploadState((prev) => {
          const newState = { ...prev };
          delete newState[uploadFile.id];
          return newState;
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Upload failed';
        setErrors((prev) => [...prev, `${uploadFile.file.name}: ${errorMsg}`]);
        onError?.(errorMsg);
      }
    }

    if (uploadedUrls.length > 0) {
      setUploadedFiles((prev) => [...prev, ...uploadedUrls]);
      onUploadComplete?.(uploadedUrls);
    }

    setIsUploading(false);
  };

  const handleRemoveFile = async (fileId: string) => {
    const file = uploadedFiles.find((f) => f.id === fileId);
    if (file) {
      try {
        await storageService.deleteFile(file.url);
        setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Delete failed';
        setErrors((prev) => [...prev, errorMsg]);
        onError?.(errorMsg);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getProgressPercentage = (id: string): number => {
    const progress = uploadState[id];
    if (!progress) return 0;
    return Math.round((progress.bytesTransferred / progress.totalBytes) * 100);
  };

  return (
    <div className={className}>
      {/* Upload Area */}
      <div
        onClick={triggerFileInput}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-line rounded-lg p-8 text-center cursor-pointer hover:border-accent transition-colors bg-surface/50"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={getAcceptString()}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-3">
            <Upload className="text-accent" size={24} />
          </div>
          <p className="font-bold text-ink mb-1">
            Drop {uploadType} here or click to select
          </p>
          <p className="text-xs text-muted">
            {uploadType === 'videos'
              ? `Max ${VIDEO_CONFIG.MAX_SIZE / 1024 / 1024}MB per video`
              : uploadType === 'icons'
                ? `Max ${ICON_CONFIG.MAX_SIZE / 1024 / 1024}MB per icon`
                : `Max ${IMAGE_CONFIG.MAX_SIZE / 1024 / 1024}MB per image`}
          </p>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          {errors.map((error, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-red-700 mb-2 last:mb-0">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Uploading Files */}
      {Object.entries(uploadState).length > 0 && (
        <div className="mt-4 space-y-3">
          {Object.entries(uploadState).map(([fileId]) => {
            const percentage = getProgressPercentage(fileId);
            return (
              <div key={fileId} className="bg-surface border border-line rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Loader size={16} className="text-accent animate-spin" />
                    <span className="text-xs font-bold">Uploading...</span>
                  </div>
                  <span className="text-xs text-muted font-bold">{percentage}%</span>
                </div>
                <div className="w-full bg-line rounded-full h-1 overflow-hidden">
                  <div
                    className="bg-accent h-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted mb-3">
            Uploaded ({uploadedFiles.length}/{maxFiles})
          </h3>
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="bg-surface border border-line rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {file.type.startsWith('image') ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <ImageIcon size={20} className="text-accent" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{file.name}</p>
                  <p className="text-[10px] text-muted">
                    {(file.size / 1024 / 1024).toFixed(2)}MB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <CheckCircle size={16} className="text-emerald-500" />
                <button
                  onClick={() => handleRemoveFile(file.id)}
                  className="p-1 hover:bg-line rounded transition-colors"
                  title="Remove file"
                >
                  <X size={16} className="text-muted hover:text-ink" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
