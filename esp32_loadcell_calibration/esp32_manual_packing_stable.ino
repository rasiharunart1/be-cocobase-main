/**
 * ESP32 Loadcell IoT System - Manual Packing with LCD (v2.3 THRESHOLD ALARM)
 *
 * NEW Features v2.3:
 * - Dynamic Threshold from Web Dashboard
 * - Buzzer Alert when weight >= threshold
 * - Faster reading (optimized samples)
 * - 4-decimal precision (native KG)
 *
 * Hardware:
 * - ESP32 Development Board
 * - HX711 Loadcell Amplifier
 * - Loadcell Sensor
 * - Push Button (Momentary)
 * - I2C LCD Display 16x2
 * - Buzzer (Active/Passive)
 *
 * Wiring:
 * - HX711 DOUT -> GPIO 16
 * - HX711 SCK  -> GPIO 4
 * - Button     -> GPIO 5 (with internal pull-up)
 * - Buzzer (+) -> GPIO 2 (D2)
 * - Buzzer (-) -> GND
 * - LCD SDA    -> GPIO 21
 * - LCD SCL    -> GPIO 22
 * - LCD VCC    -> 5V
 * - LCD GND    -> GND
 */

#include <ArduinoJson.h>
#include <EEPROM.h>
#include <HTTPClient.h>
#include <HX711.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <Wire.h>

// ==================== LCD CONFIGURATION ====================
const int LCD_COLS = 16;
const int LCD_ROWS = 2;
const int LCD_ADDRESS = 0x27; // Try 0x3F if doesn't work

LiquidCrystal_I2C lcd(LCD_ADDRESS, LCD_COLS, LCD_ROWS);

// ==================== CONFIGURATION ====================

// WiFi Credentials
const char *WIFI_SSID = "Harun";
const char *WIFI_PASSWORD = "harun3211";

// Backend API Configuration
const char *API_URL_INGEST =
    "https://be-cocobase-main.vercel.app/api/v1/iot/loadcell/ingest";
const char *API_URL_PACK =
    "https://be-cocobase-main.vercel.app/api/v1/iot/loadcell/pack";
const char *DEVICE_TOKEN = "7400e85c-80ef-4352-8400-6361294d3050";

// Hardware Pins
const int LOADCELL_DOUT_PIN = 16;
const int LOADCELL_SCK_PIN = 4;
const int BUTTON_PIN = 5;
const int BUZZER_PIN = 2; // D2 (GPIO 2)

// Timing Configuration
const unsigned long SEND_INTERVAL = 300; // 300ms for faster updates
const unsigned long WIFI_RECONNECT_INTERVAL = 30000;

// EEPROM Configuration
const int EEPROM_SIZE = 512;
const int CAL_FACTOR_ADDR = 0;
float DEFAULT_CALIBRATION_FACTOR = 2280.0;

// ==================== WEIGHT FILTERING CONFIG ====================
const int MOVING_AVG_SIZE = 5; // Moving average buffer size
const int HX711_SAMPLES = 15;  // Samples per reading (increased for stability)
const float ZERO_THRESHOLD =
    5.0;                        // Values below this are treated as 0 (in grams)
const float NOISE_FILTER = 2.0; // Filter out changes smaller than this (grams)

// Weight unit configuration
const bool USE_KILOGRAMS = false; // Set to false to display in grams
const float GRAM_TO_KG = 1000.0;  // Conversion factor

// ==================== GLOBAL VARIABLES ====================

HX711 scale;
float calibrationFactor = DEFAULT_CALIBRATION_FACTOR;
float targetThreshold = 5.0; // Default 5kg, updated from server

unsigned long lastSendTime = 0;
unsigned long lastWiFiCheckTime = 0;
bool isWiFiConnected = false;

// Button debouncing
bool lastButtonState = HIGH;
bool buttonState = HIGH;
unsigned long lastDebounceTime = 0;
const unsigned long debounceDelay = 50;

// Button press state tracking
bool waitingForTare = false;

// Buzzer Alert State
bool buzzerActive = false;

// Moving average filter
float weightBuffer[MOVING_AVG_SIZE];
int bufferIndex = 0;
bool bufferFilled = false;
float lastStableWeight = 0.0;

// ==================== WEIGHT FILTERING FUNCTIONS ====================

