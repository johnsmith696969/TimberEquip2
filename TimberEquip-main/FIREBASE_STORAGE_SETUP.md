# Firebase Image & Video Upload Setup Guide

Complete walkthrough for setting up Firebase Cloud Storage and integrating image/video uploads for TimberEquip.

---

## 📋 Overview

This guide covers:
1. Creating Firebase Cloud Storage bucket
2. Setting up security rules
3. Integrating the storage service
4. Using upload components in your app
5. Managing brand assets (logos, favicons)
6. Deployment & monitoring

**Total Setup Time**: 15-20 minutes

---

## 🔧 Step 1: Firebase Console Setup

### 1.1 Create Cloud Storage Bucket

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your TimberEquip project
3. In left sidebar, click **Storage** (under "Build")
4. Click **Create bucket**
5. Configure:
   - **Bucket name**: `[your-project].appspot.com` (or custom name)
   - **Location**: Choose closest to users (e.g., `us-west1` for US)
   - **Storage class**: Standard
   - **Access control**: Uniform (recommended)
6. Click **Create**

### 1.2 Enable CORS (Cross-Origin Requests)

Firebase Storage needs CORS enabled for browser uploads. Set this up via `gsutil`:

```bash
# Install Google Cloud SDK if needed
# https://cloud.google.com/sdk/docs/install

# Create cors.json file
cat > cors.json << 'EOF'
[
  {
    "origin": ["https://timberequip.com", "http://localhost:5173"],
    "method": ["GET", "HEAD", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  },
  {
    "origin": ["https://timberequip.com", "http://localhost:5173"],
    "method": ["PUT", "POST", "OPTIONS"],
    "responseHeader": [
      "Content-Type",
      "x-goog-meta-uploaded-by",
      "x-goog-meta-uploaded-at"
    ],
    "maxAgeSeconds": 3600
  }
]
EOF

# Apply CORS to bucket
gsutil cors set cors.json gs://[your-bucket-name]

# Verify CORS
gsutil cors get gs://[your-bucket-name]
```

**Note**: Update origin URLs for production. For development, add `http://localhost:5173`.

---

## 📁 Step 2: Storage Rules Deployment

### 2.1 Deploy Storage Rules

The `storage.rules` file in your project defines security policies. Deploy it:

```bash
cd /workspaces/TimberEquip

# Login to Firebase (if not already)
firebase login

# Deploy only storage rules
firebase deploy --only storage

# Or deploy all (storage + firestore)
firebase deploy
```

### 2.2 Storage Rules Overview

Rules are in [storage.rules](../storage.rules):

```
Public listings:    Anyone can read, owners/admins can write
Brand assets:       Anyone can read, admins only can write
Private documents:  Only owner/admins can access
User files:         Each user has quota and access restrictions
```

**Key rules file locations**:
- Listings images & videos: `/listings/{listingId}/images|videos/`
- Brand assets: `/brand-assets/{type}/`  (logo, favicon, social, banner, hero)
- User avatars: `/users/{userId}/avatar/`
- Private files: `/private/{userId}/documents/`

---

## 🗄️ Step 3: Firestore Collections Setup

The following Firestore collections track media metadata:

### 3.1 Collection: `media-metadata`

Stores information about uploaded files:

```typescript
// Example document structure
{
  id: "abc123xyz",
  fileUrl: "https://storage.googleapis.com/...",
  fileName: "listing-photo-1.jpg",
  fileType: "image/jpeg",
  fileSize: 2048576,              // bytes
  category: "product",              // 'product' | 'brand' | 'user' | 'listing'
  listingId: "listing-12345",        // optional
  uploadedBy: "user-uid-abc",
  uploadedAt: "2026-03-21T10:30:00Z",
  tags: ["skidder", "john-deere", "2020"],
  usageCount: 3,                     // How many places this is used
  isPublic: true,
  metadata: {
    width: 1920,
    height: 1080,
    duration: null,                  // For videos
    thumbnail: "https://...",
  }
}
```

