# 🚀 Quick Start Guide - ESP32 Loadcell

Panduan singkat untuk mulai menggunakan ESP32 Loadcell IoT System.

## 📋 Checklist Persiapan

- [ ] ESP32 Development Board
- [ ] HX711 Loadcell Amplifier
- [ ] Loadcell Sensor
- [ ] Kabel Jumper
- [ ] Arduino IDE terinstall
- [ ] WiFi 2.4GHz tersedia

---

## ⚡ 5 Langkah Setup

### 1️⃣ Install Libraries

Buka Arduino IDE → Sketch → Include Library → Manage Libraries

Install 2 library ini:
- **HX711** (by Bogdan Necula)
- **ArduinoJson** (by Benoit Blanchon)

### 2️⃣ Wiring

```
ESP32 GPIO 16  →  HX711 DOUT
ESP32 GPIO 4   →  HX711 SCK
ESP32 5V       →  HX711 VCC
ESP32 GND      →  HX711 GND
```

### 3️⃣ Edit Konfigurasi

Buka `esp32_loadcell_complete.ino` dan ubah:

```cpp
const char* WIFI_SSID = "NamaWiFiAnda";
const char* WIFI_PASSWORD = "PasswordWiFiAnda";
const char* DEVICE_TOKEN = "token-dari-dashboard";
```

**Cara dapat Device Token:**
1. Login ke dashboard web
2. Buka "Management Alat"
3. Add Device atau pilih device yang ada
4. Copy token

### 4️⃣ Upload ke ESP32

1. Tools → Board → ESP32 Dev Module
2. Tools → Port → Pilih port COM ESP32
3. Klik Upload (→)
4. Tunggu "Done uploading"

### 5️⃣ Test & Monitor

1. Tools → Serial Monitor (115200 baud)
2. Lihat output:
   ```
   ✓ WiFi Connected!
   ✓ HX711 detected and ready
   📤 Weight: 0.00 kg | HTTP: 200
   ```
3. Buka dashboard → IoT Monitoring
4. Lihat data real-time masuk!

---

## 🔧 Kalibrasi (2 Langkah)

### Step 1: TARE
1. Kosongkan timbangan
2. Dashboard → Calibration Mode → **TARE NOW**
3. Tunggu 2 detik → berat jadi 0.00 kg ✓

### Step 2: CALIBRATE
1. Letakkan beban 1 kg (atau berat yang diketahui)
2. Dashboard menampilkan (misal) 0.87 kg
3. Calibration modal → masukkan **1** (berat sebenarnya)
4. Klik **CALIBRATE**
5. Sekarang menampilkan 1.00 kg ✓

**Done!** Kalibrasi tersimpan otomatis.

---

## ❓ Troubleshooting Cepat

| Problem | Solusi |
|---------|--------|
| HX711 not detected | Cek wiring, pastikan kabel tidak lepas |
| WiFi failed | Pastikan WiFi 2.4GHz, cek SSID & password |
| HTTP Error | Cek device token, pastikan backend running |
| Data tidak masuk | Cek Serial Monitor untuk error detail |
| Pembacaan loncat | Tambah averaging: `get_units(20)` |

---

## 📖 Dokumentasi Lengkap

Lihat **COMPLETE_GUIDE.md** untuk:
- Penjelasan detail setiap fitur
- Troubleshooting lengkap
- Advanced customization
- Performance tips
- Security notes

---

## 🎯 Fitur Utama

✅ Real-time weight monitoring  
✅ Remote TARE dari web  
✅ Remote CALIBRATE dari web  
✅ Auto-save ke EEPROM  
✅ WiFi auto-reconnect  
✅ Threshold detection  
✅ Command polling (no port forwarding needed)  

---

**Selamat mencoba! 🎉**

Jika ada masalah, cek Serial Monitor (115200 baud) untuk detail error.