void initWeightBuffer() {
  for (int i = 0; i < MOVING_AVG_SIZE; i++) {
    weightBuffer[i] = 0.0;
  }
  bufferIndex = 0;
  bufferFilled = false;
}

float getMovingAverage(float newValue) {
  weightBuffer[bufferIndex] = newValue;
  bufferIndex = (bufferIndex + 1) % MOVING_AVG_SIZE;

  if (bufferIndex == 0) {
    bufferFilled = true;
  }

  float sum = 0.0;
  int count = bufferFilled ? MOVING_AVG_SIZE : bufferIndex;
  if (count == 0)
    count = 1; // Safety

  for (int i = 0; i < count; i++) {
    sum += weightBuffer[i];
  }

  return sum / count;
}

float getStableWeight() {
  if (!scale.is_ready()) {
    return lastStableWeight;
  }

  // Read weight (already in KG if calibration factor is KG-native)
  float rawWeight = scale.get_units(HX711_SAMPLES);

  // Clamp negative values close to zero
  if (rawWeight < 0 && rawWeight > -ZERO_THRESHOLD) {
    rawWeight = 0.0;
  }

  // Apply moving average filter
  float filteredWeight = getMovingAverage(rawWeight);

  // Apply zero threshold
  if (abs(filteredWeight) < ZERO_THRESHOLD) {
    filteredWeight = 0.0;
  }

  // Noise filtering
  float weightDiff = abs(filteredWeight - lastStableWeight);
  if (weightDiff < NOISE_FILTER && lastStableWeight != 0.0) {
    filteredWeight = lastStableWeight;
  }

  lastStableWeight = filteredWeight;
  return filteredWeight;
}

String formatWeight(float weight) {
  char buffer[16];

  if (USE_KILOGRAMS) {
    // Weight is already in KG
    dtostrf(weight, 6, 4, buffer); // 4 decimal places
    return String(buffer) + " kg";
  } else {
    // Weight in grams
    dtostrf(weight, 6, 1, buffer);
    return String(buffer) + " g";
  }
}

// ==================== THRESHOLD ALARM ====================

void checkThresholdAlert(float currentWeightInGrams) {
  // Convert to kg for comparison (threshold from server is in kg)
  float currentWeightKg = currentWeightInGrams / GRAM_TO_KG;

  // Hysteresis: ON if >= threshold, OFF if < (threshold - 0.05kg)
  if (currentWeightKg >= targetThreshold) {
    if (!buzzerActive) {
      buzzerActive = true;
      digitalWrite(BUZZER_PIN, HIGH); // Turn ON buzzer
      Serial.printf("🔔 ALERT! Weight %.4f kg >= Threshold %.4f kg\n",
                    currentWeightKg, targetThreshold);
    }
  } else if (currentWeightKg < (targetThreshold - 0.05)) {
    if (buzzerActive) {
      buzzerActive = false;
      digitalWrite(BUZZER_PIN, LOW); // Turn OFF buzzer
      Serial.println("🔕 Alert cleared");
    }
  }
}

// ==================== LCD FUNCTIONS ====================

void clearLCDLine(int row) {
  lcd.setCursor(0, row);
  for (int i = 0; i < LCD_COLS; i++) {
    lcd.print(" ");
  }
}

void updateLCDWeight(float weight) {
  lcd.setCursor(0, 0);
  String weightStr = formatWeight(weight);
  lcd.print(weightStr);

  // Clear rest of line
  for (int i = weightStr.length(); i < LCD_COLS; i++) {
    lcd.print(" ");
  }
}

void updateLCDStatus(String status) {
  lcd.setCursor(0, 1);

  if (status.length() > LCD_COLS) {
    status = status.substring(0, LCD_COLS);
  }

  lcd.print(status);

  // Clear rest of line
  for (int i = status.length(); i < LCD_COLS; i++) {
    lcd.print(" ");
  }
}

void showLCDMessage(String line1, String line2 = "") {
  lcd.clear();

  lcd.setCursor(0, 0);
  if (line1.length() > LCD_COLS) {
    line1 = line1.substring(0, LCD_COLS);
  }
  lcd.print(line1);

  if (line2.length() > 0) {
    lcd.setCursor(0, 1);
    if (line2.length() > LCD_COLS) {
      line2 = line2.substring(0, LCD_COLS);
    }
    lcd.print(line2);
  }
}