**Add to Firestore**:
1. Firebase Console → Firestore Database
2.  Click **+ Start collection**
3. Name: `media-metadata`
4. Click **Next** and then **Save** (auto-ID first document)

### 3.2 Collection: `user-storage-usage`

Tracks per-user storage quotas:

```typescript
{
  userId: "user-uid-abc",
  totalUsageBytes: 1073741824,    // 1GB
  quotaBytes: 10737418240,         // 10GB quota
  filesCount: 145,
  imagesCount: 120,
  videosCount: 25,
  lastUpdated: "2026-03-21T10:30:00Z"
}
```

**Add to Firestore**:
1. Firestore Database → **+ Start collection**
2. Name: `user-storage-usage`
3. Click **Next** and **Save**

### 3.3 Update Firestore Rules

The `firestore.rules` file has been updated with these collections. Deploy:

```bash
firebase deploy --only firestore:rules
```

---

## 💻 Step 4: Integration in Code

### 4.1 The Storage Service

File: [src/services/storageService.ts](../src/services/storageService.ts)

Already created and ready to use. Key functions:

```typescript
import { storageService } from '../services/storageService';

// Upload a single image
const url = await storageService.uploadListingImage(file, listingId, (progress) => {
  console.log(`${progress.bytesTransferred} / ${progress.totalBytes} bytes`);
});

// Upload a video
const videoUrl = await storageService.uploadListingVideo(file, listingId, onProgress);

// Upload brand icon (logo, favicon, social)
const logoUrl = await storageService.uploadBrandIcon(file, 'logo'); // or 'favicon' | 'social'

// Delete a file
await storageService.deleteFile(url);

// Delete multiple files
await storageService.deleteMultipleFiles([url1, url2, url3]);

// Upload multiple files (batch)
const urls = await storageService.uploadMultipleFiles([file1, file2], listingId, 'images');
```

### 4.2 File Size & Type Limits

Configured in `storageService.ts`:

| Type | Max Size | Allowed Types |
|------|----------|---------------|
| **Images** | 10MB | JPEG, PNG, WebP, GIF |
| **Videos** | 500MB | MP4, MPEG, MOV, WebM |
| **Icons** | 5MB | JPEG, PNG, SVG, WebP |

Override in component props if needed.

---

## 🖼️ Step 5: Image Upload Component

### 5.1 Basic Usage

File: [src/components/ImageVideoUploader.tsx](../src/components/ImageVideoUploader.tsx)

```typescript
import { ImageVideoUploader } from '../components/ImageVideoUploader';

function MyComponent() {
  const [uploadedFiles, setUploadedFiles] = useState([]);

  return (
    <ImageVideoUploader
      uploadType="images"          // 'images' | 'videos' | 'icons'
      multiple={true}
      maxFiles={10}
      listingId="listing-123"
      onUploadComplete={(files) => {
        setUploadedFiles(files);
        console.log('Uploaded:', files);
      }}
      onError={(error) => {
        console.error('Upload error:', error);
      }}
    />
  );
}
```

### 5.2 Events

- `onUploadComplete`: Called when file(s) finish uploading
- `onError`: Called when validation or upload fails

### 5.3 Features

- ✅ Drag & drop support
- ✅ Progress bar per file
- ✅ File validation (type, size)
- ✅ Multiple file upload
- ✅ Remove uploaded files
- ✅ Error messages
- ✅ Preview for images

---

## 🏢 Step 6: Brand Asset Manager

### 6.1 Brand Icon Setup

File: [src/components/BrandAssetManager.tsx](../src/components/BrandAssetManager.tsx)

Upload and manage brand assets (logo, favicons, social icons):

```typescript
import { BrandAssetManager } from '../components/BrandAssetManager';

function AdminDashboard() {
  return (
    <div>
      <h2>Manage Brand Assets</h2>
      <BrandAssetManager
        onAssetUpdate={(assets) => {
          console.log('Updated assets:', assets);
          // Save to config or database
        }}
      />
    </div>
  );
}
```

