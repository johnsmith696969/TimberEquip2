import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onIdTokenChanged,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateFirebaseProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfile } from '../types';
import { userService } from '../services/userService';
import type { ListingPlanId } from '../services/billingService';

const ADMIN_EMAILS = ['caleb@forestryequipmentsales.com'];
type AccountAccessSource = NonNullable<UserProfile['accountAccessSource']>;

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    displayName: string;
    company?: string;
    email: string;
    password: string;
    onboardingIntent?: 'free_member' | ListingPlanId;
  }) => Promise<{ emailVerified: boolean; verificationEmailSent: boolean }>;
  loginWithGoogle: () => Promise<void>;
  sendVerificationEmail: () => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  toggleFavorite: (listingId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeSubscriptionPlanId(value: unknown): UserProfile['activeSubscriptionPlanId'] {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'individual_seller' || normalized === 'dealer' || normalized === 'fleet_dealer') {
    return normalized as UserProfile['activeSubscriptionPlanId'];
  }
  return null;
}

function normalizeSubscriptionStatus(value: unknown): UserProfile['subscriptionStatus'] {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'active' || normalized === 'canceled' || normalized === 'past_due' || normalized === 'trialing' || normalized === 'pending') {
    return normalized as UserProfile['subscriptionStatus'];
  }
  return null;
}

function normalizeAccountAccessSource(value: unknown): AccountAccessSource | null {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'free_member' || normalized === 'pending_checkout' || normalized === 'subscription' || normalized === 'admin_override' || normalized === 'managed_account') {
    return normalized as AccountAccessSource;
  }
  return null;
}