// ==================== HELPER FUNCTIONS ====================

void saveCalibrationFactor(float factor) {
  EEPROM.put(CAL_FACTOR_ADDR, factor);
  EEPROM.commit();
  Serial.println("✓ Cal factor saved: " + String(factor));
}

float loadCalibrationFactor() {
  float factor;
  EEPROM.get(CAL_FACTOR_ADDR, factor);

  if (isnan(factor) || factor == 0 || factor < 0) {
    Serial.println("⚠ Using default factor");
    return DEFAULT_CALIBRATION_FACTOR;
  }

  Serial.println("✓ Loaded factor: " + String(factor));
  return factor;
}

void connectToWiFi() {
  Serial.println("\n========================================");
  Serial.println("Connecting to WiFi: " + String(WIFI_SSID));
  Serial.println("========================================");

  showLCDMessage("WiFi Connect...", WIFI_SSID);

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
    Serial.println("IP: " + WiFi.localIP().toString());
    showLCDMessage("WiFi Connected", WiFi.localIP().toString());
    delay(2000);
  } else {
    isWiFiConnected = false;
    Serial.println("\n✗ WiFi Failed!");
    showLCDMessage("WiFi Failed!", "Check settings");
    delay(2000);
  }
}

void checkWiFiConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    if (isWiFiConnected) {
      Serial.println("⚠ WiFi lost!");
      isWiFiConnected = false;
    }

    if (millis() - lastWiFiCheckTime >= WIFI_RECONNECT_INTERVAL) {
      Serial.println("Reconnecting WiFi...");
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

void sendWeightData(float weight) {
  if (!isWiFiConnected)
    return;

  HTTPClient http;
  http.begin(API_URL_INGEST);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);

  // Convert to kg for API (backend expects kg, weight is in grams)
  float weightToSend = weight / GRAM_TO_KG;

  JsonDocument doc;
  doc["token"] = DEVICE_TOKEN;
  doc["weight"] = round(weightToSend * 10000) / 10000.0; // 4 decimal precision

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();

    JsonDocument responseDoc;
    DeserializationError error = deserializeJson(responseDoc, response);

    if (!error) {
      // 1️⃣ UPDATE THRESHOLD FROM SERVER
      if (responseDoc.containsKey("threshold")) {
        // Check if threshold is not null
        if (!responseDoc["threshold"].isNull()) {
          float newThreshold = responseDoc["threshold"].as<float>();

          // Debug: Print received threshold
          Serial.printf("📡 Received threshold from server: %.4f kg\n",
                        newThreshold);

          if (newThreshold > 0 &&
              abs(newThreshold - targetThreshold) > 0.0001) {
            targetThreshold = newThreshold;
            Serial.printf("✅ Threshold UPDATED: %.4f kg\n", targetThreshold);
          } else if (newThreshold > 0) {
            Serial.printf("ℹ️ Threshold unchanged: %.4f kg\n", targetThreshold);
          }
        } else {
          Serial.println("⚠️ Threshold field is null");
        }
      } else {
        Serial.println("⚠️ No threshold field in response");
      }

      // 2️⃣ HANDLE COMMANDS
      if (responseDoc["command"].is<JsonObject>()) {
        JsonObject cmd = responseDoc["command"];
        String commandType = cmd["type"].as<String>();

        Serial.println("\n📥 COMMAND: " + commandType);

        if (commandType == "TARE") {
          Serial.println("Executing TARE...");
          showLCDMessage("Remote TARE", "Resetting...");
          scale.tare();
          initWeightBuffer();
          Serial.println("✓ TARE Complete");
          delay(1000);
        } else if (commandType == "CALIBRATE") {
          if (cmd["value"].is<float>()) {
            float newFactor = cmd["value"].as<float>();

            Serial.println("Executing CALIBRATE...");
            Serial.println("New Factor: " + String(newFactor));
            showLCDMessage("Remote Calibr.", "F:" + String(newFactor, 0));

            calibrationFactor = newFactor;
            scale.set_scale(calibrationFactor);
            saveCalibrationFactor(calibrationFactor);
            initWeightBuffer();

            Serial.println("✓ CALIBRATE Complete");
            delay(1000);
          }
        } else if (commandType == "SET_THRESHOLD") {
          if (cmd["value"].is<float>()) {
            float newThreshold = cmd["value"].as<float>();

            Serial.println("Executing SET_THRESHOLD...");
            Serial.printf("New Threshold: %.4f kg\n", newThreshold);
            showLCDMessage("Set Threshold", String(newThreshold, 2) + " kg");

            targetThreshold = newThreshold;

            Serial.printf("✅ THRESHOLD SET: %.4f kg\n", targetThreshold);
            delay(1500);
          }
        }
      }
    } else {
      Serial.print("⚠️ JSON Parse Error: ");
      Serial.println(error.c_str());
    }

    // Update LCD
    updateLCDWeight(weight);
    if (waitingForTare) {
      updateLCDStatus("Press for TARE");
    } else {
      // Show alert status or threshold
      if (buzzerActive) {
        updateLCDStatus("ALERT! >= Target");
      } else {
        char buf[16];
        sprintf(buf, "Target: %.2f kg", targetThreshold);
        updateLCDStatus(String(buf));
      }
    }
  } else {
    Serial.printf("⚠️ HTTP Error: %d\n", httpResponseCode);
  }

  http.end();
}

