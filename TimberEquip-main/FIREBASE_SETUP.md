# Firebase Configuration Guide for Forestry Equipment Sales

Complete setup instructions for Firebase image storage and account information storage.

---

## 1. Firebase Project Setup

### Prerequisites
- Google Cloud Account
- Firebase Project created at https://console.firebase.google.com

### Step 1: Enable Firebase Services

In the Firebase Console for your Forestry Equipment Sales project:

1. **Cloud Storage**
   - Navigate to `Build > Cloud Storage`
   - Click "Create Bucket"
   - Set bucket name: `timberequip-storage` (or similar)
   - Choose region: `us-central1` (or closest to your primary market)
   - Set access rules (see below)
   - Create bucket

2. **Firestore Database**
   - Navigate to `Build > Firestore Database`
   - Create database in `us-central1`
   - Start in production mode (with rules below)
   - See Rules section below

3. **Authentication**
   - Navigate to `Build > Authentication`
   - Enable sign-in methods:
     - Email/Password
     - Google
     - (Optional: Apple, Facebook, GitHub)

---

## 2. Cloud Storage Configuration

### Storage Bucket Rules

Replace the default rules with this security policy:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // ========================================
    // Public (READ-ONLY) Listings
    // ========================================
    match /listings-public/{userId}/{allPaths=**} {
      allow read;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }

    // ========================================
    // User Account Data
    // ========================================
    match /users/{userId}/profile/{allPaths=**} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && isAdmin(userId);
    }

    // ========================================
    // Media Library (Editor+)
    // ========================================
    match /media-library/{userId}/{allPaths=**} {
      allow read: if isEditor(request.auth.uid);
      allow write: if isEditor(request.auth.uid);
      allow delete: if isAdmin(request.auth.uid);
    }

    // ========================================
    // Temporary Upload Zone
    // ========================================
    match /temp/uploads/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // ========================================
    // Deny all other access
    // ========================================
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }

  // ========================================
  // Helper Functions
  // ========================================
  function isAdmin(uid) {
    return request.auth != null && 
           (request.auth.token.email == "caleb@forestryequipmentsales.com");
  }

  function isEditor(uid) {
    return request.auth != null && 
           (request.auth.token.email == "caleb@forestryequipmentsales.com" ||
            isRole(uid, ['super_admin', 'admin', 'content_manager', 'editor']));
  }

  function isRole(uid, roles) {
    // This would need to be validated against Firestore user's role field
    // Alternatively, use custom claims in Firebase Auth tokens
    return request.auth != null;
  }
}
```

### CORS Configuration (for browser uploads)

Create `cors.json` in your project root:

```json
[
  {
    "origin": ["https://timberequip.com", "https://www.timberequip.com"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

Apply CORS rules via gcloud CLI:
```bash
gsutil cors set cors.json gs://timberequip-storage
```

---

## 3. Firestore Database Collections

### Collection: `users`

**Document ID**: `{uid}` (Firebase Auth UID)

**Schema**:
```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'super_admin' | 'admin' | 'developer' | 'content_manager' | 'editor' | 'dealer' | 'dealer_manager' | 'dealer_staff' | 'individual_seller' | 'member' | 'buyer';
  phoneNumber?: string;
  company?: string;
  location?: string;
  bio?: string;
  
  // Account Status
  accountStatus: 'active' | 'pending' | 'suspended';
  emailVerified: boolean;
  
  // Account Linking (for sub-accounts)
  parentAccountUid?: string;
  
  // Timestamps
  createdAt: FieldValue.serverTimestamp();
  updatedAt?: FieldValue.serverTimestamp();
  lastLoginAt?: string;
  
  // Preferences
  twoFactorEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
  
  // Storage References
  profileImageUrl?: string;
  
  // Metadata
  favorites?: string[]; // listing IDs
  metadata?: {
    totalListingsCreated?: number;
    totalPurchases?: number;
    totalSales?: number;
  };
}
```

### Collection: `media-metadata`

**Document ID**: `{mediaId}` (auto-generated)

**Purpose**: Stores metadata about media files in Cloud Storage

**Schema**:
```typescript
interface MediaMetadata {
  id: string;
  url: string; // Full Cloud Storage URL
  storagePath: string; // Path in Cloud Storage
  filename: string;
  mimeType: string; // 'image/jpeg', 'image/png', 'application/pdf', etc.
  sizeBytes: number;
  
  // Metadata
  uploadedBy: string; // uid
  uploadedByName?: string;
  createdAt: FieldValue.serverTimestamp();
  
  // Organization
  tags: string[];
  category?: string; // 'listing', 'profile', 'content', etc.
  relatedListingId?: string; // if uploaded with listing
  
  // Derived Data
  width?: number; // for images
  height?: number; // for images
  duration?: number; // for videos (seconds)
  
  // Usage Stats
  usageCount?: number;
  lastAccessedAt?: string;
}
```

### Collection: `user-storage-usage`

**Document ID**: `{uid}`

**Purpose**: Track storage usage per user

**Schema**:
```typescript
interface StorageUsage {
  uid: string;
  totalBytesUsed: number;
  maxBytesAllowed: number; // e.g., 5GB = 5368709120
  fileCount: number;
  updatedAt: FieldValue.serverTimestamp();
}
```

### Collection: `audit-logs` (enhancement)

**Add storage operations logging**:
```typescript
{
  id: string;
  userId: string;
  action: 'UPLOAD' | 'DELETE' | 'DOWNLOAD' | 'UPDATE_METADATA';
  resourceType: 'image' | 'document' | 'video' | 'profile';
  resourceId: string; // media ID
  storagePath: string;
  sizeBytes?: number;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failed';
  errorMessage?: string;
  timestamp: FieldValue.serverTimestamp();
}
```

---

## 4. Firestore Rules for User & Media Collections

**Update `firestore.rules`**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    function isAdmin() {
      return request.auth.token.email == "caleb@forestryequipmentsales.com" ||
             getUserRole() in ['super_admin', 'admin', 'developer'];
    }

    function isEditor() {
      return isAdmin() || getUserRole() in ['content_manager', 'editor'];
    }

    function isOwner(uid) {
      return request.auth.uid == uid;
    }

    function validateUserProfile(data) {
      return data.keys().hasAll(['uid', 'email', 'displayName', 'role', 'accountStatus', 'emailVerified']) &&
             data.email is string &&
             data.role in ['super_admin', 'admin', 'developer', 'content_manager', 'editor', 'dealer', 'dealer_manager', 'dealer_staff', 'individual_seller', 'member', 'buyer'] &&
             data.accountStatus in ['active', 'pending', 'suspended'] &&
             data.emailVerified is bool;
    }

    // ========== USERS COLLECTION ==========
    match /users/{userId} {
      allow read: if isAuthenticated() && (isOwner(userId) || isAdmin() || isEditor());
      
      allow create: if isAuthenticated() &&
                       (isOwner(userId) && validateUserProfile(request.resource.data) && request.resource.data.role == 'buyer') ||
                       (isAdmin() && validateUserProfile(request.resource.data));
      
      allow update: if isAuthenticated() &&
                       (isOwner(userId) && validateUserProfile(request.resource.data) && request.resource.data.role == resource.data.role) ||
                       (isAdmin() && validateUserProfile(request.resource.data));
      
      allow delete: if isAdmin();
    }

    // ========== MEDIA METADATA COLLECTION ==========
    match /media-metadata/{mediaId} {
      allow read: if isEditor();
      
      allow create: if isAuthenticated() && 
                       isEditor() &&
                       request.resource.data.uploadedBy == request.auth.uid;
      
      allow update: if isAuthenticated() &&
                       (isOwner(resource.data.uploadedBy) || isAdmin());
      
      allow delete: if isAdmin() || isOwner(resource.data.uploadedBy);
    }

    // ========== STORAGE USAGE TRACKING ==========
    match /user-storage-usage/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if isAdmin();
    }

    // ========== AUDIT LOGS ==========
    match /audit-logs/{logId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }
  }
}
```

---

## 5. TypeScript Service Layer

### File: `src/services/storageService.ts`

```typescript
import { storage, db, auth } from '../firebase';
import {
  ref,
  uploadBytes,
  downloadURL,
  deleteObject,
  getMetadata,
  listAll,
  StorageReference
} from 'firebase/storage';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { MediaMetadata } from '../types';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'video/mp4'
];

