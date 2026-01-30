# ESP32 HTTP Integration Guide

This guide explains how to configure your ESP32 device to send loadcell data to the Cocobase backend using HTTP POST requests instead of MQTT.

## 🔌 API Endpoint

**Base URL**: Your backend API URL (e.g., `http://yourserver.com:5000` or `https://your-vercel-app.vercel.app`)

**Endpoint**: `POST /api/v1/iot/loadcell/ingest`

**Content-Type**: `application/json`

---

## 📤 Request Format

### Required Fields

```json
{
  "token": "your-device-token",
  "weight": 15.5
}
```

| Field | Type | Description |
|-------|------|-------------|
| `token` | string | Unique device token (found in device management) |
| `weight` | float | Current weight reading in kilograms |

---

## 📝 Arduino/ESP32 Example Code

### Prerequisites

Install the following libraries via Arduino Library Manager:
- `WiFi` (built-in)
- `HTTPClient` (built-in)
- `ArduinoJson` (by Benoit Blanchon)
- `HX711` (for loadcell, if using HX711 module)

### Complete Example

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <HX711.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// API Configuration
const char* apiUrl = "https://your-backend.vercel.app/api/v1/iot/loadcell/ingest";
const char* deviceToken = "your-device-token-here";  // Get this from device management

// HX711 Loadcell Configuration
#define LOADCELL_DOUT_PIN 16
#define LOADCELL_SCK_PIN 4
HX711 scale;

// Timing
unsigned long lastSendTime = 0;
const unsigned long sendInterval = 1000; // Send every 1 second

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  
  // Initialize loadcell
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(2280.f); // Calibration factor - adjust for your loadcell
  scale.tare();            // Reset to zero
  
  Serial.println("Setup complete!");
}

void loop() {
  // Read weight from loadcell
  float weight = scale.get_units(10); // Average of 10 readings
  if (weight < 0) weight = 0; // Ignore negative values
  
  // Send data every interval
  if (millis() - lastSendTime >= sendInterval) {
    sendDataToBackend(weight);
    lastSendTime = millis();
  }
  
  delay(100);
}

void sendDataToBackend(float weight) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    return;
  }
  
  HTTPClient http;
  http.begin(apiUrl);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload
  StaticJsonDocument<200> doc;
  doc["token"] = deviceToken;
  doc["weight"] = weight;
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  // Send POST request
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("Weight: %.2f kg | HTTP Code: %d | Response: %s\n", 
                  weight, httpResponseCode, response.c_str());
  } else {
    Serial.printf("Error sending data: %s\n", http.errorToString(httpResponseCode).c_str());
  }
  
  http.end();
}
```

---

## 🎯 Backend Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Reading recorded"
}
```

### Packing Event Triggered

When weight exceeds threshold and device is ready:

```json
{
  "success": true,
  "message": "Packing event recorded",
  "alert": true
}
```

### Error Responses

**Device Not Found (404)**
```json
{
  "success": false,
  "message": "Device not found"
}
```

**Missing Parameters (400)**
```json
{
  "success": false,
  "message": "Token and weight are required"
}
```

---

## 🔧 Calibration Guide

### 1. Tare the Scale

```cpp
scale.tare();  // Reset to zero
```

### 2. Find Calibration Factor

```cpp
// Place known weight (e.g., 1 kg) on scale
float reading = scale.get_units(10);
float knownWeight = 1.0; // kg
float calibrationFactor = reading / knownWeight;

scale.set_scale(calibrationFactor);
```

### 3. Save and Test

Update the calibration factor in your code and test with known weights.

---

## 📊 System Behavior

1. **Continuous Monitoring**: ESP32 sends weight data every second (or your configured interval)
2. **Automatic Packing Detection**: 
   - When weight ≥ threshold AND device is ready → Creates packing log
   - Device marked as "not ready" after packing
3. **Reset to Ready**: 
   - When weight drops below 0.5 kg → Device becomes ready again

---

## 🐛 Troubleshooting

### Connection Errors

```cpp
// Add WiFi reconnection logic
if (WiFi.status() != WL_CONNECTED) {
  Serial.println("Reconnecting to WiFi...");
  WiFi.disconnect();
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}
```

### HTTP Timeout

Increase HTTP timeout:
```cpp
http.setTimeout(10000); // 10 seconds
```

### SSL Certificate Issues (HTTPS)

For HTTPS endpoints, you may need to add certificate validation:
```cpp
#include <WiFiClientSecure.h>

WiFiClientSecure client;
client.setInsecure(); // Skip certificate validation (not recommended for production)
```

---

## 💡 Tips

- **Reduce Send Frequency**: For battery-powered devices, increase `sendInterval` to 5-10 seconds
- **Add Button for Manual Packing**: Send a special POST request when a button is pressed
- **Monitor Serial Output**: Use Serial Monitor to debug connection and data transmission issues
- **Test Locally First**: Start with local server before deploying to production

---

## 📞 Support

If you encounter issues:
1. Check device token is correct in device management
2. Verify backend API URL is accessible
3. Monitor Serial output for detailed error messages
4. Check backend logs for incoming requests