function normalizeClaimNumber(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function deriveOnboardingIntent(
  role: UserProfile['role'],
  accessSource: AccountAccessSource | null,
  activeSubscriptionPlanId: UserProfile['activeSubscriptionPlanId'],
  currentOnboardingIntent?: UserProfile['onboardingIntent'] | null
): UserProfile['onboardingIntent'] {
  if (currentOnboardingIntent) return currentOnboardingIntent;
  if (activeSubscriptionPlanId) return activeSubscriptionPlanId;
  if (accessSource === 'pending_checkout' && role !== 'member') {
    return role === 'buyer' ? 'individual_seller' : 'free_member';
  }
  return role === 'member' ? 'free_member' : 'free_member';
}

async function resolveAuthAccessSnapshot(
  firebaseUser: FirebaseUser,
  current: UserProfile | null
): Promise<{
  role: UserProfile['role'];
  activeSubscriptionPlanId: UserProfile['activeSubscriptionPlanId'];
  subscriptionStatus: UserProfile['subscriptionStatus'];
  listingCap: number | null;
  managedAccountCap: number | null;
  accountAccessSource: AccountAccessSource | null;
}> {
  let resolvedRole = current?.role || 'member';
  let activeSubscriptionPlanId = normalizeSubscriptionPlanId(current?.activeSubscriptionPlanId);
  let subscriptionStatus = normalizeSubscriptionStatus(current?.subscriptionStatus);
  let listingCap = typeof current?.listingCap === 'number' ? current.listingCap : null;
  let managedAccountCap = typeof current?.managedAccountCap === 'number' ? current.managedAccountCap : null;
  let accountAccessSource = normalizeAccountAccessSource(current?.accountAccessSource);

  try {
    const tokenResult = await firebaseUser.getIdTokenResult();
    const rawClaimRole = String(tokenResult.claims.role || '').trim();
    if (rawClaimRole) {
      resolvedRole = userService.normalizeRole(rawClaimRole);
    }
    activeSubscriptionPlanId = activeSubscriptionPlanId ?? normalizeSubscriptionPlanId(tokenResult.claims.subscriptionPlanId);
    subscriptionStatus = subscriptionStatus ?? normalizeSubscriptionStatus(tokenResult.claims.subscriptionStatus);
    listingCap = listingCap ?? normalizeClaimNumber(tokenResult.claims.listingCap);
    managedAccountCap = managedAccountCap ?? normalizeClaimNumber(tokenResult.claims.managedAccountCap);
    accountAccessSource = accountAccessSource ?? normalizeAccountAccessSource(tokenResult.claims.accountAccessSource);
  } catch (error) {
    console.error('Unable to resolve auth role claims during profile fallback:', error);
  }

  const normalizedEmail = (firebaseUser.email || '').trim().toLowerCase();
  if (normalizedEmail && ADMIN_EMAILS.includes(normalizedEmail)) {
    resolvedRole = 'super_admin';
    accountAccessSource = accountAccessSource || 'admin_override';
  }

  if (!accountAccessSource) {
    if (activeSubscriptionPlanId) {
      accountAccessSource = 'subscription';
    } else if (current?.parentAccountUid && ['individual_seller', 'dealer', 'pro_dealer'].includes(resolvedRole)) {
      accountAccessSource = 'managed_account';
    } else if (resolvedRole === 'member') {
      accountAccessSource = 'free_member';
    }
  }

  return {
    role: resolvedRole,
    activeSubscriptionPlanId,
    subscriptionStatus,
    listingCap,
    managedAccountCap,
    accountAccessSource,
  };
}

async function buildFallbackProfile(
  firebaseUser: FirebaseUser,
  current: UserProfile | null
): Promise<UserProfile> {
  const accessSnapshot = await resolveAuthAccessSnapshot(firebaseUser, current);
  const role = accessSnapshot.role;
  const accountAccessSource = accessSnapshot.accountAccessSource;
  const activeSubscriptionPlanId = current?.activeSubscriptionPlanId ?? accessSnapshot.activeSubscriptionPlanId ?? null;
  const subscriptionStatus = current?.subscriptionStatus ?? accessSnapshot.subscriptionStatus ?? (accountAccessSource === 'pending_checkout' ? 'pending' : null);
  const listingCap = current?.listingCap ?? accessSnapshot.listingCap ?? 0;
  const managedAccountCap = current?.managedAccountCap ?? accessSnapshot.managedAccountCap ?? 0;

  return {
    uid: firebaseUser.uid,
    displayName: current?.displayName || firebaseUser.displayName || 'Anonymous User',
    email: firebaseUser.email || current?.email || '',
    role,
    photoURL: firebaseUser.photoURL || current?.photoURL || '',
    coverPhotoUrl: current?.coverPhotoUrl || '',
    company: current?.company || '',
    phoneNumber: current?.phoneNumber || '',
    website: current?.website || '',
    about: current?.about || '',
    bio: current?.bio || '',
    location: current?.location || '',
    accountStatus: current?.accountStatus || (accountAccessSource === 'pending_checkout' ? 'pending' : 'active'),
    accountAccessSource,
    onboardingIntent: deriveOnboardingIntent(role, accountAccessSource, activeSubscriptionPlanId, current?.onboardingIntent),
    activeSubscriptionPlanId,
    subscriptionStatus,
    listingCap,
    managedAccountCap,
    currentSubscriptionId: current?.currentSubscriptionId || null,
    currentPeriodEnd: current?.currentPeriodEnd || null,
    favorites: Array.isArray(current?.favorites) ? current.favorites : [],
    emailVerified: firebaseUser.emailVerified,
    createdAt: current?.createdAt || new Date().toISOString(),
  };
}

async function bootstrapPrivilegedAdminProfile(firebaseUser: FirebaseUser | null | undefined): Promise<boolean> {
  const currentUser = firebaseUser || auth.currentUser;
  const normalizedEmail = (currentUser?.email || '').trim().toLowerCase();
  if (!currentUser || !normalizedEmail || !ADMIN_EMAILS.includes(normalizedEmail)) {
    return false;
  }

  try {
    const token = await currentUser.getIdToken(true);
    const response = await fetch('/api/auth/bootstrap-profile-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Privileged role bootstrap failed:', error);
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const normalizeProfile = (profile: UserProfile): UserProfile => ({
    ...profile,
    favorites: Array.isArray(profile.favorites) ? profile.favorites : [],
  });

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let authStateVersion = 0;

    const unsubscribeAuth = onIdTokenChanged(auth, (firebaseUser) => {
      authStateVersion += 1;
      const currentVersion = authStateVersion;

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        setLoading(true);
        // User is signed in, subscribe to their profile in Firestore
        unsubscribeProfile = userService.subscribeToProfile(firebaseUser.uid, (profile, meta) => {
          void (async () => {
            if (currentVersion !== authStateVersion || auth.currentUser?.uid !== firebaseUser.uid) {
              return;
            }

            if (meta?.error) {
              const fallbackProfile = await buildFallbackProfile(firebaseUser, user);
              setUser(normalizeProfile(fallbackProfile));
              setLoading(false);
              return;
            }

            if (profile) {
              const mergedProfile = normalizeProfile({
                ...profile,
                displayName: profile.displayName || firebaseUser.displayName || 'Anonymous User',
                email: profile.email || firebaseUser.email || '',
                photoURL: firebaseUser.photoURL || profile.photoURL || '',
                emailVerified: firebaseUser.emailVerified,
              });

              if (profile.emailVerified !== firebaseUser.emailVerified) {
                try {
                  await userService.updateProfile(firebaseUser.uid, { emailVerified: firebaseUser.emailVerified });
                } catch (_) {
                  // Non-blocking sync; continue with merged client state.
                }
              }

              // Auto-promote known admin emails to super admin role
              const normalizedEmail = (firebaseUser.email || '').trim().toLowerCase();
              if (normalizedEmail && ADMIN_EMAILS.includes(normalizedEmail) && mergedProfile.role !== 'super_admin') {
                try {
                  const promoted = await bootstrapPrivilegedAdminProfile(firebaseUser);
                  if (!promoted) {
                    await userService.updateProfile(firebaseUser.uid, { role: 'super_admin' });
                  }
                } catch (_) {
                  // Ignore update failure; still use email-based admin access
                }
                if (currentVersion !== authStateVersion || auth.currentUser?.uid !== firebaseUser.uid) {
                  return;
                }
                setUser({ ...mergedProfile, role: 'super_admin' });
              } else {
                setUser(mergedProfile);
              }
            } else if (meta?.exists === false) {
              // Create profile if it doesn't exist
              const newProfile: UserProfile = await buildFallbackProfile(firebaseUser, null);
              try {
                await userService.createProfile(newProfile);
                if (newProfile.role === 'super_admin') {
                  await bootstrapPrivilegedAdminProfile(firebaseUser);
                }
              } catch (_) {
                // Non-blocking; continue with local profile representation.
              }

              if (currentVersion !== authStateVersion || auth.currentUser?.uid !== firebaseUser.uid) {
                return;
              }

              setUser(normalizeProfile(newProfile));
            }

            if (currentVersion === authStateVersion && auth.currentUser?.uid === firebaseUser.uid) {
              setLoading(false);
            }
          })();
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      authStateVersion += 1;
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }
      unsubscribeAuth();
    };
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const sendVerificationEmailViaApi = async (firebaseUser?: FirebaseUser | null) => {
    const currentUser = firebaseUser || auth.currentUser;
    if (!currentUser?.email) return false;

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('SMTP verification email send failed:', error);
      return false;
    }
  };

  const register = async ({
    displayName,
    company,
    email,
    password,
    onboardingIntent = 'free_member',
  }: {
    displayName: string;
    company?: string;
    email: string;
    password: string;
    onboardingIntent?: 'free_member' | ListingPlanId;
  }) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    try {
      await updateFirebaseProfile(credential.user, { displayName });
    } catch (error) {
      // Auth account is already created; keep registration flow successful.
      console.error('Display name update warning after registration:', error);
    }

    const isAdmin = ADMIN_EMAILS.includes(email.trim().toLowerCase());
    const nextRole = isAdmin ? 'super_admin' : onboardingIntent === 'free_member' ? 'member' : 'buyer';
    const nextAccountStatus = isAdmin || onboardingIntent === 'free_member' ? 'active' : 'pending';
    const nextAccessSource: UserProfile['accountAccessSource'] = isAdmin
      ? 'admin_override'
      : onboardingIntent === 'free_member'
        ? 'free_member'
        : 'pending_checkout';

    const profile: UserProfile = {
      uid: credential.user.uid,
      displayName,
      email,
      role: nextRole,
      photoURL: credential.user.photoURL || '',
      company: company || '',
      accountStatus: nextAccountStatus,
      accountAccessSource: nextAccessSource,
      onboardingIntent,
      activeSubscriptionPlanId: null,
      subscriptionStatus: onboardingIntent === 'free_member' ? null : 'pending',
      listingCap: 0,
      managedAccountCap: 0,
      currentSubscriptionId: null,
      currentPeriodEnd: null,
      favorites: [],
      emailVerified: credential.user.emailVerified,
      createdAt: new Date().toISOString(),
    };

    try {
      await userService.createProfile(profile);
      if (isAdmin) {
        await bootstrapPrivilegedAdminProfile(credential.user);
      }
    } catch (error) {
      // Auth account already exists at this point; do not fail hard on profile write race.
      console.error('Profile creation warning after auth registration:', error);
    }

    let verificationEmailSent = false;

    if (!credential.user.emailVerified) {
      verificationEmailSent = await sendVerificationEmailViaApi(credential.user);

      try {
        await signOut(auth);
      } catch (error) {
        console.error('Sign out warning after registration:', error);
      }
    }

    return {
      emailVerified: credential.user.emailVerified,
      verificationEmailSent,
    };
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      const code = error?.code || '';
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth, provider);
        return;
      }
      throw error;
    }
  };

  const sendPasswordReset = async (email: string) => {
    // Use the canonical domain so Firebase's authorized-domain check passes
    const continueUrl = 'https://timberequip.com/login';
    try {
      await sendPasswordResetEmail(auth, email, { url: continueUrl });
    } catch (error: any) {
      const code = error?.code ?? '';
      if (code === 'auth/unauthorized-continue-uri' || code === 'auth/invalid-continue-uri') {
        // timberequip.com not yet in Firebase Auth authorized domains — fall back to default handler
        await sendPasswordResetEmail(auth, email);
        return;
      }
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    await signOut(auth);
  };

  const toggleFavorite = async (listingId: string) => {
    const uid = user?.uid || auth.currentUser?.uid;
    if (!uid) return;
    const favorites = Array.isArray(user?.favorites) ? user.favorites : [];
    const isFavorite = favorites.includes(listingId);
    await userService.toggleFavorite(uid, listingId, isFavorite);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, sendVerificationEmail: () => sendVerificationEmailViaApi(), sendPasswordReset, logout, isAuthenticated: !!user, toggleFavorite }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