void sendPackingData(float weight) {
  if (!isWiFiConnected) {
    Serial.println("⚠ WiFi not connected");
    showLCDMessage("WiFi Error!", "No connection");
    delay(2000);
    return;
  }

  // Convert to kg for API (weight is in grams)
  float weightToSend = weight / GRAM_TO_KG;

  Serial.println("\n========================================");
  Serial.println("📦 BUTTON #1 - SAVING DATA");
  Serial.println("========================================");
  Serial.printf("Weight: %.4f kg (%.1f g)\n", weightToSend, weight);

  showLCDMessage("Saving...", formatWeight(weight));

  HTTPClient http;
  http.begin(API_URL_PACK);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  JsonDocument doc;
  doc["token"] = DEVICE_TOKEN;
  doc["weight"] = round(weightToSend * 10000) / 10000.0;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("HTTP: %d | %s\n", httpResponseCode, response.c_str());

    JsonDocument responseDoc;
    DeserializationError error = deserializeJson(responseDoc, response);

    if (!error) {
      bool success = responseDoc["success"];
      String message = responseDoc["message"].as<String>();

      if (success) {
        Serial.println("✓ " + message);
        Serial.println("\n⏳ WAITING FOR BUTTON #2 TO TARE...");

        showLCDMessage("Saved!", "Press for TARE");
        waitingForTare = true;

        // Success beep
        digitalWrite(BUZZER_PIN, HIGH);
        delay(100);
        digitalWrite(BUZZER_PIN, LOW);
        delay(100);
        digitalWrite(BUZZER_PIN, HIGH);
        delay(100);
        digitalWrite(BUZZER_PIN, LOW);
      } else {
        Serial.println("✗ " + message);

        if (message.indexOf("session") >= 0) {
          showLCDMessage("No Session!", "Start session");
        } else {
          showLCDMessage("Error!", message.substring(0, LCD_COLS));
        }

        waitingForTare = false;
        delay(3000);
      }
    }
  } else {
    Serial.printf("✗ HTTP Error: %d\n", httpResponseCode);
    showLCDMessage("HTTP Error!", "Code:" + String(httpResponseCode));
    waitingForTare = false;
    delay(3000);
  }

  Serial.println("========================================\n");
  http.end();
}

