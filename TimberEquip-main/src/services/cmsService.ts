import { API_BASE } from '../constants/api';
import { db, auth } from '../firebase';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, orderBy, serverTimestamp, arrayUnion
} from 'firebase/firestore';
import { BlogPost, ContentBlock, MediaItem } from '../types';

export interface AdminContentBootstrapResponse {
  posts: BlogPost[];
  media: MediaItem[];
  contentBlocks: ContentBlock[];
  partial: boolean;
  degradedSections: string[];
  errors: Partial<Record<'posts' | 'media' | 'contentBlocks', string>>;
  firestoreQuotaLimited: boolean;
  fetchedAt: string;
}

const CMS_CACHE_PREFIX = 'te-cms-cache-v1';

type CmsCacheEnvelope<T> = {
  savedAt: string;
  data: T;
};

function isQuotaExceededCmsError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '');
  return /quota limit exceeded|free daily read units per project|quota exceeded|daily read quota is exhausted/i.test(message);
}

function readCmsCache<T>(scope: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(`${CMS_CACHE_PREFIX}:${scope}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CmsCacheEnvelope<T> | T;
    if (parsed && typeof parsed === 'object' && 'data' in (parsed as CmsCacheEnvelope<T>)) {
      return ((parsed as CmsCacheEnvelope<T>).data ?? null) as T | null;
    }
    return parsed as T;
  } catch (error) {
    console.warn(`Unable to read CMS cache for ${scope}:`, error);
    return null;
  }
}

function writeCmsCache<T>(scope: string, data: T): void {
  if (typeof window === 'undefined') return;

  try {
    const payload: CmsCacheEnvelope<T> = {
      savedAt: new Date().toISOString(),
      data,
    };
    window.localStorage.setItem(`${CMS_CACHE_PREFIX}:${scope}`, JSON.stringify(payload));
  } catch (error) {
    console.warn(`Unable to write CMS cache for ${scope}:`, error);
  }
}

function getApiRequestUrls(input: RequestInfo | URL): string[] {
  const rawInput = typeof input === 'string' ? input : input instanceof URL ? input.toString() : String(input);
  if (typeof window === 'undefined' || !rawInput.startsWith(API_BASE)) {
    return [rawInput];
  }

  const urls = [rawInput];
  const hostname = window.location.hostname.trim().toLowerCase();
  if (hostname === 'www.forestryequipmentsales.com') {
    urls.push(`https://forestryequipmentsales.com${rawInput}`);
  } else if (hostname === 'www.timberequip.com') {
    urls.push(`https://timberequip.com${rawInput}`);
  }

  return Array.from(new Set(urls));
}

async function fetchApiWithFallback(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urls = getApiRequestUrls(input);
  let lastError: unknown = null;
  let lastResponse: Response | null = null;

  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];

    try {
      const response = await fetch(url, init);
      if (response.ok || index === urls.length - 1 || response.status !== 404) {
        return response;
      }
      lastResponse = response;
    } catch (error) {
      lastError = error;
      if (index === urls.length - 1) {
        throw error;
      }
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError instanceof Error ? lastError : new Error('CMS API request failed');
}

