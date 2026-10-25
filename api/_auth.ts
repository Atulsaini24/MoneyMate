import { createRemoteJWKSet, jwtVerify } from 'jose';

/**
 * Verifies a Firebase ID token without needing a service-account key.
 * Firebase signs ID tokens with Google's public keys, so we check the
 * signature, issuer and audience against the project id.
 */
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

export class AuthError extends Error {}

export interface VerifiedUser {
  uid: string;
  email?: string;
  name?: string;
}

export async function verifyRequest(authorization: string | undefined | null): Promise<VerifiedUser> {
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID is not configured on the server.');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
  if (!token) throw new AuthError('Missing sign-in token.');

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    if (!payload.sub) throw new AuthError('Token has no subject.');
    return {
      uid: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      name: typeof payload.name === 'string' ? payload.name : undefined,
    };
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new AuthError('Sign-in token is invalid or expired.');
  }
}
