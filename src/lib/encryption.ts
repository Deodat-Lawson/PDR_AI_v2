import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const TAG_LENGTH = 16; // 128-bit auth tag

/**
 * Derives a 32-byte key from the ENCRYPTION_KEY env var.
 * If the env var is already 64 hex chars (32 bytes) it is used directly,
 * otherwise it is zero-padded / truncated to 32 bytes.
 */
function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  // If it looks like a 64-char hex string, decode it
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }

  // Otherwise use raw bytes, padded/truncated to 32
  const buf = Buffer.alloc(32);
  Buffer.from(raw, "utf8").copy(buf);
  return buf;
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a single base64 string containing iv + authTag + ciphertext.
 */
export function encryptValue(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Pack: iv (12) + tag (16) + ciphertext
  const packed = Buffer.concat([iv, tag, encrypted]);
  return packed.toString("base64");
}

/**
 * Decrypt a value that was encrypted with `encryptValue`.
 */
export function decryptValue(ciphertext: string): string {
  const key = getKey();
  const packed = Buffer.from(ciphertext, "base64");

  const iv = packed.subarray(0, IV_LENGTH);
  const tag = packed.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = packed.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/**
 * Mask a decrypted key for safe display.
 * Shows the first 4 and last 4 characters, replacing the middle with asterisks.
 * For short keys (<=10 chars) shows only the first 2 and last 2.
 */
export function maskValue(value: string): string {
  if (value.length <= 8) {
    return value.slice(0, 2) + "****" + value.slice(-2);
  }
  return value.slice(0, 4) + "****" + value.slice(-4);
}

