/**
 * ESP32 LCD I2C Test - Simple Test untuk LCD
 *
 * Gunakan ini untuk test apakah LCD sudah terdeteksi
 *
 * Wiring:
 * - LCD SDA -> GPIO 21
 * - LCD SCL -> GPIO 22
 * - LCD VCC -> 5V
 * - LCD GND -> GND
 *
 * Library Required:
 * Install via Library Manager: "LiquidCrystal I2C" by Frank de Brabander
 */

#include <LiquidCrystal_I2C.h>
#include <Wire.h>


// LCD Configuration
LiquidCrystal_I2C lcd(0x27, 16, 2); // Address 0x27, 16 cols, 2 rows

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("LCD Test Starting...");

  // Initialize I2C
  Wire.begin(21, 22); // SDA=21, SCL=22

  // Initialize LCD
  lcd.init();
  lcd.backlight();

  // Display test message
  lcd.setCursor(0, 0);
  lcd.print("Hello ESP32!");
  lcd.setCursor(0, 1);
  lcd.print("LCD Working!");

  Serial.println("LCD Initialized!");
  Serial.println("If you see 'Hello ESP32!' on LCD, it's working!");
}

void loop() {
  // Blink backlight every 2 seconds
  delay(2000);
  lcd.noBacklight();
  delay(500);
  lcd.backlight();
}
