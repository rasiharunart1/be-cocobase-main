/**
 * ESP32 Loadcell IoT System - Manual Packing Trigger
 *
 * Features:
 * - Real-time weight monitoring (continuous data transmission)
 * - Manual packing trigger via push button
 * - Auto TARE after successful packing
 * - Remote calibration (TARE & CALIBRATE) via web dashboard
 * - EEPROM persistence for calibration factor
 * - WiFi auto-reconnect
 * - Session validation (backend checks for active session)
 *
 * Hardware:
 * - ESP32 Development Board
 * - HX711 Loadcell Amplifier
 * - Loadcell Sensor
 * - Push Button (Momentary)
 *
 * Wiring:
 * - HX711 DOUT -> GPIO 16
 * - HX711 SCK  -> GPIO 4
 * - Button     -> GPIO 5 (or use built-in BOOT button on GPIO 0)
 * - Button GND -> GND (with internal pull-up)
 */

#include <ArduinoJson.h>
#include <EEPROM.h>
#include <HTTPClient.h>
#include <HX711.h>
#include <WiFi.h>


// ==================== CONFIGURATION ====================

// WiFi Credentials
const char *WIFI_SSID = "Harun";         // GANTI dengan nama WiFi Anda
const char *WIFI_PASSWORD = "harun3211"; // GANTI dengan password WiFi Anda

// Backend API Configuration
const char *API_URL_INGEST =
    "https://be-cocobase-main.vercel.app/api/v1/iot/loadcell/ingest";
const char *API_URL_PACK =
    "https://be-cocobase-main.vercel.app/api/v1/iot/loadcell/pack";
const char *DEVICE_TOKEN =
    "7400e85c-80ef-4352-8400-6361294d3050"; // DAPATKAN dari halaman Device
                                            // Management

// HX711 Loadcell Pins
const int LOADCELL_DOUT_PIN = 16;
const int LOADCELL_SCK_PIN = 4;

// Push Button Pin
const int BUTTON_PIN = 5; // GPIO 5 (atau gunakan GPIO 0 untuk BOOT button)

// Timing Configuration
const unsigned long SEND_INTERVAL = 1000; // Send weight data every 1 second
const unsigned long WIFI_RECONNECT_INTERVAL = 30000;

// EEPROM Configuration
const int EEPROM_SIZE = 512;
const int CAL_FACTOR_ADDR = 0;

// Default Calibration Factor
float DEFAULT_CALIBRATION_FACTOR = 2280.0;

// ==================== GLOBAL VARIABLES ====================

HX711 scale;
float calibrationFactor = DEFAULT_CALIBRATION_FACTOR;
unsigned long lastSendTime = 0;
unsigned long lastWiFiCheckTime = 0;
bool isWiFiConnected = false;

// Button debouncing
bool lastButtonState = HIGH;
bool buttonState = HIGH;
unsigned long lastDebounceTime = 0;
const unsigned long debounceDelay = 50;

// ==================== HELPER FUNCTIONS ====================

void saveCalibrationFactor(float factor) {
  EEPROM.put(CAL_FACTOR_ADDR, factor);
  EEPROM.commit();
  Serial.println("✓ Calibration factor saved to EEPROM: " + String(factor));
}

float loadCalibrationFactor() {
  float factor;
  EEPROM.get(CAL_FACTOR_ADDR, factor);

  if (isnan(factor) || factor == 0 || factor < 0) {
    Serial.println("⚠ EEPROM empty or invalid, using default factor");
    return DEFAULT_CALIBRATION_FACTOR;
  }

  Serial.println("✓ Loaded calibration factor from EEPROM: " + String(factor));
  return factor;
}

void connectToWiFi() {
  Serial.println("\n========================================");
  Serial.println("Connecting to WiFi: " + String(WIFI_SSID));
  Serial.println("========================================");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    isWiFiConnected = true;
    Serial.println("\n✓ WiFi Connected!");
    Serial.println("IP Address: " + WiFi.localIP().toString());
  } else {
    isWiFiConnected = false;
    Serial.println("\n✗ WiFi Connection Failed!");
  }
}

void checkWiFiConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    if (isWiFiConnected) {
      Serial.println("⚠ WiFi connection lost!");
      isWiFiConnected = false;
    }

    if (millis() - lastWiFiCheckTime >= WIFI_RECONNECT_INTERVAL) {
      Serial.println("Attempting to reconnect to WiFi...");
      connectToWiFi();
      lastWiFiCheckTime = millis();
    }
  } else {
    if (!isWiFiConnected) {
      Serial.println("✓ WiFi reconnected!");
      isWiFiConnected = true;
    }
  }
}

