import { createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_LIFETIME_SECONDS = 60 * 60 * 8;
const secret = process.env.ADMIN_SESSION_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

function signature(value: string) {
  if (!secret) throw new Error('Missing ADMIN_SESSION_SECRET or SUPABASE_SERVICE_ROLE_KEY.');
  return createHmac('sha256', secret).update(value).digest('base64url');
}

export function createAdminSession(email: string) {
  const payload = Buffer.from(JSON.stringify({ email, expiresAt: Date.now() + SESSION_LIFETIME_SECONDS * 1000 })).toString('base64url');
  return `${payload}.${signature(payload)}`;
}

export function verifyAdminSession(token?: string) {
  if (!token) return false;
  const [payload, receivedSignature] = token.split('.');
  if (!payload || !receivedSignature) return false;
  const expectedSignature = signature(payload);
  if (receivedSignature.length !== expectedSignature.length || !timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(expectedSignature))) return false;

  try {
    const value = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { email?: string; expiresAt?: number };
    return value.email?.toLowerCase() === 'admin@gmail.com' && typeof value.expiresAt === 'number' && value.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export const ADMIN_SESSION_COOKIE = 'pms_admin_session';
export const adminSessionMaxAge = SESSION_LIFETIME_SECONDS;
