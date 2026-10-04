-- File Migrasi untuk memastikan ketersediaan kolom registered_teams_count dan index pendaftaran ganda.

-- Tambahkan kolom kuota (registered_teams_count) jika belum ada.
-- Catatan: MySQL/TiDB tidak mendukung klausa IF NOT EXISTS untuk ADD COLUMN secara native dalam satu query sederhana,
-- namun TiDB mendukungnya pada versi terbaru. Jika query ini error di versi MySQL lama, abaikan error tersebut jika kolom sudah ada.
ALTER TABLE categories ADD COLUMN IF NOT EXISTS registered_teams_count INT NOT NULL DEFAULT 0;

-- Mencegah pendaftaran ganda berdasarkan kombinasi Kategori dan Nama Tim
-- Gunakan UNIQUE index
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_team_category ON registrations (category_id, team_name);