void performTare() {
  Serial.println("\n========================================");
  Serial.println("🔄 BUTTON #2 - PERFORMING TARE");
  Serial.println("========================================");

  showLCDMessage("TARE...", "Resetting...");

  scale.tare();
  initWeightBuffer();

  Serial.println("✓ TARE Complete!");
  Serial.println("✓ Ready for next packing\n");
  Serial.println("========================================\n");

  showLCDMessage("TARE Done!", "Ready");

  // Long beep
  digitalWrite(BUZZER_PIN, HIGH);
  delay(500);
  digitalWrite(BUZZER_PIN, LOW);

  delay(1500);

  waitingForTare = false;
}

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n========================================");
  Serial.println("  ESP32 Loadcell v2.3 THRESHOLD ALARM");
  Serial.println("========================================");

  // Initialize Buzzer
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW); // Start OFF

  // Initialize LCD
  Serial.println("\n[1/7] Initializing LCD...");
  Wire.begin(21, 22);
  lcd.init();
  lcd.backlight();
  showLCDMessage("Cocobase v2.3", "Threshold Alarm");
  Serial.println("✓ LCD initialized");
  delay(1500);

  // Initialize weight filter
  Serial.println("\n[2/7] Initializing Filters...");
  initWeightBuffer();
  Serial.println("✓ Moving average filter ready");
  Serial.printf("  - Samples: %d\n", HX711_SAMPLES);
  Serial.printf("  - Buffer: %d\n", MOVING_AVG_SIZE);
  Serial.printf("  - Zero threshold: %.4f kg\n", ZERO_THRESHOLD);
  showLCDMessage("Filter Ready", "Optimized");
  delay(1000);

  // Initialize EEPROM
  Serial.println("\n[3/7] Initializing EEPROM...");
  EEPROM.begin(EEPROM_SIZE);
  calibrationFactor = loadCalibrationFactor();
  showLCDMessage("Loading config", "F:" + String(calibrationFactor, 0));
  delay(1000);

  // Initialize Button
  Serial.println("\n[4/7] Initializing Button...");
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Serial.println("✓ Button on GPIO " + String(BUTTON_PIN));
  showLCDMessage("Button Ready", "GPIO " + String(BUTTON_PIN));
  delay(1000);

  // Initialize Loadcell
  Serial.println("\n[5/7] Initializing HX711...");
  showLCDMessage("Init Loadcell", "Please wait...");
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);

  if (scale.is_ready()) {
    Serial.println("✓ HX711 ready");
    scale.set_scale(calibrationFactor);

    showLCDMessage("Taring...", "Remove weight");
    delay(2000);

    scale.tare();
    delay(500);

    // Warm up
    Serial.println("Warming up sensor...");
    for (int i = 0; i < 5; i++) {
      scale.get_units(10);
      delay(100);
    }

    Serial.println("✓ Loadcell initialized");
    showLCDMessage("Loadcell Ready", "0.0000 kg");
    delay(1000);
  } else {
    Serial.println("✗ HX711 not detected!");
    showLCDMessage("HX711 Error!", "Check wiring");
    delay(3000);
  }

  // Connect WiFi
  Serial.println("\n[6/7] Connecting WiFi...");
  connectToWiFi();

  // Final setup
  Serial.println("\n[7/7] Setup Complete!");
  Serial.println("========================================");
  Serial.println("Device Token: " + String(DEVICE_TOKEN));
  Serial.println("Mode: Native Kilograms (4 decimals)");
  Serial.printf("Default Threshold: %.4f kg\n", targetThreshold);
  Serial.println("========================================");
  Serial.println("\n🚀 System Ready!\n");

  showLCDMessage("System Ready!", "Monitoring...");
  delay(2000);
}

// ==================== MAIN LOOP ====================

void loop() {
  checkWiFiConnection();

  // Read button with debouncing
  int reading = digitalRead(BUTTON_PIN);

  if (reading != lastButtonState) {
    lastDebounceTime = millis();
  }

  if ((millis() - lastDebounceTime) > debounceDelay) {
    if (reading != buttonState) {
      buttonState = reading;

      if (buttonState == LOW) {
        if (waitingForTare) {
          performTare();
        } else {
          if (scale.is_ready()) {
            float weight = getStableWeight();
            sendPackingData(weight);
          } else {
            Serial.println("⚠ HX711 not ready");
            showLCDMessage("Scale Error!", "Not ready");
            delay(2000);
          }
        }
      }
    }
  }

  lastButtonState = reading;

  // Send weight data & check threshold
  if (millis() - lastSendTime >= SEND_INTERVAL) {
    if (scale.is_ready()) {
      float weight = getStableWeight();

      // Check threshold alarm
      checkThresholdAlert(weight);

      // Send to server
      sendWeightData(weight);

      // Debug output
      Serial.printf(
          "Weight: %.1f g (%.4f kg) | Threshold: %.4f kg | Alert: %s\n", weight,
          weight / GRAM_TO_KG, targetThreshold, buzzerActive ? "ON" : "OFF");
    }
    lastSendTime = millis();
  }

  delay(10);
}

// ==================== END OF CODE ====================
