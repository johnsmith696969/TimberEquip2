import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
import { AccountBootstrapResponse, UserProfile } from '../types';
import { userService } from '../services/userService';
import { billingService, type ListingPlanId, type RefreshedAccountAccessSummary } from '../services/billingService';
import { resolveAccountEntitlement, withResolvedAccountEntitlement } from '../utils/accountEntitlement';
import { isPrivilegedAdminEmail } from '../utils/privilegedAdmin';

type AccountAccessSource = NonNullable<UserProfile['accountAccessSource']>;

interface AuthContextType {
  user: UserProfile | null;
  accountBootstrap: AccountBootstrapResponse | null;
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
  patchCurrentUserProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const USER_PROFILE_CACHE_PREFIX = 'fes:user-profile-cache:';

function getCachedProfileStorageKey(uid: string): string {
  return `${USER_PROFILE_CACHE_PREFIX}${uid}`;
}

function readCachedProfile(uid: string): Partial<UserProfile> | null {
  if (typeof window === 'undefined' || !uid) return null;

  try {
    const raw = window.localStorage.getItem(getCachedProfileStorageKey(uid));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writeCachedProfile(profile: Partial<UserProfile> | null | undefined) {
  if (typeof window === 'undefined' || !profile?.uid) return;

  try {
    window.localStorage.setItem(
      getCachedProfileStorageKey(profile.uid),
      JSON.stringify(profile)
    );
  } catch {
    // Best-effort only; quota fallback should not break auth flows.
  }
}

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

function normalizeAccountStatus(value: unknown): UserProfile['accountStatus'] | null {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'active' || normalized === 'pending' || normalized === 'suspended') {
    return normalized as UserProfile['accountStatus'];
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

function shouldRefreshBillingAccess(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false;

  const role = userService.normalizeRole(profile.role || '');
  const accessSource = normalizeAccountAccessSource(profile.accountAccessSource);
  const onboardingIntent = normalizeSubscriptionPlanId(profile.onboardingIntent);
  const activePlanId = normalizeSubscriptionPlanId(profile.activeSubscriptionPlanId);

  if (['super_admin', 'admin', 'developer', 'content_manager', 'editor'].includes(role)) {
    return false;
  }

  if (activePlanId && accessSource === 'subscription') {
    return false;
  }

  return ['individual_seller', 'dealer', 'pro_dealer'].includes(role) || !!onboardingIntent;
}

function applyBillingRefreshToProfile(
  baseProfile: UserProfile,
  refresh: RefreshedAccountAccessSummary
): UserProfile {
  const refreshedRole = refresh.role ? userService.normalizeRole(refresh.role) : baseProfile.role;
  const refreshedAccessSource = normalizeAccountAccessSource(refresh.accountAccessSource) ?? baseProfile.accountAccessSource ?? null;
  const refreshedPlanId = normalizeSubscriptionPlanId(refresh.planId) ?? baseProfile.activeSubscriptionPlanId ?? null;
  const refreshedAccountStatus = normalizeAccountStatus(refresh.accountStatus) ?? baseProfile.accountStatus ?? 'active';

  return {
    ...baseProfile,
    role: refreshedRole,
    activeSubscriptionPlanId: refreshedPlanId,
    subscriptionStatus: normalizeSubscriptionStatus(refresh.subscriptionStatus) ?? baseProfile.subscriptionStatus ?? null,
    listingCap: typeof refresh.listingCap === 'number' ? refresh.listingCap : baseProfile.listingCap,
    managedAccountCap: typeof refresh.managedAccountCap === 'number' ? refresh.managedAccountCap : baseProfile.managedAccountCap,
    currentSubscriptionId: refresh.currentSubscriptionId ?? baseProfile.currentSubscriptionId ?? null,
    currentPeriodEnd: refresh.currentPeriodEnd ?? baseProfile.currentPeriodEnd ?? null,
    accountAccessSource: refreshedAccessSource,
    accountStatus: refreshedAccountStatus,
    onboardingIntent: deriveOnboardingIntent(
      refreshedRole,
      refreshedAccessSource,
      refreshedPlanId,
      baseProfile.onboardingIntent
    ),
    entitlement: refresh.entitlement ?? resolveAccountEntitlement({
      ...baseProfile,
      role: refreshedRole,
      activeSubscriptionPlanId: refreshedPlanId,
      subscriptionStatus: normalizeSubscriptionStatus(refresh.subscriptionStatus) ?? baseProfile.subscriptionStatus ?? null,
      listingCap: typeof refresh.listingCap === 'number' ? refresh.listingCap : baseProfile.listingCap,
      managedAccountCap: typeof refresh.managedAccountCap === 'number' ? refresh.managedAccountCap : baseProfile.managedAccountCap,
      currentSubscriptionId: refresh.currentSubscriptionId ?? baseProfile.currentSubscriptionId ?? null,
      currentPeriodEnd: refresh.currentPeriodEnd ?? baseProfile.currentPeriodEnd ?? null,
      accountAccessSource: refreshedAccessSource,
      accountStatus: refreshedAccountStatus,
    }),
  };
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
  accountStatus: UserProfile['accountStatus'] | null;
}> {
  let resolvedRole = current?.role || 'member';
  let activeSubscriptionPlanId = normalizeSubscriptionPlanId(current?.activeSubscriptionPlanId);
  let subscriptionStatus = normalizeSubscriptionStatus(current?.subscriptionStatus);
  let listingCap = typeof current?.listingCap === 'number' ? current.listingCap : null;
  let managedAccountCap = typeof current?.managedAccountCap === 'number' ? current.managedAccountCap : null;
  let accountAccessSource = normalizeAccountAccessSource(current?.accountAccessSource);
  let accountStatus = current?.accountStatus || null;

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
    accountStatus = accountStatus ?? normalizeAccountStatus(tokenResult.claims.accountStatus);
  } catch (error) {
    console.error('Unable to resolve auth role claims during profile fallback:', error);
  }

  const normalizedEmail = (firebaseUser.email || '').trim().toLowerCase();
  if (isPrivilegedAdminEmail(normalizedEmail)) {
    resolvedRole = 'super_admin';
    accountAccessSource = accountAccessSource || 'admin_override';
  }

  if (!accountAccessSource) {
    if (activeSubscriptionPlanId) {
      accountAccessSource = 'subscription';
    } else if (current?.parentAccountUid && ['member', 'buyer'].includes(resolvedRole)) {
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
    accountStatus,
  };
}

async function buildFallbackProfile(
  firebaseUser: FirebaseUser,
  current: UserProfile | null
): Promise<UserProfile> {
  const cachedProfile = readCachedProfile(firebaseUser.uid);
  const accessSnapshot = await resolveAuthAccessSnapshot(firebaseUser, current);
  const role = accessSnapshot.role;
  const accountAccessSource = accessSnapshot.accountAccessSource;
  const mergedCurrent = {
    ...(cachedProfile || {}),
    ...(current || {}),
  } as Partial<UserProfile>;
  const activeSubscriptionPlanId = mergedCurrent.activeSubscriptionPlanId ?? accessSnapshot.activeSubscriptionPlanId ?? null;
  const subscriptionStatus = mergedCurrent.subscriptionStatus ?? accessSnapshot.subscriptionStatus ?? (accountAccessSource === 'pending_checkout' ? 'pending' : null);
  const listingCap = mergedCurrent.listingCap ?? accessSnapshot.listingCap ?? 0;
  const managedAccountCap = mergedCurrent.managedAccountCap ?? accessSnapshot.managedAccountCap ?? 0;
  const accountStatus = mergedCurrent.accountStatus ?? accessSnapshot.accountStatus ?? (accountAccessSource === 'pending_checkout' ? 'pending' : 'active');

  return {
    uid: firebaseUser.uid,
    displayName: mergedCurrent.displayName || firebaseUser.displayName || 'Anonymous User',
    email: firebaseUser.email || mergedCurrent.email || '',
    role,
    photoURL: firebaseUser.photoURL || mergedCurrent.photoURL || '',
    coverPhotoUrl: mergedCurrent.coverPhotoUrl || '',
    company: mergedCurrent.company || '',
    phoneNumber: mergedCurrent.phoneNumber || '',
    website: mergedCurrent.website || '',
    about: mergedCurrent.about || '',
    bio: mergedCurrent.bio || '',
    location: mergedCurrent.location || '',
    accountStatus,
    accountAccessSource,
    onboardingIntent: deriveOnboardingIntent(role, accountAccessSource, activeSubscriptionPlanId, mergedCurrent.onboardingIntent),
    activeSubscriptionPlanId,
    subscriptionStatus,
    listingCap,
    managedAccountCap,
    currentSubscriptionId: mergedCurrent.currentSubscriptionId || null,
    currentPeriodEnd: mergedCurrent.currentPeriodEnd || null,
    favorites: Array.isArray(mergedCurrent.favorites) ? mergedCurrent.favorites : [],
    emailVerified: firebaseUser.emailVerified,
    preferredLanguage: mergedCurrent.preferredLanguage,
    preferredCurrency: mergedCurrent.preferredCurrency,
    emailNotificationsEnabled: mergedCurrent.emailNotificationsEnabled,
    storefrontSlug: mergedCurrent.storefrontSlug,
    storefrontName: mergedCurrent.storefrontName,
    storefrontTagline: mergedCurrent.storefrontTagline,
    storefrontDescription: mergedCurrent.storefrontDescription,
    seoTitle: mergedCurrent.seoTitle,
    seoDescription: mergedCurrent.seoDescription,
    seoKeywords: Array.isArray(mergedCurrent.seoKeywords) ? mergedCurrent.seoKeywords : [],
    createdAt: mergedCurrent.createdAt || new Date().toISOString(),
    entitlement: resolveAccountEntitlement({
      ...(mergedCurrent || {}),
      role,
      accountStatus,
      accountAccessSource,
      activeSubscriptionPlanId,
      subscriptionStatus,
      listingCap,
      managedAccountCap,
      currentSubscriptionId: mergedCurrent.currentSubscriptionId || null,
      currentPeriodEnd: mergedCurrent.currentPeriodEnd || null,
    }),
  };
}

async function bootstrapPrivilegedAdminProfile(firebaseUser: FirebaseUser | null | undefined): Promise<boolean> {
  const currentUser = firebaseUser || auth.currentUser;
  const normalizedEmail = (currentUser?.email || '').trim().toLowerCase();
  if (!currentUser || !isPrivilegedAdminEmail(normalizedEmail)) {
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
  const [accountBootstrap, setAccountBootstrap] = useState<AccountBootstrapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const billingRefreshAttemptsRef = useRef<Set<string>>(new Set());
  const currentUserRef = useRef<UserProfile | null>(null);

  const normalizeProfile = (profile: UserProfile): UserProfile => withResolvedAccountEntitlement({
    ...profile,
    favorites: Array.isArray(profile.favorites) ? profile.favorites : [],
  });

  const applyPatchedCurrentUserProfile = (updates: Partial<UserProfile>) => {
    let nextUserSnapshot: UserProfile | null = null;
    setUser((currentUser) => {
      if (!currentUser) return currentUser;
      nextUserSnapshot = normalizeProfile({
        ...currentUser,
        ...updates,
      });
      return nextUserSnapshot;
    });

    if (nextUserSnapshot) {
      writeCachedProfile(nextUserSnapshot);
      setAccountBootstrap((currentBootstrap) => (
        currentBootstrap
          ? {
              ...currentBootstrap,
              profile: nextUserSnapshot,
              fetchedAt: new Date().toISOString(),
            }
          : currentBootstrap
      ));
    }
  };

  useEffect(() => {
    currentUserRef.current = user;
  }, [user]);

  useEffect(() => {
    let authStateVersion = 0;

    const unsubscribeAuth = onIdTokenChanged(auth, (firebaseUser) => {
      authStateVersion += 1;
      const currentVersion = authStateVersion;

      if (firebaseUser) {
        const existingUser = currentUserRef.current;
        const shouldBlockRender = !existingUser || existingUser.uid !== firebaseUser.uid;
        if (shouldBlockRender) {
          setLoading(true);
        }
        void (async () => {
          const isStaleSession = () => currentVersion !== authStateVersion || auth.currentUser?.uid !== firebaseUser.uid;
          const cachedBootstrap = userService.getCachedAccountBootstrap();
          const cachedBootstrapForCurrentUser =
            cachedBootstrap?.profile?.uid === firebaseUser.uid ? cachedBootstrap : null;
          let initialRenderReleased = !shouldBlockRender;

          const releaseInitialRender = () => {
            if (!shouldBlockRender || initialRenderReleased || isStaleSession()) return;
            initialRenderReleased = true;
            setLoading(false);
          };

          const persistResolvedProfile = (nextProfile: UserProfile, bootstrapPayload?: AccountBootstrapResponse | null) => {
            if (isStaleSession()) return;
            const normalizedProfile = normalizeProfile(nextProfile);
            writeCachedProfile(normalizedProfile);
            currentUserRef.current = normalizedProfile;
            setUser(normalizedProfile);
            setAccountBootstrap((currentBootstrap) => {
              if (bootstrapPayload) {
                return {
                  ...bootstrapPayload,
                  profile: normalizedProfile,
                };
              }

              return currentBootstrap
                ? {
                    ...currentBootstrap,
                    profile: normalizedProfile,
                    fetchedAt: new Date().toISOString(),
                  }
                : currentBootstrap;
            });
          };

          const scheduleBillingRefresh = (baseProfile: UserProfile, suffix = '') => {
            const billingRefreshKey = `${firebaseUser.uid}:${currentVersion}${suffix}`;
            if (!shouldRefreshBillingAccess(baseProfile) || billingRefreshAttemptsRef.current.has(billingRefreshKey)) {
              return;
            }

            billingRefreshAttemptsRef.current.add(billingRefreshKey);
            void (async () => {
              try {
                const refreshedAccess = await billingService.refreshAccountAccess();
                if (isStaleSession()) {
                  return;
                }

                let nextUserSnapshot: UserProfile | null = null;
                setUser((currentUser) => {
                  const resolvedBaseProfile = currentUser && currentUser.uid === firebaseUser.uid
                    ? currentUser
                    : baseProfile;
                  nextUserSnapshot = normalizeProfile(applyBillingRefreshToProfile(resolvedBaseProfile, refreshedAccess));
                  return nextUserSnapshot;
                });

                if (nextUserSnapshot) {
                  writeCachedProfile(nextUserSnapshot);
                  currentUserRef.current = nextUserSnapshot;
                  setAccountBootstrap((currentBootstrap) => (
                    currentBootstrap
                      ? {
                          ...currentBootstrap,
                          profile: nextUserSnapshot,
                          fetchedAt: new Date().toISOString(),
                        }
                      : currentBootstrap
                  ));
                }
              } catch (error) {
                console.error('Unable to refresh billing access from Stripe:', error);
              }
            })();
          };

          try {
            if (shouldBlockRender) {
              const provisionalProfile = cachedBootstrapForCurrentUser?.profile
                ? normalizeProfile({
                    ...cachedBootstrapForCurrentUser.profile,
                    displayName:
                      cachedBootstrapForCurrentUser.profile.displayName ||
                      firebaseUser.displayName ||
                      'Anonymous User',
                    email: cachedBootstrapForCurrentUser.profile.email || firebaseUser.email || '',
                    photoURL: firebaseUser.photoURL || cachedBootstrapForCurrentUser.profile.photoURL || '',
                    emailVerified: firebaseUser.emailVerified,
                  })
                : await buildFallbackProfile(firebaseUser, currentUserRef.current);

              if (isStaleSession()) {
                return;
              }

              persistResolvedProfile(provisionalProfile, cachedBootstrapForCurrentUser);
              releaseInitialRender();
            }

            const profileResponse = await userService.getAccountBootstrap();
            if (isStaleSession()) {
              return;
            }

            let resolvedProfile = profileResponse.profile
              ? normalizeProfile({
                  ...profileResponse.profile,
                  displayName: profileResponse.profile.displayName || firebaseUser.displayName || 'Anonymous User',
                  email: profileResponse.profile.email || firebaseUser.email || '',
                  photoURL: firebaseUser.photoURL || profileResponse.profile.photoURL || '',
                  emailVerified: firebaseUser.emailVerified,
                })
              : await buildFallbackProfile(firebaseUser, currentUserRef.current);

            const accessSnapshot = await resolveAuthAccessSnapshot(firebaseUser, resolvedProfile);
            const effectiveAccessSource = accessSnapshot.accountAccessSource ?? resolvedProfile.accountAccessSource ?? null;
            const effectivePlanId = accessSnapshot.activeSubscriptionPlanId ?? resolvedProfile.activeSubscriptionPlanId ?? null;
            const effectiveRole = accessSnapshot.role || resolvedProfile.role;
            const effectiveAccountStatus = accessSnapshot.accountStatus ?? resolvedProfile.accountStatus ?? 'active';

            resolvedProfile = normalizeProfile({
              ...resolvedProfile,
              role: effectiveRole,
              activeSubscriptionPlanId: effectivePlanId,
              subscriptionStatus: accessSnapshot.subscriptionStatus ?? resolvedProfile.subscriptionStatus ?? null,
              listingCap: accessSnapshot.listingCap ?? resolvedProfile.listingCap ?? 0,
              managedAccountCap: accessSnapshot.managedAccountCap ?? resolvedProfile.managedAccountCap ?? 0,
              accountAccessSource: effectiveAccessSource,
              accountStatus: effectiveAccountStatus,
              onboardingIntent: deriveOnboardingIntent(
                effectiveRole,
                effectiveAccessSource,
                effectivePlanId,
                resolvedProfile.onboardingIntent
              ),
            });

            const normalizedEmail = (firebaseUser.email || '').trim().toLowerCase();
            if (isPrivilegedAdminEmail(normalizedEmail) && resolvedProfile.role !== 'super_admin') {
              try {
                const promoted = await bootstrapPrivilegedAdminProfile(firebaseUser);
                if (!promoted) {
                  await userService.updateProfile(firebaseUser.uid, { role: 'super_admin' });
                }
              } catch (_) {
                // Ignore update failure; still use email-based admin access.
              }

              if (isStaleSession()) {
                return;
              }

              resolvedProfile = normalizeProfile({ ...resolvedProfile, role: 'super_admin' });
            }

            persistResolvedProfile(resolvedProfile, profileResponse);

            if (profileResponse.profileDocExists === false && !profileResponse.firestoreQuotaLimited) {
              try {
                await userService.createProfile(resolvedProfile);
                if (resolvedProfile.role === 'super_admin') {
                  await bootstrapPrivilegedAdminProfile(firebaseUser);
                }
              } catch (_) {
                // Non-blocking; continue with normalized auth-backed profile.
              }
            }

            scheduleBillingRefresh(resolvedProfile, profileResponse.profile ? '' : ':fallback');
          } catch (error) {
            console.error('Unable to bootstrap profile via account API:', error);
            if (shouldBlockRender && !currentUserRef.current) {
              const fallbackProfile = await buildFallbackProfile(firebaseUser, currentUserRef.current);
              if (isStaleSession()) {
                return;
              }

              persistResolvedProfile(fallbackProfile, cachedBootstrapForCurrentUser);
            }
            const latestProfile = currentUserRef.current;
            if (latestProfile) {
              scheduleBillingRefresh(latestProfile, ':fallback');
            }
          } finally {
            releaseInitialRender();
          }
        })();
      } else {
        billingRefreshAttemptsRef.current.clear();
        currentUserRef.current = null;
        setUser(null);
        setAccountBootstrap(null);
        setLoading(false);
      }
    });

    return () => {
      authStateVersion += 1;
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

    const isAdmin = isPrivilegedAdminEmail(email);
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
    const normalizedEmail = email.trim().toLowerCase();
    const response = await fetch('/api/auth/password-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: normalizedEmail }),
    });

    if (response.ok) {
      return;
    }

    let payload: { error?: string; code?: string } | null = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    const resetError = new Error(payload?.error || 'Failed to send reset email. Please try again.');
    (resetError as Error & { code?: string }).code = payload?.code || '';
    throw resetError;

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
    setAccountBootstrap(null);
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
    <AuthContext.Provider value={{ user, accountBootstrap, login, register, loginWithGoogle, sendVerificationEmail: () => sendVerificationEmailViaApi(), sendPasswordReset, logout, isAuthenticated: !!user, toggleFavorite, patchCurrentUserProfile: applyPatchedCurrentUserProfile }}>
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
