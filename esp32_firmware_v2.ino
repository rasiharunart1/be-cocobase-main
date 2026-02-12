#include <ArduinoJson.h>
#include <EEPROM.h>
#include <HTTPClient.h>
#include <HX711.h>
#include <LiquidCrystal_I2C.h>
#include <WiFiClientSecure.h> // NEW: Required for HTTPS
#include <WiFiManager.h>
#include <Wire.h>


// ================= CONFIG =================

const char *DEVICE_TOKEN = "7400e85c-80ef-4352-8400-6361294d3050";
const char *API_URL =
    "https://be-cocobase-main.vercel.app/api/v1/iot/loadcell/ingest";

#define PIN_DOUT 16
#define PIN_SCK 4
#define PIN_RELAY 27
#define PIN_BUZZER 2
#define PIN_BTN_WIFI 26
#define PIN_BTN_MODE 25
#define PIN_BTN_RELAY 5

#define LCD_INTERVAL 150
#define HTTP_INTERVAL 500    // Constant update interval (0.5s)
#define MOVING_AVG_SAMPLES 5 // Number of samples for moving average

// ================= OBJECT =================

LiquidCrystal_I2C lcd(0x27, 16, 2);
HX711 scale;
HTTPClient http;
WiFiClientSecure client; // NEW: Secure client

// ================= PARAM =================

float calibrationFactor = 200.7;
float targetThreshold = 10.0; // Display Only
float relayThreshold = 50.0;  // MAX

// ================= STATE =================

bool offlineMode = false;
bool isRelayOn = false;
bool lastModeBtn = HIGH;
bool lastRelayBtn = HIGH;

unsigned long lastLCD = 0;
unsigned long lastHTTP = 0;
unsigned long btnPressTime = 0;
bool btnHeld = false;

float currentWeight = 0;
float lastSentWeight = 0;
float lastLoggedWeight = 0; // NEW: Track last weight that was logged
float movingAvgBuffer[MOVING_AVG_SAMPLES] = {0}; // NEW: Filter buffer
int bufferIndex = 0;                             // NEW: Buffer position
bool isSending = false;

// ================= UTILITY =================

void buzzerBeep(int times = 1, int on = 70, int off = 80) {
  for (int i = 0; i < times; i++) {
    digitalWrite(PIN_BUZZER, HIGH);
    delay(on);
    digitalWrite(PIN_BUZZER, LOW);
    delay(off);
  }
}

// ================= FILTERING =================

float getFilteredWeight() {
  if (!scale.is_ready())
    return currentWeight;

  // Read raw weight (in grams)
  float rawWeight = scale.get_units(1);

  // Update moving average buffer
  movingAvgBuffer[bufferIndex] = rawWeight;
  bufferIndex = (bufferIndex + 1) % MOVING_AVG_SAMPLES;

  // Calculate average
  float sum = 0;
  for (int i = 0; i < MOVING_AVG_SAMPLES; i++) {
    sum += movingAvgBuffer[i];
  }

  return sum / MOVING_AVG_SAMPLES;
}

bool shouldLog(float newWeightKg, float thresholdKg) {
  // Calculate which threshold milestone we've passed
  // Example: if threshold = 5kg
  // - At 5.1kg: currentMilestone = 1 (crossed first 5kg)
  // - At 10.3kg: currentMilestone = 2 (crossed second 5kg)
  // - At 15.2kg: currentMilestone = 3 (crossed third 5kg)

  int currentMilestone = (int)(newWeightKg / thresholdKg);
  int lastMilestone = (int)(lastLoggedWeight / thresholdKg);

  // Log if we've crossed into a new threshold milestone
  if (currentMilestone > lastMilestone) {
    return true;
  }

  return false;
}

void setRelay(bool state) {
  if (isRelayOn == state)
    return;
  isRelayOn = state;
  digitalWrite(PIN_RELAY, state ? LOW : HIGH);
  if (state)
    buzzerBeep(1);
}

// ================= LCD =================

void updateLCD(float weight) {
  float kg = weight / 1000.0;

  lcd.setCursor(0, 0);
  lcd.printf("B:%6.2f", kg);

  lcd.setCursor(10, 0);
  if (isSending)
    lcd.print("Up..");
  else
    lcd.print("    ");

  lcd.setCursor(0, 1);
  lcd.print(offlineMode ? "OFF" : "ON ");

  lcd.setCursor(4, 1);
  if (isRelayOn)
    lcd.print("MENGAYAK   ");
  else
    lcd.printf("Max:%.0f   ", relayThreshold);
}

// ================= SERVER CMD =================

void processServerCommand(JsonDocument &rDoc) {
  if (offlineMode)
    return;

  if (!rDoc["threshold"].isNull()) {
    targetThreshold = rDoc["threshold"].as<float>();
  }

  if (!rDoc["relayThreshold"].isNull()) {
    relayThreshold = rDoc["relayThreshold"].as<float>();
  }

  if (rDoc["command"].isNull())
    return;

  // Check if command is object or string to be safe, though backend sends
  // object
  if (rDoc["command"].is<JsonObject>()) {
    String cmd = rDoc["command"]["type"].as<String>();
    Serial.println("Received Command: " + cmd);

    if (cmd == "TARE") {
      scale.tare();
      buzzerBeep(2);
    } else if (cmd == "START_RELAY") {
      setRelay(true);
    } else if (cmd == "STOP_RELAY") {
      setRelay(false);
    } else if (cmd == "CALIBRATE") {
      float val = rDoc["command"]["value"].as<float>();
      if (val > 0) {
        lcd.clear();
        lcd.print("Calibrating...");
        long raw = scale.read_average(20);
        calibrationFactor = raw / (val * 1000.0);
        scale.set_scale(calibrationFactor);
        EEPROM.put(0, calibrationFactor);
        EEPROM.commit();
        buzzerBeep(3);
      }
    }
  }
}

