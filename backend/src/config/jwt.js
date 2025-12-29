/**
 * JWT Configuration
 * Centralized JWT secret management with production safety
 */

const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;

  // In production, JWT_SECRET must be set
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('CRITICAL: JWT_SECRET environment variable is required in production!');
  }

  // In development, warn but allow fallback
  if (!secret) {
    console.warn('[WARNING] JWT_SECRET not set. Using development fallback. DO NOT use in production!');
    return 'dev-only-secret-change-in-production';
  }

  return secret;
};

// Export the secret (evaluated once at startup)
const JWT_SECRET = getJWTSecret();

// JWT options
const JWT_OPTIONS = {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

module.exports = {
  JWT_SECRET,
  JWT_OPTIONS,
};
