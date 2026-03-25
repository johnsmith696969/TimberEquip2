import { db, auth } from '../firebase';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, orderBy, serverTimestamp, arrayUnion
} from 'firebase/firestore';
import { BlogPost, ContentBlock, MediaItem } from '../types';

export const cmsService = {
  // ── Blog Posts ─────────────────────────────────────────────────────────────

  async getBlogPosts(): Promise<BlogPost[]> {
    const snap = await getDocs(query(collection(db, 'blogPosts'), orderBy('updatedAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as BlogPost));
  },

  async createPost(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ref = await addDoc(collection(db, 'blogPosts'), {
      ...post,
      revisions: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return ref.id;
  },

  async updatePost(id: string, updates: Partial<Omit<BlogPost, 'id' | 'createdAt'>>): Promise<void> {
    // Snapshot current title+content as a revision before overwriting
    const snap = await getDoc(doc(db, 'blogPosts', id));
    if (snap.exists()) {
      const cur = snap.data() as BlogPost;
      const revision = {
        id: Date.now().toString(),
        title: cur.title || '',
        content: cur.content || '',
        authorUid: auth.currentUser?.uid || '',
        authorName: auth.currentUser?.displayName || 'Admin',
        savedAt: new Date().toISOString()
      };
      await updateDoc(doc(db, 'blogPosts', id), {
        ...updates,
        revisions: arrayUnion(revision),
        updatedAt: serverTimestamp()
      });
    } else {
      await updateDoc(doc(db, 'blogPosts', id), { ...updates, updatedAt: serverTimestamp() });
    }
  },

  async deletePost(id: string): Promise<void> {
    await deleteDoc(doc(db, 'blogPosts', id));
  },

  async submitForReview(id: string): Promise<void> {
    await updateDoc(doc(db, 'blogPosts', id), {
      reviewStatus: 'in_review',
      updatedAt: serverTimestamp()
    });
  },

  async publishPost(id: string): Promise<void> {
    await updateDoc(doc(db, 'blogPosts', id), {
      status: 'published',
      reviewStatus: 'published',
      scheduledAt: null,
      updatedAt: serverTimestamp()
    });
  },

  async unpublishPost(id: string): Promise<void> {
    await updateDoc(doc(db, 'blogPosts', id), {
      status: 'draft',
      reviewStatus: 'draft',
      updatedAt: serverTimestamp()
    });
  },

  async schedulePost(id: string, scheduledAt: string): Promise<void> {
    await updateDoc(doc(db, 'blogPosts', id), {
      reviewStatus: 'scheduled',
      scheduledAt,
      updatedAt: serverTimestamp()
    });
  },

  async rollbackToRevision(postId: string, revision: NonNullable<BlogPost['revisions']>[number]): Promise<void> {
    const snap = await getDoc(doc(db, 'blogPosts', postId));
    if (!snap.exists()) return;
    const cur = snap.data() as BlogPost;
    const rollbackEntry = {
      id: Date.now().toString(),
      title: cur.title,
      content: cur.content,
      authorUid: auth.currentUser?.uid || '',
      authorName: auth.currentUser?.displayName || 'Admin',
      savedAt: new Date().toISOString(),
      note: `Rolled back from ${new Date(revision.savedAt).toLocaleString()}`
    };
    await updateDoc(doc(db, 'blogPosts', postId), {
      title: revision.title,
      content: revision.content,
      revisions: arrayUnion(rollbackEntry),
      updatedAt: serverTimestamp()
    });
  },

  // ── Media Library ──────────────────────────────────────────────────────────

  async getMedia(): Promise<MediaItem[]> {
    const snap = await getDocs(query(collection(db, 'mediaLibrary'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as MediaItem));
  },

  async addMedia(item: Omit<MediaItem, 'id' | 'createdAt'>): Promise<string> {
    const ref = await addDoc(collection(db, 'mediaLibrary'), {
      ...item,
      uploadedBy: auth.currentUser?.uid || '',
      uploadedByName: auth.currentUser?.displayName || 'Admin',
      createdAt: serverTimestamp()
    });
    return ref.id;
  },

  async updateMediaTags(id: string, tags: string[]): Promise<void> {
    await updateDoc(doc(db, 'mediaLibrary', id), { tags });
  },

  async deleteMedia(id: string): Promise<void> {
    await deleteDoc(doc(db, 'mediaLibrary', id));
  },

  // ── Content Blocks ─────────────────────────────────────────────────────────

  async getContentBlocks(): Promise<ContentBlock[]> {
    const snap = await getDocs(query(collection(db, 'contentBlocks'), orderBy('order', 'asc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ContentBlock));
  },

  async createContentBlock(block: Omit<ContentBlock, 'id'>): Promise<string> {
    const ref = await addDoc(collection(db, 'contentBlocks'), block);
    return ref.id;
  },

  async updateContentBlock(id: string, updates: Partial<ContentBlock>): Promise<void> {
    await updateDoc(doc(db, 'contentBlocks', id), updates);
  },

  async deleteContentBlock(id: string): Promise<void> {
    await deleteDoc(doc(db, 'contentBlocks', id));
  },

  // ── Role Management ────────────────────────────────────────────────────────

  async updateUserRole(uid: string, role: string): Promise<void> {
    await updateDoc(doc(db, 'users', uid), { role, updatedAt: serverTimestamp() });
  },

  async suspendUser(uid: string): Promise<void> {
    await updateDoc(doc(db, 'users', uid), {
      accountStatus: 'suspended',
      role: 'member',
      updatedAt: serverTimestamp()
    });
  }
};