// Send weight data for monitoring (no log creation)
void sendWeightData(float weight) {
  if (!isWiFiConnected)
    return;

  HTTPClient http;
  http.begin(API_URL_INGEST);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  StaticJsonDocument<256> doc;
  doc["token"] = DEVICE_TOKEN;
  doc["weight"] = round(weight * 100) / 100.0;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();

    // Check for pending command
    StaticJsonDocument<512> responseDoc;
    DeserializationError error = deserializeJson(responseDoc, response);

    if (!error && responseDoc.containsKey("command")) {
      JsonObject cmd = responseDoc["command"];
      String commandType = cmd["type"].as<String>();

      Serial.println("\n========================================");
      Serial.println("📥 COMMAND RECEIVED: " + commandType);
      Serial.println("========================================");

      if (commandType == "TARE") {
        Serial.println("Executing TARE (Reset to Zero)...");
        scale.tare();
        Serial.println("✓ TARE Complete");
      } else if (commandType == "CALIBRATE") {
        if (cmd.containsKey("value")) {
          float newFactor = cmd["value"].as<float>();

          Serial.println("Executing CALIBRATION...");
          Serial.println("Old Factor: " + String(calibrationFactor));
          Serial.println("New Factor: " + String(newFactor));

          calibrationFactor = newFactor;
          scale.set_scale(calibrationFactor);
          saveCalibrationFactor(calibrationFactor);

          Serial.println("✓ CALIBRATION Complete");
        }
      }

      Serial.println("========================================\n");
    }

  } else {
    Serial.printf("✗ HTTP Error: %d\n", httpResponseCode);
  }

  http.end();
}

// Send packing data (creates log if session active)
void sendPackingData(float weight) {
  if (!isWiFiConnected) {
    Serial.println("⚠ WiFi not connected, cannot send packing data");
    return;
  }

  Serial.println("\n========================================");
  Serial.println("📦 PACKING BUTTON PRESSED!");
  Serial.println("========================================");
  Serial.printf("Weight: %.2f kg\n", weight);
  Serial.println("Sending to backend...");

  HTTPClient http;
  http.begin(API_URL_PACK);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  StaticJsonDocument<256> doc;
  doc["token"] = DEVICE_TOKEN;
  doc["weight"] = round(weight * 100) / 100.0;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("HTTP: %d | Response: %s\n", httpResponseCode,
                  response.c_str());

    StaticJsonDocument<512> responseDoc;
    DeserializationError error = deserializeJson(responseDoc, response);

    if (!error) {
      bool success = responseDoc["success"];
      String message = responseDoc["message"].as<String>();

      if (success) {
        Serial.println("✓ " + message);
        Serial.println("Performing auto-TARE...");
        scale.tare();
        Serial.println("✓ Scale reset to 0 kg - Ready for next packing");
      } else {
        Serial.println("✗ " + message);
        Serial.println("⚠ TARE not performed - fix the issue first");
      }
    }

  } else {
    Serial.printf("✗ HTTP Error: %d\n", httpResponseCode);
    Serial.println("⚠ Packing not recorded");
  }

  Serial.println("========================================\n");
  http.end();
}

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n");
  Serial.println("========================================");
  Serial.println("  ESP32 Loadcell - Manual Packing v1.0");
  Serial.println("========================================");

  // Initialize EEPROM
  Serial.println("\n[1/5] Initializing EEPROM...");
  EEPROM.begin(EEPROM_SIZE);
  calibrationFactor = loadCalibrationFactor();

  // Initialize Button
  Serial.println("\n[2/5] Initializing Push Button...");
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Serial.println("✓ Button configured on GPIO " + String(BUTTON_PIN));
  Serial.println("  Press button to save packing data");

  // Initialize Loadcell
  Serial.println("\n[3/5] Initializing HX711 Loadcell...");
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);

  if (scale.is_ready()) {
    Serial.println("✓ HX711 detected and ready");

    scale.set_scale(calibrationFactor);
    Serial.println("Calibration factor: " + String(calibrationFactor));

    Serial.println("Performing auto-tare...");
    scale.tare();
    delay(1000);

    Serial.println("✓ Loadcell initialized");

  } else {
    Serial.println("✗ HX711 not detected! Check wiring");
  }

  // Connect to WiFi
  Serial.println("\n[4/5] Connecting to WiFi...");
  connectToWiFi();

  // Final setup
  Serial.println("\n[5/5] Setup Complete!");
  Serial.println("========================================");
  Serial.println("Device Token: " + String(DEVICE_TOKEN));
  Serial.println("Monitoring URL: " + String(API_URL_INGEST));
  Serial.println("Packing URL: " + String(API_URL_PACK));
  Serial.println("========================================");
  Serial.println("\n🚀 System Ready!");
  Serial.println("- Weight data sent every " + String(SEND_INTERVAL) + "ms");
  Serial.println("- Press button to record packing\n");

  delay(2000);
}

// ==================== MAIN LOOP ====================

void loop() {
  // Check WiFi connection
  checkWiFiConnection();

  // Read button state with debouncing
  int reading = digitalRead(BUTTON_PIN);

  if (reading != lastButtonState) {
    lastDebounceTime = millis();
  }

  if ((millis() - lastDebounceTime) > debounceDelay) {
    if (reading != buttonState) {
      buttonState = reading;

      // Button pressed (LOW because of pull-up)
      if (buttonState == LOW) {
        if (scale.is_ready()) {
          float weight = scale.get_units(10); // More averaging for button press
          sendPackingData(weight);
        } else {
          Serial.println("⚠ HX711 not ready, cannot record packing");
        }
      }
    }
  }

  lastButtonState = reading;

  // Send weight data for monitoring at regular interval
  if (millis() - lastSendTime >= SEND_INTERVAL) {
    if (scale.is_ready()) {
      float weight = scale.get_units(5);
      sendWeightData(weight);
    }
    lastSendTime = millis();
  }

  delay(10);
}

// ==================== END OF CODE ====================
