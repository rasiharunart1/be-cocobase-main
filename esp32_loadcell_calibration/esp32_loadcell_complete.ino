/**
 * ESP32 Loadcell IoT System - Complete Version
 *
 * Features:
 * - Real-time weight monitoring and HTTP data transmission
 * - Remote calibration (TARE & CALIBRATE) via web dashboard
 * - Automatic threshold detection for packing events
 * - EEPROM persistence for calibration factor
 * - WiFi auto-reconnect
 * - Command polling from backend
 *
 * Hardware:
 * - ESP32 Development Board
 * - HX711 Loadcell Amplifier
 * - Loadcell Sensor
 *
 * Wiring:
 * - HX711 DOUT -> GPIO 16
 * - HX711 SCK  -> GPIO 4
 * - HX711 VCC  -> 5V or 3.3V
 * - HX711 GND  -> GND
 *
 * Libraries Required:
 * - HX711 (by Bogdan Necula)
 * - ArduinoJson (by Benoit Blanchon)
 * - WiFi (built-in)
 * - HTTPClient (built-in)
 * - EEPROM (built-in)
 */

#include <ArduinoJson.h>
#include <EEPROM.h>
#include <HTTPClient.h>
#include <HX711.h>
#include <WiFi.h>


// ==================== CONFIGURATION ====================

// WiFi Credentials
const char *WIFI_SSID = "YOUR_WIFI_SSID"; // GANTI dengan nama WiFi Anda
const char *WIFI_PASSWORD =
    "YOUR_WIFI_PASSWORD"; // GANTI dengan password WiFi Anda

// Backend API Configuration
const char *API_URL =
    "https://be-cocobase-main.vercel.app/api/v1/iot/loadcell/ingest";
const char *DEVICE_TOKEN =
    "YOUR_DEVICE_TOKEN"; // DAPATKAN dari halaman Device Management

// HX711 Loadcell Pins
const int LOADCELL_DOUT_PIN = 16;
const int LOADCELL_SCK_PIN = 4;

// Timing Configuration
const unsigned long SEND_INTERVAL = 1000; // Send data every 1 second (1000ms)
const unsigned long WIFI_RECONNECT_INTERVAL =
    30000; // Try reconnect every 30 seconds

// EEPROM Configuration
const int EEPROM_SIZE = 512;
const int CAL_FACTOR_ADDR = 0; // Address to store calibration factor

// Default Calibration Factor (will be overwritten by EEPROM if exists)
float DEFAULT_CALIBRATION_FACTOR = 2280.0;

// ==================== GLOBAL VARIABLES ====================

HX711 scale;
float calibrationFactor = DEFAULT_CALIBRATION_FACTOR;
unsigned long lastSendTime = 0;
unsigned long lastWiFiCheckTime = 0;
bool isWiFiConnected = false;

// ==================== HELPER FUNCTIONS ====================

/**
 * Save calibration factor to EEPROM
 */
void saveCalibrationFactor(float factor) {
  EEPROM.put(CAL_FACTOR_ADDR, factor);
  EEPROM.commit();
  Serial.println("✓ Calibration factor saved to EEPROM: " + String(factor));
}

/**
 * Load calibration factor from EEPROM
 */
float loadCalibrationFactor() {
  float factor;
  EEPROM.get(CAL_FACTOR_ADDR, factor);

  // Check if EEPROM has valid data
  if (isnan(factor) || factor == 0 || factor < 0) {
    Serial.println("⚠ EEPROM empty or invalid, using default factor");
    return DEFAULT_CALIBRATION_FACTOR;
  }

  Serial.println("✓ Loaded calibration factor from EEPROM: " + String(factor));
  return factor;
}

/**
 * Connect to WiFi with retry logic
 */
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
    Serial.println("Signal Strength: " + String(WiFi.RSSI()) + " dBm");
  } else {
    isWiFiConnected = false;
    Serial.println("\n✗ WiFi Connection Failed!");
  }
}

/**
 * Check WiFi connection and reconnect if needed
 */
void checkWiFiConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    if (isWiFiConnected) {
      Serial.println("⚠ WiFi connection lost!");
      isWiFiConnected = false;
    }

    // Try to reconnect every WIFI_RECONNECT_INTERVAL
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

/**
 * Send weight data to backend and check for commands
 */
void sendDataAndCheckCommands(float weight) {
  if (!isWiFiConnected) {
    Serial.println("⚠ WiFi not connected, skipping data send");
    return;
  }

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000); // 10 second timeout

  // Create JSON payload
  StaticJsonDocument<256> doc;
  doc["token"] = DEVICE_TOKEN;
  doc["weight"] = round(weight * 100) / 100.0; // Round to 2 decimal places

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  // Send POST request
  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();

    // Print status
    Serial.printf("📤 Weight: %.2f kg | HTTP: %d | Response: %s\n", weight,
                  httpResponseCode, response.c_str());

    // Parse response for commands
    StaticJsonDocument<512> responseDoc;
    DeserializationError error = deserializeJson(responseDoc, response);

    if (!error && responseDoc.containsKey("command")) {
      JsonObject cmd = responseDoc["command"];
      String commandType = cmd["type"].as<String>();

      Serial.println("\n========================================");
      Serial.println("📥 COMMAND RECEIVED: " + commandType);
      Serial.println("========================================");

      // Execute TARE command
      if (commandType == "TARE") {
        Serial.println("Executing TARE (Reset to Zero)...");
        scale.tare();
        Serial.println("✓ TARE Complete - Scale reset to 0 kg");
      }

      // Execute CALIBRATE command
      else if (commandType == "CALIBRATE") {
        if (cmd.containsKey("value")) {
          float newFactor = cmd["value"].as<float>();

          Serial.println("Executing CALIBRATION...");
          Serial.println("Old Factor: " + String(calibrationFactor));
          Serial.println("New Factor: " + String(newFactor));

          calibrationFactor = newFactor;
          scale.set_scale(calibrationFactor);
          saveCalibrationFactor(calibrationFactor);

          Serial.println("✓ CALIBRATION Complete");
        } else {
          Serial.println("⚠ CALIBRATE command missing 'value' parameter");
        }
      }

      Serial.println("========================================\n");
    }

  } else {
    Serial.printf("✗ HTTP Error: %d - %s\n", httpResponseCode,
                  http.errorToString(httpResponseCode).c_str());
  }

  http.end();
}

