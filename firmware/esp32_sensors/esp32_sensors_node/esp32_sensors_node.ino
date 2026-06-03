/*
  BeeBridge ESP32 DevKit V1 Sensor Node

  Sensors:
  - Adafruit SHT31-D: temperature + humidity
  - Grove Sunlight Sensor v1.0 / SI1145: visible light + IR + UV index

  Wiring for ESP32 DevKit V1:
  - 3V3 -> sensor VCC
  - GND -> sensor GND
  - GPIO21 -> SDA
  - GPIO22 -> SCL

  Arduino libraries needed:
  - Adafruit SHT31 Library
  - Grove Sunlight Sensor / SI114X Library
  - Adafruit BusIO
*/

#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include "Adafruit_SHT31.h"
#include "SI114X.h"

const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

const char* FIREBASE_DATABASE_URL = "https://beebridge-fbf07-default-rtdb.europe-west1.firebasedatabase.app";
const char* FIREBASE_ENVIRONMENT_PATH = "/beebridge/station/environment.json";

const int I2C_SDA_PIN = 21;
const int I2C_SCL_PIN = 22;
const unsigned long READ_INTERVAL_MS = 5000;
const byte SI1145_I2C_ADDRESS = 0x60;
const byte SI1145_PART_ID_REG = 0x00;
const byte SI1145_REV_ID_REG = 0x01;
const byte SI1145_SEQ_ID_REG = 0x02;
const byte SI1145_IRQ_STATUS_REG = 0x21;
const byte SI1145_RESPONSE_REG = 0x20;
const byte SI1145_CHIP_STAT_REG = 0x30;
const byte SI1145_COMMAND_REG = 0x18;
const byte SI1145_COMMAND_PSALS_FORCE = 0x07;

Adafruit_SHT31 sht31 = Adafruit_SHT31();
SI114X sunlight = SI114X();

bool sht31Ready = false;
bool sunlightReady = false;
unsigned long lastReadMs = 0;

struct SensorReadings {
  float temperatureC;
  float humidityPercent;
  uint16_t visibleLight;
  uint16_t infraredLight;
  float uvIndex;
  bool temperatureHumidityOk;
  bool sunlightOk;
};

byte readSi1145Register(byte reg) {
  Wire.beginTransmission(SI1145_I2C_ADDRESS);
  Wire.write(reg);
  Wire.endTransmission();
  Wire.requestFrom(SI1145_I2C_ADDRESS, (byte)1);

  if (Wire.available()) {
    return Wire.read();
  }

  return 0;
}

void writeSi1145Register(byte reg, byte value) {
  Wire.beginTransmission(SI1145_I2C_ADDRESS);
  Wire.write(reg);
  Wire.write(value);
  Wire.endTransmission();
}

void forceSunlightMeasurement() {
  writeSi1145Register(SI1145_COMMAND_REG, SI1145_COMMAND_PSALS_FORCE);
  delay(25);
}

void printSunlightDebug() {
  Serial.print("SI1145 PART_ID: 0x");
  Serial.println(readSi1145Register(SI1145_PART_ID_REG), HEX);

  Serial.print("SI1145 REV_ID: 0x");
  Serial.println(readSi1145Register(SI1145_REV_ID_REG), HEX);

  Serial.print("SI1145 SEQ_ID: 0x");
  Serial.println(readSi1145Register(SI1145_SEQ_ID_REG), HEX);

  Serial.print("SI1145 IRQ_STATUS: 0x");
  Serial.println(readSi1145Register(SI1145_IRQ_STATUS_REG), HEX);

  Serial.print("SI1145 RESPONSE: 0x");
  Serial.println(readSi1145Register(SI1145_RESPONSE_REG), HEX);

  Serial.print("SI1145 CHIP_STAT: 0x");
  Serial.println(readSi1145Register(SI1145_CHIP_STAT_REG), HEX);
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("ESP32 sensor node IP address: ");
  Serial.println(WiFi.localIP());
}

void scanI2C() {
  Serial.println("Scanning I2C bus...");

  byte deviceCount = 0;

  for (byte address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    byte error = Wire.endTransmission();

    if (error == 0) {
      Serial.print("I2C device found at 0x");
      if (address < 16) {
        Serial.print("0");
      }
      Serial.println(address, HEX);
      deviceCount++;
    }
  }

  if (deviceCount == 0) {
    Serial.println("No I2C devices found.");
  }
}

