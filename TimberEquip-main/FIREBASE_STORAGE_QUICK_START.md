# Firebase Storage Integration Quick Start

Quick reference for integrating image/video uploads into TimberEquip components.

---

## 🚀 Quick Integration: 5 Minute Setup

### 1️⃣ Import the Component

```typescript
import { ImageVideoUploader } from '../components/ImageVideoUploader';
```

### 2️⃣ Add to Your Form

```typescript
import { useState } from 'react';
import { ImageVideoUploader } from '../components/ImageVideoUploader';

export function MyForm() {
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  return (
    <div>
      <ImageVideoUploader
        uploadType="images"
        maxFiles={10}
        listingId="my-listing-id"
        onUploadComplete={(files) => {
          setImages(files.map(f => f.url));
          console.log('Images uploaded:', files);
        }}
        onError={(error) => {
          console.error('Upload failed:', error);
        }}
      />

      {/* Display uploaded images */}
      <div className="grid grid-cols-4 gap-4 mt-4">
        {images.map((url) => (
          <img key={url} src={url} alt="uploaded" className="w-full h-32 object-cover rounded" />
        ))}
      </div>
    </div>
  );
}
```

### 3️⃣ Save to Database

```typescript
async function saveListingWithImages(listingData, imageUrls) {
  const listing = {
    ...listingData,
    images: imageUrls,
    updatedAt: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, 'listings'), listing);
  console.log('Listing saved:', docRef.id);
  return docRef.id;
}
```

---

## 📸 Common Use Cases

### Brand Logo Upload (Admin)

```typescript
import { BrandAssetManager } from '../components/BrandAssetManager';

function AdminBrandSettings() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-black mb-8">Brand Assets</h1>
      <BrandAssetManager
        onAssetUpdate={(assets) => {
          console.log('Brand assets updated:', assets);
          // Save to config file or database
        }}
      />
    </div>
  );
}
```

### Listing Photo Gallery

```typescript
import { useState } from 'react';
import { ImageVideoUploader } from '../components/ImageVideoUploader';

function ListingPhotos({ listingId }) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-8">
        <h3 className="font-bold mb-4">Add Photos</h3>
        <ImageVideoUploader
          uploadType="images"
          multiple={true}
          maxFiles={40}
          listingId={listingId}
          onUploadComplete={(files) => {
            const newPhotos = [...photos, ...files.map(f => f.url)];
            setPhotos(newPhotos.slice(0, 40)); // Max 40
          }}
          onError={(error) => alert(`Upload failed: ${error}`)}
        />
      </div>

      {/* Main photo viewer */}
      {selectedPhoto && (
        <div className="mb-8">
          <img 
            src={selectedPhoto} 
            alt="main" 
            className="w-full h-96 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Thumbnail grid */}
      <div className="grid grid-cols-6 gap-2">
        {photos.map((url, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedPhoto(url)}
            className={`relative group ${selectedPhoto === url ? 'ring-2 ring-accent' : ''}`}
          >
            <img 
              src={url} 
              alt={`thumb-${idx}`}
              className="w-full aspect-square object-cover rounded"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPhotos(photos.filter((_, i) => i !== idx));
              }}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
            >
              ✕
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Product Video Upload

```typescript
function ListingVideos({ listingId }) {
  const [videoUrls, setVideoUrls] = useState<string[]>([]);

  return (
    <div>
      <h3 className="font-bold mb-4">Upload Demo Video</h3>
      <ImageVideoUploader
        uploadType="videos"
        maxFiles={3}
        listingId={listingId}
        onUploadComplete={(files) => {
          setVideoUrls(files.map(f => f.url));
        }}
        onError={(error) => console.error(error)}
      />

      {/* Video player */}
      {videoUrls.map((url) => (
        <video
          key={url}
          src={url}
          controls
          className="w-full max-w-2xl mt-4 rounded-lg border"
        />
      ))}
    </div>
  );
}
```

### Direct Storage Service Usage

```typescript
import { storageService } from '../services/storageService';

