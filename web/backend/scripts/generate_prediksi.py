"""
scripts/generate_prediksi.py
============================
Script ini dijalankan LOKAL oleh anggota tim ML,
lalu hasilnya (tabel prediksi) langsung masuk ke MySQL.

Cara pakai:
    python generate_prediksi.py

Dependensi tambahan (install sekali):
    pip install mysql-connector-python requests

Pastikan variabel DB_* di bawah sesuai dengan config hosting kamu.
Kalau hosting belum siap, set SIMPAN_KE_DB = False agar output
hanya ke CSV dulu.
"""

import os
import joblib
import numpy as np
import pandas as pd
import requests
from datetime import datetime, timedelta

# ── Konfigurasi ──────────────────────────────────────────────
MODEL_PATH   = '../models/model_rf_rica_manado_final.pkl'
SCALER_PATH  = '../models/scaler_rf_rica_manado_final.pkl'
FEATURES_PATH = '../models/features_rf_rica_manado_final.pkl'
DATASET_PATH = '../data/clean_dataset_rica_manado_final.csv'

SIMPAN_KE_DB = True      # set False kalau hosting belum siap
SIMPAN_KE_CSV = True     # selalu True sebagai backup

HARI_PREDIKSI = 7        # berapa hari ke depan yang diprediksi

# Konfigurasi database (samakan dengan config/db.php)
DB_CONFIG = {
    'host':     'localhost',
    'database': 'ricaholic',
    'user':     'root',
    'password': '',
    'port':     3306,
}

# Koordinat Kota Manado
LAT  = 1.4748
LON  = 124.8421

# ── Load model & scaler ───────────────────────────────────────
print("Memuat model...")
model    = joblib.load(MODEL_PATH)
scaler   = joblib.load(SCALER_PATH)
features = joblib.load(FEATURES_PATH)   # list nama fitur sesuai urutan saat training
print(f"  Fitur model: {features}")

# ── Ambil data cuaca dari Open-Meteo ─────────────────────────
def get_cuaca(past_days: int = 50) -> pd.DataFrame:
    """Ambil data cuaca historis + hari ini dari Open-Meteo API."""
    print(f"Mengambil data cuaca ({past_days} hari ke belakang)...")
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude":      LAT,
        "longitude":     LON,
        "daily": [
            "temperature_2m_mean",
            "relative_humidity_2m_max",   # Open-Meteo tidak punya RH mean, pakai max
            "precipitation_sum"
        ],
        "timezone":      "Asia/Makassar",
        "past_days":     past_days,
        "forecast_days": 1,
    }
    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()["daily"]

    df = pd.DataFrame({
        "tanggal": pd.to_datetime(data["time"]),
        "TAVG":    data["temperature_2m_mean"],
        "RH_AVG":  data["relative_humidity_2m_max"],
        "RR":      data["precipitation_sum"],
    })
    df["RR"] = df["RR"].fillna(0)
    print(f"  Data cuaca: {len(df)} baris, terakhir {df['tanggal'].max().date()}")
    return df

# ── Ambil histori harga dari dataset ─────────────────────────
def get_histori_harga() -> pd.DataFrame:
    print("Memuat dataset historis...")
    df = pd.read_csv(DATASET_PATH, parse_dates=['tanggal'])
    df = df.sort_values('tanggal').reset_index(drop=True)
    print(f"  Dataset: {len(df)} baris, terakhir {df['tanggal'].max().date()}")
    return df

# ── Hitung fitur untuk satu hari prediksi ────────────────────
def build_row(tanggal: datetime, histori: pd.DataFrame, cuaca: pd.DataFrame) -> dict:
    """
    Bangun satu baris fitur untuk input model.
    Urutan fitur harus sama persis dengan saat training.
    """
    row = {}

    # Fitur waktu
    row['Bulan']    = tanggal.month
    row['Tahun']    = tanggal.year
    row['Hari_ke']  = (tanggal - datetime(tanggal.year, 1, 1)).days + 1

    # Fitur cuaca hari prediksi (ambil dari forecast)
    cuaca_hari = cuaca[cuaca['tanggal'].dt.date == tanggal.date()]
    if not cuaca_hari.empty:
        row['TAVG']   = cuaca_hari['TAVG'].values[0]
        row['RH_AVG'] = cuaca_hari['RH_AVG'].values[0]
        row['RR']     = cuaca_hari['RR'].values[0]
    else:
        # fallback: rata-rata cuaca bulan yang sama
        row['TAVG']   = histori['TAVG'].mean()
        row['RH_AVG'] = histori['RH_AVG'].mean()
        row['RR']     = 0.0

    # RR_Lag_44: curah hujan 44 hari sebelum tanggal prediksi
    tgl_lag44 = tanggal - timedelta(days=44)
    cuaca_lag44 = cuaca[cuaca['tanggal'].dt.date == tgl_lag44.date()]
    row['RR_Lag_44'] = cuaca_lag44['RR'].values[0] if not cuaca_lag44.empty else 0.0

    # Fitur lag harga
    harga_kemarin = histori[histori['tanggal'].dt.date < tanggal.date()]
    if len(harga_kemarin) >= 1:
        row['harga_lag_1'] = harga_kemarin.iloc[-1]['Harga']
    else:
        row['harga_lag_1'] = histori['Harga'].mean()

    if len(harga_kemarin) >= 7:
        row['harga_lag_7'] = harga_kemarin.iloc[-7]['Harga']
    else:
        row['harga_lag_7'] = histori['Harga'].mean()

    # Rolling stats (7 hari terakhir sebelum tanggal prediksi)
    harga_7hari = harga_kemarin['Harga'].tail(7)
    row['Rolling_Mean_7'] = harga_7hari.mean() if len(harga_7hari) > 0 else histori['Harga'].mean()
    row['Harga_Std_7']    = harga_7hari.std()  if len(harga_7hari) > 1 else 0.0

    # Fitur lokal: hari raya
    hari_raya = [
        # Tambahkan tanggal hari raya besar Manado di sini
        # Format: 'YYYY-MM-DD'
        f'{tanggal.year}-01-01',   # Tahun Baru
        f'{tanggal.year}-12-25',   # Natal
        f'{tanggal.year}-12-26',   # Hari Raya Natal (Manado)
    ]
    row['ls_Hari_Raya'] = 1 if tanggal.strftime('%Y-%m-%d') in hari_raya else 0

    return row