### 6.2 Asset Types

- **Logo**: Main brand logo (1-2 files recommended)
- **Favicon**: Browser tab icon (multiple sizes: 32px, 64px, 192px, 512px)
- **Social**: Social media preview images (OG images, Twitter cards)
- **Banner**: Hero section banners
- **Hero**: Large hero images for pages

### 6.3 Features

- Group assets by type
- Copy URL to clipboard
- Delete assets
- View file details
- Open in new tab
- Visual preview grid

---

## 📸 Step 7: Integration Examples

### 7.1 Listing Image Upload

In your Listing creation/edit form:

```typescript
import { ImageVideoUploader } from '../components/ImageVideoUploader';

function CreateListing() {
  const listingId = useParams().id || 'temp-' + Date.now();
  const [images, setImages] = useState([]);

  return (
    <div>
      <h3>Upload Listing Photos (10-40 images)</h3>
      <ImageVideoUploader
        uploadType="images"
        minFiles={10}
        maxFiles={40}
        listingId={listingId}
        onUploadComplete={(files) => {
          setImages(files.map(f => f.url));
        }}
        onError={(error) => alert(error)}
      />
      
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mt-4">
          {images.map((url) => (
            <img key={url} src={url} alt="listing" className="w-full h-32 object-cover rounded" />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 7.2 Listing Videos

```typescript
<ImageVideoUploader
  uploadType="videos"
  maxFiles={5}
  listingId={listingId}
  onUploadComplete={(videos) => {
    setListingVideos(videos.map(v => v.url));
  }}