// Manual upload with progress tracking
async function uploadFile(file: File, listingId: string) {
  try {
    const uploadTask = storageService.uploadFile(
      file,
      `listings/${listingId}/images`,
      (progress) => {
        const percent = Math.round(
          (progress.bytesTransferred / progress.totalBytes) * 100
        );
        console.log(`Upload progress: ${percent}%`);
      }
    );

    const snapshot = await uploadTask;
    const url = await storageService.getDownloadUrl(snapshot.ref.fullPath);
    return url;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

// Delete file
async function removeFile(fileUrl: string) {
  try {
    await storageService.deleteFile(fileUrl);
    console.log('File deleted');
  } catch (error) {
    console.error('Delete failed:', error);
  }
}

// Batch upload
async function uploadMultiple(files: File[], listingId: string) {
  try {
    const urls = await storageService.uploadMultipleFiles(
      files,
      listingId,
      'images',
      (fileIndex, progress) => {
        console.log(
          `File ${fileIndex}: ${Math.round((progress.bytesTransferred / progress.totalBytes) * 100)}%`
        );
      }
    );
    return urls;
  } catch (error) {
    console.error('Batch upload failed:', error);
    throw error;
  }
}
```

---

## 🎨 Component Props Reference

### ImageVideoUploader

```typescript
interface ImageVideoUploaderProps {
  // Type of files to accept
  uploadType?: 'images' | 'videos' | 'icons';  // default: 'images'

  // Upload behavior
  multiple?: boolean;                           // default: true
  maxFiles?: number;                            // default: 10
  listingId?: string;                           // default: 'temp'

  // Callbacks
  onUploadComplete?: (files: UploadedFile[]) => void;
  onError?: (error: string) => void;

  // Styling
  className?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
}
```

### BrandAssetManager

```typescript
interface BrandAssetManagerProps {
  onAssetUpdate?: (assets: BrandAsset[]) => void;
}
```

---

## 🔐 Permissions & Access

### Image URL Format

Uploaded images follow this pattern:
```
https://storage.googleapis.com/[bucket]/listings/[listing-id]/images/[timestamp]_[filename]
```

### Public vs Private Files

- **Public** (everyone can read):
  - Listing images/videos
  - Brand assets (logos, favicons)
  - User avatars

- **Private** (owner/admin only):
  - Draft listing images
  - User invoices/documents
  - Admin files

---

## 🛠️ Advanced Usage

### Update Media Metadata

```typescript
import { storageService } from '../services/storageService';

await storageService.updateFileMetadata(imageUrl, {
  category: 'skidder',
  tags: 'john-deere,2020,excellent',
  listingId: 'listing-123',
});
```

### Get File Metadata

```typescript
const metadata = await storageService.getFileMetadata(imageUrl);
console.log(metadata.customMetadata);
```

### Generate Thumbnail URL

```typescript
const thumbUrl = storageService.generateThumbnailUrl(imageUrl, 200, 200);
// Returns: https://storage.googleapis.com/.../[image]?w=200&h=200
```

---

## ✅ Implementation Checklist

For each component that needs image uploads:

- [ ] Import `ImageVideoUploader` component
- [ ] Add upload section to form/modal
- [ ] Handle `onUploadComplete` callback
- [ ] Handle `onError` callback
- [ ] Save image URLs to database
- [ ] Display uploaded images preview
- [ ] Add file removal option
- [ ] Test on mobile device
- [ ] Test error handling (large files, wrong type)
- [ ] Test permission restrictions

---

## 🚨 Error Handling

Common errors and solutions:

```typescript
try {
  await storageService.uploadListingImage(file, listingId);
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('Invalid file type')) {
      // Handle: Wrong file type selected
      alert('Please select a JPEG, PNG, WebP, or GIF image');
    } else if (error.message.includes('File too large')) {
      // Handle: File exceeds size limit
      alert('Image must be smaller than 10MB');
    } else if (error.message.includes('Permission denied')) {
      // Handle: User not authenticated or no permissions
      alert('You must be logged in to upload');
    } else {
      // Generic upload error
      alert('Upload failed. Please try again.');
    }
  }
}
```

---

## 📦 File Size Guidelines

Optimize for web:

| Type | Recommended | Tested Max |
|------|-----------|-----------|
| **Logo** | < 500KB | 5MB |
| **Favicon** | < 100KB | 5MB |
| **Product Photo** | 1-3MB | 10MB |
| **Hero Image** | 2-4MB | 10MB |
| **Demo Video** | 50-200MB | 500MB |

**Pro Tip**: For product images, compress to 1.5-2MB before upload for faster loading.

---

## 🎯 Next Implementation Steps

1. ✅ Add image upload to Listing creation form
2. ✅ Add image upload to User profile page
3. ✅ Create brand asset manager in admin dashboard
4. ✅ Display images in listing detail page
5. ✅ Add favicon to HTML head tag
6. ✅ Update sitemap with image URLs
7. ✅ Implement image lazy loading
8. ✅ Add CDN caching headers

---

**Ready to upload!** 🚀