// ==================== SETUP ====================

void setup() {
  // Initialize Serial
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n");
  Serial.println("========================================");
  Serial.println("  ESP32 Loadcell IoT System v2.0");
  Serial.println("========================================");

  // Initialize EEPROM
  Serial.println("\n[1/4] Initializing EEPROM...");
  EEPROM.begin(EEPROM_SIZE);
  calibrationFactor = loadCalibrationFactor();

  // Initialize Loadcell
  Serial.println("\n[2/4] Initializing HX711 Loadcell...");
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);

  if (scale.is_ready()) {
    Serial.println("✓ HX711 detected and ready");

    // Display initial readings
    Serial.println("\n--- Initial Readings ---");
    Serial.print("Raw ADC: ");
    Serial.println(scale.read());

    Serial.print("Average (20 readings): ");
    Serial.println(scale.read_average(20));

    // Set calibration factor and tare
    scale.set_scale(calibrationFactor);
    Serial.println("\nApplying calibration factor: " +
                   String(calibrationFactor));

    Serial.println("Performing auto-tare (reset to zero)...");
    scale.tare();
    delay(1000);

    Serial.println("✓ Loadcell initialized and tared");

    // Test reading
    Serial.print("Current weight: ");
    Serial.print(scale.get_units(10), 2);
    Serial.println(" kg");

  } else {
    Serial.println("✗ HX711 not detected! Check wiring:");
    Serial.println("  - DOUT -> GPIO " + String(LOADCELL_DOUT_PIN));
    Serial.println("  - SCK  -> GPIO " + String(LOADCELL_SCK_PIN));
    Serial.println("  - VCC  -> 5V or 3.3V");
    Serial.println("  - GND  -> GND");
  }

  // Connect to WiFi
  Serial.println("\n[3/4] Connecting to WiFi...");
  connectToWiFi();

  // Final setup message
  Serial.println("\n[4/4] Setup Complete!");
  Serial.println("========================================");
  Serial.println("Device Token: " + String(DEVICE_TOKEN));
  Serial.println("API Endpoint: " + String(API_URL));
  Serial.println("Send Interval: " + String(SEND_INTERVAL) + " ms");
  Serial.println("========================================");
  Serial.println("\nStarting main loop...\n");

  delay(2000);
}

// ==================== MAIN LOOP ====================

void loop() {
  // Check WiFi connection status
  checkWiFiConnection();

  // Send data at specified interval
  if (millis() - lastSendTime >= SEND_INTERVAL) {

    if (scale.is_ready()) {
      // Read weight (average of 5 readings for stability)
      float weight = scale.get_units(5);

      // Optional: Clamp negative values to zero
      // if (weight < 0) weight = 0.0;

      // Send data to backend and check for commands
      sendDataAndCheckCommands(weight);

    } else {
      Serial.println("⚠ HX711 not ready, skipping reading");
    }

    lastSendTime = millis();
  }

  // Small delay to prevent watchdog issues
  delay(10);
}

// ==================== END OF CODE ====================

/**
 * USAGE INSTRUCTIONS:
 *
 * 1. Install required libraries in Arduino IDE:
 *    - HX711 by Bogdan Necula
 *    - ArduinoJson by Benoit Blanchon
 *
 * 2. Update configuration at the top of this file:
 *    - WIFI_SSID: Your WiFi network name
 *    - WIFI_PASSWORD: Your WiFi password
 *    - DEVICE_TOKEN: Get from Device Management page
 *    - API_URL: Your backend URL (default is Vercel deployment)
 *
 * 3. Upload to ESP32 and open Serial Monitor (115200 baud)
 *
 * 4. Calibration Process:
 *    a. Make sure scale is empty
 *    b. Click "TARE" button in web dashboard to reset to zero
 *    c. Place known weight (e.g., 1 kg) on scale
 *    d. Note the reading in web dashboard
 *    e. Enter the known weight in calibration modal
 *    f. Click "CALIBRATE" - new factor will be calculated and saved
 *
 * 5. The calibration factor is automatically saved to EEPROM
 *    and will persist across power cycles
 *
 * TROUBLESHOOTING:
 *
 * - "HX711 not detected": Check wiring connections
 * - "WiFi Connection Failed": Verify SSID and password
 * - "HTTP Error": Check API_URL and DEVICE_TOKEN
 * - Unstable readings: Ensure loadcell is properly mounted
 * - Calibration not working: Make sure to TARE first, then calibrate
 */
