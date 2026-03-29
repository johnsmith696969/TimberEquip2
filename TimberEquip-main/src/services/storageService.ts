import { 
  ref, 
  uploadBytes, 
  uploadBytesResumable, 
  deleteObject, 
  getDownloadURL,
  UploadTask,
  getMetadata,
  updateMetadata,
  FullMetadata
} from 'firebase/storage';
import { storage } from '../firebase';
import { auth } from '../firebase';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  state: string;
}

export interface StorageMetadata {
  contentType: string;
  customMetadata?: {
    uploadedBy?: string;
    uploadedAt?: string;
    category?: string;
    tags?: string;
    listingId?: string;
    [key: string]: string | undefined;
  };
}

// Image constraints
export const IMAGE_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
};

export const IMAGE_PUBLISHING_TARGETS = {
  THUMBNAIL_MAX_BYTES: 50 * 1024,      // 50KB thumbnails (card grids)
  DETAIL_MAX_BYTES: 120 * 1024,        // 120KB detail images (listing pages)
  THUMBNAIL_MAX_WIDTH: 480,
  DETAIL_MAX_WIDTH: 1600,
};

// Video constraints
export const VIDEO_CONFIG = {
  MAX_SIZE: 500 * 1024 * 1024, // 500MB
  ALLOWED_TYPES: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'],
};

// Icon/Logo constraints
export const ICON_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp', 'image/avif'],
};

type SupportedImageOutput = 'image/avif' | 'image/webp' | 'image/jpeg';

export interface ProcessedImageVariants {
  detailUrl: string;
  thumbnailUrl: string;
  formatUsed: SupportedImageOutput;
}

