/**
 * Skrip pembersih berkas dan baris media yatim (orphan media).
 *
 * Penggunaan:
 *   npm run cleanup:media                       # Default DRY-RUN (seluruh DB)
 *   npm run cleanup:media -- --hours=12         # DRY-RUN dengan batas umur 12 jam
 *   npm run cleanup:media -- --only=id1,id2     # DRY-RUN khusus ID tertentu
 *   npm run cleanup:media -- --apply --only=id1 # HAPUS media uji tertentu
 *
 * Kriteria Yatim (Semua Wajib Terpenuhi):
 *   1. category IN ('REG_DOC', 'TEAM_LOGO')
 *   2. ref_id IS NULL
 *   3. created_at lebih tua dari N jam (default 24; min 6 kecuali --only disertakan)
 *   4. id tidak muncul di registrations (team_logo, documents_json)
 *   5. id tidak muncul di tabel lain (sponsors.logo_url, tournament_config.config_value)
 */
import 'dotenv/config';
import { pool } from '../server/config';
import { deleteB2Objects } from '../server/b2';

// 1. Pengaman Koneksi Database
const dbUrl = process.env.DATABASE_URL || '';
const tidbDatabase = process.env.TIDB_DATABASE || process.env.MYSQL_DATABASE || '';

if (dbUrl.includes('wabupcup_db') || tidbDatabase.includes('wabupcup_db')) {
  console.error('FATAL: Database produksi wabupcup_db terdeteksi! Script dihentikan total.');
  process.exit(1);
}

// 2. Parse Argumen CLI
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const FORCE_ALL = args.includes('--force-all');

let hours = 24;
const hoursArg = args.find(a => a.startsWith('--hours='));
if (hoursArg) {
  const parsed = parseInt(hoursArg.split('=')[1], 10);
  if (!isNaN(parsed) && parsed > 0) hours = parsed;
}

let onlyIds: Set<string> | null = null;
const onlyArg = args.find(a => a.startsWith('--only='));
if (onlyArg) {
  const ids = onlyArg.split('=')[1].split(',').map(s => s.trim()).filter(Boolean);
  if (ids.length > 0) onlyIds = new Set(ids);
}

// Minimum 6 jam kecuali --only dipakai
if (!onlyIds && hours < 6) {
  console.warn(`[Peringatan] Batas umur di bawah 6 jam tanpa --only tidak diizinkan. Disesuaikan menjadi 6 jam.`);
  hours = 6;
}

// Pengaman Keras: Melarang --apply tanpa --only pada database salinan yang berbagi bucket B2
if (APPLY && !onlyIds && !FORCE_ALL) {
  console.error('FATAL: Menjalankan --apply tanpa --only DILARANG karena bucket B2 dipakai bersama produksi!');
  process.exit(1);
}

