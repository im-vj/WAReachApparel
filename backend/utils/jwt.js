import crypto from 'crypto';

const SECRET = process.env.JWT_SECRET || 'wareach_super_secret_enterprise_key_2026_x91z';

/**
 * Signs a JWT token using HMAC SHA256 (HS256)
 * @param {Object} payload 
 * @param {number} expiresInSeconds default 24 hours
 * @returns {string} JWT token
 */
export function signToken(payload, expiresInSeconds = 86400) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

/**
 * Verifies and decodes a JWT token
 * @param {string} token 
 * @returns {Object|null} Decoded payload if valid, null otherwise
 */
export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;

  // Verify signature
  const expectedSignature = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch (err) {
    return null;
  }
}
