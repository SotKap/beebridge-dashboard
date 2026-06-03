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

#include <Wire.h>
#include "Adafruit_SHT31.h"
#include "SI114X.h"

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
const byte SI1145_ALS_VIS_DATA0_REG = 0x22;
const byte SI1145_ALS_IR_DATA0_REG = 0x24;
const byte SI1145_UVINDEX0_REG = 0x2C;
const byte SI1145_COMMAND_REG = 0x18;
const byte SI1145_COMMAND_PSALS_FORCE = 0x07;

Adafruit_SHT31 sht31 = Adafruit_SHT31();
SI114X sunlight = SI114X();

bool sht31Ready = false;
bool sunlightReady = false;
unsigned long lastReadMs = 0;

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

uint16_t readSi1145HalfWord(byte reg) {
  Wire.beginTransmission(SI1145_I2C_ADDRESS);
  Wire.write(reg);
  Wire.endTransmission();
  Wire.requestFrom(SI1145_I2C_ADDRESS, (byte)2);

  if (Wire.available() >= 2) {
    uint16_t lowByte = Wire.read();
    uint16_t highByte = Wire.read();
    return lowByte | (highByte << 8);
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

void printSensorReadings() {
  Serial.println();
  Serial.println("BeeBridge sensor readings");

  if (sht31Ready) {
    float temperature = sht31.readTemperature();
    float humidity = sht31.readHumidity();

    if (!isnan(temperature) && !isnan(humidity)) {
      Serial.print("Temperature: ");
      Serial.print(temperature, 1);
      Serial.println(" C");

      Serial.print("Humidity: ");
      Serial.print(humidity, 1);
      Serial.println(" %");
    } else {
      Serial.println("SHT31-D read failed.");
    }
  }

  if (sunlightReady) {
    forceSunlightMeasurement();

    uint16_t visible = sunlight.ReadVisible();
    uint16_t infrared = sunlight.ReadIR();
    float uvIndex = sunlight.ReadUV() / 100.0;
    uint16_t rawVisible = readSi1145HalfWord(SI1145_ALS_VIS_DATA0_REG);
    uint16_t rawInfrared = readSi1145HalfWord(SI1145_ALS_IR_DATA0_REG);
    uint16_t rawUv = readSi1145HalfWord(SI1145_UVINDEX0_REG);

    Serial.print("Visible light: ");
    Serial.println(visible);

    Serial.print("Infrared light: ");
    Serial.println(infrared);

    Serial.print("UV index: ");
    Serial.println(uvIndex, 2);

    Serial.print("Raw visible register: ");
    Serial.println(rawVisible);

    Serial.print("Raw infrared register: ");
    Serial.println(rawInfrared);

    Serial.print("Raw UV register: ");
    Serial.println(rawUv);

    Serial.print("Measurement IRQ_STATUS: 0x");
    Serial.println(readSi1145Register(SI1145_IRQ_STATUS_REG), HEX);

    Serial.print("Measurement RESPONSE: 0x");
    Serial.println(readSi1145Register(SI1145_RESPONSE_REG), HEX);

    if (visible == 0 && infrared == 0 && uvIndex == 0.0) {
      Serial.println("Sunlight sensor returned all zeros. Try direct light and check that I2C address 0x60 appears in the scan.");
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("Starting BeeBridge ESP32 Sensor Node...");

  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  scanI2C();
  startSensors();
}

void loop() {
  unsigned long now = millis();

  if (now - lastReadMs >= READ_INTERVAL_MS) {
    lastReadMs = now;
    printSensorReadings();
  }
}
