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
#define PIN_RELAY 27
#define PIN_BUZZER 2
// #define PIN_BTN 5  // Reset WiFi
#define PIN_BTN_WIFI 26
#define PIN_BTN_MODE 25
#define PIN_BTN_RELAY 5

// bool lastWifi = HIGH;
// bool lastMode = HIGH;
// bool lastRelay = HIGH;

bool offlineMode = false;

bool lastModeBtn = HIGH;
bool lastRelayBtn = HIGH;

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

bool targetReached = false;

void buzzerBeep(int times = 2, int on = 80, int off = 120) {
  for (int i = 0; i < times; i++) {
    digitalWrite(PIN_BUZZER, HIGH);
    delay(on);
    digitalWrite(PIN_BUZZER, LOW);
    delay(off);
  }
}
// helper function
long readRawHX711(byte samples = 15) {
  long sum = 0;
  for (int i = 0; i < samples; i++) {
    sum += scale.read();
    delay(5);
  }
  return sum / samples;
}

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
  digitalWrite(PIN_RELAY, state ? LOW : HIGH);
  Serial.printf("Mesin : %s\n", state ? "ON" : "OFF");
}

void updateLCDStatus(float weight) {
  float kg = weight / 1000.0;

  lcd.setCursor(0, 0);
  lcd.printf("Beban : %.2f kg", kg);

  lcd.setCursor(0, 1);
  if (isRelayOn)
    lcd.print("MENGAYAK..... ");
  else
    lcd.printf("Target: %.2fkg ", targetThreshold);
}

// UPDATED: Added event parameter default empty
void sendData(float weight, String event = "") {
  if (WiFi.status() != WL_CONNECTED)
    return;

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");

  JsonDocument doc;
  doc["token"] = DEVICE_TOKEN;
  doc["weight"] = weight / 1000.0;

  // NEW: Add event if specified (e.g., "LOG")
  if (event != "") {
    doc["event"] = event;
    Serial.println("Sending LOG event...");
  }

  String json;
  serializeJson(doc, json);

  int code = http.POST(json);
  if (code > 0) {
    String resp = http.getString();
    JsonDocument rDoc;
    deserializeJson(rDoc, resp);

    if (!rDoc["threshold"].isNull()) {
      targetThreshold = rDoc["threshold"].as<float>();
    }

    if (!rDoc["relayThreshold"].isNull()) {
      relayThreshold = rDoc["relayThreshold"].as<float>();
    }

    if (!offlineMode && !rDoc["command"].isNull()) {

      String cmd = rDoc["command"]["type"].as<String>();

      if (cmd == "TARE") {
        showLCD("Taring", "");
        scale.tare();
      } else if (cmd == "START_RELAY") {
        showLCD("Mesin Start", "");
        setRelay(true);
      } else if (cmd == "STOP_RELAY") {
        showLCD("Mesin Stop", "");
        setRelay(false);
      } else if (cmd == "CALIBRATE") {
        float val = rDoc["command"]["value"].as<float>();
        if (val > 0) {

          showLCD("Kalibrasi timbangan", "");
          delay(1000);
          long raw = readRawHX711(20);

          calibrationFactor = raw / (val * 1000.0);
          scale.set_scale(calibrationFactor);
          EEPROM.put(0, calibrationFactor);
          EEPROM.commit();
        }
      }
    }
  }

  http.end();
}

void checkPeripherals(float weight) {

  float kg = weight / 1000.0;

  if (kg >= targetThreshold && !targetReached) {
    targetReached = true;
    buzzerBeep(3, 100, 100);
    showLCD("     TARGET OK", "SIMPAN RIWAYAT...");

    // NEW: Trigger explicit LOG event to Backend
    if (!offlineMode) {
      sendData(weight, "LOG");
    }
  }

  if (kg < targetThreshold * 0.8) {
    targetReached = false;
  }

  if (isRelayOn && kg >= relayThreshold) {
    setRelay(false);
    buzzerBeep(5, 70, 70);
    showLCD("Penuh!", "Mesin mati");
    delay(500);
  }
}

void setup() {
  Serial.begin(115200);
  EEPROM.begin(512);
  digitalWrite(PIN_RELAY, HIGH);
  delay(500);
  pinMode(PIN_BTN_WIFI, INPUT_PULLUP);
  pinMode(PIN_BTN_MODE, INPUT_PULLUP);
  pinMode(PIN_BTN_RELAY, INPUT_PULLUP);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_RELAY, OUTPUT);

  Wire.begin(21, 22);
  lcd.init();
  lcd.backlight();
  showLCD("SOLVIA MACHINE", "COCOBASE TelU");

  EEPROM.get(0, calibrationFactor);
  if (isnan(calibrationFactor))
    calibrationFactor = 200.70;

  scale.begin(PIN_DOUT, PIN_SCK);
  scale.set_scale(calibrationFactor);
  scale.tare();

  WiFiManager wm;

  wm.setAPCallback([](WiFiManager *myWiFiManager) {
    showLCD("Mode Setup WiFI", "IP : 192.168.4.1");
    Serial.println("masuk mode AP config");
  });

  if (!wm.autoConnect("Solvia_Machine")) {
    showLCD("Koneksi wifi Gagal", "");
    Serial.println("Gagal connect");
    ESP.restart();
  }
  showLCD("WiFi Terhubung!", WiFi.localIP().toString());
  delay(2000);
}

void loop() {
  // put your main code here, to run repeatedly:
  if (digitalRead(PIN_BTN_WIFI) == LOW) {
    if (btnPressTime == 0)
      btnPressTime = millis();
    if (millis() - btnPressTime > 3000 && !btnHeld) {
      btnHeld = true;
      showLCD("RESET WiFi...", "LEPAS TOMBOL!");

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

  bool modeBtn = digitalRead(PIN_BTN_MODE);

  if (lastModeBtn == HIGH && modeBtn == LOW) {
    offlineMode = !offlineMode;
    buzzerBeep(2);
    if (offlineMode) {
      showLCD("MODE OFFLINE", "KONTROL MANUAL");
    } else {
      showLCD("MODE ONLINE", "KONTROL WEB");
    }
    delay(1000);
  }
  lastModeBtn = modeBtn;

  bool relayBtn = digitalRead(PIN_BTN_RELAY);

  if (offlineMode) {
    if (lastRelayBtn == HIGH && relayBtn == LOW) {
      setRelay(!isRelayOn);
      buzzerBeep(1);
    }
  }
  lastRelayBtn = relayBtn;

  if (millis() - lastSend >= 100) {
    if (scale.is_ready()) {
      float weight = scale.get_units(5);
      checkPeripherals(weight);
      if (!offlineMode)
        sendData(weight); // Normal periodic update (no event)

      // if (!isRelayOn)
      updateLCDStatus(weight);
    }
    lastSend = millis();
  }
}
