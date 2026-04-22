'use strict';
/**
 * Encryption utility for environment variable secrets.
 * Uses AES-256-GCM with a random IV per value.
 * Key is derived from JWT_SECRET — no extra env var required.
 *
 * Encrypted format stored in DB:  iv:authTag:ciphertext  (all hex)
 */
const crypto = require('crypto');

const ALGORITHM  = 'aes-256-gcm';
const IV_LENGTH  = 12;  // 96-bit IV recommended for GCM
const IV_HEX_LEN = IV_LENGTH * 2; // 24 hex chars

// Derive key once at module load — avoids repeated hashing per call
const _key = (() => {
    const secret = process.env.JWT_SECRET || 'change-this-secret-min-32-chars!!';
    return crypto.createHash('sha256').update(secret).digest();
})();

function encrypt(plaintext) {
    if (plaintext === null || plaintext === undefined) return plaintext;
    const iv       = crypto.randomBytes(IV_LENGTH);
    const cipher   = crypto.createCipheriv(ALGORITHM, _key, iv);
    const encrypted= Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
    const authTag  = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(ciphertext) {
    if (!ciphertext || typeof ciphertext !== 'string') return ciphertext;
    if (!ciphertext.includes(':')) return ciphertext;

    const parts = ciphertext.split(':');
    if (parts.length !== 3) return ciphertext;

    const [ivHex, authTagHex, encryptedHex] = parts;

    // Validate hex lengths before Buffer.from to prevent malformed-input crashes
    if (ivHex.length !== IV_HEX_LEN) return ciphertext;

    const iv        = Buffer.from(ivHex, 'hex');
    const authTag   = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, _key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(encrypted) + decipher.final('utf8');
}

function isEncrypted(value) {
    if (typeof value !== 'string') return false;
    const parts = value.split(':');
    return parts.length === 3 && parts[0].length === IV_HEX_LEN;
}

module.exports = { encrypt, decrypt, isEncrypted };
