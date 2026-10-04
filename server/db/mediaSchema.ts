import type { Pool } from 'mysql2/promise';

/**
 * Menambah kolom storage & file_key pada app_media_storage bila belum ada.
 * Aman dijalankan berulang (idempoten).
 */
export async function ensureMediaColumns(pool: Pool): Promise<void> {
  try {
    const [rows]: any = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'app_media_storage'`
    );
    const have = new Set((rows as any[]).map((r) => String(r.COLUMN_NAME).toLowerCase()));
    if (have.size === 0) return; // tabel belum ada
    if (!have.has('storage')) {
      await pool.query("ALTER TABLE app_media_storage ADD COLUMN storage VARCHAR(8) NOT NULL DEFAULT 'db'");
    }
    if (!have.has('file_key')) {
      await pool.query('ALTER TABLE app_media_storage ADD COLUMN file_key VARCHAR(255) NULL');
    }
  } catch (err) {
    console.warn('[ensureMediaColumns] gagal menambah kolom:', (err as any)?.message || err);
  }
}
