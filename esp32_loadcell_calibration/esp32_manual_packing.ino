/**
 * Kartu Kendali ESP32 Loadcell IoT - Manual Packing dengan LCD & RELAY (v6.0
 * CALIBRATION BUTTON)
 *
 * PERUBAHAN v6.0 (User Request):
 * - RESTORE COMMAND BUTTON -> GPIO 5
 * - BUTTON PRESSED -> MODE KALIBRASI ON-DEMAND (Raw Reading)
 * - BUTTON RELEASED -> KEMBALI KE BIASA
 * - Tetap No Filter (Raw Data) & Web Control Relay
 *
 * Hardware:
 * - ESP32 Development Board
 * - HX711 Loadcell Amplifier
 * - Loadcell Sensor
 * - Relay Module (Active HIGH/LOW configurable) -> GPIO 15
 * - I2C LCD Display 16x2
 * - Buzzer (Active/Passive)
 * - Button (Momentary) -> GPIO 5
 *
 */

#include <ArduinoJson.h>
#include <EEPROM.h>
#include <HTTPClient.h>
#include <HX711.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <Wire.h>

// ==================== KONFIGURASI LCD ====================
const int LCD_COLS = 16;
const int LCD_ROWS = 2;
const int LCD_ADDRESS = 0x27;

LiquidCrystal_I2C lcd(LCD_ADDRESS, LCD_COLS, LCD_ROWS);

// ==================== KONFIGURASI UTAMA ====================

// WiFi
const char *WIFI_SSID = "Harun";
const char *WIFI_PASSWORD = "harun3211";

// Backend API
const char *API_URL_INGEST =
    "https://be-cocobase-main.vercel.app/api/v1/iot/loadcell/ingest";

const char *DEVICE_TOKEN = "7400e85c-80ef-4352-8400-6361294d3050";

// Hardware Pins
const int LOADCELL_DOUT_PIN = 16;
const int LOADCELL_SCK_PIN = 4;
const int BUZZER_PIN = 2; // D2 (GPIO 2)
const int RELAY_PIN = 15; // PIN RELAY
const int BUTTON_PIN = 5; // CALIBRATION BUTTON (Baru/Restore)

// Konfigurasi Waktu
const unsigned long SEND_INTERVAL = 100;
const unsigned long WIFI_RECONNECT_INTERVAL = 30000;

// Konfigurasi EEPROM
const int EEPROM_SIZE = 512;
const int CAL_FACTOR_ADDR = 0;
float DEFAULT_CALIBRATION_FACTOR = 200.7046666666667;

// Satuan Berat
const bool USE_KILOGRAMS = false;
const float GRAM_TO_KG = 1000.0;

// ==================== VARIABEL GLOBAL ====================

HX711 scale;
float calibrationFactor = DEFAULT_CALIBRATION_FACTOR;
float targetThreshold = 5.0;
float relayThreshold = 10.0;

unsigned long lastSendTime = 0;
unsigned long lastWiFiCheckTime = 0;
bool isWiFiConnected = false;

// Status Buzzer & Relay
bool buzzerActive = false;
bool isRelayOn = false;

// Button & Calibration State
bool lastButtonState = HIGH;
bool isCalibrating = false;

// Debug timer
unsigned long lastDebugTime = 0;

// ==================== FUNGSI MONITOR MEMORI ====================

void printMemoryInfo() {
  Serial.printf("Free Heap: %d bytes | Min Free Heap: %d bytes\n",
                ESP.getFreeHeap(), ESP.getMinFreeHeap());
}

// ==================== UPDATE RELAY ====================

void setRelay(bool state) {
  if (state) {
    digitalWrite(RELAY_PIN, HIGH);
    isRelayOn = true;
    Serial.println("✅ RELAY ON (Web)");
  } else {
    digitalWrite(RELAY_PIN, LOW);
    isRelayOn = false;
    Serial.println("🛑 RELAY OFF (Web)");
  }
}

// ==================== BACA BERAT (RAW / NO FILTER) ====================