// ================= HTTP =================

void sendData(float weight, bool relayState) {
  if (WiFi.status() != WL_CONNECTED)
    return;

  isSending = true;
  updateLCD(currentWeight);

  // Ensure SSL client
  client.setInsecure(); // Bypass cert check for Vercel/Self-signed
  http.begin(client, API_URL);

  http.addHeader("Content-Type", "application/json");
  http.setReuse(true);

  JsonDocument doc;
  doc["token"] = DEVICE_TOKEN;
  doc["weight"] = weight;
  doc["isRelayOn"] = relayState; // Send Passed Status
  // event is empty, backend handles logic

  String json;
  serializeJson(doc, json);

  int code = http.POST(json);
  if (code > 0) {
    String resp = http.getString();

    // Add logging
    Serial.printf("HTTP %d, Resp: %s\n", code, resp.c_str());

    JsonDocument rDoc;
    DeserializationError error = deserializeJson(rDoc, resp);

    if (error) {
      Serial.print(F("deserializeJson() failed: "));
      Serial.println(error.f_str());
    } else {
      processServerCommand(rDoc);
    }
  } else {
    Serial.printf("HTTP Failed: %s\n", http.errorToString(code).c_str());
  }

  isSending = false;
  lastSentWeight = weight;
}

// ================= SETUP =================

void setup() {
  Serial.begin(115200);
  EEPROM.begin(512);

  pinMode(PIN_RELAY, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_BTN_WIFI, INPUT_PULLUP);
  pinMode(PIN_BTN_MODE, INPUT_PULLUP);
  pinMode(PIN_BTN_RELAY, INPUT_PULLUP);

  digitalWrite(PIN_RELAY, HIGH);

  Wire.begin(21, 22);
  lcd.init();
  lcd.backlight();

  lcd.print("SOLVIA MACHINE");
  lcd.setCursor(0, 1);
  lcd.print("Starting...");

  EEPROM.get(0, calibrationFactor);
  if (isnan(calibrationFactor))
    calibrationFactor = 200.7;

  scale.begin(PIN_DOUT, PIN_SCK);
  scale.set_scale(calibrationFactor);
  scale.tare();

  WiFiManager wm;
  wm.autoConnect("Solvia_Machine");

  lcd.clear();
  lcd.print("WiFi Connected");
  delay(1000);
}

// ================= LOOP =================

void loop() {
  // 1. Buttons
  if (digitalRead(PIN_BTN_WIFI) == LOW) {
    if (!btnPressTime)
      btnPressTime = millis();
    if (millis() - btnPressTime > 3000 && !btnHeld) {
      btnHeld = true;
      WiFiManager wm;
      wm.resetSettings();
      ESP.restart();
    }
  } else {
    btnPressTime = 0;
    btnHeld = false;
  }

  bool modeBtn = digitalRead(PIN_BTN_MODE);
  if (lastModeBtn == HIGH && modeBtn == LOW) {
    offlineMode = !offlineMode;
    buzzerBeep(2);
  }
  lastModeBtn = modeBtn;

  bool relayBtn = digitalRead(PIN_BTN_RELAY);
  if (offlineMode && lastRelayBtn == HIGH && relayBtn == LOW) {
    setRelay(!isRelayOn);
  }
  lastRelayBtn = relayBtn;

  // 2. Weight Reading with Filtering
  if (scale.is_ready()) {
    currentWeight = getFilteredWeight(); // Get filtered weight in grams
  }

  // 3. LCD Update
  if (millis() - lastLCD >= LCD_INTERVAL) {
    updateLCD(currentWeight);
    lastLCD = millis();
  }

  // 4. STOP Logic (Safety Local)
  float kg = currentWeight / 1000.0;
  if (isRelayOn && kg >= relayThreshold) {
    setRelay(false);
    buzzerBeep(3);
    if (!offlineMode) {
      sendData(kg, true);   // Force final log with relay ON status
      lastLoggedWeight = 0; // Reset for next session
    }
  }

  // 5. Intelligent Stream with Threshold Milestones
  if (!offlineMode) {
    if (millis() - lastHTTP >= HTTP_INTERVAL) {
      float kg = currentWeight / 1000.0;

      // Only send if relay is ON and weight crossed threshold milestone
      if (isRelayOn && shouldLog(kg, targetThreshold)) {
        sendData(kg, isRelayOn);
        lastLoggedWeight = kg; // Update last logged weight
        lastHTTP = millis();
        Serial.printf("📦 Milestone Log: %.2fkg (Threshold: %.0fkg)\n", kg,
                      targetThreshold);
      } else if (!isRelayOn) {
        // Always send when relay is OFF (for monitoring)
        sendData(kg, isRelayOn);
        lastHTTP = millis();
      } else {
        lastHTTP = millis(); // Update timer even if not sending
      }
    }
  }
}