# ── Generate prediksi ─────────────────────────────────────────
def generate_prediksi() -> pd.DataFrame:
    cuaca   = get_cuaca(past_days=50)
    histori = get_histori_harga()

    hasil = []
    tanggal_mulai = datetime.today() + timedelta(days=1)   # mulai dari besok

    for i in range(HARI_PREDIKSI):
        tgl = tanggal_mulai + timedelta(days=i)
        row = build_row(tgl, histori, cuaca)

        # Susun fitur sesuai urutan training
        X = pd.DataFrame([row])[features]

        # Normalisasi
        X_scaled = scaler.transform(X)

        # Prediksi
        pred = model.predict(X_scaled)[0]

        # Interval sederhana ±10% (sesuaikan jika model punya interval confidence)
        bawah = round(pred * 0.90, 2)
        atas  = round(pred * 1.10, 2)

        hasil.append({
            'tanggal':        tgl.strftime('%Y-%m-%d'),
            'harga_prediksi': round(pred, 2),
            'harga_bawah':    bawah,
            'harga_atas':     atas,
        })
        print(f"  {tgl.date()} → Rp {pred:,.0f}  [{bawah:,.0f} – {atas:,.0f}]")

        # Update histori sementara dengan hasil prediksi agar lag hari berikutnya akurat
        baris_baru = pd.DataFrame([{
            'tanggal': tgl,
            'Harga':   pred,
            'TAVG':    row.get('TAVG', histori['TAVG'].mean()),
            'RH_AVG':  row.get('RH_AVG', histori['RH_AVG'].mean()),
            'RR':      row.get('RR', 0),
        }])
        histori = pd.concat([histori, baris_baru], ignore_index=True)

    return pd.DataFrame(hasil)

# ── Simpan ke MySQL ───────────────────────────────────────────
def simpan_ke_mysql(df: pd.DataFrame) -> None:
    import mysql.connector

    print("\nMenyimpan ke MySQL...")
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    sql = """
        INSERT INTO prediksi (tanggal, harga_prediksi, harga_bawah, harga_atas)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            harga_prediksi = VALUES(harga_prediksi),
            harga_bawah    = VALUES(harga_bawah),
            harga_atas     = VALUES(harga_atas),
            created_at     = CURRENT_TIMESTAMP
    """

    for _, row in df.iterrows():
        cursor.execute(sql, (
            row['tanggal'],
            float(row['harga_prediksi']),
            float(row['harga_bawah']),
            float(row['harga_atas']),
        ))

    conn.commit()
    print(f"  {cursor.rowcount} baris berhasil disimpan/diperbarui.")
    cursor.close()
    conn.close()

# ── Simpan ke CSV (backup) ────────────────────────────────────
def simpan_ke_csv(df: pd.DataFrame) -> None:
    output_path = '../data/prediksi_output.csv'
    df.to_csv(output_path, index=False)
    print(f"\nBackup CSV disimpan ke: {output_path}")

# ── Main ──────────────────────────────────────────────────────
if __name__ == '__main__':
    print("=" * 50)
    print("RicaHolic — Generator Prediksi Harga Rica")
    print(f"Tanggal sekarang: {datetime.today().date()}")
    print(f"Prediksi untuk:   {HARI_PREDIKSI} hari ke depan")
    print("=" * 50)

    df_prediksi = generate_prediksi()

    print(f"\nHasil prediksi ({len(df_prediksi)} hari):")
    print(df_prediksi.to_string(index=False))

    if SIMPAN_KE_CSV:
        simpan_ke_csv(df_prediksi)

    if SIMPAN_KE_DB:
        simpan_ke_mysql(df_prediksi)

    print("\nSelesai!")