float getWeight() {
  if (!scale.is_ready())
    return 0.0;
  float rawWeight = scale.get_units(1);
  if (abs(rawWeight) < 2.0)
    rawWeight = 0.0;
  return rawWeight;
}

String formatWeight(float weight) {
  char buffer[16];
  if (USE_KILOGRAMS) {
    dtostrf(weight, 6, 4, buffer);
    return String(buffer) + " kg";
  } else {
    dtostrf(weight, 6, 1, buffer);
    return String(buffer) + " g";
  }
}

// ==================== ALARM & RELAY LOGIC ====================

void checkThresholdAlert(float currentWeightInGrams) {
  float currentWeightKg = currentWeightInGrams / GRAM_TO_KG;

  if (isRelayOn && currentWeightKg >= relayThreshold) {
    Serial.printf("🛑 AUTO-STOP: %.4f >= %.4f\n", currentWeightKg,
                  relayThreshold);
    setRelay(false);
  }

  if (currentWeightKg >= targetThreshold) {
    if (!buzzerActive) {
      buzzerActive = true;
      digitalWrite(BUZZER_PIN, HIGH);
    }
  } else if (currentWeightKg < targetThreshold) {
    if (buzzerActive) {
      buzzerActive = false;
      digitalWrite(BUZZER_PIN, LOW);
    }
  }
}

// ==================== FUNGSI LCD ====================

void updateLCDWeight(float weight) {
  lcd.setCursor(0, 0);
  String weightStr = formatWeight(weight);
  lcd.print(weightStr);
  for (int i = weightStr.length(); i < LCD_COLS; i++)
    lcd.print(" ");
}

void updateLCDStatus(String status) {
  lcd.setCursor(0, 1);
  if (status.length() > LCD_COLS)
    status = status.substring(0, LCD_COLS);
  lcd.print(status);
  for (int i = status.length(); i < LCD_COLS; i++)
    lcd.print(" ");
}

void showLCDMessage(String line1, String line2 = "") {
  lcd.clear();
  lcd.setCursor(0, 0);
  if (line1.length() > LCD_COLS)
    line1 = line1.substring(0, LCD_COLS);
  lcd.print(line1);

  if (line2.length() > 0) {
    lcd.setCursor(0, 1);
    if (line2.length() > LCD_COLS)
      line2 = line2.substring(0, LCD_COLS);
    lcd.print(line2);
  }
}

// ==================== KONFIGURASI & WIFI ====================

void saveCalibrationFactor(float factor) {
  EEPROM.put(CAL_FACTOR_ADDR, factor);
  EEPROM.commit();
}

float loadCalibrationFactor() {
  float factor;
  EEPROM.get(CAL_FACTOR_ADDR, factor);
  if (isnan(factor) || factor == 0 || factor < 0)
    return DEFAULT_CALIBRATION_FACTOR;
  return factor;
}

void connectToWiFi() {
  showLCDMessage("Konek WiFi...", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    isWiFiConnected = true;
    showLCDMessage("WiFi Terhubung", WiFi.localIP().toString());
    delay(2000);
  } else {
    isWiFiConnected = false;
    showLCDMessage("Gagal WiFi!", "Cek setelan");
    delay(2000);
  }
}

void checkWiFiConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    if (isWiFiConnected)
      isWiFiConnected = false;
    if (millis() - lastWiFiCheckTime >= WIFI_RECONNECT_INTERVAL) {
      connectToWiFi();
      lastWiFiCheckTime = millis();
    }
  } else {
    if (!isWiFiConnected)
      isWiFiConnected = true;
  }
}

// ==================== KIMIM DATA BERAT & CEK COMMAND ====================

