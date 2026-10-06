import crypto from 'crypto';
import type { Request } from 'express';
import { pool } from './config';

/**
 * Mengambil IP klien dari header tepercaya platform atau reverse proxy.
 * Platform (seperti Vercel) menjamin integritas x-real-ip dan x-vercel-forwarded-for.
 */
export function getClientIp(req: Request): string {
  const xReal = req.headers['x-real-ip'];
  if (typeof xReal === 'string' && xReal.trim()) {
    return xReal.trim();
  }
  const xVercel = req.headers['x-vercel-forwarded-for'];
  if (typeof xVercel === 'string' && xVercel.trim()) {
    return xVercel.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Menghitung SHA-256 hash untuk kunci kombinasi IP+Username dan kunci per-IP.
 */
export function computeAttemptKeys(ip: string, username: string): { userKey: string; ipKey: string } {
  const cleanUser = (username || '').trim().toLowerCase().slice(0, 64);
  const userKey = crypto.createHash('sha256').update(`${ip}|${cleanUser}`).digest('hex');
  const ipKey = crypto.createHash('sha256').update(`${ip}|*`).digest('hex');
  return { userKey, ipKey };
}

/**
 * Memeriksa status rate limit login.
 * Mengembalikan { locked: true, retryAfterSeconds } jika terkunci.
 * Maksimal 1 kueri SELECT berbasis primary key (RU minimal).
 * Fail-open untuk ketersediaan jika terjadi gangguan tabel.
 */
export async function checkLoginRateLimit(
  ip: string,
  username: string
): Promise<{ locked: boolean; retryAfterSeconds?: number }> {
  try {
    const { userKey, ipKey } = computeAttemptKeys(ip, username);
    const [rows]: any = await pool.query(
      `SELECT key_hash, failed_count, first_failed_at, locked_until,
              (locked_until > NOW()) as is_locked,
              TIMESTAMPDIFF(SECOND, NOW(), locked_until) as retry_after
       FROM admin_login_attempts WHERE key_hash IN (?, ?)`,
      [userKey, ipKey]
    );

    if (Array.isArray(rows) && rows.length > 0) {
      for (const r of rows) {
        if (Number(r.is_locked) === 1) {
          const retryAfterSeconds = Math.max(1, Number(r.retry_after) || 900);
          return { locked: true, retryAfterSeconds };
        }
      }
    }
    return { locked: false };
  } catch (err: any) {
    console.warn('[RateLimiter] Gagal memeriksa rate limit (fail-open):', err?.message || err);
    return { locked: false };
  }
}

/**
 * Mencatat kegagalan login dengan UPSERT atomik.
 * Kebijakan:
 * - 5 kegagalan dalam 15 menit pada ip+username -> terkunci 15 menit.
 * - 20 kegagalan dalam 15 menit pada ip -> terkunci 15 menit.
 * Melakukan pembersihan oportunistik baris lama (>24 jam) dengan LIMIT kecil.
 */
export async function recordLoginFailure(ip: string, username: string): Promise<void> {
  try {
    const { userKey, ipKey } = computeAttemptKeys(ip, username);

    const upsertSql = `
      INSERT INTO admin_login_attempts (key_hash, failed_count, first_failed_at, locked_until)
      VALUES (?, 1, NOW(), NULL)
      ON DUPLICATE KEY UPDATE
        failed_count = IF(first_failed_at < NOW() - INTERVAL 15 MINUTE, 1, failed_count + 1),
        locked_until = IF(
          first_failed_at < NOW() - INTERVAL 15 MINUTE,
          NULL,
          IF(failed_count >= ?, NOW() + INTERVAL 15 MINUTE, locked_until)
        ),
        first_failed_at = IF(first_failed_at < NOW() - INTERVAL 15 MINUTE, NOW(), first_failed_at)
    `;

    // 1. Catat kegagalan pada kunci ip+user (ambang 5)
    await pool.query(upsertSql, [userKey, 5]);

    // 2. Catat kegagalan pada kunci per-ip (ambang 20)
    await pool.query(upsertSql, [ipKey, 20]);

    // 3. Pembersihan oportunistik baris kadaluarsa > 24 jam (LIMIT 10 agar RU sangat kecil)
    await pool.query(
      'DELETE FROM admin_login_attempts WHERE updated_at < NOW() - INTERVAL 24 HOUR LIMIT 10'
    ).catch(() => {});
  } catch (err: any) {
    console.warn('[RateLimiter] Gagal mencatat kegagalan login:', err?.message || err);
  }
}

/**
 * Menghapus riwayat kegagalan pada kunci ip+username saat login berhasil.
 */
export async function recordLoginSuccess(ip: string, username: string): Promise<void> {
  try {
    const { userKey } = computeAttemptKeys(ip, username);
    await pool.query('DELETE FROM admin_login_attempts WHERE key_hash = ?', [userKey]).catch(() => {});
  } catch (err: any) {
    console.warn('[RateLimiter] Gagal membersihkan riwayat login berhasil:', err?.message || err);
  }
}