export const storageService = {
  /**
   * Upload file to Cloud Storage
   */
  async uploadFile(
    file: File,
    folder: 'listings' | 'profiles' | 'media-library' | 'content',
    userId: string
  ): Promise<{ downloadUrl: string; storagePath: string; metadata: MediaMetadata }> {
    // Validation
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed`);
    }

    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      // Generate unique path
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const safeFilename = file.name.replace(/[^a-z0-9.-]/gi, '-');
      const storagePath = `listings-public/${userId}/${folder}/${timestamp}-${randomStr}-${safeFilename}`;

      // Upload to Cloud Storage
      const storageRef = ref(storage, storagePath);
      const uploadTask = await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
          folder
        }
      });

      // Get download URL
      const downloadUrl = await downloadURL(uploadTask.ref);

      // Create metadata document in Firestore
      const metadataRef = await addDoc(collection(db, 'media-metadata'), {
        url: downloadUrl,
        storagePath,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        uploadedBy: userId,
        uploadedByName: auth.currentUser.displayName,
        createdAt: serverTimestamp(),
        tags: [],
        category: folder,
        usageCount: 0
      } as Omit<MediaMetadata, 'id'>);

      return {
        downloadUrl,
        storagePath,
        metadata: {
          id: metadataRef.id,
          url: downloadUrl,
          storagePath,
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          uploadedBy: userId,
          uploadedByName: auth.currentUser.displayName,
          createdAt: new Date().toISOString(),
          tags: [],
          category: folder
        }
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  /**
   * Delete file from Cloud Storage and metadata
   */
  async deleteFile(storagePath: string, metadataId: string): Promise<void> {
    try {
      // Delete from Cloud Storage
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef);

      // Delete metadata document
      await deleteDoc(doc(db, 'media-metadata', metadataId));
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  },

  /**
   * Get user's uploaded media
   */
  async getUserMedia(userId: string): Promise<MediaMetadata[]> {
    const q = query(
      collection(db, 'media-metadata'),
      where('uploadedBy', '==', userId)
    );

    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as MediaMetadata));
  },

  /**
   * Update media tags
   */
  async updateMediaTags(metadataId: string, tags: string[]): Promise<void> {
    await updateDoc(doc(db, 'media-metadata', metadataId), {
      tags,
      updatedAt: serverTimestamp()
    });
  }
};
```

---

## 6. Implementation in React Components

### Upload Example

```typescript
import { storageService } from '../services/storageService';
import { useState } from 'react';

export function ImageUploader() {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await storageService.uploadFile(
        file,
        'listings',
        'current-user-uid'
      );

      console.log('Uploaded:', result.downloadUrl);
      // Use result.downloadUrl in your listing
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <input
      type="file"
      onChange={handleFileSelect}
      disabled={uploading}
      accept="image/*"
      style={{ fontSize: '16px' }} // Prevents iOS zoom
    />
  );
}
```

---

## 7. Account Information Structure

### Enhanced `users` Collection for Account Management

```typescript
interface AccountInfo {
  // ===== IDENTITY =====
  uid: string;
  email: string;
  displayName: string;
  
  // ===== PROFILE =====
  photoURL?: string;
  phoneNumber?: string;
  company?: string;
  location?: string;
  bio?: string;
  website?: string;
  
  // ===== ROLE & PERMISSIONS =====
  role: UserRole;
  permissions?: {
    canCreateListings: boolean;
    canEditListings: boolean;
    canDeleteListings: boolean;
    canManageAccounts: boolean;
    canAccessAdmin: boolean;
    canAccessBilling: boolean;
    canManageUsers: boolean;
  };
  
  // ===== ACCOUNT STATUS =====
  accountStatus: 'active' | 'pending' | 'suspended' | 'deleted';
  emailVerified: boolean;
  phoneVerified?: boolean;
  
  // ===== SECURITY =====
  twoFactorEnabled: boolean;
  lastPasswordChange?: string;
  loginAttempts?: {
    count: number;
    lastAttempt: string;
  };
  
  // ===== ACCOUNT LINKING =====
  parentAccountUid?: string; // For sub-accounts
  isParentAccount?: boolean;
  managedAccounts?: string[]; // UIDs of managed sub-accounts
  
  // ===== PREFERENCES =====
  preferences?: {
    emailNotifications: {
      newListings: boolean;
      priceAlerts: boolean;
      weeklyMarketReport: boolean;
    };
    theme: 'light' | 'dark';
    language: string;
  };
  
  // ===== BILLING & SUBSCRIPTION =====
  billingInfo?: {
    stripeCustomerId?: string;
    subscriptionId?: string;
    planType: 'free' | 'pro' | 'enterprise';
    renewalDate?: string;
    paymentMethod?: string;
  };
  
  // ===== MEDIA & STORAGE =====
  profileImageUrl?: string;
  storageUsed?: number;
  storageLimit?: number;
  
  // ===== ACTIVITY =====
  favorites?: string[]; // listing IDs
  watchlist?: string[];
  recentSearches?: string[];
  
  // ===== METADATA & STATS =====
  statistics?: {
    totalListingsCreated: number;
    activeListingsCount: number;
    totalViews: number;
    totalLeads: number;
    responseRate: number;
    averageResponseTime: number; // minutes
  };
  
  // ===== TIMESTAMPS =====
  createdAt: FieldValue.serverTimestamp();
  updatedAt?: FieldValue.serverTimestamp();
  lastLoginAt?: string;
  lastActivityAt?: string;
  deletedAt?: string; // if soft-deleted
}
```

---

## 8. Deployment Checklist

- [ ] Enable Cloud Storage in Firebase Console
- [ ] Create storage bucket (`timberequip-storage`)
- [ ] Update `firestore.rules` with rules above
- [ ] Update `storage.rules` with rules above
- [ ] Create CORS configuration
- [ ] Set up media-metadata Firestore collection
- [ ] Create storageService.ts in project
- [ ] Add MediaMetadata type to types.ts
- [ ] Test file uploads in development
- [ ] Test file deletion
- [ ] Verify storage permissions
- [ ] Monitor Firebase quotas
- [ ] Set up billing alerts

---

## 9. Firebase CLI Commands

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage

# View Cloud Storage bucket
gsutil ls -b gs://timberequip-storage

# Check storage usage
gsutil du -s gs://timberequip-storage

# Create backup of Firestore
gcloud firestore export gs://timberequip-backups/backup-$(date +%Y%m%d-%H%M%S)
```

---

## 10. Monitoring & Maintenance

### Set Up Alerts

- [ ] Cloud Storage: Monitor for bandwidth overages
- [ ] Firestore: Monitor read/write quotas
- [ ] Set billing alert at $50/month, $100/month, $500/month
- [ ] Daily backup of Firestore data

### Regular Tasks

- **Weekly**: Review storage usage trends
- **Monthly**: Audit access logs for security
- **Quarterly**: Test disaster recovery procedures
- **Annually**: Review and optimize storage rules

---

## References

- [Firebase Documentation](https://firebase.google.com/docs)
- [Cloud Storage Security Rules](https://firebase.google.com/docs/storage/security)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/rules)
- [Firebase Quotas & Limits](https://firebase.google.com/docs/quotas)
