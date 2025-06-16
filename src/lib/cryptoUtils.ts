// src/lib/cryptoUtils.ts
'use client';

// Get encryption secret from environment variable
const getEncryptionSecret = (): string => {
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
  
  if (!secret) {
    console.error('Encryption secret not found in environment variables');
    // In development, use a warning and fallback
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using development fallback encryption secret. This is NOT secure for production!');
      return "dev-fallback-encryption-key-not-for-production-use";
    }
    // In production, throw an error
    throw new Error('Encryption secret not configured. Please set NEXT_PUBLIC_ENCRYPTION_SECRET environment variable.');
  }

  // Validate secret length (minimum 32 bytes for AES-256)
  if (secret.length < 32) {
    console.error('Encryption secret is too short. Must be at least 32 characters.');
    throw new Error('Invalid encryption secret length. Must be at least 32 characters.');
  }

  return secret;
};

// Initialize encryption secret
const ENCRYPTION_SECRET = getEncryptionSecret();

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
    console.log('Starting encryption...');
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    console.log('Generated salt and IV');
    
    const key = await deriveEncryptionKey(ENCRYPTION_SECRET, salt);
    console.log('Derived encryption key');

    const enc = new TextEncoder();
    const encodedData = enc.encode(data);
    console.log('Encoded data length:', encodedData.length);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encodedData
    );
    console.log('Data encrypted successfully');

    const encryptedHex = Array.from(new Uint8Array(encryptedBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Encryption complete. Lengths:', {
      encrypted: encryptedHex.length,
      iv: ivHex.length,
      salt: saltHex.length
    });

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
    console.log('Starting decryption...');
    console.log('Input lengths:', {
      encrypted: encryptedHex.length,
      iv: ivHex.length,
      salt: saltHex.length
    });

    const salt = hexToUint8Array(saltHex);
    const iv = hexToUint8Array(ivHex);
    console.log('Converted hex to arrays');

    const key = await deriveEncryptionKey(ENCRYPTION_SECRET, salt);
    console.log('Derived decryption key');

    const encryptedData = hexToUint8Array(encryptedHex);
    console.log('Converted encrypted data to array');

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encryptedData
    );
    console.log('Data decrypted successfully');

    const dec = new TextDecoder();
    const result = dec.decode(decryptedBuffer);
    console.log('Decryption complete. Result length:', result.length);
    return result;
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
}
