// src/lib/cryptoUtils.ts
'use client';

// IMPORTANT: This is a hardcoded secret for demo purposes.
// In a real application, this secret should be managed much more securely
// and ideally not be hardcoded in client-side JavaScript.
const ENCRYPTION_SECRET = "your-super-secret-and-long-encryption-key-for-magic-slate"; // Replace with a strong, unique key

async function getKeyMaterial(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyData = enc.encode(secret);
  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
}

async function deriveEncryptionKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await getKeyMaterial(secret);
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(data: string): Promise<{ encryptedHex: string; ivHex: string; saltHex: string } | null> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    console.error('SubtleCrypto not available');
    return null;
  }
  try {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveEncryptionKey(ENCRYPTION_SECRET, salt);

    const enc = new TextEncoder();
    const encodedData = enc.encode(data);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encodedData
    );

    const encryptedHex = Array.from(new Uint8Array(encryptedBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');

    return { encryptedHex, ivHex, saltHex };
  } catch (error) {
    console.error("Encryption failed:", error);
    return null;
  }
}

function hexToUint8Array(hexString: string): Uint8Array {
  if (hexString.length % 2 !== 0) {
    throw new Error("Invalid hexString");
  }
  const arrayBuffer = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    arrayBuffer[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
  }
  return arrayBuffer;
}

export async function decryptData(encryptedHex: string, ivHex: string, saltHex: string): Promise<string | null> {
   if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    console.error('SubtleCrypto not available');
    return null;
  }
  try {
    const salt = hexToUint8Array(saltHex);
    const iv = hexToUint8Array(ivHex);
    const key = await deriveEncryptionKey(ENCRYPTION_SECRET, salt);
    const encryptedData = hexToUint8Array(encryptedHex);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encryptedData
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
}