/>
```

### 7.3 Saving to Database

After upload, save URLs and metadata to Firestore listing:

```typescript
async function saveListing(listingData, imageUrls, videoUrls) {
  const listing = {
    ...listingData,
    images: imageUrls,        // Array of URLs
    videoUrls: videoUrls,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save listing
  const listingRef = await addDoc(collection(db, 'listings'), listing);

  // Save media metadata for each image
  for (const url of imageUrls) {
    await addDoc(collection(db, 'media-metadata'), {
      fileUrl: url,
      fileName: url.split('/').pop(),
      fileType: 'image/jpeg',
      category: 'listing',
      listingId: listingRef.id,
      uploadedBy: currentUser.uid,
      uploadedAt: new Date().toISOString(),
      tags: [listing.category, listing.manufacturer],
      usageCount: 1,
      isPublic: true,
    });
  }
}
```

---

## 🔐 Step 8: Security Best Practices

### 8.1 Access Control

Storage rules enforce:
- **Public listings**: Anyone can view, only owner/admin can upload/delete
- **Brand assets**: Anyone can view, only admin can manage
- **Private files**: Only owner/admin access
- **User files**: Only owner can upload/delete

### 8.2 File Validation

- Type checking (MIME type enforcement)
- Size limits per category
- Filename sanitization (automatic via `Date.now()` prefix)
- Metadata tracking

### 8.3 Quotas

Each user has storage quota (example: 10GB). Track in `user-storage-usage`:

```typescript
async function checkUserQuota(userId) {
  const usage = await getDoc(doc(db, 'user-storage-usage', userId));
  if (usage.exists()) {
    const data = usage.data();
    const usedPercent = (data.totalUsageBytes / data.quotaBytes) * 100;
    console.log(`User storage: ${usedPercent.toFixed(1)}% used`);
    return usedPercent < 90;  // True if under quota
  }
  return true;
}
```

### 8.4 Update Security Rules

Every 3-6 months, review rules for:
- ✅ Proper role checks (admin, editor, owner)
- ✅ File size enforcement
- ✅ Rate limiting (via Cloud Functions, not in rules)
- ✅ Suspicious patterns

---

## 🚀 Step 9: Deployment Checklist

### Before Production Deploy

```
Firebase Setup:
☐ Cloud Storage bucket created
☐ CORS configuration applied  
☐ Storage rules deployed (firebase deploy --only storage)
☐ Firestore media collections created
☐ Firestore rules deployed

Code Integration:
☐ storageService.ts in src/services/
☐ ImageVideoUploader component in src/components/
☐ BrandAssetManager component created
☐ Types updated (MediaMetadata, UserStorageUsage, BrandAsset)
☐ Build passes (npm run build)

Testing:
☐ Test image upload (local)
☐ Test video upload (local)
☐ Test brand icon upload
☐ Test delete functionality
☐ Test error handling
☐ Mobile device testing (iOS/Android)
☐ Test permission restrictions
```

### Deployment Command

```bash
# Full Firebase deployment
firebase deploy

# Or specific services
firebase deploy --only storage
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only hosting
```

---

## 📊 Step 10: Monitoring & Maintenance

### Monthly Tasks

1. **Check storage usage**: Firebase Console → Storage → Usage
2. **Review quota violations**: Check `user-storage-usage` collection
3. **Audit deleted files**: Check `media-metadata` for removal
4. **Monitor upload errors**: Check browser console and cloud logs

### Quarterly Tasks

1. **Backup important media**: Export media-metadata collection
2. **Review access patterns**: Check who's uploading what
3. **Update security rules**: Based on new usage patterns
4. **Cost analysis**: Storage costs vs. S3/other providers

### Commands

```bash
# View storage metrics
firebase database:get /

# Check quotas
firebase firestore:get user-storage-usage

# Download data
firebase firestore:get media-metadata > media_backup.json

# Delete old files (example: >30GB user storage)
firebase shell
# Then: db.collection('user-storage-usage').where('totalUsageBytes', '>', 32212254720).get()
```

---

## 🐛 Troubleshooting

### Issue: "Permission denied" on upload

**Solution**: Check Firestore rules  and Storage rules. Verify:
- User is authenticated
- User owns the listing
- File path matches rule pattern
- Custom claims (role) are set correctly

### Issue: CORS error in browser

**Solution**: Re-apply CORS configuration:
```bash
gsutil cors set cors.json gs://[bucket]
```

### Issue: Uploads very slow

**Solution**: Check:
- File size (split videos into smaller chunks)
- Network bandwidth
- Cloud Function CPU throttling
- Storage location vs. user location

### Issue: Files not showing after upload

**Solution**: 
- Verify URL in browser (should return 200 OK)
- Check Storage rules allow read access
- Clear browser cache
- Verify file exists in Firebase Console → Storage tab

---

## 📝 TypeScript Types Reference

All types are defined in [src/types.ts](../src/types.ts):

```typescript
export interface MediaMetadata {
  id: string;
  fileUrl: string;
  fileName: string;
  fileType: string;  // MIME type
  fileSize: number;  // bytes
  category: 'product' | 'brand' | 'user' | 'listing' | 'other';
  listingId?: string;
  uploadedBy: string;
  uploadedAt: string;
  tags?: string[];
  usageCount: number;
  isPublic: boolean;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    thumbnail?: string;
  };
}

export interface UserStorageUsage {
  userId: string;
  totalUsageBytes: number;
  quotaBytes: number;
  filesCount: number;
  imagesCount: number;
  videosCount: number;
  lastUpdated: string;
}

export interface BrandAsset {
  id: string;
  type: 'logo' | 'favicon' | 'social' | 'banner' | 'hero';
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  tags?: string[];
}
```

---

## 🎯 Next Steps

1. **Implement media upload** in listing creation flow
2. **Create media gallery** component for browsing uploaded files
3. **Add image optimization** (compression, resizing) via Cloud Functions
4. **Set up CDN** (Cloud CDN) for faster image delivery
5. **Implement image search** via metadata tags
6. **Add watermarking** for brand protection

---

## 📚 Resources

- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
- [Firebase Security Rules Guide](https://firebase.google.com/docs/storage/security)
- [gsutil CORS Setup](https://cloud.google.com/storage/docs/configuring-cors)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

---

**Setup Complete!** 🎉

Your Firebase Cloud Storage is now ready for image and video uploads with security rules, Firestore metadata tracking, and React components for easy integration.
