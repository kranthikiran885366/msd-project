'use strict';
/**
 * Encryption utility for environment variable secrets.
 * Uses AES-256-GCM with a random IV per value.
 * The encryption key is derived from JWT_SECRET so no extra env var is required.
 *
 * Encrypted format (stored in DB):  iv:authTag:ciphertext  (all hex)
 */
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

function _getKey() {
    const secret = process.env.JWT_SECRET || 'change-this-secret-min-32-chars!!';
    // SHA-256 of the secret gives us a stable 32-byte key
    return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt a plaintext string.
 * Returns a string in the format:  iv:authTag:ciphertext  (all hex)
 */
function encrypt(plaintext) {
    if (plaintext === null || plaintext === undefined) return plaintext;
    const key = _getKey();
    const iv  = crypto.randomBytes(12); // 96-bit IV recommended for GCM
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
    const authTag   = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a value produced by encrypt().
 * Returns the original plaintext string.
 */
function decrypt(ciphertext) {
    if (!ciphertext || typeof ciphertext !== 'string') return ciphertext;
    // If it doesn't look like an encrypted value, return as-is (migration safety)
    if (!ciphertext.includes(':')) return ciphertext;

    const parts = ciphertext.split(':');
    if (parts.length !== 3) return ciphertext;

    const [ivHex, authTagHex, encryptedHex] = parts;
    const key       = _getKey();
    const iv        = Buffer.from(ivHex, 'hex');
    const authTag   = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(encrypted) + decipher.final('utf8');
}

/**
 * Returns true if the value looks like it was produced by encrypt().
 */
function isEncrypted(value) {
    if (typeof value !== 'string') return false;
    const parts = value.split(':');
    return parts.length === 3 && parts[0].length === 24; // 12-byte IV = 24 hex chars
}

module.exports = { encrypt, decrypt, isEncrypted };
