# 📟 ESP32 Loadcell IoT System - Complete Guide

Firmware lengkap untuk sistem monitoring loadcell dengan fitur remote calibration dan real-time data transmission.

## ✨ Fitur Utama

### 1. **Real-time Weight Monitoring**
- Pembacaan berat secara kontinyu dengan averaging untuk stabilitas
- Pengiriman data ke backend setiap 1 detik
- Deteksi otomatis threshold untuk packing events

### 2. **Remote Calibration**
- **TARE**: Reset timbangan ke nol dari web dashboard
- **CALIBRATE**: Ubah faktor kalibrasi dari web dashboard
- Tidak perlu IP Public atau Port Forwarding (menggunakan command polling)

### 3. **EEPROM Persistence**
- Faktor kalibrasi tersimpan otomatis di EEPROM
- Tahan terhadap restart/power cycle
- Auto-load saat startup

### 4. **WiFi Management**
- Auto-connect saat startup
- Auto-reconnect jika koneksi terputus
- Status monitoring real-time

### 5. **Error Handling**
- HTTP timeout protection
- WiFi reconnection logic
- HX711 ready check
- Detailed serial logging

---

## 🛠️ Hardware Requirements

### Components
- **ESP32 Development Board** (any variant)
- **HX711 Loadcell Amplifier Module**
- **Loadcell Sensor** (any capacity)
- **Jumper Wires**
- **USB Cable** for programming

### Wiring Diagram

```
ESP32          HX711
-----          -----
GPIO 16  <-->  DOUT (Data Out)
GPIO 4   <-->  SCK  (Serial Clock)
5V/3.3V  <-->  VCC  (Power)
GND      <-->  GND  (Ground)
```

**Important Notes:**
- HX711 dapat bekerja dengan 5V atau 3.3V
- Pastikan koneksi kabel kuat dan tidak longgar
- Gunakan kabel pendek untuk mengurangi noise

---

## 📚 Software Requirements

### Arduino IDE Setup

1. **Install Arduino IDE**
   - Download dari: https://www.arduino.cc/en/software
   - Versi minimum: 1.8.x atau Arduino IDE 2.x

2. **Install ESP32 Board Support**
   - Buka Arduino IDE
   - File → Preferences
   - Tambahkan URL berikut ke "Additional Board Manager URLs":
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Tools → Board → Boards Manager
   - Cari "esp32" dan install "ESP32 by Espressif Systems"

3. **Install Required Libraries**
   
   Buka Sketch → Include Library → Manage Libraries, lalu install:
   
   | Library | Author | Version |
   |---------|--------|---------|
   | **HX711** | Bogdan Necula | Latest |
   | **ArduinoJson** | Benoit Blanchon | 6.x or 7.x |
   
   Libraries berikut sudah built-in:
   - WiFi
   - HTTPClient
   - EEPROM

---

## ⚙️ Configuration

### 1. Edit File `esp32_loadcell_complete.ino`

Buka file dan ubah bagian **CONFIGURATION** di baris 32-43:

```cpp
// WiFi Credentials
const char* WIFI_SSID = "NamaWiFiAnda";           // ← GANTI INI
const char* WIFI_PASSWORD = "PasswordWiFiAnda";   // ← GANTI INI

// Backend API Configuration
const char* API_URL = "https://be-cocobase-main.vercel.app/api/v1/iot/loadcell/ingest";
const char* DEVICE_TOKEN = "abc123xyz";           // ← GANTI INI
```

### 2. Dapatkan Device Token

1. Login ke dashboard web Anda
2. Buka halaman **"Management Alat"** atau **"Devices"**
3. Klik **"Add Device"** atau pilih device yang sudah ada
4. Copy **Device Token** (contoh: `dev_abc123xyz456`)
5. Paste ke variable `DEVICE_TOKEN` di kode

### 3. Upload ke ESP32

1. Hubungkan ESP32 ke komputer via USB
2. Tools → Board → ESP32 Arduino → **ESP32 Dev Module** (atau sesuai board Anda)
3. Tools → Port → Pilih port COM ESP32 Anda
4. Klik tombol **Upload** (→)
5. Tunggu hingga "Done uploading"

### 4. Monitor Serial Output

1. Tools → Serial Monitor
2. Set baud rate ke **115200**
3. Anda akan melihat output seperti:

```
========================================
  ESP32 Loadcell IoT System v2.0
========================================

[1/4] Initializing EEPROM...
✓ Loaded calibration factor from EEPROM: 2280.00

[2/4] Initializing HX711 Loadcell...
✓ HX711 detected and ready
...
```

---

## 🔧 Calibration Process

### Langkah-langkah Kalibrasi

#### **Step 1: TARE (Reset ke Nol)**

