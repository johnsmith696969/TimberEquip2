import { db, auth } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { BlogPost, AuditLog } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error(`Firestore ${operationType} error on ${path || 'unknown'}`);
  throw new Error(`Firestore ${operationType} failed`);
}

export const adminService = {
  // Blog Posts
  async getBlogPosts(): Promise<BlogPost[]> {
    const path = 'blogPosts';
    try {
      const snap = await getDocs(query(collection(db, path), orderBy('updatedAt', 'desc')));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as BlogPost));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async createBlogPost(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) {
    const path = 'blogPosts';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...post,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateBlogPost(id: string, updates: Partial<BlogPost>) {
    const path = `blogPosts/${id}`;
    try {
      const docRef = doc(db, 'blogPosts', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteBlogPost(id: string) {
    const path = `blogPosts/${id}`;
    try {
      await deleteDoc(doc(db, 'blogPosts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Audit Logs
  async logAction(action: string, targetId: string, targetType: string, details: string) {
    const path = 'auditLogs';
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, path), {
        adminUid: auth.currentUser.uid,
        adminEmail: auth.currentUser.email,
        action,
        targetId,
        targetType,
        details,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  // Listing Approvals
  async approveListing(listingId: string) {
    const path = `listings/${listingId}`;
    if (!auth.currentUser) return;
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`/api/listings/${encodeURIComponent(listingId)}/lifecycle`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
          metadata: {
            triggeredFrom: 'admin_service',
          },
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(String(payload?.error || `Unable to approve listing (${response.status}).`));
      }
      await this.logAction('APPROVE_LISTING', listingId, 'listing', 'Listing approved by admin');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async rejectListing(listingId: string, reason: string) {
    const path = `listings/${listingId}`;
    if (!auth.currentUser) return;
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`/api/listings/${encodeURIComponent(listingId)}/lifecycle`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          reason,
          metadata: {
            triggeredFrom: 'admin_service',
          },
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(String(payload?.error || `Unable to reject listing (${response.status}).`));
      }
      await this.logAction('REJECT_LISTING', listingId, 'listing', `Listing rejected: ${reason}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
};
