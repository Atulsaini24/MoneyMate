/**
 * Optional end-to-end encryption. The key is derived from a passphrase in the
 * browser (PBKDF2, 310k iterations) and never leaves the device. The server only
 * ever stores { iv, data } it cannot read. A forgotten passphrase cannot be recovered.
 */
export interface EncryptedBlob { v: 1; iv: string; data: string }

const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf as ArrayBuffer)));
const unb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const SESSION_KEY = 'moneymate:session-key';

export function newSalt() { return b64(crypto.getRandomValues(new Uint8Array(16))); }

export async function deriveKey(passphrase: string, salt: string): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: unb64(salt), iterations: 310_000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
  );
}

export async function encryptJson(key: CryptoKey, value: unknown): Promise<EncryptedBlob> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(value)));
  return { v: 1, iv: b64(iv), data: b64(data) };
}

export async function decryptJson<T>(key: CryptoKey, blob: EncryptedBlob): Promise<T> {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(blob.iv) }, key, unb64(blob.data));
  return JSON.parse(dec.decode(plain));
}

/** A small encrypted marker used to check a passphrase without decrypting the whole ledger. */
export async function makeVerifier(key: CryptoKey) { return JSON.stringify(await encryptJson(key, 'moneymate-ok')); }
export async function checkVerifier(key: CryptoKey, verifier: string) {
  try { return (await decryptJson<string>(key, JSON.parse(verifier))) === 'moneymate-ok'; } catch { return false; }
}

/** Keep the key for this browser tab only, so a reload doesn't ask again. */
export async function rememberKey(key: CryptoKey | null) {
  try {
    if (!key) return sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.setItem(SESSION_KEY, b64(await crypto.subtle.exportKey('raw', key)));
  } catch { /* private mode */ }
}
export async function recallKey(): Promise<CryptoKey | null> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? crypto.subtle.importKey('raw', unb64(raw), 'AES-GCM', true, ['encrypt', 'decrypt']) : null;
  } catch { return null; }
}
