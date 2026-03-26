import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
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

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
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
              const isAdmin = ADMIN_EMAILS.includes((firebaseUser.email || '').trim().toLowerCase());
              setUser((current) => normalizeProfile({
                uid: firebaseUser.uid,
                displayName: current?.displayName || firebaseUser.displayName || 'Anonymous User',
                email: firebaseUser.email || current?.email || '',
                role: (current?.role || (isAdmin ? 'super_admin' : 'member')) as UserProfile['role'],
                photoURL: firebaseUser.photoURL || current?.photoURL || '',
                coverPhotoUrl: current?.coverPhotoUrl || '',
                company: current?.company || '',
                phoneNumber: current?.phoneNumber || '',
                website: current?.website || '',
                about: current?.about || '',
                bio: current?.bio || '',
                location: current?.location || '',
                accountStatus: current?.accountStatus || 'active',
                onboardingIntent: current?.onboardingIntent || 'free_member',
                activeSubscriptionPlanId: current?.activeSubscriptionPlanId || null,
                subscriptionStatus: current?.subscriptionStatus || null,
                listingCap: current?.listingCap || 0,
                managedAccountCap: current?.managedAccountCap || 0,
                currentSubscriptionId: current?.currentSubscriptionId || null,
                currentPeriodEnd: current?.currentPeriodEnd || null,
                favorites: Array.isArray(current?.favorites) ? current.favorites : [],
                emailVerified: firebaseUser.emailVerified,
                createdAt: current?.createdAt || new Date().toISOString(),
              }));
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
              const isAdmin = ADMIN_EMAILS.includes((firebaseUser.email || '').trim().toLowerCase());
              const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName || 'Anonymous User',
                email: firebaseUser.email || '',
                role: isAdmin ? 'super_admin' : 'member',
                photoURL: firebaseUser.photoURL || '',
                accountStatus: 'active',
                onboardingIntent: isAdmin ? 'free_member' : 'free_member',
                activeSubscriptionPlanId: null,
                subscriptionStatus: null,
                listingCap: 0,
                managedAccountCap: 0,
                currentSubscriptionId: null,
                currentPeriodEnd: null,
                favorites: [],
                emailVerified: firebaseUser.emailVerified,
                createdAt: new Date().toISOString() // Will be replaced by serverTimestamp in service
              };
              try {
                await userService.createProfile(newProfile);
                if (isAdmin) {
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

    const profile: UserProfile = {
      uid: credential.user.uid,
      displayName,
      email,
      role: nextRole,
      photoURL: credential.user.photoURL || '',
      company: company || '',
      accountStatus: nextAccountStatus,
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
