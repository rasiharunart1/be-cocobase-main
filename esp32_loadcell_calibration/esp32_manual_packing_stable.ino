/**
 * ESP32 Loadcell IoT System - Manual Packing with LCD (STABLE VERSION)
 *
 * Improvements:
 * - Enhanced weight stability with moving average filter
 * - Negative value clamping
 * - Better noise reduction
 * - Proper unit display (gram/kg)
 * - Increased averaging samples
 * - Dead zone for zero weight
 *
 * Features:
 * - Real-time weight monitoring with LCD display
 * - Manual packing trigger via push button (2-press system)
 * - LCD I2C display for weight and status
 * - Remote calibration (TARE & CALIBRATE) via web dashboard
 * - EEPROM persistence for calibration factor
 * - WiFi auto-reconnect
 * - Session validation
 *
 * Hardware:
 * - ESP32 Development Board
 * - HX711 Loadcell Amplifier
 * - Loadcell Sensor
 * - Push Button (Momentary)
 * - I2C LCD Display 16x2
 *
 * Wiring:
 * - HX711 DOUT -> GPIO 16
 * - HX711 SCK  -> GPIO 4
 * - Button     -> GPIO 5
 * - Button GND -> GND (with internal pull-up)
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
const int LCD_COLS = 16;      // 16 columns
const int LCD_ROWS = 2;       // 2 rows
const int LCD_ADDRESS = 0x27; // I2C address (try 0x3F if doesn't work)

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

// HX711 Loadcell Pins
const int LOADCELL_DOUT_PIN = 16;
const int LOADCELL_SCK_PIN = 4;

// Push Button Pin (Connect between PIN and GND)
const int BUTTON_PIN = 5; // GPIO 5 (Check your board pinout!)

// Buzzer Configuration
const int BUZZER_PIN = 18;     // GPIO 18, connect to Buzzer (+)
float alertThresholdKg = 10.0; // Default 10kg, updated from server

// Timing Configuration
const unsigned long SEND_INTERVAL = 1000;
const unsigned long WIFI_RECONNECT_INTERVAL = 30000;

// EEPROM Configuration
const int EEPROM_SIZE = 512;
const int CAL_FACTOR_ADDR = 0;
float DEFAULT_CALIBRATION_FACTOR = 2280.0;

// ==================== WEIGHT FILTERING CONFIG ====================
const int MOVING_AVG_SIZE = 5; // Moving average buffer size
const int HX711_SAMPLES = 15;  // Samples per reading (increased)
const float ZERO_THRESHOLD =
    0.01; // Values below this are treated as 0 (0.01 kg = 10g)
const float NOISE_FILTER =
    0.005; // Filter out changes smaller than this (0.005 kg = 5g)

// Weight unit configuration
// Set false = Tampilan dalam GRAM (contoh: 5000.0 g) -> Cocok untuk loadcell
// kecil/presisi Set true  = Tampilan dalam KILOGRAM (contoh: 5.000 kg) -> Cocok
// untuk loadcell besar (>10kg)
const bool USE_KILOGRAMS = true;
const float GRAM_TO_KG = 1000.0; // Conversion factor

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

// Button press state tracking
bool waitingForTare = false;

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
  // Add new value to buffer
  weightBuffer[bufferIndex] = newValue;
  bufferIndex = (bufferIndex + 1) % MOVING_AVG_SIZE;

  if (bufferIndex == 0) {
    bufferFilled = true;
  }

  // Calculate average
  float sum = 0.0;
  int count = bufferFilled ? MOVING_AVG_SIZE : bufferIndex;

  for (int i = 0; i < count; i++) {
    sum += weightBuffer[i];
  }

  return count > 0 ? sum / count : 0.0;
}

float getStableWeight() {
  if (!scale.is_ready()) {
    return lastStableWeight;
  }

  // 1. Read raw weight (averaged by HX711 hardware)
  float rawWeight = scale.get_units(HX711_SAMPLES);

  // 2. Moving Average Filter
  float filteredWeight = getMovingAverage(rawWeight);

  // 3. Noise & Zero Threshold (Clamping)
  if (abs(filteredWeight) < ZERO_THRESHOLD) {
    filteredWeight = 0.0;
  }

  // 4. Force POSITIVE only (Mengatasi masalah "nilai negatif")
  if (filteredWeight < 0) {
    filteredWeight = 0.0;
  }

  // 5. Stability Filter to prevent jitter (Lock value if change is small)
  float weightDiff = abs(filteredWeight - lastStableWeight);
  // Only update if change > NOISE_FILTER OR if we are returning to zero
  if (weightDiff > NOISE_FILTER ||
      (filteredWeight == 0.0 && lastStableWeight != 0.0)) {
    lastStableWeight = filteredWeight;
  }

  return lastStableWeight;
}

String formatWeight(float weightInKg) {
  char buffer[16];
  dtostrf(weightInKg, 6, 4, buffer); // 4 decimal places for kg
  return String(buffer) + " kg";
}

// ==================== LCD FUNCTIONS ====================

void clearLCDLine(int row) {
  lcd.setCursor(0, row);
  for (int i = 0; i < LCD_COLS; i++) {
    lcd.print(" ");
  }
}

void updateLCDWeight(float weightInKg) {
  lcd.setCursor(0, 0);

  String weightStr = formatWeight(weightInKg);
  lcd.print(weightStr);

  // Clear rest of line
  for (int i = weightStr.length(); i < LCD_COLS; i++) {
    lcd.print(" ");
  }
}

void updateLCDStatus(String status) {
  lcd.setCursor(0, 1);

  // Truncate if too long
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

  // Line 1
  lcd.setCursor(0, 0);
  if (line1.length() > LCD_COLS) {
    line1 = line1.substring(0, LCD_COLS);
  }
  lcd.print(line1);

  // Line 2
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

void sendWeightData(float weightInKg) {
  if (!isWiFiConnected)
    return;

  HTTPClient http;
  http.begin(API_URL_INGEST);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  JsonDocument doc;
  doc["token"] = DEVICE_TOKEN;
  // Increase precision to 4 decimal places (e.g. 5.1234 kg)
  doc["weight"] = round(weightInKg * 10000) / 10000.0;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();

    JsonDocument responseDoc;
    DeserializationError error = deserializeJson(responseDoc, response);

    if (!error) {
      // 1. Check for command
      if (responseDoc["command"].is<JsonObject>()) {
        JsonObject cmd = responseDoc["command"];
        String commandType = cmd["type"].as<String>();

        Serial.println("\n📥 COMMAND: " + commandType);

        if (commandType == "TARE") {
          Serial.println("Executing TARE...");
          showLCDMessage("Remote TARE", "Resetting...");
          scale.tare();
          initWeightBuffer(); // Reset moving average
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
            initWeightBuffer(); // Reset moving average

            Serial.println("✓ CALIBRATE Complete");
            delay(1000);
          }
        }
      }

      // 2. Update Threshold from Server
      if (responseDoc["threshold"].is<float>()) {
        float serverThreshold = responseDoc["threshold"];
        if (serverThreshold > 0) {
          alertThresholdKg = serverThreshold;
        }
      }
    }

    // Update LCD
    updateLCDWeight(weightInKg);
    if (waitingForTare) {
      updateLCDStatus("Press for TARE");
    } else {
      // Show alert status on LCD if active
      if (weightInKg >= alertThresholdKg) {
        updateLCDStatus("! MAX LIMIT !");
      } else {
        updateLCDStatus(isWiFiConnected ? "WiFi OK" : "WiFi Error");
      }
    }
  }

  http.end();
}

void sendPackingData(float weightInKg) {
  if (!isWiFiConnected) {
    Serial.println("⚠ WiFi not connected");
    showLCDMessage("WiFi Error!", "No connection");
    delay(2000);
    return;
  }

  Serial.println("\n========================================");
  Serial.println("📦 BUTTON #1 - SAVING DATA");
  Serial.println("========================================");
  Serial.printf("Weight: %.4f kg\n", weightInKg);

  showLCDMessage("Saving...", formatWeight(weightInKg));

  HTTPClient http;
  http.begin(API_URL_PACK);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  JsonDocument doc;
  doc["token"] = DEVICE_TOKEN;
  doc["weight"] = round(weightInKg * 10000) / 10000.0;

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
  initWeightBuffer(); // Reset moving average

  Serial.println("✓ TARE Complete!");
  Serial.println("✓ Ready for next packing\n");
  Serial.println("========================================\n");

  showLCDMessage("TARE Done!", "Ready: 0.0 g");
  delay(2000);

  waitingForTare = false;
}

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n========================================");
  Serial.println("  ESP32 Loadcell with LCD v2.0 STABLE");
  Serial.println("========================================");

  // Initialize LCD
  Serial.println("\n[1/7] Initializing LCD...");
  Wire.begin(21, 22); // SDA=21, SCL=22
  lcd.init();
  lcd.backlight();
  showLCDMessage("Cocobase IoT", "v2.0 STABLE");
  Serial.println("✓ LCD initialized");
  delay(1000);

  // Initialize weight filter
  Serial.println("\n[2/7] Initializing Filters...");
  initWeightBuffer();
  Serial.println("✓ Moving average filter ready");
  Serial.printf("  - Samples: %d\n", HX711_SAMPLES);
  Serial.printf("  - Buffer: %d\n", MOVING_AVG_SIZE);
  Serial.printf("  - Zero threshold: %.1f g\n", ZERO_THRESHOLD);
  showLCDMessage("Filter Ready", "Samples:" + String(HX711_SAMPLES));
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

  // Initialize Buzzer
  Serial.println("[4a/7] Initializing Buzzer...");
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // Test Buzzer (Short Beep)
  digitalWrite(BUZZER_PIN, HIGH);
  delay(100);
  digitalWrite(BUZZER_PIN, LOW);

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

    // Warm up - discard first few readings
    Serial.println("Warming up sensor...");
    for (int i = 0; i < 5; i++) {
      scale.get_units(10);
      delay(100);
    }

    Serial.println("✓ Loadcell initialized");
    showLCDMessage("Loadcell Ready", "0.0 g");
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
  Serial.println("Unit Display: " +
                 String(USE_KILOGRAMS ? "Kilograms" : "Grams"));
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

  // Check for alert
  if (scale.is_ready()) {
    float currentWeight = getStableWeight();
    float currentWeightKg;

    if (USE_KILOGRAMS) {
      currentWeightKg = currentWeight;
    } else {
      currentWeightKg = currentWeight / 1000.0;
    }

    // Alert logic: If weight >= threshold -> Beep
    // Only beep if weight is significant (> 0.05kg) to avoid noise alerts on
    // empty scale
    if (currentWeightKg >= alertThresholdKg && currentWeightKg > 0.05) {
      // Intermittent beep pattern (500ms ON, 500ms OFF)
      if ((millis() / 200) % 2 == 0) {
        digitalWrite(BUZZER_PIN, HIGH);
      } else {
        digitalWrite(BUZZER_PIN, LOW);
      }
    } else {
      digitalWrite(BUZZER_PIN, LOW);
    }
  }

  // Send weight data
  if (millis() - lastSendTime >= SEND_INTERVAL) {
    if (scale.is_ready()) {
      float weight = getStableWeight();
      sendWeightData(weight);

      // Debug output
      float weightInKg;
      if (USE_KILOGRAMS) {
        weightInKg = weight;
      } else {
        weightInKg = weight / 1000.0;
      }
      Serial.printf("Weight: %.4f kg\n", weightInKg);
    }
    lastSendTime = millis();
  }

  delay(10);
}

// ==================== END OF CODE ====================