void sendWeightData(float weight) {
  if (!isWiFiConnected)
    return;

  HTTPClient http;
  http.begin(API_URL_INGEST);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(3000);

  float weightToSend = weight / GRAM_TO_KG;

  JsonDocument doc;
  doc["token"] = DEVICE_TOKEN;
  doc["weight"] = round(weightToSend * 10000) / 10000.0;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    JsonDocument responseDoc;
    deserializeJson(responseDoc, response);

    if (responseDoc.containsKey("threshold")) {
      float newThreshold = responseDoc["threshold"].as<float>();
      if (newThreshold > 0)
        targetThreshold = newThreshold;
    }

    if (responseDoc.containsKey("relayThreshold")) {
      float newRelayThreshold = responseDoc["relayThreshold"].as<float>();
      if (newRelayThreshold > 0)
        relayThreshold = newRelayThreshold;
    }

    if (responseDoc.containsKey("command") &&
        responseDoc["command"].is<JsonObject>()) {
      JsonObject cmd = responseDoc["command"].as<JsonObject>();
      if (cmd.containsKey("type")) {
        String commandType = cmd["type"].as<String>();
        if (commandType == "TARE") {
          scale.tare();
        } else if (commandType == "START_RELAY") {
          setRelay(true);
        } else if (commandType == "STOP_RELAY") {
          setRelay(false);
        } else if (commandType == "CALIBRATE") {
          if (cmd.containsKey("value")) {
            calibrationFactor = cmd["value"].as<float>();
            scale.set_scale(calibrationFactor);
            saveCalibrationFactor(calibrationFactor);
          }
        }
      }
    }

    // LCD Standard Update
    if (!isCalibrating) {
      updateLCDWeight(weight);
      if (isRelayOn)
        updateLCDStatus("⚡ MENGISI... ⚡");
      else if (buzzerActive)
        updateLCDStatus("🔴 PENUH! >=Bts");
      else {
        char buf[16];
        snprintf(buf, sizeof(buf), "Target: %.2f kg", targetThreshold);
        updateLCDStatus(String(buf));
      }
    }
  }
  http.end();
}

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);
  pinMode(BUTTON_PIN, INPUT_PULLUP); // RESTORED BUTTON

  Wire.begin(21, 22);
  lcd.init();
  lcd.backlight();
  showLCDMessage("Cocobase v6.0", "Calibration Mode");
  delay(2000);

  EEPROM.begin(EEPROM_SIZE);
  calibrationFactor = loadCalibrationFactor();

  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  if (scale.is_ready()) {
    scale.set_scale(calibrationFactor);
    scale.tare();
  }

  connectToWiFi();
}

// ==================== LOOP UTAMA ====================

void loop() {
  // 1. CEK TOMBOL KALIBRASI
  int btnState = digitalRead(BUTTON_PIN);

  // Jika tombol ditekan (LOW) -> Masuk Mode Kalibrasi
  if (btnState == LOW) {
    if (!isCalibrating) {
      // Init Calibration
      isCalibrating = true;
      setRelay(false); // Safety

      showLCDMessage("KALIBRASI...", "Angkat Beban!");
      Serial.println("ENTRY CALIBRATION: Removing weights...");

      scale.set_scale(); // Reset scale to 1 (Raw)
      delay(2000);       // Wait for stability
      scale.tare();      // Zero with no weight

      showLCDMessage("TARUH BEBAN", "Tahan Tombol...");
      Serial.println("TARE DONE. Place known weight.");
      delay(2000);
    }

    // Loop Kalibrasi: Tampilkan Raw Value Terus menerus
    long reading = scale.get_units(10); // Average 10 readings for stability

    lcd.setCursor(0, 0);
    lcd.print("RAW VALUE:      ");
    lcd.setCursor(0, 1);
    lcd.print(String(reading) + "       ");

    Serial.print("Calibration Raw Reading: ");
    Serial.println(reading);
    delay(200);

  } else {
    // Tombol Dilepas (HIGH)
    if (isCalibrating) {
      // Exit Calibration
      isCalibrating = false;
      scale.set_scale(calibrationFactor); // Restore Factor
      showLCDMessage("Selesai Kalibr.", "Sistem Siap");
      Serial.println("EXIT CALIBRATION. Restored Factor.");
      delay(2000);
    }

    // Normal Operation
    checkWiFiConnection();

    if (millis() - lastSendTime >= SEND_INTERVAL) {
      if (scale.is_ready()) {
        float weight = getWeight();
        checkThresholdAlert(weight);
        sendWeightData(weight);
      }
      lastSendTime = millis();
    }
  }

  delay(10);
}
