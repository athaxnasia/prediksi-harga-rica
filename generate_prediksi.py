import pandas as pd
import numpy as np
import joblib
import requests
import mysql.connector
from datetime import datetime, timedelta

# ── 1. Load model & scaler ──────────────────────────────────
model        = joblib.load('models/model_rf_rica_manado_final.pkl')
scaler       = joblib.load('models/scaler_rica_manado_final.pkl')
feature_cols = joblib.load('models/feature_cols.pkl')

print("Model loaded.")

# ── 2. Load histori harga dari CSV ──────────────────────────
df = pd.read_csv('data/processed/clean_dataset_rica_manado_final.csv')
df['Tanggal'] = pd.to_datetime(df['Tanggal'])
df = df.sort_values('Tanggal').reset_index(drop=True)

df['Rolling_Mean_7']  = df['Harga'].rolling(window=7).mean()
df['Rolling_Mean_14'] = df['Harga'].rolling(window=14).mean()
df['Harga_Std_7']     = df['Harga'].rolling(window=7).std()
df['Harga_Lag_30']    = df['Harga'].shift(30)
df['RR_Lag_44']       = df['RR'].shift(44)
df = df.dropna().reset_index(drop=True)

print(f"Histori harga loaded: {len(df)} baris")
print(f"Data terakhir: {df['Tanggal'].max().date()}")

# ── 3. Ambil data cuaca dari Open-Meteo ─────────────────────
print("Mengambil data cuaca dari Open-Meteo...")

url = "https://api.open-meteo.com/v1/forecast"
params = {
    "latitude"     : 1.4748,
    "longitude"    : 124.8421,
    "daily"        : ["temperature_2m_mean", "relative_humidity_2m_mean", "precipitation_sum"],
    "timezone"     : "Asia/Makassar",
    "past_days"    : 50,
    "forecast_days": 7
}

response = requests.get(url, params=params)
cuaca    = response.json()

df_cuaca = pd.DataFrame({
    'Tanggal': pd.to_datetime(cuaca['daily']['time']),
    'TAVG'   : cuaca['daily']['temperature_2m_mean'],
    'RH_AVG' : cuaca['daily']['relative_humidity_2m_mean'],
    'RR'     : cuaca['daily']['precipitation_sum']
})

today          = pd.Timestamp(datetime.now().date())
cuaca_hist     = df_cuaca[df_cuaca['Tanggal'] <  today].copy()
cuaca_forecast = df_cuaca[df_cuaca['Tanggal'] >= today].copy()

print(f"Data cuaca forecast: {len(cuaca_forecast)} hari ke depan")

# ── 4. Generate prediksi 7 hari ke depan ────────────────────
print("Generating prediksi...")

hasil_prediksi = []
harga_series   = df['Harga'].tolist()

for i, row in cuaca_forecast.iterrows():
    tanggal = row['Tanggal']
    tavg    = row['TAVG']
    rh_avg  = row['RH_AVG']
    rr      = row['RR']

    idx_lag44 = cuaca_hist[cuaca_hist['Tanggal'] == tanggal - timedelta(days=44)]['RR']
    rr_lag44  = idx_lag44.values[0] if len(idx_lag44) > 0 else df['RR'].mean()

    harga_lag1  = harga_series[-1]
    harga_lag7  = harga_series[-7]  if len(harga_series) >= 7  else harga_series[0]
    harga_lag30 = harga_series[-30] if len(harga_series) >= 30 else harga_series[0]

    rolling7  = np.mean(harga_series[-7:])
    rolling14 = np.mean(harga_series[-14:]) if len(harga_series) >= 14 else np.mean(harga_series)
    std7      = np.std(harga_series[-7:])   if len(harga_series) >= 7  else np.std(harga_series)

    bulan        = tanggal.month
    tahun        = tanggal.year
    is_hari_raya = 1 if bulan in [12, 1] else 0

    input_data = pd.DataFrame([[
        rr, tavg, rh_avg, rr_lag44,
        harga_lag1, harga_lag7, harga_lag30,
        rolling7, rolling14, std7,
        bulan, tahun, is_hari_raya
    ]], columns=feature_cols)

    input_scaled = pd.DataFrame(scaler.transform(input_data), columns=feature_cols)
    pred         = model.predict(input_scaled)[0]
    margin       = pred * 0.08

    hasil_prediksi.append({
        'tanggal'            : tanggal.date(),
        'harga_prediksi'     : round(pred * 1000),
        'harga_prediksi_low' : round((pred - margin) * 1000),
        'harga_prediksi_high': round((pred + margin) * 1000)
    })

    harga_series.append(pred)

# ── 5. Simpan ke CSV ────────────────────────────────────────
df_hasil = pd.DataFrame(hasil_prediksi)
df_hasil.to_csv('data/processed/prediksi_output.csv', index=False)
print(df_hasil.to_string(index=False))

# ── 6. INSERT ke MySQL ───────────────────────────────────────
conn = mysql.connector.connect(
    host     = "localhost",
    user     = "root",
    password = "",
    database = "ricaholic"
)
cursor = conn.cursor()

for row in hasil_prediksi:
    cursor.execute("""
        INSERT INTO prediksi (tanggal, harga_prediksi, harga_bawah, harga_atas, created_at)
        VALUES (%s, %s, %s, %s, NOW())
        ON DUPLICATE KEY UPDATE
            harga_prediksi = VALUES(harga_prediksi),
            harga_bawah    = VALUES(harga_bawah),
            harga_atas     = VALUES(harga_atas)
    """, (
        row['tanggal'],
        row['harga_prediksi'],
        row['harga_prediksi_low'],
        row['harga_prediksi_high']
    ))

conn.commit()
cursor.close()
conn.close()
print("Prediksi berhasil disimpan ke MySQL.")