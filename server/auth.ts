import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export function parseCookies(req: Request) {
  const list: Record<string, string> = {};
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    let [name, ...rest] = cookie.split('=');
    name = name?.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    list[name] = decodeURIComponent(value);
  });
  return list;
}

export function getAdminSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.trim().length < 32) {
    return null;
  }
  return secret.trim();
}

export function generateToken(adminId: string, role: string): string {
  const secret = getAdminSecret();
  if (!secret) {
    throw new Error('CONFIG_INCOMPLETE: ADMIN_SESSION_SECRET is missing or less than 32 characters');
  }

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ 
    sub: adminId, 
    role, 
    exp: Math.floor(Date.now() / 1000) + (12 * 60 * 60) // 12 hours
  })).toString('base64url');

  const signature = crypto.createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string): { sub: string, role: string } | null {
  const secret = getAdminSecret();
  if (!secret) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expectedSigBuf = Buffer.from(expectedSig);

  if (sigBuf.length !== expectedSigBuf.length || !crypto.timingSafeEqual(sigBuf, expectedSigBuf)) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export function buildSessionCookie(token: string, req?: Request, maxAgeSeconds: number = 12 * 60 * 60): string {
  const isHttps = req ? (req.secure || req.headers['x-forwarded-proto'] === 'https') : false;
  const isLocal = req ? (req.hostname === 'localhost' || req.hostname === '127.0.0.1') : false;
  const isProd = process.env.NODE_ENV === 'production';
  const useSecure = isHttps || (isProd && !isLocal);
  return `admin_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${useSecure ? '; Secure' : ''}`;
}

export function buildClearSessionCookie(req?: Request): string {
  const isHttps = req ? (req.secure || req.headers['x-forwarded-proto'] === 'https') : false;
  const isLocal = req ? (req.hostname === 'localhost' || req.hostname === '127.0.0.1') : false;
  const isProd = process.env.NODE_ENV === 'production';
  const useSecure = isHttps || (isProd && !isLocal);
  return `admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${useSecure ? '; Secure' : ''}`;
}

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Fail-closed check: if ADMIN_SESSION_SECRET is missing or < 32 characters
  if (!getAdminSecret()) {
    return res.status(500).json({
      success: false,
      error: 'Konfigurasi server otentikasi belum lengkap (ADMIN_SESSION_SECRET).'
    });
  }

  const cookies = parseCookies(req);
  const authHeader = req.headers?.authorization;
  const bearerToken = authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;
  const token = cookies['admin_session'] || bearerToken;

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      (req as any).adminUser = decoded;
      return next();
    }
  }

  return res.status(401).json({
    success: false,
    error: 'Sesi tidak valid atau telah berakhir. Harap login kembali.'
  });
};

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  requireAdmin(req, res, () => {
    const user = (req as any).adminUser;
    if (!user || user.role !== 'SUPERADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Akses ditolak. Tindakan ini membutuhkan level SUPERADMIN.'
      });
    }
    next();
  });
};
