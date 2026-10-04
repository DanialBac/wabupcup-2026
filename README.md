
## Environment Variables (Vercel Production)

Aplikasi ini memerlukan beberapa Environment Variable di sisi backend. Variabel-variabel ini digunakan untuk terhubung dengan TiDB Cloud (Web 1) dan layanan eksternal lainnya.

| NAMA VARIABLE | KETERANGAN |
| --- | --- |
| `DATABASE_URL` | String URL koneksi, (Opsional, fallback dari TIDB_*) `mysql://USER:PASS@HOST:4000/DB_WEB_1` |
| `TIDB_HOST` | Host dari database TiDB Cloud |
| `TIDB_PORT` | Port database (Biasanya 4000 untuk TiDB) |
| `TIDB_USER` | Username koneksi database |
| `TIDB_PASSWORD` | Password koneksi database |
| `TIDB_DATABASE` | Nama database |
| `ADMIN_SECRET_PIN` | Kode PIN rahasia untuk otorisasi admin tambahan |
| `BLOB_READ_WRITE_TOKEN` | Token baca/tulis media Storage |
| `R2_ACCOUNT_ID` | Akun ID Cloudflare R2 |
| `R2_ACCESS_KEY_ID` | Access key Cloudflare R2 |
| `R2_SECRET_ACCESS_KEY` | Secret key Cloudflare R2 |
| `R2_BUCKET_NAME` | Nama bucket penyimpan R2 |
| `R2_PUBLIC_DOMAIN` | Domain kustom/public akses media R2 |
