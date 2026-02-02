#include <ArduinoJson.h>
#include <EEPROM.h>
#include <HTTPClient.h>
#include <HX711.h>
#include <WiFi.h>

// --- CONFIGURATION ---
const char *ssid = "YOUR_WIFI_SSID";         // GANTI DENGAN WIFI ANDA
const char *password = "YOUR_WIFI_PASSWORD"; // GANTI DENGAN PASSWORD ANDA

// Backend API
const char *apiUrl =
    "https://be-cocobase-main.vercel.app/api/v1/iot/loadcell/ingest";
const char *deviceToken = "YOUR_DEVICE_TOKEN"; // DAPATKAN DARI HALAMAN DEVICES

// Loadcell Pins
const int LOADCELL_DOUT_PIN = 16;
const int LOADCELL_SCK_PIN = 4;

// EEPROM Address
const int EEPROM_SIZE = 512;
const int CAL_FACTOR_ADDR = 0;

// --- GLOBALS ---
HX711 scale;
float calibration_factor = 2280.0;
unsigned long lastSendTime = 0;
const unsigned long sendInterval = 1000; // Send every 1 second

// --- HELPER FUNCTIONS ---

void saveCalibrationFactor(float factor) {
  EEPROM.put(CAL_FACTOR_ADDR, factor);
  EEPROM.commit();
  Serial.println("Calibration factor saved to EEPROM");
}

float loadCalibrationFactor() {
  float factor;
  EEPROM.get(CAL_FACTOR_ADDR, factor);
  if (isnan(factor) || factor == 0) {
    return 2280.0; // Default value if EEPROM is empty
  }
  return factor;
}

// --- SETUP ---
void setup() {
  Serial.begin(115200);

  // Init EEPROM
  EEPROM.begin(EEPROM_SIZE);
  calibration_factor = loadCalibrationFactor();
  Serial.print("Loaded Calibration Factor: ");
  Serial.println(calibration_factor);

  // Init Loadcell
  Serial.println("Initializing Loadcell...");
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(calibration_factor);
  scale.tare(); // Auto tare on startup

  // Connect WiFi
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.println("========================================");
  Serial.println("Setup Complete! Starting main loop...");
  Serial.println("========================================");
  delay(1000);
}

// --- LOOP ---
void loop() {
  // Send data & Poll commands
  if (millis() - lastSendTime >= sendInterval) {
    if (scale.is_ready()) {
      float weight = scale.get_units(5); // Average 5 readings
      // if (weight < 0) weight = 0.0; // Optional: clamping
      sendDataAndCheckCommands(weight);
    } else {
      Serial.println("⚠ HX711 not ready!");
    }
    lastSendTime = millis();
  }
}

// --- BACKEND COMMunicATION ---
void sendDataAndCheckCommands(float weight) {
  if (WiFi.status() != WL_CONNECTED)
    return;

  HTTPClient http;
  http.begin(apiUrl);
  http.addHeader("Content-Type", "application/json");

  // Create Payload
  StaticJsonDocument<200> doc;
  doc["token"] = deviceToken;
  doc["weight"] = weight;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  // Send POST
  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("📤 Weight: %.2f kg | HTTP: %d | Response: %s\n", weight,
                  httpResponseCode, response.c_str());

    // Parse Response for Commands
    StaticJsonDocument<512> respDoc;
    DeserializationError error = deserializeJson(respDoc, response);

    if (!error) {
      if (respDoc.containsKey("command")) {
        JsonObject cmd = respDoc["command"];
        String type = cmd["type"];

        Serial.print("Received Command: ");
        Serial.println(type);

        if (type == "TARE") {
          Serial.println("Executing TARE...");
          scale.tare();
          Serial.println("TARE Complete.");
        } else if (type == "CALIBRATE") {
          if (cmd.containsKey("value")) {
            float newFactor = cmd["value"];
            Serial.print("Calibrating to New Factor: ");
            Serial.println(newFactor);

            calibration_factor = newFactor;
            scale.set_scale(calibration_factor);
            saveCalibrationFactor(calibration_factor);
          }
        }
      }
    }

  } else {
    Serial.print("Error sending data: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}