1. Pastikan timbangan **kosong** (tidak ada beban)
2. Buka web dashboard → halaman **IoT Monitoring**
3. Pilih device Anda dari dropdown
4. Klik tombol **"Calibration Mode"**
5. Klik **"TARE NOW"**
6. Tunggu 1-2 detik
7. Serial Monitor akan menampilkan:
   ```
   📥 COMMAND RECEIVED: TARE
   Executing TARE (Reset to Zero)...
   ✓ TARE Complete - Scale reset to 0 kg
   ```
8. Dashboard akan menampilkan berat **0.00 kg**

#### **Step 2: CALIBRATE (Set Faktor)**

1. Siapkan **beban dengan berat yang diketahui** (contoh: 1 kg, 5 kg, 10 kg)
2. **Letakkan beban** di atas timbangan
3. Lihat pembacaan di dashboard (contoh: menampilkan 4.52 kg padahal beban 5 kg)
4. Di modal Calibration, masukkan **berat sebenarnya** (contoh: 5)
5. Klik **"CALIBRATE"**
6. Serial Monitor akan menampilkan:
   ```
   📥 COMMAND RECEIVED: CALIBRATE
   Executing CALIBRATION...
   Old Factor: 2280.00
   New Factor: 2053.44
   ✓ CALIBRATION Complete
   ✓ Calibration factor saved to EEPROM: 2053.44
   ```
7. Dashboard sekarang akan menampilkan **5.00 kg** (akurat!)

#### **Step 3: Verifikasi**

1. Angkat beban → harus kembali ke ~0 kg
2. Letakkan beban lagi → harus menampilkan berat yang benar
3. Test dengan beban berbeda untuk memastikan akurasi
4. Faktor kalibrasi sudah tersimpan, tidak perlu kalibrasi ulang kecuali ganti loadcell

---

## 📊 How It Works

### Command Polling System

```
┌─────────┐                    ┌─────────┐
│  ESP32  │                    │ Backend │
└────┬────┘                    └────┬────┘
     │                              │
     │  POST /ingest               │
     │  { weight: 12.5 }           │
     ├────────────────────────────>│
     │                              │
     │  Response:                   │
     │  { success: true,            │
     │    command: {                │
     │      type: "TARE"            │
     │    }                         │
     │  }                           │
     │<────────────────────────────┤
     │                              │
     │  Execute TARE                │
     │  scale.tare()                │
     │                              │
```

**Keuntungan:**
- ✅ Tidak perlu IP Public
- ✅ Tidak perlu Port Forwarding
- ✅ Bekerja di balik NAT/Firewall
- ✅ Simple dan reliable

**Trade-off:**
- ⏱️ Delay 1-2 detik antara klik tombol dan eksekusi (karena polling interval)

---

## 🐛 Troubleshooting

### Problem: "HX711 not detected"

**Penyebab:**
- Wiring salah atau kabel lepas
- HX711 rusak
- Pin GPIO salah

**Solusi:**
1. Cek ulang wiring sesuai diagram
2. Pastikan semua koneksi kencang
3. Coba ganti kabel jumper
4. Test HX711 dengan multimeter (VCC harus ada tegangan)
5. Coba ganti pin GPIO di kode:
   ```cpp
   const int LOADCELL_DOUT_PIN = 16;  // Coba pin lain
   const int LOADCELL_SCK_PIN = 4;    // Coba pin lain
   ```

---

### Problem: "WiFi Connection Failed"

**Penyebab:**
- SSID atau password salah
- WiFi 5GHz (ESP32 hanya support 2.4GHz)
- Signal terlalu lemah

**Solusi:**
1. Cek SSID dan password (case-sensitive!)
2. Pastikan WiFi adalah 2.4GHz, bukan 5GHz
3. Dekatkan ESP32 ke router
4. Coba restart router
5. Test dengan hotspot HP

---

### Problem: "HTTP Error -1" atau "HTTP Error -11"

**Penyebab:**
- Backend tidak bisa diakses
- Timeout
- SSL certificate issue (jika HTTPS)

**Solusi:**
1. Test API URL di browser/Postman
2. Pastikan backend sudah deploy dan running
3. Cek Serial Monitor untuk detail error
4. Increase timeout:
   ```cpp
   http.setTimeout(15000); // 15 detik
   ```

---

### Problem: Pembacaan tidak stabil / loncat-loncat

**Penyebab:**
- Loadcell tidak terpasang dengan baik
- Electrical noise
- Kabel terlalu panjang
- Grounding issue

**Solusi:**
1. Pastikan loadcell terpasang kencang dan rata
2. Gunakan kabel sependk mungkin
3. Tambahkan kapasitor 100nF antara VCC dan GND HX711
4. Increase averaging:
   ```cpp
   float weight = scale.get_units(20); // Dari 5 jadi 20
   ```
5. Jauhkan dari sumber noise (motor, relay, dll)

---

### Problem: Kalibrasi tidak akurat

**Penyebab:**
- Tidak melakukan TARE sebelum kalibrasi
- Beban referensi tidak akurat
- Loadcell overload atau rusak