function extractMediaIds(data: any): Set<string> {
  const ids = new Set<string>();
  if (!data) return ids;

  const checkStr = (str: string) => {
    if (!str || typeof str !== 'string') return;
    const viewMatches = str.match(/\/api\/media\/view\/([a-zA-Z0-9_-]+)/g);
    if (viewMatches) {
      for (const m of viewMatches) {
        const id = m.replace('/api/media/view/', '').split(/[?#]/)[0];
        if (id) ids.add(id);
      }
    }
    const directMatches = str.match(/\bmed-\d+-[a-zA-Z0-9_-]+\b/g);
    if (directMatches) {
      for (const m of directMatches) {
        ids.add(m);
      }
    }
  };

  const walk = (item: any) => {
    if (!item) return;
    if (typeof item === 'string') {
      checkStr(item);
    } else if (Array.isArray(item)) {
      for (const x of item) walk(x);
    } else if (typeof item === 'object') {
      for (const v of Object.values(item)) walk(v);
    }
  };

  walk(data);
  return ids;
}

async function main() {
  // Verifikasi SELECT DATABASE()
  const [[{ current_db }]]: any = await pool.query('SELECT DATABASE() AS current_db');
  if (current_db !== 'wabupcup2026') {
    console.error(`FATAL: Database aktif adalah "${current_db}", bukan "wabupcup2026". Script dihentikan!`);
    await pool.end();
    process.exit(1);
  }

  console.log(`=== PEMBERSIH MEDIA YATIM (WABUPCUP 2026) ===`);
  console.log(`Mode        : ${APPLY ? 'APPLY (MENGHAPUS BERKAS & BARIS)' : 'DRY-RUN (SIMULASI, TIDAK ADA PERUBAHAN)'}`);
  console.log(`Database    : ${current_db}`);
  console.log(`Filter Umur : >= ${hours} jam lalu ${onlyIds ? '(Dilewati karena --only aktif)' : ''}`);
  if (onlyIds) {
    console.log(`Filter ID   : ${Array.from(onlyIds).join(', ')}`);
  }
  console.log('--------------------------------------------------\n');

  // 1. Kumpulkan seluruh Media ID yang masih aktif direferensikan
  console.log('[1/4] Mengumpulkan referensi media aktif...');
  const referencedIds = new Set<string>();

  // a. Registrations (team_logo, documents_json)
  const [registrations]: any = await pool.query('SELECT id, team_logo, documents_json FROM registrations');
  for (const reg of registrations) {
    const idsLogo = extractMediaIds(reg.team_logo);
    const idsDocs = extractMediaIds(reg.documents_json);
    idsLogo.forEach(id => referencedIds.add(id));
    idsDocs.forEach(id => referencedIds.add(id));
  }
  console.log(`  - Referensi dari registrations: ${referencedIds.size} file`);

  // b. Sponsors (logo_url)
  const [sponsors]: any = await pool.query('SELECT id, logo_url FROM sponsors');
  let spCount = 0;
  for (const sp of sponsors) {
    const ids = extractMediaIds(sp.logo_url);
    ids.forEach(id => { referencedIds.add(id); spCount++; });
  }
  console.log(`  - Referensi dari sponsors: ${spCount} file`);

  // c. Tournament Config (config_value)
  const [configs]: any = await pool.query('SELECT config_key, config_value FROM tournament_config');
  let cfgCount = 0;
  for (const cfg of configs) {
    const ids = extractMediaIds(cfg.config_value);
    ids.forEach(id => { referencedIds.add(id); cfgCount++; });
  }
  console.log(`  - Referensi dari tournament_config: ${cfgCount} file`);
  console.log(`Total ID media unik yang aktif direferensikan: ${referencedIds.size}\n`);

  // 2. Kueri kandidat media yatim dari app_media_storage
  console.log('[2/4] Mencari kandidat media yatim...');
  let query = `
    SELECT id, category, filename, file_size, storage, file_key, created_at
    FROM app_media_storage
    WHERE category IN ('REG_DOC', 'TEAM_LOGO')
      AND ref_id IS NULL
  `;
  const queryParams: any[] = [];

  if (onlyIds) {
    const idList = Array.from(onlyIds);
    query += ` AND id IN (?)`;
    queryParams.push(idList);
  } else {
    query += ` AND created_at < DATE_SUB(NOW(), INTERVAL ? HOUR)`;
    queryParams.push(hours);
  }

  query += ` ORDER BY created_at ASC`;

  const [candidates]: any = await pool.query(query, queryParams);
  console.log(`Kandidat awal (category in ('REG_DOC','TEAM_LOGO'), ref_id IS NULL): ${candidates.length}`);

  // 3. Filter kandidat yang TIDAK ADA dalam referencedIds
  const orphans: any[] = [];
  const referencedCandidates: any[] = [];

  for (const row of candidates) {
    if (referencedIds.has(row.id)) {
      referencedCandidates.push(row);
    } else {
      orphans.push(row);
    }
  }

  console.log(`  - Kandidat yang lolos (ternyata direferensikan): ${referencedCandidates.length}`);
  console.log(`  - Kandidat yang benar-benar YATIM: ${orphans.length}\n`);

  // Ringkasan Media Yatim
  let dbCount = 0;
  let b2Count = 0;
  let dbBytes = 0;
  let b2Bytes = 0;

  for (const o of orphans) {
    const size = Number(o.file_size || 0);
    if (o.storage === 'b2') {
      b2Count++;
      b2Bytes += size;
    } else {
      dbCount++;
      dbBytes += size;
    }
  }

  const formatSize = (b: number) => {
    if (b >= 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(2)} MB`;
    return `${(b / 1024).toFixed(1)} KB`;
  };

  console.log('=== RINGKASAN MEDIA YATIM ===');
  console.log(`Total Yatim       : ${orphans.length}`);
  console.log(`Total Ukuran      : ${formatSize(dbBytes + b2Bytes)} (${dbBytes + b2Bytes} bytes)`);
  console.log(`- Storage 'db'    : ${dbCount} berkas (${formatSize(dbBytes)})`);
  console.log(`- Storage 'b2'    : ${b2Count} berkas (${formatSize(b2Bytes)})`);
  console.log('--------------------------------------------------\n');

  if (orphans.length > 0) {
    console.log('Daftar 20 Yatim Pertama:');
    console.table(
      orphans.slice(0, 20).map(o => ({
        id: o.id,
        category: o.category,
        filename: o.filename?.slice(0, 30),
        size: formatSize(Number(o.file_size || 0)),
        storage: o.storage,
        file_key: o.file_key || '-',
        created_at: o.created_at ? new Date(o.created_at).toISOString().replace('T', ' ').slice(0, 19) : '-',
      }))
    );
    if (orphans.length > 20) {
      console.log(`... dan ${orphans.length - 20} berkas yatim lainnya.`);
    }
  }

  // 4. Eksekusi Penghapusan (Hanya jika --apply)
  if (APPLY) {
    console.log('\n[3/4] Melakukan penghapusan media yatim...');
    let deletedCount = 0;
    let failedCount = 0;

    for (const o of orphans) {
      try {
        // Hapus dari B2 jika storage b2
        if (o.storage === 'b2' && o.file_key) {
          await deleteB2Objects([o.file_key]);
        }
        // Hapus baris dari database
        await pool.query('DELETE FROM app_media_storage WHERE id = ?', [o.id]);
        deletedCount++;
        console.log(`[TERHAPUS] ID: ${o.id} (${o.storage}) - ${o.filename}`);
      } catch (err: any) {
        failedCount++;
        console.error(`[GAGAL] ID: ${o.id}: ${err?.message || err}`);
      }
    }

    console.log(`\n[4/4] Selesai penghapusan. Berhasil: ${deletedCount}, Gagal: ${failedCount}.`);
  } else {
    console.log('\n[INFO] Mode DRY-RUN selesai. Tidak ada baris atau berkas yang dihapus.');
    console.log('Untuk menghapus data uji tertentu secara permanen, gunakan:');
    console.log('  npm run cleanup:media -- --apply --only=<ID1>,<ID2>');
  }

  await pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  pool.end().finally(() => process.exit(1));
});
