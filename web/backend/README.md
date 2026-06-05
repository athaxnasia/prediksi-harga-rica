# RicaHolic — Backend

Backend PHP murni untuk aplikasi prediksi harga rica Kota Manado.

## Struktur Folder

```
web/backend/
├── config/
│   └── db.php              ← konfigurasi koneksi PDO ke MySQL
├── includes/
│   ├── session_check.php   ← helper cek login & role
│   └── response.php        ← helper header & JSON response
├── api/
│   ├── auth.php            ← login & logout
│   ├── register.php        ← registrasi penjual baru
│   ├── harga.php           ← harga terkini & input harga
│   ├── prediksi.php        ← data prediksi dari model ML
│   ├── histori.php         ← histori harga untuk grafik
│   ├── pasar.php           ← daftar pasar (dropdown)
│   ├── users.php           ← manajemen penjual (admin only)
│   └── gamifikasi.php      ← skor tebak harga (opsional)
├── database/
│   └── schema.sql          ← skema database + seed data
└── scripts/
    └── generate_prediksi.py ← script Python untuk isi tabel prediksi
```

## Setup Awal

### 1. Import database
Buka phpMyAdmin di hosting, lalu import file `database/schema.sql`.

### 2. Konfigurasi koneksi
Edit `config/db.php`, sesuaikan `DB_USER` dan `DB_PASS` dengan kredensial MySQL hosting kamu.

### 3. Upload ke hosting
Upload semua isi folder `web/` ke `public_html/` di hosting.  
Struktur di server:
```
public_html/
├── index.html          ← halaman utama (frontend)
├── api/                ← folder backend ini
├── css/
└── js/
```

### 4. Generate prediksi pertama
Jalankan script Python di komputer lokal (setelah model selesai):
```bash
cd scripts/
pip install mysql-connector-python requests
python generate_prediksi.py
```
Pastikan konfigurasi `DB_CONFIG` di dalam script sudah sesuai dengan hosting.

## Daftar Endpoint API

Semua endpoint mengembalikan JSON dengan format:
```json
{ "status": "ok", "data": { ... } }
{ "status": "error", "error": "pesan error" }
```

| Endpoint | Method | Auth | Keterangan |
|---|---|---|---|
| `api/auth.php?action=login` | POST | — | Login |
| `api/auth.php?action=logout` | POST | Login | Logout |
| `api/auth.php?action=me` | GET | — | Cek status login |
| `api/register.php` | POST | — | Daftar akun penjual |
| `api/harga.php` | GET | — | Harga terkini hari ini |
| `api/harga.php` | POST | Penjual/Admin | Input harga harian |
| `api/prediksi.php` | GET | — | Prediksi 7 hari ke depan |
| `api/prediksi.php?besok=1` | GET | — | Prediksi besok (gamifikasi) |
| `api/histori.php?range=30` | GET | — | Histori harga 30/90/365 hari |
| `api/histori.php?penjual=1` | GET | Penjual | Histori input milik penjual |
| `api/pasar.php` | GET | — | Daftar pasar |
| `api/users.php` | GET | Admin | List semua penjual |
| `api/users.php?action=approve` | POST | Admin | Approve penjual |
| `api/users.php?action=nonaktifkan` | POST | Admin | Nonaktifkan penjual |
| `api/users.php?action=hapus` | POST | Admin | Hapus akun penjual |
| `api/gamifikasi.php` | GET | — | Leaderboard (opsional) |
| `api/gamifikasi.php` | POST | — | Simpan skor tebakan (opsional) |

## Akun Default

| Role | Email | Password |
|---|---|---|
| Admin | `admin@ricaholic.id` | `admin123` |

**⚠️ Ganti password admin segera setelah deploy!**

## Catatan Keamanan
- Semua query menggunakan PDO prepared statements
- Password di-hash dengan `password_hash()` cost=12
- Session di-regenerate saat login (`session_regenerate_id`)
- Input di-sanitasi dengan `htmlspecialchars()`
- Endpoint sensitif cek session sebelum eksekusi
