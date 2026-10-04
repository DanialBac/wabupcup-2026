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

export function generateToken(adminId: string, role: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET tidak dikonfigurasi di .env');
  
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
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;
  
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  const [header, payload, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');
    
  if (signature !== expectedSig) return null;
  
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const cookies = parseCookies(req);
  const token = cookies['admin_session'];
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Sesi tidak valid atau telah berakhir. Harap login kembali.' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, error: 'Akses ditolak. Token otentikasi tidak valid.' });
  }
  
  // Attach user to req
  (req as any).adminUser = decoded;
  next();
};

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  requireAdmin(req, res, () => {
    const user = (req as any).adminUser;
    if (user.role !== 'SUPERADMIN') {
      return res.status(403).json({ success: false, error: 'Akses ditolak. Tindakan ini membutuhkan level SUPERADMIN.' });
    }
    next();
  });
};
