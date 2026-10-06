-- ==========================================================
-- WABUP CUP 2026 - STARTER SEED DATA
-- Default Categories, Admin Accounts, Configuration, and Sponsors
-- ==========================================================

USE `wabupcup2026`;

-- 1. SEED DEFAULT ADMIN USERS (DIHAPUS DEMI KEAMANAN)
-- Akun admin awal disemai secara aman dan terenkripsi scrypt saat database kosong
-- menggunakan environment variable INITIAL_ADMIN_USERNAME dan INITIAL_ADMIN_PASSWORD (min. 12 karakter),
-- atau dibuat secara langsung oleh Superadmin melalui dashboard.


-- 2. SEED DEFAULT CATEGORIES
INSERT INTO `categories` (`id`, `name`, `badge_title`, `age_restriction`, `max_teams`, `registered_teams_count`, `registration_fee`, `total_prize`, `description`, `prizes_json`, `rules_json`) VALUES
('SD', 'Kategori SD/MI Sederajat', 'U-12', 'Maksimal Kelahiran 2014', 16, 0, 150000.00, 3500000.00, 'Turnamen Futsal Usia Dini tingkat SD/MI se-Kabupaten', '[{"rank":"Juara 1","prizeMoney":1500000,"trophy":"Piala Tetap + Medali Emas"},{"rank":"Juara 2","prizeMoney":1000000,"trophy":"Piala Tetap + Medali Perak"},{"rank":"Juara 3 Bersama","prizeMoney":600000,"trophy":"Piala Tetap + Medali Perunggu"},{"rank":"Top Scorer","prizeMoney":200000,"trophy":"Trofi Sepatu Emas"},{"rank":"Pemain Terbaik","prizeMoney":200000,"trophy":"Trofi Bola Emas"}]', '["Wajib melampirkan raport & akta kelahiran","Pemain terdaftar aktif di sekolah yang bersangkutan","Durasi pertandingan 2x10 menit bersih"]'),
('SMP', 'Kategori SMP/MTs Sederajat', 'U-15', 'Maksimal Kelahiran 2011', 24, 0, 250000.00, 6000000.00, 'Turnamen Futsal Pelajar tingkat SMP/MTs se-Kabupaten', '[{"rank":"Juara 1","prizeMoney":2500000,"trophy":"Piala Tetap + Medali Emas"},{"rank":"Juara 2","prizeMoney":1750000,"trophy":"Piala Tetap + Medali Perak"},{"rank":"Juara 3 Bersama","prizeMoney":1000000,"trophy":"Piala Tetap + Medali Perunggu"},{"rank":"Top Scorer","prizeMoney":400000,"trophy":"Trofi Sepatu Emas"},{"rank":"Pemain Terbaik","prizeMoney":350000,"trophy":"Trofi Bola Emas"}]', '["Wajib melampirkan NISN & kartu pelajar aktif","Durasi pertandingan 2x15 menit kotor","Official maksimal 3 orang ber-ID card"]'),
('SMA', 'Kategori SMA/SMK/MA Sederajat', 'U-18', 'Maksimal Kelahiran 2008', 32, 0, 350000.00, 10000000.00, 'Turnamen Futsal Pelajar tingkat SMA/SMK/MA se-Kabupaten', '[{"rank":"Juara 1","prizeMoney":4000000,"trophy":"Piala Bergilir Wabup + Piala Tetap + Medali Emas"},{"rank":"Juara 2","prizeMoney":2750000,"trophy":"Piala Tetap + Medali Perak"},{"rank":"Juara 3 Bersama","prizeMoney":1750000,"trophy":"Piala Tetap + Medali Perunggu"},{"rank":"Top Scorer","prizeMoney":500000,"trophy":"Trofi Sepatu Emas"},{"rank":"Pemain Terbaik","prizeMoney":500000,"trophy":"Trofi Bola Emas"},{"rank":"Best Supporter","prizeMoney":500000,"trophy":"Trofi Penghargaan"}]', '["Wajib kartu pelajar & surat rekomendasi kepala sekolah","Sistem gugur / setengah kompetisi sesuai juknis","Durasi pertandingan 2x15 menit bersih semifinal & final"]'),
('INSTANSI', 'Kategori Instansi & Perusahaan', 'Terbuka', 'Pegawai ASN / Honorer / Karyawan Tetap', 16, 0, 500000.00, 8000000.00, 'Turnamen Futsal Antar Dinas, Instansi, BUMN/BUMD, dan Perusahaan Swasta', '[{"rank":"Juara 1","prizeMoney":3500000,"trophy":"Piala Bergilir + Piala Tetap"},{"rank":"Juara 2","prizeMoney":2250000,"trophy":"Piala Tetap"},{"rank":"Juara 3","prizeMoney":1250000,"trophy":"Piala Tetap"},{"rank":"Top Scorer","prizeMoney":500000,"trophy":"Trofi Top Scorer"},{"rank":"Kiper Terbaik","prizeMoney":500000,"trophy":"Trofi Sarung Tangan Emas"}]', '["Wajib melampirkan SK/Surat Tugas resmi instansi & BPJS Ketenagakerjaan","Pemain tidak diperbolehkan gabungan instansi berbeda","Wajib menjunjung tinggi sportivitas"]'),
('UMUM', 'Kategori Terbuka / Klub Umum', 'Open Bebas', 'Usia Bebas (Terbuka Umum se-Indonesia)', 32, 0, 500000.00, 15000000.00, 'Turnamen Kategori Utama Terbuka Prestasi Nasional', '[{"rank":"Juara 1","prizeMoney":7000000,"trophy":"Piala Bergilir Utama + Piala Tetap + Medali Emas"},{"rank":"Juara 2","prizeMoney":4000000,"trophy":"Piala Tetap + Medali Perak"},{"rank":"Juara 3","prizeMoney":2000000,"trophy":"Piala Tetap + Medali Perunggu"},{"rank":"Top Scorer","prizeMoney":1000000,"trophy":"Trofi Sepatu Emas"},{"rank":"Pemain Terbaik","prizeMoney":1000000,"trophy":"Trofi Bola Emas"}]', '["Terbuka untuk semua klub futsal amatir / semi-pro","Pendaftaran berlaku sistem kuota tim tercepat","Peraturan resmi mengacu standar FFI & FIFA Futsal Laws of the Game"]')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 3. SEED DEFAULT SPONSORS
INSERT INTO `sponsors` (`id`, `name`, `tier`, `logo_text`, `website_url`, `description`, `sort_order`, `is_active`) VALUES
('sp-1', 'Bank Daerah Utama', 'PLATINUM', 'BANK DAERAH', 'https://bankdaerah.id', 'Mitra Resmi Perbankan dan Layanan Transaksi Finansial Turnamen', 1, 1),
('sp-2', 'Apparel Olahraga Nasional', 'GOLD', 'SPORT APPAREL', 'https://sportapparel.id', 'Penyedia Bola Resmi & Jersey Wasit Turnamen', 2, 1),
('sp-3', 'Air Mineral Pegunungan', 'SILVER', 'HYDRATION WATER', 'https://mineralwater.id', 'Official Hydration Partner Wabup Cup 2026', 3, 1),
('sp-4', 'PSSI / Asosiasi Futsal Daerah', 'OFFICIAL_PARTNER', 'AFD / PSSI', 'https://pssi.org', 'Badan Pengawas Teknis dan Legalitas Kompetisi Resmi', 4, 1)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
