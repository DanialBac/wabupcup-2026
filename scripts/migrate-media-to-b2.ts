/**
 * Migrasi berkas lama dari TiDB (kolom file_data, base64) ke Backblaze B2.
 *
 * Jalankan dari laptop, BUKAN dari Vercel:
 *   npm run migrate:media -- --dry-run          # lihat apa yang akan dipindah
 *   npm run migrate:media                       # pindahkan REG_DOC
 *   npm run migrate:media -- --all              # pindahkan semua kategori
 *   npm run migrate:media -- --purge            # kosongkan file_data baris yang sudah di B2
 *
 * Perlu env: DATABASE_URL (atau MYSQL_*), B2_KEY_ID, B2_APP_KEY, B2_REGION, B2_BUCKET.
 * Aman dijalankan ulang: hanya memproses baris dengan storage = 'db'.
 * file_data TIDAK dihapus sampai kamu menjalankan --purge (jadi bisa rollback).
 */
import 'dotenv/config';
import { pool } from '../server/config';
import { ensureMediaColumns } from '../server/db/mediaSchema';
import { isB2Configured, putB2Object, headB2Object } from '../server/b2';

const args = new Set(process.argv.slice(2));
const DRY = args.has('--dry-run');
const ALL = args.has('--all');
const PURGE = args.has('--purge');

function decode(fileData: string): Buffer {
  const m = fileData.match(/^data:([A-Za-z0-9-+/.]+);base64,(.+)$/s);
  return Buffer.from(m ? m[2] : fileData, 'base64');
}

async function main() {
  if (!isB2Configured()) {
    throw new Error('B2_KEY_ID, B2_APP_KEY, B2_REGION, dan B2_BUCKET harus diisi.');
  }
  await ensureMediaColumns(pool);

  if (PURGE) {
    const [r]: any = await pool.query("UPDATE app_media_storage SET file_data = '' WHERE storage = 'b2' AND file_data <> ''");
    console.log(`Purge selesai: file_data dikosongkan pada ${r.affectedRows} baris.`);
    await pool.end();
    return;
  }

  const where = ALL ? "storage = 'db'" : "storage = 'db' AND category = 'REG_DOC'";
  const [idRows]: any = await pool.query(
    `SELECT id, category, filename, file_size FROM app_media_storage WHERE ${where} ORDER BY created_at`
  );
  console.log(`${idRows.length} berkas akan diproses${DRY ? ' (dry-run, tidak ada yang diubah)' : ''}.`);

  let ok = 0, failed = 0;
  for (const row of idRows as any[]) {
    const key = `${String(row.category).toLowerCase().replace(/_/g, '-')}/${row.id}`;
    if (DRY) { console.log(`- ${row.id} -> ${key}`); continue; }
    try {
      const [[data]]: any = await pool.query(
        'SELECT file_data, content_type FROM app_media_storage WHERE id = ?', [row.id]
      );
      const buf = decode(String(data.file_data || ''));
      if (!buf.length) throw new Error('file_data kosong');

      await putB2Object(key, buf, String(data.content_type || 'application/octet-stream'));
      const head = await headB2Object(key);
      if (!head || head.size !== buf.length) throw new Error(`ukuran tidak cocok (B2=${head?.size}, lokal=${buf.length})`);

      await pool.query(
        "UPDATE app_media_storage SET storage = 'b2', file_key = ?, file_size = ? WHERE id = ? AND storage = 'db'",
        [key, buf.length, row.id]
      );
      ok++;
      console.log(`OK   ${row.id} (${(buf.length / 1024).toFixed(0)} KB)`);
    } catch (err: any) {
      failed++;
      console.error(`GAGAL ${row.id}: ${err?.message || err}`);
    }
  }
  console.log(`\nSelesai. Berhasil: ${ok}, gagal: ${failed}.`);
  if (!DRY && ok > 0) console.log('Setelah semua berkas diverifikasi terbuka, jalankan: npm run migrate:media -- --purge');
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