void startSensors() {
  sht31Ready = sht31.begin(0x44);

  if (!sht31Ready) {
    // Some SHT31-D boards use address 0x45.
    sht31Ready = sht31.begin(0x45);
  }

  if (sht31Ready) {
    Serial.println("SHT31-D ready.");
  } else {
    Serial.println("SHT31-D not found. Check wiring/address.");
  }

  sunlightReady = sunlight.Begin();

  if (sunlightReady) {
    Serial.println("Grove Sunlight / SI1145 ready.");
    printSunlightDebug();
  } else {
    Serial.println("Grove Sunlight / SI1145 not found. Check wiring/address.");
  }
}

SensorReadings readSensors() {
  SensorReadings readings = {};
  readings.temperatureC = NAN;
  readings.humidityPercent = NAN;
  readings.visibleLight = 0;
  readings.infraredLight = 0;
  readings.uvIndex = 0.0;
  readings.temperatureHumidityOk = false;
  readings.sunlightOk = false;

  if (sht31Ready) {
    readings.temperatureC = sht31.readTemperature();
    readings.humidityPercent = sht31.readHumidity();
    readings.temperatureHumidityOk = !isnan(readings.temperatureC) && !isnan(readings.humidityPercent);
  }

  if (sunlightReady) {
    forceSunlightMeasurement();
    readings.visibleLight = sunlight.ReadVisible();
    readings.infraredLight = sunlight.ReadIR();
    readings.uvIndex = sunlight.ReadUV() / 100.0;
    readings.sunlightOk = true;
  }

  return readings;
}

String firebaseJsonForEnvironment(const SensorReadings& readings) {
  String json = "{";
  json += "\"temperatureC\":";
  json += readings.temperatureHumidityOk ? String(readings.temperatureC, 1) : String("null");
  json += ",\"humidityPercent\":";
  json += readings.temperatureHumidityOk ? String(readings.humidityPercent, 1) : String("null");
  json += ",\"lightLux\":";
  json += readings.sunlightOk ? String(readings.visibleLight) : String("null");
  json += ",\"visibleLight\":";
  json += readings.sunlightOk ? String(readings.visibleLight) : String("null");
  json += ",\"infraredLight\":";
  json += readings.sunlightOk ? String(readings.infraredLight) : String("null");
  json += ",\"uvIndex\":";
  json += readings.sunlightOk ? String(readings.uvIndex, 2) : String("null");
  json += ",\"soilMoisturePercent\":42";
  json += ",\"airQuality\":\"GOOD\"";
  json += ",\"lastUpdatedMs\":";
  json += String(millis());
  json += "}";

  return json;
}

void uploadEnvironmentToFirebase(const SensorReadings& readings) {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  String url = String(FIREBASE_DATABASE_URL) + FIREBASE_ENVIRONMENT_PATH;
  String payload = firebaseJsonForEnvironment(readings);

  Serial.print("Uploading environment data to Firebase... ");

  if (!http.begin(client, url)) {
    Serial.println("HTTP begin failed.");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  int statusCode = http.PUT(payload);

  Serial.print("HTTP ");
  Serial.println(statusCode);

  if (statusCode <= 0 || statusCode >= 400) {
    Serial.print("Firebase response: ");
    Serial.println(http.getString());
  }

  http.end();
}

void printSensorReadings(const SensorReadings& readings) {
  Serial.println();
  Serial.println("BeeBridge sensor readings");

  if (readings.temperatureHumidityOk) {
    Serial.print("Temperature: ");
    Serial.print(readings.temperatureC, 1);
    Serial.println(" C");

    Serial.print("Humidity: ");
    Serial.print(readings.humidityPercent, 1);
    Serial.println(" %");
  } else {
    Serial.println("SHT31-D read failed.");
  }

  if (readings.sunlightOk) {
    Serial.print("Visible light: ");
    Serial.println(readings.visibleLight);

    Serial.print("Infrared light: ");
    Serial.println(readings.infraredLight);

    Serial.print("UV index: ");
    Serial.println(readings.uvIndex, 2);

    if (readings.visibleLight == 0 && readings.infraredLight == 0 && readings.uvIndex == 0.0) {
      Serial.println("Sunlight sensor returned all zeros. Try direct light and check that I2C address 0x60 appears in the scan.");
    }
  } else {
    Serial.println("Grove Sunlight / SI1145 read skipped.");
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("Starting BeeBridge ESP32 Sensor Node...");

  connectToWiFi();
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  scanI2C();
  startSensors();
}

void loop() {
  unsigned long now = millis();

  if (now - lastReadMs >= READ_INTERVAL_MS) {
    lastReadMs = now;
    SensorReadings readings = readSensors();
    printSensorReadings(readings);
    uploadEnvironmentToFirebase(readings);
  }
}