class StorageService {
  /**
   * Upload a file to Firebase Storage with progress tracking
   * @param file - File to upload
   * @param path - Path in storage (e.g., 'listings/123/images')
   * @param onProgress - Optional callback for upload progress
   * @returns Promise with download URL
   */
  uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void,
    metadata?: StorageMetadata
  ): UploadTask {
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    const baseMetadata = {
      contentType: file.type,
      customMetadata: {
        uploadedBy: auth.currentUser?.uid || '',
        uploadedAt: new Date().toISOString(),
      },
    };
    
    const uploadTask = uploadBytesResumable(storageRef, file, {
      ...baseMetadata,
      ...metadata,
      customMetadata: {
        ...baseMetadata.customMetadata,
        ...(metadata?.customMetadata || {}),
      },
    });

    uploadTask.on('state_changed',
      (snapshot) => {
        if (onProgress) {
          const progress: UploadProgress = {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            state: snapshot.state,
          };
          onProgress(progress);
        }
      }
    );

    return uploadTask;
  }

  /**
   * Upload a brand icon/logo
   */
  async uploadBrandIcon(file: File, iconType: 'logo' | 'favicon' | 'social'): Promise<string> {
    if (!ICON_CONFIG.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`Only ${ICON_CONFIG.ALLOWED_TYPES.join(', ')} files allowed for icons`);
    }
    if (file.size > ICON_CONFIG.MAX_SIZE) {
      throw new Error(`Icon must be smaller than ${ICON_CONFIG.MAX_SIZE / 1024 / 1024}MB`);
    }

    const path = `brand-assets/${iconType}`;
    const storageRef = ref(storage, `${path}/${file.name}`);
    
    await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        type: iconType,
      },
    });

    return await getDownloadURL(storageRef);
  }

  /**
   * Upload a listing image
   */
  async uploadListingImage(
    file: File,
    listingId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    if (!IMAGE_CONFIG.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`Only ${IMAGE_CONFIG.ALLOWED_TYPES.join(', ')} files allowed for images`);
    }
    if (file.size > IMAGE_CONFIG.MAX_SIZE) {
      throw new Error(`Image must be smaller than ${IMAGE_CONFIG.MAX_SIZE / 1024 / 1024}MB`);
    }

    // Upload to 'source/' subdirectory so the Cloud Function trigger fires
    const path = `listings/${listingId}/images/source`;
    
    return new Promise((resolve, reject) => {
      const uploadTask = this.uploadFile(file, path, onProgress, {
        contentType: file.type,
        customMetadata: {
          listingId,
        },
      });

      uploadTask.then(async (snapshot) => {
        try {
          const downloadURL = await getDownloadURL(snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });
  }

  private async createImageBitmapFromFile(file: File): Promise<ImageBitmap> {
    const bitmap = await createImageBitmap(file);
    return bitmap;
  }

  private async renderImageToBlob(
    image: ImageBitmap,
    maxWidth: number,
    outputType: SupportedImageOutput,
    quality: number
  ): Promise<Blob> {
    const scale = Math.min(1, maxWidth / image.width);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Image processing failed: canvas context unavailable');
    }

    ctx.drawImage(image, 0, 0, width, height);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error(`Failed to encode image as ${outputType}`));
            return;
          }
          resolve(blob);
        },
        outputType,
        quality
      );
    });
  }

  private async compressToTargetBytes(
    image: ImageBitmap,
    maxWidth: number,
    targetBytes: number,
    outputType: SupportedImageOutput
  ): Promise<Blob> {
    const qualities = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4];
    const widthSteps = [maxWidth, Math.round(maxWidth * 0.85), Math.round(maxWidth * 0.72), Math.round(maxWidth * 0.6), Math.round(maxWidth * 0.5), Math.round(maxWidth * 0.4)].filter((width, index, array) => width > 0 && array.indexOf(width) === index);
    let bestBlob: Blob | null = null;

    for (const width of widthSteps) {
      for (const quality of qualities) {
        const blob = await this.renderImageToBlob(image, width, outputType, quality);
        bestBlob = blob;
        if (blob.size <= targetBytes) {
          return blob;
        }
      }
    }

    if (!bestBlob) {
      throw new Error('Image compression failed');
    }

    throw new Error(`Unable to compress image to ${Math.round(targetBytes / 1024)}KB ${outputType.toUpperCase()} target`);
  }

  private async supportsOutputType(outputType: SupportedImageOutput): Promise<boolean> {
    const testCanvas = document.createElement('canvas');
    testCanvas.width = 1;
    testCanvas.height = 1;

    return await new Promise<boolean>((resolve) => {
      testCanvas.toBlob((blob) => resolve(Boolean(blob && blob.type === outputType)), outputType, 0.8);
    });
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async waitForDownloadUrl(path: string, attempts = 25, delayMs = 1000): Promise<string> {
    const fileRef = ref(storage, path);

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        return await getDownloadURL(fileRef);
      } catch {
        await this.delay(delayMs);
      }
    }

    throw new Error(`Timed out waiting for generated file at ${path}`);
  }

  async uploadListingImageWithPublishingVariants(
    file: File,
    listingId: string
  ): Promise<ProcessedImageVariants> {
    if (!IMAGE_CONFIG.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`Only ${IMAGE_CONFIG.ALLOWED_TYPES.join(', ')} files allowed for images`);
    }

    if (file.size > IMAGE_CONFIG.MAX_SIZE) {
      throw new Error(`Image must be smaller than ${IMAGE_CONFIG.MAX_SIZE / 1024 / 1024}MB`);
    }

    const safeBaseName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);
    const sourceExtension = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const objectBaseName = `${Date.now()}_${safeBaseName || 'image'}`;

    const sourcePath = `listings/${listingId}/images/source/${objectBaseName}.${sourceExtension}`;
    const detailAvifPath = `listings/${listingId}/images/detail/${objectBaseName}.avif`;
    const thumbAvifPath = `listings/${listingId}/images/thumb/${objectBaseName}.avif`;
    const sourceRef = ref(storage, sourcePath);

    await uploadBytes(sourceRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: auth.currentUser?.uid || '',
        uploadedAt: new Date().toISOString(),
        listingId,
      },
    });

    try {
      const [detailUrl, thumbnailUrl] = await Promise.all([
        this.waitForDownloadUrl(detailAvifPath),
        this.waitForDownloadUrl(thumbAvifPath),
      ]);

      return {
        detailUrl,
        thumbnailUrl,
        formatUsed: 'image/avif',
      };
    } catch {
      const outputType: SupportedImageOutput = 'image/avif';
      const avifSupported = await this.supportsOutputType(outputType);
      if (!avifSupported) {
        throw new Error('AVIF publishing variants were not generated and this browser cannot encode AVIF fallback images.');
      }

      const detailRef = ref(storage, `listings/${listingId}/images/detail/${objectBaseName}.avif`);
      const thumbnailRef = ref(storage, `listings/${listingId}/images/thumb/${objectBaseName}.avif`);
      const image = await this.createImageBitmapFromFile(file);

      try {
        const detailBlob = await this.compressToTargetBytes(
          image,
          IMAGE_PUBLISHING_TARGETS.DETAIL_MAX_WIDTH,
          IMAGE_PUBLISHING_TARGETS.DETAIL_MAX_BYTES,
          outputType
        );

        const thumbBlob = await this.compressToTargetBytes(
          image,
          IMAGE_PUBLISHING_TARGETS.THUMBNAIL_MAX_WIDTH,
          IMAGE_PUBLISHING_TARGETS.THUMBNAIL_MAX_BYTES,
          outputType
        );

        await Promise.all([
          uploadBytes(detailRef, detailBlob, {
            contentType: outputType,
            customMetadata: {
              uploadedBy: auth.currentUser?.uid || '',
              uploadedAt: new Date().toISOString(),
              listingId,
            },
          }),
          uploadBytes(thumbnailRef, thumbBlob, {
            contentType: outputType,
            customMetadata: {
              uploadedBy: auth.currentUser?.uid || '',
              uploadedAt: new Date().toISOString(),
              listingId,
            },
          }),
        ]);

        const [detailUrl, thumbnailUrl] = await Promise.all([
          getDownloadURL(detailRef),
          getDownloadURL(thumbnailRef),
        ]);

        return {
          detailUrl,
          thumbnailUrl,
          formatUsed: 'image/avif',
        };
      } finally {
        image.close();
      }
    }
  }

  /**
   * Upload a listing video
   */
  async uploadListingVideo(
    file: File,
    listingId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    if (!VIDEO_CONFIG.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`Only ${VIDEO_CONFIG.ALLOWED_TYPES.join(', ')} files allowed for videos`);
    }
    if (file.size > VIDEO_CONFIG.MAX_SIZE) {
      throw new Error(`Video must be smaller than ${VIDEO_CONFIG.MAX_SIZE / 1024 / 1024}MB`);
    }

    const path = `listings/${listingId}/videos`;
    
    return new Promise((resolve, reject) => {
      const uploadTask = this.uploadFile(file, path, onProgress, {
        contentType: file.type,
        customMetadata: {
          listingId,
        },
      });

      uploadTask.then(async (snapshot) => {
        try {
          const downloadURL = await getDownloadURL(snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });
  }

  /**
   * Upload multiple images/videos
   */
  async uploadMultipleFiles(
    files: File[],
    listingId: string,
    fileType: 'images' | 'videos',
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<string[]> {
    const uploadPromises = files.map((file, index) =>
      fileType === 'images'
        ? this.uploadListingImage(
            file,
            listingId,
            (progress) => onProgress?.(index, progress)
          )
        : this.uploadListingVideo(
            file,
            listingId,
            (progress) => onProgress?.(index, progress)
          )
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const url = new URL(fileUrl);
      const pathName = decodeURIComponent(url.pathname);
      const match = pathName.match(/\/o\/(.+?)(\?|$)/);
      
      if (!match) {
        throw new Error('Invalid file URL');
      }

      const filePath = match[1];
      const fileRef = ref(storage, filePath);
      
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Delete multiple files
   */
  async deleteMultipleFiles(fileUrls: string[]): Promise<void> {
    const deletePromises = fileUrls.map(url => this.deleteFile(url));
    await Promise.all(deletePromises);
  }

  /**
   * Get download URL for a file
   */
  async getDownloadUrl(filePath: string): Promise<string> {
    const fileRef = ref(storage, filePath);
    return await getDownloadURL(fileRef);
  }

  /**
   * Update file metadata
   */
  async updateFileMetadata(
    fileUrl: string,
    customMetadata: Record<string, string>
  ): Promise<FullMetadata> {
    try {
      const url = new URL(fileUrl);
      const pathName = decodeURIComponent(url.pathname);
      const match = pathName.match(/\/o\/(.+?)(\?|$)/);
      
      if (!match) {
        throw new Error('Invalid file URL');
      }

      const filePath = match[1];
      const fileRef = ref(storage, filePath);

      const newMetadata = {
        customMetadata: {
          ...customMetadata,
          updatedAt: new Date().toISOString(),
        },
      };

      return await updateMetadata(fileRef, newMetadata);
    } catch (error) {
      console.error('Error updating metadata:', error);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileUrl: string): Promise<FullMetadata> {
    try {
      const url = new URL(fileUrl);
      const pathName = decodeURIComponent(url.pathname);
      const match = pathName.match(/\/o\/(.+?)(\?|$)/);
      
      if (!match) {
        throw new Error('Invalid file URL');
      }

      const filePath = match[1];
      const fileRef = ref(storage, filePath);

      return await getMetadata(fileRef);
    } catch (error) {
      console.error('Error getting metadata:', error);
      throw error;
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, config: typeof IMAGE_CONFIG | typeof VIDEO_CONFIG): string | null {
    if (!config.ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type. Allowed: ${config.ALLOWED_TYPES.join(', ')}`;
    }

    if (file.size > config.MAX_SIZE) {
      return `File too large. Maximum size: ${config.MAX_SIZE / 1024 / 1024}MB`;
    }

    return null;
  }

  /**
   * Generate a thumbnail URL (if using Firebase ML Kit or similar)
   */
  generateThumbnailUrl(imageUrl: string, width: number = 200, height: number = 200): string {
    try {
      const url = new URL(imageUrl);
      url.searchParams.append('w', width.toString());
      url.searchParams.append('h', height.toString());
      return url.toString();
    } catch {
      return imageUrl;
    }
  }
}

export const storageService = new StorageService();