async function getAuthorizedJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Unauthorized');
  }

  const idToken = await currentUser.getIdToken();
  const response = await fetchApiWithFallback(input, {
    ...init,
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const rawBody = await response.text().catch(() => '');
  let payload: Record<string, unknown> = {};
  if (rawBody) {
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    throw new Error(String(payload?.error || rawBody || `Content request failed (${response.status}).`));
  }

  return payload as T;
}

export const cmsService = {
  // ── Blog Posts ─────────────────────────────────────────────────────────────

  async getBlogPosts(): Promise<BlogPost[]> {
    try {
      const posts = await getAuthorizedJson<BlogPost[]>(`${API_BASE}/admin/content/blog-posts`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      if (Array.isArray(posts)) {
        writeCmsCache('blog-posts', posts);
      }
      return posts;
    } catch (error) {
      const cachedPosts = readCmsCache<BlogPost[]>('blog-posts');
      if (Array.isArray(cachedPosts) && cachedPosts.length > 0) {
        console.warn('Using cached blog posts because the live CMS request failed:', error);
        return cachedPosts;
      }
      if (isQuotaExceededCmsError(error)) {
        console.warn('Blog posts are temporarily unavailable because the Firestore daily read quota is exhausted:', error);
        return [];
      }
      throw error;
    }
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
    try {
      const media = await getAuthorizedJson<MediaItem[]>(`${API_BASE}/admin/content/media`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      if (Array.isArray(media)) {
        writeCmsCache('media', media);
      }
      return media;
    } catch (error) {
      const cachedMedia = readCmsCache<MediaItem[]>('media');
      if (Array.isArray(cachedMedia) && cachedMedia.length > 0) {
        console.warn('Using cached media assets because the live CMS request failed:', error);
        return cachedMedia;
      }
      if (isQuotaExceededCmsError(error)) {
        console.warn('Media assets are temporarily unavailable because the Firestore daily read quota is exhausted:', error);
        return [];
      }
      throw error;
    }
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
    try {
      const blocks = await getAuthorizedJson<ContentBlock[]>(`${API_BASE}/admin/content/blocks`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      if (Array.isArray(blocks)) {
        writeCmsCache('content-blocks', blocks);
      }
      return blocks;
    } catch (error) {
      const cachedBlocks = readCmsCache<ContentBlock[]>('content-blocks');
      if (Array.isArray(cachedBlocks) && cachedBlocks.length > 0) {
        console.warn('Using cached content blocks because the live CMS request failed:', error);
        return cachedBlocks;
      }
      if (isQuotaExceededCmsError(error)) {
        console.warn('Content blocks are temporarily unavailable because the Firestore daily read quota is exhausted:', error);
        return [];
      }
      throw error;
    }
  },

  async getAdminContentBootstrap(): Promise<AdminContentBootstrapResponse> {
    try {
      const payload = await getAuthorizedJson<AdminContentBootstrapResponse>(`${API_BASE}/admin/content/bootstrap`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      const normalized: AdminContentBootstrapResponse = {
        posts: Array.isArray(payload?.posts) ? payload.posts : [],
        media: Array.isArray(payload?.media) ? payload.media : [],
        contentBlocks: Array.isArray(payload?.contentBlocks) ? payload.contentBlocks : [],
        partial: Boolean(payload?.partial),
        degradedSections: Array.isArray(payload?.degradedSections) ? payload.degradedSections : [],
        errors: typeof payload?.errors === 'object' && payload?.errors ? payload.errors : {},
        firestoreQuotaLimited: Boolean(payload?.firestoreQuotaLimited),
        fetchedAt: String(payload?.fetchedAt || new Date().toISOString()),
      };

      writeCmsCache('blog-posts', normalized.posts);
      writeCmsCache('media', normalized.media);
      writeCmsCache('content-blocks', normalized.contentBlocks);
      return normalized;
    } catch (error) {
      const cachedPosts = readCmsCache<BlogPost[]>('blog-posts') || [];
      const cachedMedia = readCmsCache<MediaItem[]>('media') || [];
      const cachedBlocks = readCmsCache<ContentBlock[]>('content-blocks') || [];
      const hasCachedData = cachedPosts.length > 0 || cachedMedia.length > 0 || cachedBlocks.length > 0;

      if (hasCachedData) {
        console.warn('Using cached admin content bootstrap because the live CMS bootstrap request failed:', error);
        return {
          posts: cachedPosts,
          media: cachedMedia,
          contentBlocks: cachedBlocks,
          partial: true,
          degradedSections: ['live_request'],
          errors: {
            posts: 'Using cached CMS data.',
            media: 'Using cached CMS data.',
            contentBlocks: 'Using cached CMS data.',
          },
          firestoreQuotaLimited: isQuotaExceededCmsError(error),
          fetchedAt: new Date().toISOString(),
        };
      }

      throw error;
    }
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