**Solusi:**
1. **WAJIB** TARE dulu sebelum kalibrasi
2. Gunakan beban referensi yang akurat (timbangan digital)
3. Pastikan beban dalam range loadcell (jangan overload)
4. Ulangi kalibrasi beberapa kali untuk konsistensi
5. Test dengan beban berbeda

---

### Problem: Data tidak masuk ke dashboard

**Penyebab:**
- Device token salah
- Device belum dibuat di dashboard
- Backend error

**Solusi:**
1. Cek Serial Monitor untuk HTTP response code
2. Pastikan device token benar (copy-paste dari dashboard)
3. Cek di dashboard apakah device sudah terdaftar
4. Lihat backend logs di Vercel untuk error
5. Test dengan Postman:
   ```json
   POST https://be-cocobase-main.vercel.app/api/v1/iot/loadcell/ingest
   Content-Type: application/json
   
   {
     "token": "your-device-token",
     "weight": 12.5
   }
   ```

---

## 📈 Performance Tips

### 1. Optimize Send Interval

Untuk battery-powered devices atau mengurangi beban server:

```cpp
const unsigned long SEND_INTERVAL = 5000; // 5 detik instead of 1 detik
```

### 2. Reduce Averaging for Faster Response

Jika pembacaan sudah stabil:

```cpp
float weight = scale.get_units(3); // Dari 5 jadi 3
```

### 3. Add Deep Sleep (Advanced)

Untuk battery operation:

```cpp
#include <esp_sleep.h>

void loop() {
  // Send data
  sendDataAndCheckCommands(weight);
  
  // Sleep for 10 seconds
  esp_sleep_enable_timer_wakeup(10 * 1000000); // microseconds
  esp_deep_sleep_start();
}
```

---

## 🔐 Security Notes

1. **Device Token**: Simpan dengan aman, jangan share ke publik
2. **WiFi Credentials**: Jangan commit ke Git dengan credentials asli
3. **HTTPS**: Gunakan HTTPS untuk production (sudah default di kode)

---

## 📝 Serial Monitor Output Examples

### Normal Operation
```
📤 Weight: 12.35 kg | HTTP: 200 | Response: {"success":true,"message":"Reading recorded"}
📤 Weight: 12.38 kg | HTTP: 200 | Response: {"success":true,"message":"Reading recorded"}
📤 Weight: 12.40 kg | HTTP: 200 | Response: {"success":true,"message":"Reading recorded"}
```

### Packing Event Detected
```
📤 Weight: 15.20 kg | HTTP: 200 | Response: {"success":true,"message":"Packing event recorded","alert":true}
```

### TARE Command
```
📤 Weight: 5.23 kg | HTTP: 200 | Response: {"success":true,"command":{"type":"TARE"}}

========================================
📥 COMMAND RECEIVED: TARE
========================================
Executing TARE (Reset to Zero)...
✓ TARE Complete - Scale reset to 0 kg
========================================
```

### CALIBRATE Command
```
📤 Weight: 4.52 kg | HTTP: 200 | Response: {"success":true,"command":{"type":"CALIBRATE","value":2053.44}}

========================================
📥 COMMAND RECEIVED: CALIBRATE
========================================
Executing CALIBRATION...
Old Factor: 2280.00
New Factor: 2053.44
✓ CALIBRATION Complete
✓ Calibration factor saved to EEPROM: 2053.44
========================================
```

---

## 🎓 Advanced Customization

### Change GPIO Pins

```cpp
const int LOADCELL_DOUT_PIN = 25;  // Ganti ke GPIO 25
const int LOADCELL_SCK_PIN = 26;   // Ganti ke GPIO 26
```

### Add Button for Manual Tare

```cpp
const int BUTTON_PIN = 0; // GPIO 0 (BOOT button)

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  // ... rest of setup
}

void loop() {
  // Check button press
  if (digitalRead(BUTTON_PIN) == LOW) {
    Serial.println("Button pressed - Performing TARE");
    scale.tare();
    delay(1000); // Debounce
  }
  
  // ... rest of loop
}
```

### Add LED Indicator

```cpp
const int LED_PIN = 2; // Built-in LED

void setup() {
  pinMode(LED_PIN, OUTPUT);
  // ... rest of setup
}

void sendDataAndCheckCommands(float weight) {
  digitalWrite(LED_PIN, HIGH); // LED ON saat kirim data
  
  // ... HTTP code ...
  
  digitalWrite(LED_PIN, LOW); // LED OFF setelah selesai
}
```

---

## 📞 Support

Jika masih ada masalah:

1. **Check Serial Monitor** untuk error messages
2. **Check Backend Logs** di Vercel dashboard
3. **Test Hardware** dengan example code sederhana
4. **Verify Configuration** (WiFi, token, URL)

---

## 📄 License

MIT License - Free to use and modify

---

**Happy Coding! 🚀**
