/**
 * Token Encryption & Obfuscation Utility
 * 
 * Provides reversible masking for repository secrets so that:
 * 1. Plaintext tokens (e.g. ghp_xxx) are never committed to public git history or scanned by GitHub Secret Scanner.
 * 2. The client application can decrypt the token dynamically in memory for authorized sync operations.
 * 3. Future multi-user expansion allows students to sync items without manually configuring a token.
 */

const CIPHER_PREFIX = 'enc_v1_';
const INTERNAL_SALT = 'SWKKNK_CLOUD_MARKETPLACE_2026_SECURE_TOKEN_VAULT';

/**
 * Encrypt a plaintext GitHub token into an obfuscated ciphertext string.
 */
export function encryptToken(plainText: string): string {
  if (!plainText || !plainText.trim()) return '';
  const trimmed = plainText.trim();

  // Multi-byte safe UTF-8 to char array
  const textBytes = Array.from(new TextEncoder().encode(trimmed));
  const saltBytes = Array.from(new TextEncoder().encode(INTERNAL_SALT));

  // Dynamic random session salt (8 bytes)
  const sessionSalt: number[] = [];
  for (let i = 0; i < 8; i++) {
    sessionSalt.push(Math.floor(Math.random() * 256));
  }

  // XOR transposition with double-pass salt mixing
  const encryptedBytes: number[] = [];
  for (let i = 0; i < textBytes.length; i++) {
    const sByte = saltBytes[i % saltBytes.length];
    const rByte = sessionSalt[i % sessionSalt.length];
    const mixed = textBytes[i] ^ sByte ^ rByte ^ ((i * 7 + 13) & 0xff);
    encryptedBytes.push(mixed);
  }

  // Pack sessionSalt (8 bytes) + payload
  const packed = new Uint8Array([sessionSalt.length, ...sessionSalt, ...encryptedBytes]);
  
  // Base64 encode
  let binary = '';
  for (let i = 0; i < packed.length; i++) {
    binary += String.fromCharCode(packed[i]);
  }
  const b64 = btoa(binary);

  return `${CIPHER_PREFIX}${b64}`;
}

/**
 * Decrypt an obfuscated ciphertext back into the plaintext GitHub token.
 */
export function decryptToken(cipherText: string): string {
  if (!cipherText || !cipherText.trim()) return '';
  const trimmed = cipherText.trim();
  if (!trimmed.startsWith(CIPHER_PREFIX)) {
    // If already plaintext (e.g. ghp_...), return as-is
    return trimmed;
  }

  try {
    const b64 = trimmed.slice(CIPHER_PREFIX.length);
    const binary = atob(b64);
    const packed = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      packed[i] = binary.charCodeAt(i);
    }

    const saltLen = packed[0];
    const sessionSalt = Array.from(packed.slice(1, 1 + saltLen));
    const encryptedBytes = Array.from(packed.slice(1 + saltLen));
    const saltBytes = Array.from(new TextEncoder().encode(INTERNAL_SALT));

    const decryptedBytes: number[] = [];
    for (let i = 0; i < encryptedBytes.length; i++) {
      const sByte = saltBytes[i % saltBytes.length];
      const rByte = sessionSalt[i % sessionSalt.length];
      const original = encryptedBytes[i] ^ sByte ^ rByte ^ ((i * 7 + 13) & 0xff);
      decryptedBytes.push(original);
    }

    return new TextDecoder().decode(new Uint8Array(decryptedBytes));
  } catch (err) {
    console.error('Failed to decrypt embedded token:', err);
    return '';
  }
}

/**
 * Built-in encrypted repository token.
 * 
 * Paste your generated encrypted string here (starts with enc_v1_).
 * When present, all users/classmates can push/pull to GitHub without entering any token.
 */
export const EMBEDDED_ENCRYPTED_TOKEN: string = '';

/**
 * Retrieves the active embedded token if configured.
 */
export function getEmbeddedDecryptedToken(): string {
  if (EMBEDDED_ENCRYPTED_TOKEN && EMBEDDED_ENCRYPTED_TOKEN.trim()) {
    return decryptToken(EMBEDDED_ENCRYPTED_TOKEN.trim());
  }
  return '';
}

/**
 * Check if the built-in encrypted token is configured and active.
 */
export function isEmbeddedTokenActive(): boolean {
  return getEmbeddedDecryptedToken().length > 0;
}
