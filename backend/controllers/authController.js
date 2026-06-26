import crypto from 'crypto';
import { signToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';
import prisma from '../prismaClient.js';

// Default fallback credentials
const DEFAULT_EMAIL = process.env.ADMIN_EMAIL || 'admin@company.com';
const DEFAULT_PASS = process.env.ADMIN_PASSWORD || 'ChangeMe@123';

/**
 * Constant-time comparison to protect against timing attacks
 */
function safeEqual(inputStr, targetStr) {
  const bufInput = Buffer.from(String(inputStr || ''));
  const bufTarget = Buffer.from(String(targetStr || ''));
  if (bufInput.length !== bufTarget.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufInput, bufTarget);
}

/**
 * Helper to fetch dynamic admin credentials from Database
 */
async function getAdminCreds() {
  try {
    const emailSetting = await prisma.appSetting.findUnique({ where: { key: 'auth.admin-email' } });
    const passSetting = await prisma.appSetting.findUnique({ where: { key: 'auth.admin-password' } });

    return {
      email: emailSetting?.value || DEFAULT_EMAIL,
      password: passSetting?.value || DEFAULT_PASS
    };
  } catch (err) {
    logger.error('Auth', 'Database read error during auth, using defaults', err);
    return { email: DEFAULT_EMAIL, password: DEFAULT_PASS };
  }
}

/**
 * Handle User Login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const validCreds = await getAdminCreds();
    const trimmedEmail = String(email).trim().toLowerCase();

    if (trimmedEmail === validCreds.email.trim().toLowerCase() && safeEqual(password, validCreds.password)) {
      const user = {
        email: validCreds.email,
        name: validCreds.email.split('@')[0].toUpperCase(),
        role: 'Admin Enterprise',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'
      };

      const token = signToken({ email: validCreds.email, role: 'admin' });
      logger.info('Auth', `Successful login for user: ${validCreds.email}`);

      return res.status(200).json({
        success: true,
        token,
        user
      });
    }

    logger.warn('Auth', `Failed login attempt for email: ${email}`);
    return res.status(401).json({ error: 'Invalid email or password' });
  } catch (error) {
    logger.error('Auth', 'Login exception:', error);
    return res.status(500).json({ error: 'Internal Authentication Error' });
  }
};

/**
 * Verify Session / Current User
 */
export const me = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const validCreds = await getAdminCreds();
    return res.status(200).json({
      success: true,
      user: {
        email: validCreds.email,
        name: validCreds.email.split('@')[0].toUpperCase(),
        role: 'Admin Enterprise',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to verify user session' });
  }
};
