import {
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  getMultiFactorResolver,
  multiFactor,
  type MultiFactorInfo,
  type MultiFactorResolver,
  type User as FirebaseUser,
  type UserCredential,
} from 'firebase/auth';
import { auth } from '../firebase';

export interface SmsMfaFactorSummary {
  uid: string;
  displayName: string;
  phoneNumber: string;
  enrollmentTime: string;
}

function normalizeFactorString(value: unknown): string {
  return String(value || '').trim();
}

function toSmsFactorSummary(factor: MultiFactorInfo): SmsMfaFactorSummary | null {
  if (factor.factorId !== PhoneMultiFactorGenerator.FACTOR_ID) {
    return null;
  }

  const phoneFactor = factor as MultiFactorInfo & { phoneNumber?: unknown };
  return {
    uid: normalizeFactorString(factor.uid),
    displayName: normalizeFactorString(factor.displayName),
    phoneNumber: normalizeFactorString(phoneFactor.phoneNumber),
    enrollmentTime: normalizeFactorString(factor.enrollmentTime),
  };
}

export function createVisibleRecaptchaVerifier(containerId: string): RecaptchaVerifier {
  return new RecaptchaVerifier(auth, containerId, {
    size: 'normal',
  });
}

export function resetRecaptchaVerifier(verifier: RecaptchaVerifier | null | undefined): void {
  if (!verifier) return;
  verifier.clear();
}

export function listSmsMfaFactors(user: FirebaseUser | null | undefined): SmsMfaFactorSummary[] {
  if (!user) return [];

  return multiFactor(user).enrolledFactors
    .map((factor) => toSmsFactorSummary(factor))
    .filter((factor): factor is SmsMfaFactorSummary => Boolean(factor));
}

export function getSmsMultiFactorResolver(error: unknown): MultiFactorResolver {
  return getMultiFactorResolver(auth, error as Parameters<typeof getMultiFactorResolver>[1]);
}

export function getPreferredSmsMfaFactor(
  resolver: MultiFactorResolver,
  factorUid?: string | null
): SmsMfaFactorSummary | null {
  const factor = resolver.hints.find(
    (hint) => hint.factorId === PhoneMultiFactorGenerator.FACTOR_ID && (!factorUid || hint.uid === factorUid)
  );

  return factor ? toSmsFactorSummary(factor) : null;
}

export async function startSmsMfaEnrollment(
  user: FirebaseUser,
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<string> {
  const session = await multiFactor(user).getSession();
  const phoneAuthProvider = new PhoneAuthProvider(auth);

  return phoneAuthProvider.verifyPhoneNumber(
    {
      phoneNumber,
      session,
    },
    verifier
  );
}

export async function completeSmsMfaEnrollment(
  user: FirebaseUser,
  verificationId: string,
  verificationCode: string,
  displayName?: string
): Promise<SmsMfaFactorSummary[]> {
  const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
  const assertion = PhoneMultiFactorGenerator.assertion(credential);
  await multiFactor(user).enroll(assertion, displayName || undefined);
  await user.getIdToken(true);
  return listSmsMfaFactors(auth.currentUser || user);
}

export async function startSmsMfaSignIn(
  resolver: MultiFactorResolver,
  factorUid: string | null | undefined,
  verifier: RecaptchaVerifier
): Promise<{ verificationId: string; factor: SmsMfaFactorSummary }> {
  const preferredFactor = resolver.hints.find(
    (hint) => hint.factorId === PhoneMultiFactorGenerator.FACTOR_ID && (!factorUid || hint.uid === factorUid)
  );

  const factor = preferredFactor ? toSmsFactorSummary(preferredFactor) : null;
  if (!preferredFactor || !factor) {
    throw new Error('This account does not have an SMS multi-factor method available.');
  }

  const phoneAuthProvider = new PhoneAuthProvider(auth);
  const verificationId = await phoneAuthProvider.verifyPhoneNumber(
    {
      multiFactorHint: preferredFactor,
      session: resolver.session,
    },
    verifier
  );

  return {
    verificationId,
    factor,
  };
}

export async function completeSmsMfaSignIn(
  resolver: MultiFactorResolver,
  verificationId: string,
  verificationCode: string
): Promise<UserCredential> {
  const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
  const assertion = PhoneMultiFactorGenerator.assertion(credential);
  return resolver.resolveSignIn(assertion);
}

export async function unenrollSmsMfaFactor(
  user: FirebaseUser,
  factorUid: string
): Promise<SmsMfaFactorSummary[]> {
  await multiFactor(user).unenroll(factorUid);
  await user.getIdToken(true);
  return listSmsMfaFactors(auth.currentUser || user);
}
