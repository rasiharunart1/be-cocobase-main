# ESP32 Loadcell dengan Fitur Kalibrasi (Command Polling)

Firmware ini mendukung **Remote Calibration** dari Web Dashboard Vercel tanpa perlu IP Public atau Port Forwarding.

## 📡 Cara Kerja (Command Polling)

ESP32 secara aktif mengirim data berat ke server setiap detik. Saat server menerima data, server juga akan mengirimkan **perintah tertunda** (jika ada) dalam respons yang sama.

Contoh Alur:
1. Anda klik tombol "TARE" di Web Dashboard.
2. Server menyimpan perintah TARE.
3. ESP32 mengirim data berat -> Server membalas `{ "success": true, "command": { "type": "TARE" } }`.
4. ESP32 menerima balasan, membaca perintah, dan melakukan `scale.tare()`.

## 🛠️ Persiapan

1. **Install Library** di Arduino IDE:
   - `ArduinoJson` by Benoit Blanchon
   - `HX711` by Bogdan Necula
   - `WiFi` (Built-in)
   - `HTTPClient` (Built-in)
   - `EEPROM` (Built-in)

2. **Wiring ESP32 <-> HX711**:
   - `DOUT` -> GPIO 16
   - `SCK`  -> GPIO 4
   - `VCC`  -> 5V / 3.3V
   - `GND`  -> GND

## ⚙️ Konfigurasi Kode

Buka `esp32_loadcell_calibration.ino` dan edit baris berikut:

```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* deviceToken = "YOUR_DEVICE_TOKEN"; // Ambil dari Dashboard Device Management
```

## 🔧 Fitur

1. **Remote Tare**: Reset timbangan ke nol dari web.
2. **Remote Calibration**: Ubah faktor kalibrasi dari web.
3. **Auto Save**: Nilai kalibrasi tersimpan otomatis di EEPROM ESP32 (tahan restart).
4. **Real-time Ingestion**: Data berat terus dikirim ke dashboard untuk monitoring.

## ⚠️ Troubleshooting

- **Delay Kalibrasi**: Karena sistem polling, mungkin ada delay 1-2 detik antara klik tombol di web dan eksekusi di alat. Ini normal.
- **Data Tidak Masuk**: Cek Serial Monitor, pastikan WiFi connect dan HTTP Code 200.
