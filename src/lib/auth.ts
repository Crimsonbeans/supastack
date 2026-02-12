import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';

export function hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const verifyHash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
}
