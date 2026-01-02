import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * AES-256-GCM 암호화 유틸리티
 * Notion API 토큰 등 민감한 정보를 암호화하여 저장
 */

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  // 32 bytes (256 bits) key required for AES-256
  return crypto.scryptSync(key, 'salt', 32);
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
}

/**
 * 문자열을 AES-256-GCM으로 암호화
 * @param plaintext 암호화할 평문
 * @returns 암호화된 데이터와 IV
 */
export function encrypt(plaintext: string): EncryptedData {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Auth tag를 암호문에 추가
  const authTag = cipher.getAuthTag();
  encrypted += authTag.toString('hex');

  return {
    encrypted,
    iv: iv.toString('hex'),
  };
}

/**
 * AES-256-GCM으로 암호화된 데이터를 복호화
 * @param encryptedData 암호화된 데이터
 * @param ivHex IV (hex 문자열)
 * @returns 복호화된 평문
 */
export function decrypt(encryptedData: string, ivHex: string): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');

  // Auth tag 분리 (마지막 32 hex characters = 16 bytes)
  const authTagHex = encryptedData.slice(-AUTH_TAG_LENGTH * 2);
  const encryptedHex = encryptedData.slice(0, -AUTH_TAG_LENGTH * 2);

  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
