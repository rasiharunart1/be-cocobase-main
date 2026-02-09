/**
 * ESP32 Loadcell IoT - Manual Packing (v7.0 WiFiManager + Simplified)
 *
 * FITUR:
 * 1. WiFiManager: Auto-Connect / Captive Portal (AP: "Cocobase_Config")
 * 2. Button (GPIO 5): Tekan Tahan 3 Detik -> Reset WiFi Settings
 * 3. Relay (GPIO 15): Web Control + Auto-Stop (Threshold)
 * 4. Loadcell: Raw Data (No Filter)
 * 5. Bahasa Indonesia
 */

#include <ArduinoJson.h>
#include <EEPROM.h>
#include <HTTPClient.h>
#include <HX711.h>
#include <LiquidCrystal_I2C.h>
#include <WiFiManager.h> // Install library by tzapu
#include <Wire.h>

// --- KONFIGURASI ---
const char *DEVICE_TOKEN = "7400e85c-80ef-4352-8400-6361294d3050";
const char *API_URL =
    "https://be-cocobase-main.vercel.app/api/v1/iot/loadcell/ingest";

// Pin Mapping
#define PIN_DOUT 16
#define PIN_SCK 4
#define PIN_RELAY 15
#define PIN_BUZZER 2
#define PIN_BUTTON 5 // Reset WiFi

// LCD
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Loadcell
HX711 scale;
float calibrationFactor = 200.70; // Default
float targetThreshold = 5.0;      // Auto-Log
float relayThreshold = 10.0;      // Auto-Stop

// Variables
bool isRelayOn = false;
unsigned long lastSend = 0;
unsigned long btnPressTime = 0;
bool btnHeld = false;

// --- FUNGSI BANTUAN ---

void showLCD(String line1, String line2 = "") {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1.substring(0, 16));
  if (line2 != "") {
    lcd.setCursor(0, 1);
    lcd.print(line2.substring(0, 16));
  }
}

void setRelay(bool state) {
  isRelayOn = state;
  digitalWrite(PIN_RELAY, state ? HIGH : LOW);
  Serial.printf("RELAY: %s\n", state ? "ON" : "OFF");
}

void updateLCDStatus(float weight) {
  lcd.setCursor(0, 0);
  lcd.printf("%.1f g        ", weight); // Raw Grams

  lcd.setCursor(0, 1);
  if (isRelayOn)
    lcd.print("MENGISI...      ");
  else if (weight >= scale.get_units(1))
    lcd.printf("Target: %.1f    ", targetThreshold);
}

// --- LOGIKA UTAMA ---

void checkPeripherals(float weight) {
  // 1. Auto-Stop Relay
  if (isRelayOn && (weight / 1000.0) >= relayThreshold) {
    setRelay(false);
    showLCD("PENUH!", "Relay OFF");
    delay(1000);
  }
}

void sendData(float weight) {
  if (WiFi.status() != WL_CONNECTED)
    return;

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");

  JsonDocument doc;
  doc["token"] = DEVICE_TOKEN;
  doc["weight"] = weight / 1000.0; // Kirim KG

  String json;
  serializeJson(doc, json);

  int code = http.POST(json);
  if (code > 0) {
    String resp = http.getString();
    JsonDocument rDoc;
    deserializeJson(rDoc, resp);

    // Update Thresholds
    if (rDoc["threshold"] > 0)
      targetThreshold = rDoc["threshold"];
    if (rDoc["relayThreshold"] > 0)
      relayThreshold = rDoc["relayThreshold"];

    // Handle Commands
    String cmd = rDoc["command"]["type"];
    if (cmd == "TARE")
      scale.tare();
    else if (cmd == "START_RELAY")
      setRelay(true);
    else if (cmd == "STOP_RELAY")
      setRelay(false);
    else if (cmd == "CALIBRATE") {
      float val = rDoc["command"]["value"];
      if (val > 0) {
        calibrationFactor = val;
        scale.set_scale(calibrationFactor);
        EEPROM.put(0, calibrationFactor);
        EEPROM.commit();
      }
    }
  }
  http.end();
}

// --- SETUP ---

void setup() {
  Serial.begin(115200);
  EEPROM.begin(512);

  // Init Pins
  pinMode(PIN_RELAY, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_BUTTON, INPUT_PULLUP);

  // Init LCD
  Wire.begin(21, 22);
  lcd.init();
  lcd.backlight();
  showLCD("Cocobase v7.0", "WiFi Manager");

  // Load Config
  EEPROM.get(0, calibrationFactor);
  if (isnan(calibrationFactor))
    calibrationFactor = 200.70;

  // Init Loadcell
  scale.begin(PIN_DOUT, PIN_SCK);
  scale.set_scale(calibrationFactor);
  scale.tare();

  // WiFi Manager
  WiFiManager wm;
  // wm.resetSettings(); // Un-comment untuk wipe settings tiap boot (Debug)

  wm.setAPCallback([](WiFiManager *myWiFiManager) {
    showLCD("Mode Konfigurasi", "IP: 192.168.4.1");
    Serial.println("Masuk Mode AP config");
  });

  if (!wm.autoConnect("Cocobase_Config")) {
    Serial.println("Gagal Konek/Timeout");
    ESP.restart();
  }

  showLCD("WiFi Terhubung!", WiFi.localIP().toString());
  delay(2000);
}

// --- LOOP ---

void loop() {
  // 1. Cek Button Reset WiFi (Tahan 3 Detik)
  if (digitalRead(PIN_BUTTON) == LOW) {
    if (btnPressTime == 0)
      btnPressTime = millis();
    if (millis() - btnPressTime > 3000 && !btnHeld) {
      btnHeld = true;
      showLCD("RESET WIFI...", "Lepas Tombol");

      WiFiManager wm;
      wm.resetSettings();
      delay(1000);
      showLCD("Restarting...", "");
      delay(1000);
      ESP.restart();
    }
  } else {
    btnPressTime = 0;
    btnHeld = false;
  }

  // 2. Loop Utama
  if (millis() - lastSend >= 100) {
    if (scale.is_ready()) {
      float weight = scale.get_units(1); // Raw No Filter
      if (abs(weight) < 2.0)
        weight = 0.0;

      checkPeripherals(weight);
      sendData(weight);

      if (!isRelayOn)
        updateLCDStatus(weight);
    }
    lastSend = millis();
  }
}
